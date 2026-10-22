from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
import logging
from psycopg2.extras import RealDictCursor

from ..database import get_db
from ..auth.router import get_current_user
from .models import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectResponse,
    ProjectDetailResponse,
    PaperItem,
    PaperCreateRequest,
)

logger = logging.getLogger("modellyng.projects")
projects_router = APIRouter(prefix="/api/projects", tags=["Projects"])


@projects_router.get("", response_model=List[ProjectResponse])
def list_projects(
    search: Optional[str] = Query(None, description="Pencarian nama atau deskripsi proyek"),
    status_filter: Optional[str] = Query("all", alias="status", description="Filter status (all, active, archived)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Mengambil daftar proyek riset milik pengguna yang sedang login.
    Mendukung pencarian teks dan filter status.
    """
    user_id = current_user["id"]
    query = """
        SELECT 
            p.id, 
            p.user_id, 
            p.name, 
            p.description, 
            p.status, 
            p.created_at, 
            p.updated_at,
            COUNT(pa.id) AS paper_count,
            COUNT(pa.id) FILTER (WHERE pa.status = 'ready') AS ready_count
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

            results = []
            for r in rows:
                results.append(
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
                )
            return results


@projects_router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Membuat proyek riset baru yang otomatis terasosiasi dengan user_id pengguna.
    """
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
    """
    Mengambil detail proyek dan seluruh daftar paper PDF di dalamnya.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Fetch project ensuring ownership
            cur.execute(
                """
                SELECT 
                    p.id, 
                    p.user_id, 
                    p.name, 
                    p.description, 
                    p.status, 
                    p.created_at, 
                    p.updated_at,
                    COUNT(pa.id) AS paper_count,
                    COUNT(pa.id) FILTER (WHERE pa.status = 'ready') AS ready_count
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

            # 2. Fetch papers in project
            cur.execute(
                """
                SELECT id, title, file_name, file_size_bytes, status, total_pages, uploaded_at
                FROM public.papers
                WHERE project_id = %s
                ORDER BY uploaded_at DESC;
                """,
                (project_id,),
            )
            paper_rows = cur.fetchall()
            papers = [
                PaperItem(
                    id=str(pr["id"]),
                    title=pr["title"],
                    file_name=pr["file_name"],
                    file_size_bytes=int(pr["file_size_bytes"]),
                    status=pr["status"],
                    total_pages=int(pr["total_pages"]),
                    uploaded_at=pr["uploaded_at"].isoformat() if hasattr(pr["uploaded_at"], "isoformat") else str(pr["uploaded_at"]),
                )
                for pr in paper_rows
            ]

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
    """
    Memperbarui nama, deskripsi, atau status proyek riset.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check existence and ownership
            cur.execute(
                "SELECT id FROM public.projects WHERE id = %s AND user_id = %s;",
                (project_id, user_id),
            )
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Proyek tidak ditemukan atau Anda tidak memiliki akses.",
                )

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
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tidak ada perubahan yang dikirim.")

            params.extend([project_id, user_id])
            update_sql = f"""
                UPDATE public.projects
                SET {', '.join(updates)}, updated_at = NOW()
                WHERE id = %s AND user_id = %s
                RETURNING id, user_id, name, description, status, created_at, updated_at;
            """
            cur.execute(update_sql, params)
            r = cur.fetchone()

            # Paper counts
            cur.execute(
                """
                SELECT 
                    COUNT(id) AS paper_count,
                    COUNT(id) FILTER (WHERE status = 'ready') AS ready_count
                FROM public.papers
                WHERE project_id = %s;
                """,
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
    """
    Menghapus proyek riset. Semua data paper, ekstraksi komponen, dan relasi di dalamnya
    akan otomatis terhapus secara kaskade (ON DELETE CASCADE).
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM public.projects WHERE id = %s AND user_id = %s RETURNING id;",
                (project_id, user_id),
            )
            deleted = cur.fetchone()
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Proyek tidak ditemukan atau Anda tidak memiliki hak untuk menghapusnya.",
                )
            return {"success": True, "message": "Proyek dan seluruh data terkait berhasil dihapus."}


@projects_router.post("/{project_id}/papers", response_model=PaperItem, status_code=status.HTTP_201_CREATED)
def add_paper_to_project(
    project_id: str,
    req: PaperCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Menambahkan paper PDF baru ke dalam proyek riset.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify project ownership
            cur.execute(
                "SELECT id FROM public.projects WHERE id = %s AND user_id = %s;",
                (project_id, user_id),
            )
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Proyek tidak ditemukan atau Anda tidak memiliki akses.",
                )

            storage_path = f"papers/{project_id}/{req.file_name}"
            cur.execute(
                """
                INSERT INTO public.papers (
                    project_id, title, storage_path, file_name, file_size_bytes,
                    total_pages, status, authors, year
                )
                VALUES (%s, %s, %s, %s, %s, %s, 'ready', %s, %s)
                RETURNING id, title, file_name, file_size_bytes, status, total_pages, uploaded_at;
                """,
                (
                    project_id,
                    req.title.strip(),
                    storage_path,
                    req.file_name.strip(),
                    req.file_size_bytes,
                    req.total_pages or 1,
                    req.authors or [],
                    req.year,
                ),
            )
            p = cur.fetchone()
            return PaperItem(
                id=str(p["id"]),
                title=p["title"],
                file_name=p["file_name"],
                file_size_bytes=int(p["file_size_bytes"]),
                status=p["status"],
                total_pages=int(p["total_pages"]),
                uploaded_at=p["uploaded_at"].isoformat() if hasattr(p["uploaded_at"], "isoformat") else str(p["uploaded_at"]),
            )


@projects_router.delete("/{project_id}/papers/{paper_id}")
def delete_paper_from_project(
    project_id: str,
    paper_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Menghapus paper PDF dari proyek.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify ownership
            cur.execute(
                "SELECT id FROM public.projects WHERE id = %s AND user_id = %s;",
                (project_id, user_id),
            )
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Proyek tidak ditemukan atau Anda tidak memiliki akses.",
                )

            cur.execute(
                "DELETE FROM public.papers WHERE id = %s AND project_id = %s RETURNING id;",
                (paper_id, project_id),
            )
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Paper tidak ditemukan dalam proyek ini.",
                )
            return {"success": True, "message": "Dokumen paper berhasil dihapus."}
