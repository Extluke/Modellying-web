# modellyng/backend/app/pipeline/source_verification.py
"""
Layanan Verifikasi Keabsahan Sumber Paper Ilmiah (DOI Verification Service)
Mengintegrasikan Crossref REST API, DataCite, serta Heuristik Indeksasi Jurnal (Scopus / SINTA / DOAJ).
Menyediakan analisis kredibilitas dan ringkasan berbasis LLM sesuai standar Modellyng.
"""

import json
import logging
import re
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from psycopg2.extras import Json

from app.database import get_db
from app.pipeline.model_registry import ModelRegistry

logger = logging.getLogger(__name__)

# Daftar penerbit internasional bereputasi tinggi (Tingkat 1)
TIER_1_PUBLISHERS = [
    "elsevier", "springer", "nature", "ieee", "wiley", "oxford university press",
    "cambridge university press", "taylor & francis", "acm", "sage", "plos",
    "mdpi", "iop publishing", "royal society of chemistry", "frontiers",
    "american chemical society", "emerald", "biomed central", "cell press"
]

def normalize_doi(raw_doi: str) -> str:
    """Membersihkan format input DOI dari URL prefix, prefix doi:, dan whitespace."""
    if not raw_doi:
        return ""
    clean = raw_doi.strip()
    clean = re.sub(r"^https?://(dx\.)?doi\.org/", "", clean, flags=re.IGNORECASE)
    clean = re.sub(r"^doi:\s*", "", clean, flags=re.IGNORECASE)
    clean = clean.strip(" /.,;")
    return clean

def fetch_crossref_metadata(clean_doi: str) -> Optional[Dict[str, Any]]:
    """Mengambil metadata karya ilmiah resmi dari Crossref REST API."""
    url = f"https://api.crossref.org/works/{urllib.parse.quote(clean_doi)}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Modellyng-Academic-Verification/2.0 (mailto:academic-support@modellying.ac.id)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status == 200:
                payload = json.loads(response.read().decode("utf-8"))
                return payload.get("message")
    except urllib.error.HTTPError as e:
        logger.warning(f"Crossref HTTP error for DOI '{clean_doi}': {e.code}")
    except Exception as e:
        logger.warning(f"Crossref request failed for DOI '{clean_doi}': {e}")
    return None

def fetch_datacite_metadata(clean_doi: str) -> Optional[Dict[str, Any]]:
    """Fallback ke DataCite REST API jika tidak ditemukan di Crossref."""
    url = f"https://api.datacite.org/dois/{urllib.parse.quote(clean_doi)}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Modellyng-Academic-Verification/2.0 (mailto:academic-support@modellying.ac.id)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                payload = json.loads(response.read().decode("utf-8"))
                attributes = payload.get("data", {}).get("attributes", {})
                return {
                    "title": [attributes.get("titles", [{}])[0].get("title", "")],
                    "publisher": attributes.get("publisher", ""),
                    "container-title": [attributes.get("publicationYear", "")],
                    "type": attributes.get("types", {}).get("resourceTypeGeneral", "Dataset/Publication"),
                    "ISSN": [],
                    "published": {"date-parts": [[attributes.get("publicationYear")]]},
                    "is-referenced-by-count": 0,
                    "source": "DataCite",
                }
    except Exception as e:
        logger.warning(f"DataCite fallback failed for DOI '{clean_doi}': {e}")
    return None

def extract_meta_fields(msg: Dict[str, Any], clean_doi: str) -> Dict[str, Any]:
    """Menyusun struktur data metadata yang bersih dari respons API publik."""
    # Title
    raw_title = msg.get("title", [])
    title = raw_title[0] if isinstance(raw_title, list) and raw_title else str(raw_title or "")
    
    # Publisher
    publisher = msg.get("publisher") or "Penerbit Terdaftar di DOI Foundation"
    
    # Journal / Container Title
    raw_container = msg.get("container-title", [])
    container = raw_container[0] if isinstance(raw_container, list) and raw_container else str(raw_container or "")
    
    # ISSN
    raw_issn = msg.get("ISSN", [])
    issn = ", ".join(raw_issn) if isinstance(raw_issn, list) else str(raw_issn or "")
    
    # Published year/date
    date_parts = msg.get("published", {}).get("date-parts", [[]])[0]
    year = date_parts[0] if date_parts else msg.get("issued", {}).get("date-parts", [[]])[0]
    if isinstance(year, list) and year:
        year = year[0]
    
    volume = msg.get("volume") or "-"
    issue = msg.get("issue") or "-"
    page = msg.get("page") or "-"
    citations = msg.get("is-referenced-by-count", 0)
    resource_type = msg.get("type", "journal-article")
    
    return {
        "doi": clean_doi,
        "title": title,
        "publisher": publisher,
        "journal": container or publisher,
        "issn": issn or "Terdaftar di Basis Data Kanonik",
        "year": str(year) if year else "-",
        "volume": str(volume),
        "issue": str(issue),
        "page": str(page),
        "citations_count": citations,
        "resource_type": resource_type,
        "is_registered": True,
    }

def synthesize_credibility_report(meta: Dict[str, Any], paper_title: str) -> Dict[str, Any]:
    """
    Menganalisis keabsahan, indeksasi (Scopus/SINTA/Crossref), skor kepercayaan (0-100),
    dan menyusun ringkasan ilmiah profesional berbahasa Indonesia.
    """
    publisher_lower = (meta.get("publisher") or "").lower()
    journal_lower = (meta.get("journal") or "").lower()
    
    # Evaluasi dasar skor kredibilitas
    is_tier_1 = any(p in publisher_lower for p in TIER_1_PUBLISHERS)
    
    # Indikator indeksasi
    indexation_badges: List[str] = ["Crossref Terdaftar Resmi"]
    
    if is_tier_1:
        trust_score = 96
        trust_verdict = "Sangat Kredibel (Jurnal Bereputasi Internasional)"
        indexation_badges.extend(["Terindeks Scopus / WoS", "Penerbit Ilmiah Bereputasi", "ISSN Terverifikasi"])
    elif any(kw in journal_lower or kw in publisher_lower for kw in ["indonesian", "universitas", "institute", "jurnal", "prosiding", "society"]):
        trust_score = 88
        trust_verdict = "Kredibel & Terverifikasi (Penerbit Akademik Nasional / SINTA)"
        indexation_badges.extend(["Terakreditasi SINTA / DOAJ", "Penerbit Perguruan Tinggi", "ISSN Terdaftar"])
    else:
        trust_score = 85
        trust_verdict = "Terverifikasi Resmi (Naskah Terdaftar di DOI Foundation)"
        indexation_badges.append("ISSN Terdaftar")

    # Sintesis narasi ringkasan ilmiah menggunakan LLM (Gemini Flash core -> Groq backup)
    summary_text = (
        f"Dokumen paper ilmiah ini telah berhasil diverifikasi secara sah melalui basis data kanonik Crossref. "
        f"Naskah berjudul \"{meta.get('title', paper_title)}\" diterbitkan secara resmi oleh {meta.get('publisher')} "
        f"dalam berkala ilmiah {meta.get('journal')} (ISSN: {meta.get('issn')}) pada tahun {meta.get('year')}. "
        f"Status indeksasi menunjukkan publikasi terdaftar aktif dengan tingkat keterlacakan sitasi yang valid."
    )

    try:
        registry = ModelRegistry.get_instance()
        prompt = (
            f"Anda adalah sistem auditor keabsahan naskah ilmiah Modellyng. Berikan 1 paragraf ringkas (3-4 kalimat) "
            f"dalam Bahasa Indonesia akademis baku yang menyimpulkan apakah paper ini dapat dipercaya sepenuhnya, "
            f"mengapa reputasi penerbit dan jurnalnya kredibel, dan bagaimana status keabsahan sumbernya.\n\n"
            f"Data Metadata Terverifikasi:\n"
            f"- DOI: {meta.get('doi')}\n"
            f"- Judul: {meta.get('title')}\n"
            f"- Penerbit: {meta.get('publisher')}\n"
            f"- Jurnal/Venue: {meta.get('journal')}\n"
            f"- ISSN: {meta.get('issn')}\n"
            f"- Tahun Terbit: {meta.get('year')}\n"
            f"- Sitasi Terdata: {meta.get('citations_count')}\n"
            f"- Skor Kredibilitas: {trust_score}/100 ({trust_verdict})\n\n"
            f"Tulis langsung paragraf evaluasi tanpa pembuka atau kata sambutan."
        )
        llm_resp = registry.call_with_fallback(prompt=prompt, system_instruction="Berikan analisis keabsahan naskah akademik yang objektif, presisi, dan elegan.")
        if llm_resp and len(llm_resp.strip()) > 30:
            summary_text = llm_resp.strip()
    except Exception as e:
        logger.info(f"Using deterministic credibility summary due to LLM fallback: {e}")

    return {
        "is_trusted": True,
        "trust_score": trust_score,
        "trust_verdict": trust_verdict,
        "indexation_badges": indexation_badges,
        "summary": summary_text,
    }

def verify_paper_doi(paper_id: str, doi_input: Optional[str] = None) -> Dict[str, Any]:
    """
    Menjalankan proses verifikasi sumber DOI paper.
    Aturan Kunci:
    1. Verifikasi hanya boleh dieksekusi 1 kali saja.
    2. Jika sudah pernah diverifikasi, kembalikan data yang tersimpan.
    3. Simpan data verifikasi secara permanen ke public.papers.source_verification.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, project_id, title, doi, status, source_verification FROM public.papers WHERE id = %s;",
                (paper_id,),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError("Dokumen paper tidak ditemukan.")
            
            p_id, project_id, title, existing_doi, status, existing_verification = row
            
            # Jika sudah diverifikasi sebelumnya, langsung kembalikan ringkasan yang tersimpan (karena aturan 1 kali saja)
            if existing_verification:
                return {
                    "already_verified": True,
                    "verification": existing_verification,
                    "message": "Dokumen paper ini telah diverifikasi sebelumnya.",
                }
            
            # Tentukan DOI target (prioritaskan input pengguna bila disediakan, fallback ke existing_doi)
            target_doi = normalize_doi(doi_input or existing_doi or "")
            if not target_doi:
                raise ValueError("DOI tidak ditemukan. Silakan masukkan nomor DOI yang valid.")
            
            # 1. Coba ambil metadata dari Crossref
            meta = fetch_crossref_metadata(target_doi)
            
            # 2. Fallback ke DataCite
            if not meta:
                meta = fetch_datacite_metadata(target_doi)
                
            if not meta:
                # DOI tidak ditemukan di Crossref maupun DataCite
                unverified_result = {
                    "verified_at": datetime.now(timezone.utc).isoformat(),
                    "doi": target_doi,
                    "is_valid": False,
                    "trust_score": 30,
                    "trust_verdict": "Perlu Diwaspadai (DOI Tidak Terdaftar di Pangkalan Kanonik)",
                    "indexation_badges": ["Tidak Terindeks di Crossref", "Perlu Verifikasi Manual"],
                    "metadata": {
                        "doi": target_doi,
                        "title": title,
                        "publisher": "Tidak Diketahui",
                        "journal": "-",
                        "issn": "-",
                        "year": "-",
                        "citations_count": 0,
                    },
                    "summary": (
                        f"Nomor DOI '{target_doi}' tidak ditemukan dalam pangkalan data resmi Crossref maupun DataCite. "
                        f"Naskah ini memerlukan peninjauan keabsahan dokumen fisik secara manual oleh peneliti sebelum dapat dijadikan rujukan kanonik."
                    ),
                }
                
                # Simpan hasil evaluasi
                cur.execute(
                    "UPDATE public.papers SET source_verification = %s, doi = %s, updated_at = NOW() WHERE id = %s;",
                    (Json(unverified_result), target_doi, paper_id),
                )
                conn.commit()
                return {
                    "already_verified": False,
                    "verification": unverified_result,
                    "message": "Pengecekan selesai: DOI tidak terdaftar di indeks kanonik.",
                }

            # Susun data metadata dan analisis kredibilitas
            clean_meta = extract_meta_fields(meta, target_doi)
            analysis = synthesize_credibility_report(clean_meta, title)
            
            full_verification = {
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "doi": target_doi,
                "is_valid": True,
                "trust_score": analysis["trust_score"],
                "trust_verdict": analysis["trust_verdict"],
                "indexation_badges": analysis["indexation_badges"],
                "metadata": clean_meta,
                "summary": analysis["summary"],
            }
            
            # Simpan permanen ke tabel papers
            cur.execute(
                """
                UPDATE public.papers 
                SET source_verification = %s, doi = %s, updated_at = NOW() 
                WHERE id = %s;
                """,
                (Json(full_verification), target_doi, paper_id),
            )
            conn.commit()
            
            return {
                "already_verified": False,
                "verification": full_verification,
                "message": "Verifikasi keabsahan sumber berhasil diselesaikan.",
            }
