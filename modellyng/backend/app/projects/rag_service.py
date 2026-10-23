import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger("modellyng.rag_service")

FALLBACK_NOT_FOUND_MSG = "Informasi tidak ditemukan dalam dokumen proyek ini."

SYSTEM_RAG_PROMPT = """Anda adalah Asisten Peneliti Akademis Berbasis Bukti (Evidence-Centered RAG) pada platform Modellyng.
Tugas utama Anda adalah menjawab pertanyaan peneliti HANYA berdasarkan kutipan konteks dokumen ilmiah yang disediakan di bawah ini.

ATURAN MUTLAK & ANTI-HALUSINASI:
1. Jawablah secara objektif, ilmiah, dan mendalam HANYA menggunakan fakta dari teks konteks di bawah.
2. DILARANG KERAS mengarang, berasumsi, menyimpulkan hal yang tidak tertulis, atau menggunakan pengetahuan eksternal di luar teks konteks.
3. JIKA JAWABAN TIDAK ADA ATAU TIDAK DAPAT DIBUKTIKAN oleh teks konteks yang disediakan, Anda WAJIB menjawab persis:
   "Informasi tidak ditemukan dalam dokumen proyek ini."
4. Setiap klaim informasi yang Anda sampaikan WAJIB menyertakan penanda sitasi sumber di akhir kalimat atau klausa, misalnya: [S1] atau [S2].
5. Format jawaban Anda wajib menggunakan Markdown yang kaya dan terstruktur (gunakan bullet points, bold, atau tabel bila relevan).
6. BAHASA JAWABAN: SELURUH teks jawaban WAJIB ditulis dalam Bahasa Indonesia yang baku, formal, dan akademis. Dilarang keras menyalin mentah teks Bahasa Inggris dari dokumen sumber tanpa menerjemahkannya secara presisi ke dalam Bahasa Indonesia.
7. Kembalikan respons HANYA dalam format JSON valid dengan skema:
{
  "answer": "Teks jawaban lengkap dalam format Markdown Bahasa Indonesia beserta sitasi [S1], [S2]...",
  "citations_used": ["S1", "S2"]
}
"""

def generate_rag_response(query: str, contexts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Synthesizes an answer using Groq Llama-3.3-70B or Gemini with strict evidence grounding and structured JSON outputs.
    """
    if not contexts:
        return {
            "answer": FALLBACK_NOT_FOUND_MSG,
            "citations": [],
        }

    # Format context blocks
    formatted_context_list = []
    for c in contexts:
        formatted_context_list.append(
            f"[{c['citation_id']}] Dokumen: '{c['paper_title']}' (Halaman {c['page_number']}, Blok {c['block_id']})\n"
            f"Kutipan:\n\"{c['full_content']}\""
        )
    context_str = "\n\n".join(formatted_context_list)

    user_prompt = f"""KONTEKS DOKUMEN PROYEK:
{context_str}

PERTANYAAN PENELITI:
{query}

Berikan jawaban terstruktur dalam format JSON sesuai instruksi sistem:"""

    # 1. Try Groq Llama-3.3-70B
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_api_key and not groq_api_key.startswith("masukkan_"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_RAG_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
                max_tokens=1500,
            )
            raw_content = completion.choices[0].message.content
            parsed = json.loads(raw_content)
            answer_text = parsed.get("answer", "").strip()
            used_citations_keys = parsed.get("citations_used", [])

            # Filter citations to only those actually cited in the answer
            matched_citations = [
                c for c in contexts if c["citation_id"] in used_citations_keys or f"[{c['citation_id']}]" in answer_text
            ]

            return {
                "answer": answer_text or FALLBACK_NOT_FOUND_MSG,
                "citations": matched_citations if answer_text != FALLBACK_NOT_FOUND_MSG else [],
            }
        except Exception as e:
            logger.warning(f"Groq RAG completion failed: {e}. Trying Gemini or fallback.")

    # 2. Try Gemini Flash
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_api_key and not gemini_api_key.startswith("AQ.Ab8RN6JU0") and not gemini_api_key.startswith("masukkan_"):
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{SYSTEM_RAG_PROMPT}\n\n{user_prompt}"}]}
                ],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                },
            }
            resp = httpx.post(url, json=payload, timeout=15.0)
            if resp.status_code == 200:
                res_json = resp.json()
                text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                answer_text = parsed.get("answer", "").strip()
                used_citations_keys = parsed.get("citations_used", [])

                matched_citations = [
                    c for c in contexts if c["citation_id"] in used_citations_keys or f"[{c['citation_id']}]" in answer_text
                ]

                return {
                    "answer": answer_text or FALLBACK_NOT_FOUND_MSG,
                    "citations": matched_citations if answer_text != FALLBACK_NOT_FOUND_MSG else [],
                }
        except Exception as e:
            logger.warning(f"Gemini RAG completion failed: {e}. Using deterministic synthesis.")

    # 3. Deterministic Extractive Synthesis Fallback
    # Check if any context has keyword overlap with query
    query_terms = [w.lower() for w in query.split() if len(w) > 3]
    relevant_contexts = []
    for c in contexts:
        content_lower = c["full_content"].lower()
        overlap = sum(1 for w in query_terms if w in content_lower)
        if overlap > 0:
            relevant_contexts.append((overlap, c))

    if not relevant_contexts:
        return {
            "answer": FALLBACK_NOT_FOUND_MSG,
            "citations": [],
        }

    relevant_contexts.sort(key=lambda x: x[0], reverse=True)
    top_c = [c for _, c in relevant_contexts[:3]]

    bullets = []
    for c in top_c:
        snippet = c["full_content"].replace("\n", " ").strip()
        if len(snippet) > 220:
            snippet = snippet[:220] + "..."
        bullets.append(f"- **{c['paper_title']}** (Hal {c['page_number']}): \"{snippet}\" [{c['citation_id']}]")

    answer_text = f"Berdasarkan analisis dokumen pada proyek ini, ditemukan beberapa temuan terkait:\n\n" + "\n".join(bullets)
    return {
        "answer": answer_text,
        "citations": top_c,
    }
