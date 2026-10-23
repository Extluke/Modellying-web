import os
import math
import hashlib
import logging
from typing import List, Dict, Any
from psycopg2.extras import RealDictCursor
from app.database import get_db

logger = logging.getLogger("modellyng.hybrid_search")

def get_query_embedding(query_text: str) -> List[float]:
    """
    Computes a 768-dim query embedding using Gemini text-embedding-004
    or a normalized deterministic fallback vector.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_api_key and not gemini_api_key.startswith("AQ.Ab8RN6JU0"):
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={gemini_api_key}"
            resp = httpx.post(
                url,
                json={"model": "models/text-embedding-004", "content": {"parts": [{"text": query_text[:2000]}]}},
                timeout=8.0,
            )
            if resp.status_code == 200:
                values = resp.json().get("embedding", {}).get("values")
                if values and len(values) == 768:
                    return values
        except Exception as e:
            logger.warning(f"Gemini query embedding failed: {e}. Using deterministic fallback.")

    # Deterministic fallback embedding (768 dimensions)
    hash_bytes = hashlib.sha512(query_text.encode("utf-8")).digest()
    raw_floats = [((hash_bytes[i % len(hash_bytes)] ^ (i * 31 & 0xFF)) / 127.5) - 1.0 for i in range(768)]
    norm = math.sqrt(sum(x * x for x in raw_floats)) or 1.0
    return [round(x / norm, 6) for x in raw_floats]


def perform_hybrid_search(project_id: str, query: str, top_k: int = 6) -> List[Dict[str, Any]]:
    """
    Executes Hybrid Search combining Dense Retrieval (pgvector HNSW) and
    Sparse Retrieval (PostgreSQL BM25 Full-Text Search) with Reciprocal Rank Fusion (RRF).
    Constant k = 60.
    """
    query_clean = query.strip()
    if not query_clean:
        return []

    query_vector = get_query_embedding(query_clean)
    vector_str = str(query_vector)

    dense_results: List[Dict[str, Any]] = []
    sparse_results: List[Dict[str, Any]] = []

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Dense Semantic Retrieval via pgvector
            try:
                cur.execute(
                    """
                    SELECT 
                        pe.paper_id, pe.page_number, pe.chunk_index, pe.content,
                        (1 - (pe.embedding <=> %s::vector)) AS score,
                        p.title AS paper_title, p.file_name
                    FROM public.paper_embeddings pe
                    JOIN public.papers p ON p.id = pe.paper_id
                    WHERE p.project_id = %s
                    ORDER BY pe.embedding <=> %s::vector ASC
                    LIMIT 20;
                    """,
                    (vector_str, project_id, vector_str),
                )
                dense_results = cur.fetchall() or []
            except Exception as e:
                logger.error(f"Error executing dense retrieval: {e}")

            # 2. Sparse Lexical Retrieval via BM25 Full-Text Search
            try:
                cur.execute(
                    """
                    SELECT 
                        pb.paper_id, pb.page_number, pb.block_id, pb.text AS content, pb.bbox,
                        ts_rank_cd(pb.fts_tokens, plainto_tsquery('simple', %s)) AS score,
                        p.title AS paper_title, p.file_name
                    FROM public.paper_blocks pb
                    JOIN public.papers p ON p.id = pb.paper_id
                    WHERE p.project_id = %s
                      AND pb.fts_tokens @@ plainto_tsquery('simple', %s)
                    ORDER BY score DESC
                    LIMIT 20;
                    """,
                    (query_clean, project_id, query_clean),
                )
                sparse_results = cur.fetchall() or []

                # Fallback to ILIKE if plainto_tsquery returns nothing
                if not sparse_results:
                    keywords = [w for w in query_clean.split() if len(w) > 3][:3]
                    if keywords:
                        ilike_conds = " OR ".join(["pb.text ILIKE %s" for _ in keywords])
                        params = [f"%{k}%" for k in keywords]
                        cur.execute(
                            f"""
                            SELECT 
                                pb.paper_id, pb.page_number, pb.block_id, pb.text AS content, pb.bbox,
                                0.5 AS score,
                                p.title AS paper_title, p.file_name
                            FROM public.paper_blocks pb
                            JOIN public.papers p ON p.id = pb.paper_id
                            WHERE p.project_id = %s AND ({ilike_conds})
                            LIMIT 15;
                            """,
                            [project_id] + params,
                        )
                        sparse_results = cur.fetchall() or []
            except Exception as e:
                logger.error(f"Error executing sparse retrieval: {e}")

    # 3. Reciprocal Rank Fusion (RRF)
    # RRF_score(d) = 1 / (60 + dense_rank) + 1 / (60 + sparse_rank)
    k_rrf = 60
    candidates: Dict[str, Dict[str, Any]] = {}

    # Map dense ranking
    for rank, item in enumerate(dense_results):
        key = f"{item['paper_id']}_p{item['page_number']}"
        candidates[key] = {
            "paper_id": str(item["paper_id"]),
            "paper_title": item["paper_title"],
            "file_name": item["file_name"],
            "page_number": int(item["page_number"]),
            "content": item["content"],
            "block_id": None,
            "bbox": None,
            "dense_rank": rank + 1,
            "sparse_rank": None,
            "rrf_score": 1.0 / (k_rrf + (rank + 1)),
        }

    # Map sparse ranking & combine
    for rank, item in enumerate(sparse_results):
        key = f"{item['paper_id']}_p{item['page_number']}"
        sparse_score = 1.0 / (k_rrf + (rank + 1))
        if key in candidates:
            candidates[key]["sparse_rank"] = rank + 1
            candidates[key]["rrf_score"] += sparse_score
            candidates[key]["block_id"] = item.get("block_id") or candidates[key]["block_id"]
            candidates[key]["bbox"] = item.get("bbox") or candidates[key]["bbox"]
        else:
            candidates[key] = {
                "paper_id": str(item["paper_id"]),
                "paper_title": item["paper_title"],
                "file_name": item["file_name"],
                "page_number": int(item["page_number"]),
                "content": item["content"],
                "block_id": item.get("block_id"),
                "bbox": item.get("bbox"),
                "dense_rank": None,
                "sparse_rank": rank + 1,
                "rrf_score": sparse_score,
            }

    # Sort by RRF score descending
    sorted_candidates = sorted(candidates.values(), key=lambda x: x["rrf_score"], reverse=True)
    top_candidates = sorted_candidates[:top_k]

    # Assign citation IDs S1, S2, ... and look up exact block bbox if missing
    final_results = []
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            for idx, cand in enumerate(top_candidates):
                cit_id = f"S{idx + 1}"
                bbox = cand.get("bbox")
                block_id = cand.get("block_id")

                # If bbox is missing, query first block on that page
                if not bbox or not block_id:
                    cur.execute(
                        """
                        SELECT block_id, bbox FROM public.paper_blocks 
                        WHERE paper_id = %s AND page_number = %s 
                        ORDER BY block_id ASC LIMIT 1;
                        """,
                        (cand["paper_id"], cand["page_number"]),
                    )
                    b_row = cur.fetchone()
                    if b_row:
                        block_id = b_row["block_id"]
                        bbox = b_row["bbox"]

                final_results.append({
                    "citation_id": cit_id,
                    "paper_id": cand["paper_id"],
                    "paper_title": cand["paper_title"],
                    "file_name": cand["file_name"],
                    "page_number": cand["page_number"],
                    "block_id": block_id or f"p{cand['page_number']}_b1",
                    "bbox": bbox or [50.0, 50.0, 500.0, 150.0],
                    "quote": cand["content"][:250].strip(),
                    "full_content": cand["content"],
                    "rrf_score": round(cand["rrf_score"], 5),
                })

    return final_results
