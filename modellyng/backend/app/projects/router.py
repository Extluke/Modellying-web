import hashlib
import uuid
import re
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor, Json

from app.database import get_db
from app.auth.router import get_current_user
from .models import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectResponse,
    ProjectDetailResponse,
    PaperItem,
    PaperCreateRequest,
    PaperConfirmRequest,
    ComponentItem,
    BlockItem,
    ComponentUpdateRequest,
    ChatMessageRequest,
    ChatResponse,
    ChatMessageHistoryItem,
    CitationItem,
    ComponentAiReviseRequest,
    ComponentAiReviseResponse,
)
from app.pipeline.storage import STORAGE_ROOT, get_paper_file_path
from app.pipeline.pdf_parser import inspect_pdf_metadata, PDFParseError, extract_canonical_blocks_and_coverage
from app.pipeline.tasks import process_paper_pipeline, generate_paper_embeddings_task
from app.pipeline.source_verification import verify_paper_doi
from .export_service import (
    fetch_project_export_data,
    generate_csv_export,
    generate_xlsx_export,
    generate_pdf_export,
)
from .hybrid_search import perform_hybrid_search
from .rag_service import generate_rag_response
from .revision_service import generate_component_ai_revision

projects_router = APIRouter(prefix="/projects", tags=["Projects & Papers"])
papers_router = APIRouter(prefix="/papers", tags=["Papers"])


class VerifyDoiRequest(BaseModel):
    doi: Optional[str] = None


def map_paper_row(pr: dict) -> PaperItem:
    """Maps database row to PaperItem with complete data contract."""
    return PaperItem(
        id=str(pr["id"]),
        title=pr["title"],
        file_name=pr["file_name"],
        file_size_bytes=int(pr["file_size_bytes"]),
        total_pages=int(pr.get("total_pages") or 0),
        sha256=pr.get("sha256"),
        status=pr["status"],
        stage=pr.get("stage"),
        stage_detail=pr.get("stage_detail"),
        error=pr.get("error"),
        warnings=pr.get("warnings") or [],
        coverage=pr.get("coverage"),
        doc_type=pr.get("doc_type"),
        run=pr.get("run"),
        doi=pr.get("doi"),
        authors=pr.get("authors") or [],
        year=pr.get("year"),
        journal=pr.get("journal"),
        source_verification=pr.get("source_verification"),
        uploaded_at=pr["uploaded_at"].isoformat() if hasattr(pr["uploaded_at"], "isoformat") else str(pr["uploaded_at"]),
        updated_at=pr["updated_at"].isoformat() if hasattr(pr.get("updated_at"), "isoformat") and pr.get("updated_at") else None,
    )



# ==============================================================================
# PROJECT ENDPOINTS
# ==============================================================================

@projects_router.get("", response_model=List[ProjectResponse])
def get_projects(
    search: Optional[str] = Query(None, description="Pencarian judul atau deskripsi proyek"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter status proyek (active, archived)"),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    query = """
        SELECT 
            p.id, p.user_id, p.name, p.description, p.status, p.created_at, p.updated_at,
            COUNT(pa.id) AS paper_count,
            COUNT(pa.id) FILTER (WHERE pa.status = 'ready' OR pa.status = 'needs_review') AS ready_count
        FROM public.projects p
        LEFT JOIN public.papers pa ON pa.project_id = p.id
        WHERE p.user_id = %s
    """
    params = [user_id]

    if status_filter and status_filter.lower() in ("active", "archived"):
        query += " AND p.status = %s"
        params.append(status_filter.lower())

    if search and search.strip():
        search_pattern = f"%{search.strip().lower()}%"
        query += " AND (lower(p.name) LIKE %s OR lower(COALESCE(p.description, '')) LIKE %s)"
        params.extend([search_pattern, search_pattern])

    query += " GROUP BY p.id ORDER BY p.updated_at DESC;"

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            return [
                ProjectResponse(
                    id=str(r["id"]),
                    user_id=str(r["user_id"]),
                    name=r["name"],
                    description=r["description"],
                    status=r["status"],
                    paper_count=int(r["paper_count"]),
                    ready_count=int(r["ready_count"]),
                    created_at=r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"]),
                    updated_at=r["updated_at"].isoformat() if hasattr(r["updated_at"], "isoformat") else str(r["updated_at"]),
                )
                for r in rows
            ]


@projects_router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO public.projects (user_id, name, description, status)
                VALUES (%s, %s, %s, 'active')
                RETURNING id, user_id, name, description, status, created_at, updated_at;
                """,
                (user_id, req.name.strip(), req.description.strip() if req.description else None),
            )
            r = cur.fetchone()
            return ProjectResponse(
                id=str(r["id"]),
                user_id=str(r["user_id"]),
                name=r["name"],
                description=r["description"],
                status=r["status"],
                paper_count=0,
                ready_count=0,
                created_at=r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"]),
                updated_at=r["updated_at"].isoformat() if hasattr(r["updated_at"], "isoformat") else str(r["updated_at"]),
            )


@projects_router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project_detail(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    p.id, p.user_id, p.name, p.description, p.status, p.created_at, p.updated_at,
                    COUNT(pa.id) AS paper_count,
                    COUNT(pa.id) FILTER (WHERE pa.status = 'ready' OR pa.status = 'needs_review') AS ready_count
                FROM public.projects p
                LEFT JOIN public.papers pa ON pa.project_id = p.id
                WHERE p.id = %s AND p.user_id = %s
                GROUP BY p.id;
                """,
                (project_id, user_id),
            )
            p = cur.fetchone()
            if not p:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Proyek tidak ditemukan atau Anda tidak memiliki akses.",
                )

            cur.execute(
                """
                SELECT 
                    id, title, file_name, file_size_bytes, status, total_pages, sha256,
                    stage, stage_detail, error, warnings, coverage, doc_type, run,
                    doi, authors, year, journal, source_verification,
                    uploaded_at, updated_at
                FROM public.papers
                WHERE project_id = %s
                ORDER BY uploaded_at DESC;
                """,
                (project_id,),
            )
            paper_rows = cur.fetchall()
            papers = [map_paper_row(pr) for pr in paper_rows]

            return ProjectDetailResponse(
                id=str(p["id"]),
                user_id=str(p["user_id"]),
                name=p["name"],
                description=p["description"],
                status=p["status"],
                paper_count=int(p["paper_count"]),
                ready_count=int(p["ready_count"]),
                created_at=p["created_at"].isoformat() if hasattr(p["created_at"], "isoformat") else str(p["created_at"]),
                updated_at=p["updated_at"].isoformat() if hasattr(p["updated_at"], "isoformat") else str(p["updated_at"]),
                papers=papers,
            )


@projects_router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    req: ProjectUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM public.projects WHERE id = %s AND user_id = %s;", (project_id, user_id))
            if not cur.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyek tidak ditemukan.")

            updates = []
            params = []
            if req.name is not None:
                updates.append("name = %s")
                params.append(req.name.strip())
            if req.description is not None:
                updates.append("description = %s")
                params.append(req.description.strip())
            if req.status is not None:
                updates.append("status = %s")
                params.append(req.status.lower())

            if not updates:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tidak ada data perubahan.")

            params.extend([project_id, user_id])
            cur.execute(
                f"UPDATE public.projects SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s AND user_id = %s RETURNING *;",
                params,
            )
            r = cur.fetchone()

            cur.execute(
                "SELECT COUNT(id) AS paper_count, COUNT(id) FILTER (WHERE status = 'ready' OR status = 'needs_review') AS ready_count FROM public.papers WHERE project_id = %s;",
                (project_id,),
            )
            counts = cur.fetchone()

            return ProjectResponse(
                id=str(r["id"]),
                user_id=str(r["user_id"]),
                name=r["name"],
                description=r["description"],
                status=r["status"],
                paper_count=int(counts["paper_count"]),
                ready_count=int(counts["ready_count"]),
                created_at=r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"]),
                updated_at=r["updated_at"].isoformat() if hasattr(r["updated_at"], "isoformat") else str(r["updated_at"]),
            )


@projects_router.delete("/{project_id}")
def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.projects WHERE id = %s AND user_id = %s RETURNING id;", (project_id, user_id))
            if not cur.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyek tidak ditemukan.")

            # Clean up physical storage files for this project
            project_dir = STORAGE_ROOT / user_id / project_id
            if project_dir.exists():
                shutil.rmtree(project_dir, ignore_errors=True)

            return {"success": True, "message": "Proyek beserta seluruh dokumen terkait berhasil dihapus."}


# ==============================================================================
# STREAMING UPLOAD & PIPELINE ENDPOINTS
# ==============================================================================

@projects_router.post("/{project_id}/papers/upload", response_model=PaperItem, status_code=status.HTTP_201_CREATED)
async def upload_paper(
    project_id: str,
    file: UploadFile = File(...),
    auto_process: bool = Form(True),
    current_user: dict = Depends(get_current_user),
):
    """
    Streaming upload endpoint:
    - 50MB file size limit (streaming check).
    - %PDF- magic bytes validation.
    - SHA-256 calculation.
    - Duplicate SHA-256 detection per project -> 409 duplicate_content.
    - Duplicate filename detection -> warning duplicate_filename.
    - PyMuPDF inspection for corruption or password encryption.
    - Dispatches Celery pipeline job when auto_process=True.
    """
    user_id = current_user["id"]

    # 1. Verify project ownership
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM public.projects WHERE id = %s AND user_id = %s;", (project_id, user_id))
            if not cur.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyek riset tidak ditemukan.")

    # 2. Validate magic bytes (%PDF-) from first 5 bytes
    first_chunk = await file.read(5)
    if not first_chunk.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "not_pdf", "message": "File bukan dokumen PDF asli yang valid (Magic bytes %PDF- tidak ditemukan)."},
        )

    # 3. Stream read and calculate SHA-256
    sha256_hash = hashlib.sha256()
    sha256_hash.update(first_chunk)
    total_bytes = len(first_chunk)
    chunks = [first_chunk]

    MAX_BYTES = 52428800  # 50 MB
    while True:
        chunk = await file.read(1024 * 64)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail={"code": "file_too_large", "message": "Ukuran file melebihi batas maksimal 50 MB."},
            )
        sha256_hash.update(chunk)
        chunks.append(chunk)

    hex_digest = sha256_hash.hexdigest()
    paper_id = str(uuid.uuid4())
    clean_filename = re.sub(r'[^\w\-_\. ]', '_', file.filename or "document.pdf")
    rel_storage_path = f"{user_id}/{project_id}/{paper_id}.pdf"
    abs_storage_path = STORAGE_ROOT / rel_storage_path
    abs_storage_path.parent.mkdir(parents=True, exist_ok=True)

    # 4. Check duplicate SHA-256 in the same project
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, title, file_name, status, storage_path FROM public.papers WHERE project_id = %s AND sha256 = %s;",
                (project_id, hex_digest),
            )
            existing_paper = cur.fetchone()
            if existing_paper:
                # If previous upload failed, automatically clean it up and allow user to re-upload seamlessly
                if existing_paper.get("status") in ("failed", "error"):
                    cur.execute("DELETE FROM public.papers WHERE id = %s;", (existing_paper["id"],))
                    if existing_paper.get("storage_path"):
                        old_file = STORAGE_ROOT / existing_paper["storage_path"]
                        old_file.unlink(missing_ok=True)
                else:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={
                            "code": "duplicate_content",
                            "message": f"Isi dokumen identik dengan paper yang sudah ada dalam proyek: '{existing_paper['title']}'.",
                            "existing_paper_id": str(existing_paper["id"]),
                        },
                    )

            # Check duplicate filename in project (warning only for active/ready papers)
            cur.execute(
                "SELECT id FROM public.papers WHERE project_id = %s AND file_name = %s AND status != 'failed';",
                (project_id, clean_filename),
            )
            has_duplicate_name = bool(cur.fetchone())

    # 5. Write file chunks to local storage
    try:
        with open(abs_storage_path, "wb") as f:
            for ch in chunks:
                f.write(ch)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "internal", "message": f"Gagal menyimpan file ke penyimpanan: {str(e)}"},
        )

    # 6. Inspect PDF metadata using PyMuPDF (smart font-size heuristic & template filtering)
    try:
        total_pages, detected_title = inspect_pdf_metadata(abs_storage_path, original_filename=clean_filename)
    except PDFParseError as e:
        abs_storage_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": e.code, "message": e.user_message},
        )

    title = detected_title if detected_title and len(detected_title) >= 5 else Path(clean_filename).stem.replace("_", " ").title()

    initial_warnings = []
    if has_duplicate_name:
        initial_warnings.append("duplicate_filename")

    # 7. Insert paper into PostgreSQL
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO public.papers (
                    id, project_id, title, storage_path, file_name, file_size_bytes,
                    total_pages, sha256, status, stage, warnings, uploaded_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'processing', 'queued', %s, NOW(), NOW())
                RETURNING 
                    id, title, file_name, file_size_bytes, status, total_pages, sha256,
                    stage, stage_detail, error, warnings, coverage, doc_type, run,
                    uploaded_at, updated_at;
                """,
                (
                    paper_id,
                    project_id,
                    title[:250],
                    rel_storage_path,
                    clean_filename,
                    total_bytes,
                    total_pages,
                    hex_digest,
                    Json(initial_warnings),
                ),
            )
            pr = cur.fetchone()

    # 8. Dispatch Celery task
    if auto_process:
        try:
            task = process_paper_pipeline.delay(paper_id=paper_id)
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute("UPDATE public.papers SET celery_task_id = %s WHERE id = %s;", (task.id, paper_id))
        except Exception as e:
            # If Celery worker is offline, run synchronously or mark queued
            pass

    return map_paper_row(pr)


# Alias route for POST /papers/upload with project_id in form
@papers_router.post("/upload", response_model=PaperItem, status_code=status.HTTP_201_CREATED)
async def upload_paper_generic(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    auto_process: bool = Form(True),
    current_user: dict = Depends(get_current_user),
):
    return await upload_paper(project_id=project_id, file=file, auto_process=auto_process, current_user=current_user)


# ==============================================================================
# PAPER PROCESS & CONFIRMATION ENDPOINTS
# ==============================================================================

@projects_router.post("/{project_id}/papers/{paper_id}/process", response_model=PaperItem)
def reprocess_paper(
    project_id: str,
    paper_id: str,
    force: bool = Query(False, description="Ulangi proses dari awal jika true"),
    current_user: dict = Depends(get_current_user),
):
    """
    Idempotent reprocess endpoint. If already queued/processing and force=False, returns active state.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.* FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            paper = cur.fetchone()
            if not paper:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper tidak ditemukan.")

            if paper["status"] in ("validating", "processing") and not force:
                return map_paper_row(paper)

            cur.execute(
                "UPDATE public.papers SET status = 'processing', stage = 'queued', error = NULL, updated_at = NOW() WHERE id = %s RETURNING *;",
                (paper_id,),
            )
            updated = cur.fetchone()

    task = process_paper_pipeline.delay(paper_id=paper_id, force=True)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE public.papers SET celery_task_id = %s WHERE id = %s;", (task.id, paper_id))

    return map_paper_row(updated)


@projects_router.post("/{project_id}/papers/{paper_id}/confirm", response_model=PaperItem)
def confirm_paper(
    project_id: str,
    paper_id: str,
    req: PaperConfirmRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Gatekeeper confirmation endpoint for documents flagged as needs_confirmation (e.g. slides, homework).
    - action: "proceed" -> User insists on processing -> resumes AI extraction.
    - action: "discard" -> User discards the document -> permanently deletes file & record.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.* FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            paper = cur.fetchone()
            if not paper:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper tidak ditemukan.")

            if req.action == "discard":
                # Delete physical file
                file_path = STORAGE_ROOT / paper["storage_path"]
                file_path.unlink(missing_ok=True)
                cur.execute("DELETE FROM public.papers WHERE id = %s;", (paper_id,))
                return map_paper_row(paper)

            elif req.action == "proceed":
                # Resume processing: change status to processing and stage to saving_blocks -> ai_extraction
                cur.execute(
                    """
                    UPDATE public.papers 
                    SET status = 'processing', stage = 'saving_blocks', updated_at = NOW() 
                    WHERE id = %s 
                    RETURNING *;
                    """,
                    (paper_id,),
                )
                updated = cur.fetchone()

    # Re-dispatch Celery worker with force=True to resume extraction
    process_paper_pipeline.delay(paper_id=paper_id, force=True)
    return map_paper_row(updated)


@projects_router.delete("/{project_id}/papers/{paper_id}")
def delete_paper_from_project(
    project_id: str,
    paper_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.id, p.storage_path FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            paper = cur.fetchone()
            if not paper:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper tidak ditemukan.")

            file_path = STORAGE_ROOT / paper["storage_path"]
            file_path.unlink(missing_ok=True)
            cur.execute("DELETE FROM public.papers WHERE id = %s;", (paper_id,))
            return {"success": True, "message": "Dokumen paper dan file fisik berhasil dihapus."}


# ==============================================================================
# DATA DISTRIBUTION ENDPOINTS (COMPONENTS, BLOCKS, PDF STREAM)
# ==============================================================================

@projects_router.get("/{project_id}/papers/{paper_id}/components", response_model=List[ComponentItem])
def get_paper_components(
    project_id: str,
    paper_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns 11 extracted components with JSONB values and evidence coordinates.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify paper ownership
            cur.execute(
                """
                SELECT p.id FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokumen paper tidak ditemukan.")

            cur.execute(
                """
                SELECT 
                    ec.id, ec.paper_id, ec.parameter_key, ec.parameter_version,
                    ep.label, ep.group_name, ep.tab_group, ep.instruction, ep.sort_order,
                    ec.state, ec.value, ec.evidence, ec.confidence_score, ec.status,
                    ec.reviewer_notes, ec.created_at, ec.updated_at
                FROM public.extracted_components ec
                JOIN public.extraction_parameters ep ON ep.key = ec.parameter_key
                WHERE ec.paper_id = %s
                ORDER BY ep.sort_order ASC;
                """,
                (paper_id,),
            )
            rows = cur.fetchall()
            return [
                ComponentItem(
                    id=str(r["id"]),
                    paper_id=str(r["paper_id"]),
                    parameter_key=r["parameter_key"],
                    parameter_version=int(r["parameter_version"]),
                    label=r["label"],
                    group_name=r["group_name"],
                    tab_group=r.get("tab_group", "konteks_masalah"),
                    instruction=r["instruction"],
                    sort_order=int(r["sort_order"]),
                    state=r["state"],
                    value=r["value"] or {},
                    evidence=r["evidence"] or [],
                    confidence_score=float(r["confidence_score"]) if r.get("confidence_score") is not None else None,
                    status=r["status"],
                    reviewer_notes=r.get("reviewer_notes"),
                    created_at=r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"]),
                    updated_at=r["updated_at"].isoformat() if hasattr(r["updated_at"], "isoformat") else str(r["updated_at"]),
                )
                for r in rows
            ]


@projects_router.get("/{project_id}/papers/{paper_id}/blocks", response_model=List[BlockItem])
def get_paper_blocks(
    project_id: str,
    paper_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns array of canonical text blocks with bounding box coordinates [x0, y0, x1, y1]
    for interactive PDF highlighting in frontend canvas.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Verify paper ownership
            cur.execute(
                """
                SELECT p.id, p.storage_path FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            paper = cur.fetchone()
            if not paper:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokumen paper tidak ditemukan.")

            # 2. Try fetching from public.paper_blocks
            cur.execute(
                """
                SELECT block_id, page_number, bbox, text
                FROM public.paper_blocks
                WHERE paper_id = %s
                ORDER BY page_number ASC, block_id ASC;
                """,
                (paper_id,),
            )
            rows = cur.fetchall()

            if rows:
                return [
                    BlockItem(
                        block_id=r["block_id"],
                        page_number=int(r["page_number"]),
                        bbox=[float(x) for x in r["bbox"]],
                        text=r["text"],
                    )
                    for r in rows
                ]

            # 3. Fallback: Parse PDF file on disk and populate paper_blocks
            file_path = STORAGE_ROOT / paper["storage_path"]
            if not file_path.exists():
                return []

            try:
                parse_result = extract_canonical_blocks_and_coverage(file_path)
                blocks = parse_result.get("blocks", [])
                for b in blocks:
                    cur.execute(
                        """
                        INSERT INTO public.paper_blocks (paper_id, block_id, page_number, bbox, text)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (paper_id, block_id) DO NOTHING;
                        """,
                        (paper_id, b["block_id"], b["page_index"], Json(b["bbox"]), b["text"]),
                    )
                return [
                    BlockItem(
                        block_id=b["block_id"],
                        page_number=int(b["page_index"]),
                        bbox=[float(x) for x in b["bbox"]],
                        text=b["text"],
                    )
                    for b in blocks
                ]
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Gagal mengekstrak blok teks PDF: {str(e)}",
                )


@projects_router.get("/{project_id}/papers/{paper_id}/pdf")
def get_paper_pdf_stream(
    project_id: str,
    paper_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Streams the physical PDF file with JWT validation and RLS security.
    Consumed directly by pdfjs-dist on client canvas.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.id, p.file_name, p.storage_path FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            paper = cur.fetchone()
            if not paper:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokumen paper tidak ditemukan.")

            abs_file_path = STORAGE_ROOT / paper["storage_path"]
            if not abs_file_path.exists():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File fisik PDF tidak ditemukan di penyimpanan server.",
                )

            return FileResponse(
                path=str(abs_file_path),
                media_type="application/pdf",
                filename=paper["file_name"],
            )


# ==============================================================================
# COMPONENT MUTATION & HUMAN REVIEW ENDPOINTS
# ==============================================================================

@projects_router.patch("/{project_id}/papers/{paper_id}/components/{component_key}", response_model=ComponentItem)
def update_component_review(
    project_id: str,
    paper_id: str,
    component_key: str,
    req: ComponentUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Updates status (accepted, rejected, edited), revised value text, or reviewer notes.
    If all components of the paper are accepted/reviewed, paper status automatically transitions to 'ready'
    and triggers vector embedding task for RAG.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Verify paper ownership
            cur.execute(
                """
                SELECT p.id FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokumen paper tidak ditemukan.")

            # 2. Build updates
            updates = ["updated_at = NOW()"]
            params = []

            if req.status is not None:
                updates.append("status = %s")
                params.append(req.status)

            if req.value is not None:
                updates.append("value = %s")
                params.append(Json(req.value))
                if req.status is None:
                    updates.append("status = 'edited'")

            if req.reviewer_notes is not None:
                updates.append("reviewer_notes = %s")
                params.append(req.reviewer_notes)

            params.extend([paper_id, component_key])

            cur.execute(
                f"""
                UPDATE public.extracted_components
                SET {', '.join(updates)}
                WHERE paper_id = %s AND parameter_key = %s
                RETURNING *;
                """,
                params,
            )
            updated_comp = cur.fetchone()
            if not updated_comp:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Komponen dengan kunci '{component_key}' tidak ditemukan pada paper ini.",
                )

            # 3. Check remaining unreviewed components for this paper
            cur.execute(
                """
                SELECT COUNT(id) AS unreviewed_count
                FROM public.extracted_components
                WHERE paper_id = %s AND status = 'needs_review';
                """,
                (paper_id,),
            )
            count_res = cur.fetchone()
            unreviewed = int(count_res["unreviewed_count"]) if count_res else 0

            paper_became_ready = False
            if unreviewed == 0:
                cur.execute(
                    """
                    UPDATE public.papers
                    SET status = 'ready', updated_at = NOW()
                    WHERE id = %s AND status != 'ready'
                    RETURNING id;
                    """,
                    (paper_id,),
                )
                if cur.fetchone():
                    paper_became_ready = True

            # 4. Fetch joined parameter metadata for return
            cur.execute(
                """
                SELECT label, group_name, tab_group, instruction, sort_order
                FROM public.extraction_parameters
                WHERE key = %s;
                """,
                (component_key,),
            )
            param_meta = cur.fetchone() or {
                "label": {"id": component_key, "en": component_key},
                "group_name": "core",
                "tab_group": "konteks_masalah",
                "instruction": "",
                "sort_order": 99,
            }

    # 5. Trigger vector embedding task if paper became ready
    if paper_became_ready:
        generate_paper_embeddings_task.delay(paper_id=paper_id)

    return ComponentItem(
        id=str(updated_comp["id"]),
        paper_id=str(updated_comp["paper_id"]),
        parameter_key=updated_comp["parameter_key"],
        parameter_version=int(updated_comp["parameter_version"]),
        label=param_meta["label"],
        group_name=param_meta["group_name"],
        tab_group=param_meta.get("tab_group", "konteks_masalah"),
        instruction=param_meta["instruction"],
        sort_order=int(param_meta["sort_order"]),
        state=updated_comp["state"],
        value=updated_comp["value"] or {},
        evidence=updated_comp["evidence"] or [],
        confidence_score=float(updated_comp["confidence_score"]) if updated_comp.get("confidence_score") is not None else None,
        status=updated_comp["status"],
        reviewer_notes=updated_comp.get("reviewer_notes"),
        created_at=updated_comp["created_at"].isoformat() if hasattr(updated_comp["created_at"], "isoformat") else str(updated_comp["created_at"]),
        updated_at=updated_comp["updated_at"].isoformat() if hasattr(updated_comp["updated_at"], "isoformat") else str(updated_comp["updated_at"]),
    )


@projects_router.post(
    "/{project_id}/papers/{paper_id}/components/{component_key}/ai-revise",
    response_model=ComponentAiReviseResponse,
)
def revise_paper_component_ai(
    project_id: str,
    paper_id: str,
    component_key: str,
    req: ComponentAiReviseRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Produces a revised component formulation draft using LLM grounded in physical PDF blocks.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Verify paper ownership & fetch paper title
            cur.execute(
                """
                SELECT p.id, p.title FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            paper_row = cur.fetchone()
            if not paper_row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokumen paper tidak ditemukan.")

            # 2. Fetch current component & parameter metadata
            cur.execute(
                """
                SELECT ec.value, ec.evidence, ep.label
                FROM public.extracted_components ec
                JOIN public.extraction_parameters ep ON ep.key = ec.parameter_key
                WHERE ec.paper_id = %s AND ec.parameter_key = %s;
                """,
                (paper_id, component_key),
            )
            comp_row = cur.fetchone()
            if not comp_row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Komponen tidak ditemukan.")

            label_dict = comp_row.get("label") or {}
            component_label = label_dict.get("id") or label_dict.get("en") or component_key
            evidence_list = comp_row.get("evidence") or []
            paper_title = paper_row["title"]

    res = generate_component_ai_revision(
        component_label=component_label,
        paper_title=paper_title,
        current_text=req.current_text,
        user_instruction=req.user_instruction,
        evidence_list=evidence_list,
        history=req.history,
    )

    return ComponentAiReviseResponse(
        revised_text=res["revised_text"],
        explanation=res.get("explanation"),
    )


@projects_router.get("/{project_id}/review-queue")
def get_project_review_queue(
    project_id: str,
    threshold: float = Query(0.80, description="Ambang batas nilai keyakinan"),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns all components in the project needing human review (status='needs_review' OR confidence < threshold).
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    ec.id, ec.paper_id, p.title AS paper_title, p.file_name,
                    ec.parameter_key, ep.label, ep.group_name,
                    ec.value, ec.evidence, ec.confidence_score, ec.status,
                    p.run->>'model_used' AS model_used,
                    ec.updated_at
                FROM public.extracted_components ec
                JOIN public.papers p ON p.id = ec.paper_id
                JOIN public.projects pr ON pr.id = p.project_id
                JOIN public.extraction_parameters ep ON ep.key = ec.parameter_key
                WHERE pr.id = %s AND pr.user_id = %s
                  AND (ec.status = 'needs_review' OR ec.confidence_score < %s)
                ORDER BY ec.confidence_score ASC NULLS FIRST, ec.updated_at DESC;
                """,
                (project_id, user_id, threshold),
            )
            rows = cur.fetchall()
            return [
                {
                    "id": str(r["id"]),
                    "paper_id": str(r["paper_id"]),
                    "paper_title": r["paper_title"],
                    "file_name": r["file_name"],
                    "parameter_key": r["parameter_key"],
                    "label": r["label"],
                    "group_name": r["group_name"],
                    "value": r["value"] or {},
                    "evidence": r["evidence"] or [],
                    "confidence_score": float(r["confidence_score"]) if r.get("confidence_score") is not None else 0.0,
                    "status": r["status"],
                    "model_used": r.get("model_used") or "groq/llama-3.3-70b-versatile",
                    "updated_at": r["updated_at"].isoformat() if hasattr(r["updated_at"], "isoformat") else str(r["updated_at"]),
                }
                for r in rows
            ]


@projects_router.post("/{project_id}/review-queue/bulk-accept")
def bulk_accept_project_reviews(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Accepts all pending reviews across all papers in the project and transitions papers to 'ready'.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor() as cur:
            # 1. Verify project access
            cur.execute("SELECT id FROM public.projects WHERE id = %s AND user_id = %s;", (project_id, user_id))
            if not cur.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyek tidak ditemukan.")

            # 2. Mark all components in project as accepted
            cur.execute(
                """
                UPDATE public.extracted_components ec
                SET status = 'accepted', updated_at = NOW()
                FROM public.papers p
                WHERE ec.paper_id = p.id
                  AND p.project_id = %s
                  AND ec.status = 'needs_review';
                """,
                (project_id,),
            )

            # 3. Transition all papers in project from 'needs_review' to 'ready'
            # STRICT GATEKEEPING: Hanya dokumen yang telah diverifikasi keabsahannya (source_verification IS NOT NULL) yang dapat beralih ke 'ready'!
            cur.execute(
                """
                UPDATE public.papers
                SET status = 'ready', updated_at = NOW()
                WHERE project_id = %s 
                  AND status = 'needs_review'
                  AND source_verification IS NOT NULL;
                """,
                (project_id,),
            )

            # Hitung apakah masih ada paper yang tertahan karena belum diverifikasi
            cur.execute(
                """
                SELECT COUNT(id) FROM public.papers 
                WHERE project_id = %s AND status = 'needs_review' AND source_verification IS NULL;
                """,
                (project_id,),
            )
            unverified_count = cur.fetchone()[0]

            if unverified_count > 0:
                msg = f"Tinjauan diterima. Sebanyak {unverified_count} dokumen belum beralih ke status Siap karena belum menyelesaikan Cek Keabsahan Sumber (DOI)."
            else:
                msg = "Seluruh tinjauan dokumen dalam proyek berhasil diterima dan dokumen telah Siap."

    return {"success": True, "message": msg, "unverified_count": unverified_count}


# ==============================================================================
# EXPORT SYNTHESIS MATRIX (CSV, XLSX, PDF)
# ==============================================================================

@projects_router.get("/{project_id}/export")
def export_project_synthesis(
    project_id: str,
    format: str = Query("xlsx", regex="^(csv|xlsx|pdf)$", description="Format unduhan (csv, xlsx, pdf)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Mengunduh matriks sintesis 13 parameter ilmiah seluruh paper dalam proyek
    dalam format CSV, Excel (.xlsx), atau PDF resmi secara presisi dan non-empty.
    """
    user_id = current_user["id"]
    try:
        data = fetch_project_export_data(project_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    
    project_name = re.sub(r'[^a-zA-Z0-9_-]', '_', data["project"]["name"])
    date_str = datetime.now().strftime("%Y%m%d_%H%M")
    
    if format == "csv":
        csv_bytes = generate_csv_export(data)
        filename = f"Modellyng_{project_name}_{date_str}.csv"
        return Response(
            content=csv_bytes,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    elif format == "xlsx":
        xlsx_bytes = generate_xlsx_export(data)
        filename = f"Modellyng_{project_name}_{date_str}.xlsx"
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    elif format == "pdf":
        pdf_bytes = generate_pdf_export(data)
        filename = f"Modellyng_{project_name}_{date_str}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    else:
        raise HTTPException(status_code=400, detail="Format unduhan tidak didukung.")


# ==============================================================================
# SOURCE VERIFICATION ENDPOINTS (CEK KEABSAHAN DOI)
# ==============================================================================

@projects_router.get("/{project_id}/papers/{paper_id}/source-verification")
def get_paper_source_verification(
    project_id: str,
    paper_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Mengambil status dan ringkasan keabsahan sumber paper yang telah diverifikasi sebelumnya.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.id, p.doi, p.source_verification, p.status 
                FROM public.papers p
                JOIN public.projects pr ON pr.id = p.project_id
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Dokumen paper tidak ditemukan.")
            
            return {
                "paper_id": str(row["id"]),
                "doi": row["doi"] or "",
                "source_verification": row["source_verification"],
                "is_verified": row["source_verification"] is not None,
                "status": row["status"],
            }


@projects_router.post("/{project_id}/papers/{paper_id}/verify-source")
def verify_paper_source_endpoint(
    project_id: str,
    paper_id: str,
    req: VerifyDoiRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Menjalankan proses Cek Keabsahan Sumber (DOI) melalui Crossref / DataCite / Scopus-SINTA heuristics.
    Aturan Ketat: Verifikasi hanya dapat dilakukan 1 kali saja.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT p.id FROM public.papers p 
                JOIN public.projects pr ON pr.id = p.project_id 
                WHERE p.id = %s AND p.project_id = %s AND pr.user_id = %s;
                """,
                (paper_id, project_id, user_id),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Dokumen paper tidak ditemukan.")
    
    try:
        result = verify_paper_doi(paper_id, req.doi)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memverifikasi sumber paper: {str(e)}")



# ==============================================================================
# EVIDENCE-CENTERED RAG CHAT ENDPOINTS
# ==============================================================================

@projects_router.post("/{project_id}/chat", response_model=ChatResponse)
def project_chat_query(
    project_id: str,
    req: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Evidence-Centered Project RAG endpoint:
    - Runs Hybrid Search (pgvector HNSW + BM25 Full-Text Search + RRF).
    - Injects top 5-7 context blocks into System Prompt.
    - Uses structured JSON mode with strict anti-hallucination validation.
    - Stores messages in public.chat_messages for persistent history.
    """
    user_id = current_user["id"]

    # 1. Verify project ownership
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM public.projects WHERE id = %s AND user_id = %s;", (project_id, user_id))
            if not cur.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyek riset tidak ditemukan.")

    # 2. Perform Hybrid Search
    search_results = perform_hybrid_search(project_id=project_id, query=req.message, top_k=6)

    # 3. Generate Evidence-Centered RAG response
    rag_res = generate_rag_response(query=req.message, contexts=search_results)
    answer = rag_res["answer"]
    citations = rag_res["citations"]

    # 4. Save to chat history
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.chat_messages (user_id, project_id, scope, role, content, citations)
                VALUES (%s, %s, 'project_rag', 'user', %s, '[]'::jsonb);
                """,
                (user_id, project_id, req.message.strip()),
            )
            cur.execute(
                """
                INSERT INTO public.chat_messages (user_id, project_id, scope, role, content, citations)
                VALUES (%s, %s, 'project_rag', 'assistant', %s, %s);
                """,
                (user_id, project_id, answer, Json(citations)),
            )

    return ChatResponse(
        answer=answer,
        citations=[
            CitationItem(
                citation_id=c["citation_id"],
                paper_id=c["paper_id"],
                paper_title=c["paper_title"],
                file_name=c["file_name"],
                page_number=c["page_number"],
                block_id=c["block_id"],
                bbox=c["bbox"],
                quote=c["quote"],
            )
            for c in citations
        ],
    )


@projects_router.get("/{project_id}/chat", response_model=List[ChatMessageHistoryItem])
def get_project_chat_history(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns message history for this project's RAG chat.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, role, content, citations, created_at
                FROM public.chat_messages
                WHERE project_id = %s AND user_id = %s AND scope = 'project_rag'
                ORDER BY created_at ASC;
                """,
                (project_id, user_id),
            )
            rows = cur.fetchall()
            return [
                ChatMessageHistoryItem(
                    id=str(r["id"]),
                    role=r["role"],
                    content=r["content"],
                    citations=r["citations"] or [],
                    created_at=r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"]),
                )
                for r in rows
            ]


# ==============================================================================
# COMPARATIVE MATRIX ENDPOINT
# ==============================================================================

@projects_router.get("/{project_id}/comparative-matrix")
def get_comparative_matrix(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns a grouped 2D matrix structure of all 11 parameters across all papers in the project
    ready to be rendered as a synchronized horizontal scrolling comparison table.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Verify project
            cur.execute("SELECT id, name FROM public.projects WHERE id = %s AND user_id = %s;", (project_id, user_id))
            proj = cur.fetchone()
            if not proj:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyek tidak ditemukan.")

            # 2. Get papers in this project
            cur.execute(
                """
                SELECT id, title, authors, year, journal, status, total_pages, uploaded_at
                FROM public.papers
                WHERE project_id = %s
                ORDER BY uploaded_at ASC;
                """,
                (project_id,),
            )
            papers = cur.fetchall()

            # 3. Get all parameters
            cur.execute(
                """
                SELECT key, label, group_name, tab_group, sort_order, instruction
                FROM public.extraction_parameters
                WHERE status = 'active'
                ORDER BY sort_order ASC;
                """
            )
            parameters = cur.fetchall()

            # 4. Get extracted components
            cur.execute(
                """
                SELECT 
                    ec.id, ec.paper_id, ec.parameter_key, ec.state, ec.value,
                    ec.evidence, ec.confidence_score, ec.status
                FROM public.extracted_components ec
                JOIN public.papers p ON p.id = ec.paper_id
                WHERE p.project_id = %s;
                """,
                (project_id,),
            )
            comp_rows = cur.fetchall()

            # Group cells by parameter_key -> paper_id
            matrix_cells = {}
            for row in comp_rows:
                pkey = row["parameter_key"]
                pid = str(row["paper_id"])
                if pkey not in matrix_cells:
                    matrix_cells[pkey] = {}
                matrix_cells[pkey][pid] = {
                    "id": str(row["id"]),
                    "state": row["state"],
                    "value": row["value"] or {},
                    "evidence": row["evidence"] or [],
                    "confidence_score": float(row["confidence_score"]) if row["confidence_score"] is not None else 0.0,
                    "status": row["status"],
                }

            return {
                "project_id": str(proj["id"]),
                "project_name": proj["name"],
                "parameters": [
                    {
                        "key": p["key"],
                        "label": p["label"],
                        "group_name": p["group_name"],
                        "tab_group": p.get("tab_group", "konteks_masalah"),
                        "sort_order": int(p["sort_order"]),
                        "instruction": p["instruction"],
                    }
                    for p in parameters
                ],
                "papers": [
                    {
                        "id": str(pa["id"]),
                        "title": pa["title"],
                        "authors": pa["authors"] or [],
                        "year": pa.get("year"),
                        "status": pa["status"],
                        "total_pages": int(pa["total_pages"]),
                    }
                    for pa in papers
                ],
                "matrix": matrix_cells,
            }
