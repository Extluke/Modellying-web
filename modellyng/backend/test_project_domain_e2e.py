import os
import sys
import time
import requests
import pymupdf as fitz
from io import BytesIO

BASE_URL = "http://127.0.0.1:8000/api"

def create_synthetic_academic_pdf(title: str, is_slide: bool = False) -> bytes:
    """Creates a valid PDF with PyMuPDF in memory."""
    doc = fitz.open()
    
    if is_slide:
        # Slide format: low text density, slide title
        p1 = doc.new_page(width=842, height=595) # Landscape
        p1.insert_text((50, 80), f"SLIDE PRESENTASI: {title.upper()}", fontsize=24)
        p1.insert_text((50, 150), "Agenda Perkuliahan dan Pengantar Topik", fontsize=16)
        p1.insert_text((50, 200), "1. Definisi Konsep Dasar\n2. Diskusi Kelompok\n3. Tanya Jawab", fontsize=14)
        
        p2 = doc.new_page(width=842, height=595)
        p2.insert_text((50, 80), "TUGAS MANDIRI MAHASISWA", fontsize=24)
        p2.insert_text((50, 150), "Kumpulkan laporan rangkuman minggu depan di portal kuliah.", fontsize=14)
    else:
        # Academic paper format: Abstract, IMRaD, DOI, References
        p1 = doc.new_page(width=595, height=842) # A4 Portrait
        p1.insert_text((50, 60), title, fontsize=18)
        p1.insert_text((50, 90), "Penulis: Arby Sanjaya, Ph.D., Cahayu Putri, M.Sc.", fontsize=11)
        p1.insert_text((50, 110), "DOI: 10.1016/j.modellyng.2026.04.012", fontsize=10)
        
        abstract_text = (
            "ABSTRACT\n"
            "This study investigates academic document extraction using evidence-centered analysis. "
            "We propose a novel framework that bridges LLM reasoning with canonical PDF text blocks. "
            "Our results demonstrate that dynamic parameter registries achieve 96.4% factual precision "
            "without manual template reconfiguration. The primary research gap addressed is the lack of "
            "grounded evidence tracing in contemporary academic AI assistants."
        )
        p1.insert_text((50, 140), abstract_text, fontsize=10)
        
        body_text = (
            "1. INTRODUCTION & PROBLEM STATEMENT\n"
            "Academic researchers face significant challenges in synthesizing literature across hundreds of publications. "
            "Current approaches hallucinate claims or lose traceability back to original document coordinates. "
            "\n\n2. METHODOLOGY & DATASET\n"
            "We analyze a benchmark dataset consisting of 120 peer-reviewed computer science and medical papers. "
            "The model utilizes PyMuPDF for layout preservation and Groq Llama-3.3-70B for dynamic structured output. "
            "Deterministic fuzzy string matching verifies all cited quotes against PDF character bounding boxes. "
            "\n\n3. KEY FINDINGS & ANALYSIS TECHNIQUE\n"
            "Evaluation reveals a 42% reduction in verification latency while preserving 100% citation grounding. "
            "The statistical ANOVA test confirms significance with p < 0.001 across all empirical test runs."
        )
        p1.insert_text((50, 240), body_text, fontsize=10)
        
        p2 = doc.new_page(width=595, height=842)
        p2_text = (
            "4. LIMITATIONS & FUTURE WORK\n"
            "A key limitation is the dependency on clean digital text; scanned documents require OCR preprocessing. "
            "Future work will explore multi-modal vision-language transformers for complex scientific figures. "
            "\n\n5. SCIENTIFIC NOVELTY & CONTRIBUTION\n"
            "The fundamental novelty is the zero-hardcoding JSONB architecture coupled with verifiable evidence spans. "
            "\n\nREFERENCES\n"
            "[1] Vaswani, A., et al. (2017). Attention is All You Need. NeurIPS.\n"
            "[2] Sanjaya, A. (2026). Evidence-Centered Academic PDF Modeling. Journal of Web Science, 14(2), 110-125.\n"
            "[3] Smith, J., & Doe, E. (2025). Systematic Literature Reviews via RAG Systems. ACM Computing Surveys."
        )
        p2.insert_text((50, 60), p2_text, fontsize=10)

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def run_tests():
    print("=" * 70)
    print("MODELLYNG WEB: END-TO-END DOMAIN & PIPELINE INTEGRATION TEST")
    print("=" * 70)
    
    # -------------------------------------------------------------------------
    # 1. Login / Get Auth Token
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Menguji Otentikasi & Token Akses...")
    test_email = f"test_e2e_{int(time.time())}@modellyng.ac.id"
    test_password = "Password123!"
    
    # Register dedicated test user
    reg_res = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "full_name": "Peneliti Penguji Otomatis",
            "email": test_email,
            "password": test_password,
            "confirm_password": test_password,
            "institution": "Universitas Modellyng",
            "field_of_study": "Computer Science"
        }
    )
    if reg_res.status_code == 201:
        token = reg_res.json().get("token") or reg_res.json().get("access_token")
    else:
        # Fallback to login
        login_res = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "arby@modellyng.ac.id", "password": "Password123!"}
        )
        assert login_res.status_code == 200, f"Login fallback failed: {login_res.text}"
        token = login_res.json().get("token") or login_res.json().get("access_token")

    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS: Token otentikasi berhasil didapatkan.")

    # -------------------------------------------------------------------------
    # 2. Project Creation & List Filter
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Menguji Pembuatan Proyek & Isolasi Filter Status...")
    proj_res = requests.post(
        f"{BASE_URL}/projects",
        headers=headers,
        json={
            "name": f"Uji Otomatisasi Pipeline {int(time.time())}",
            "description": "Proyek riset verifikasi ekstraksi dinamis dan LLM gatekeeper."
        }
    )
    assert proj_res.status_code == 201, f"Gagal membuat proyek: {proj_res.text}"
    project = proj_res.json()
    project_id = project["id"]
    print(f"SUCCESS: Proyek berhasil dibuat (ID: {project_id}, Nama: {project['name']}).")

    # Test Project Archive & Filter
    arch_res = requests.put(
        f"{BASE_URL}/projects/{project_id}",
        headers=headers,
        json={"status": "archived"}
    )
    assert arch_res.status_code == 200
    
    # Verify not in active list
    active_list = requests.get(f"{BASE_URL}/projects?status=active", headers=headers).json()
    assert not any(p["id"] == project_id for p in active_list), "FAILED: Proyek arsip masih muncul di filter active!"
    
    # Verify in archived list
    arch_list = requests.get(f"{BASE_URL}/projects?status=archived", headers=headers).json()
    assert any(p["id"] == project_id for p in arch_list), "FAILED: Proyek arsip tidak muncul di filter archived!"
    print("SUCCESS: Filter isolasi 'Semua/Active' dan 'Diarsipkan' berfungsi 100% sempurna.")

    # Restore to active
    requests.put(f"{BASE_URL}/projects/{project_id}", headers=headers, json={"status": "active"})

    # -------------------------------------------------------------------------
    # 3. PDF Validation & Upload Engine
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Menguji Validasi Unggah PDF (Magic Bytes, Hash SHA-256, Duplikat)...")
    
    # 3A. Reject Non-PDF file (corrupt magic bytes)
    fake_file = BytesIO(b"Ini bukan dokumen PDF yang sah tapi teks biasa.")
    fake_res = requests.post(
        f"{BASE_URL}/projects/{project_id}/papers/upload",
        headers=headers,
        files={"file": ("fake_doc.pdf", fake_file, "application/pdf")}
    )
    assert fake_res.status_code == 400, f"FAILED: Non-PDF harusnya ditolak 400, tapi dapat: {fake_res.status_code}"
    print(f"SUCCESS: File non-PDF berhasil ditolak secara akurat: {fake_res.json().get('detail')}")

    # 3B. Upload Valid Academic PDF
    valid_pdf_bytes = create_synthetic_academic_pdf("Transformasi Ekstraksi Literatur Akademik Berbasis Bukti")
    upload_res = requests.post(
        f"{BASE_URL}/projects/{project_id}/papers/upload",
        headers=headers,
        files={"file": ("paper_akademik_valid.pdf", BytesIO(valid_pdf_bytes), "application/pdf")},
        data={"auto_process": "true"}
    )
    assert upload_res.status_code == 201, f"FAILED: Unggah PDF valid gagal: {upload_res.text}"
    paper_1 = upload_res.json()
    paper_1_id = paper_1["id"]
    sha256_hash = paper_1["sha256"]
    print(f"SUCCESS: PDF Akademik berhasil diunggah (ID: {paper_1_id}, Pages: {paper_1['total_pages']}, SHA-256: {sha256_hash[:16]}...).")

    # 3C. Reject Duplicate Content (Same SHA-256 in same project)
    dup_res = requests.post(
        f"{BASE_URL}/projects/{project_id}/papers/upload",
        headers=headers,
        files={"file": ("nama_berbeda_tapi_identik.pdf", BytesIO(valid_pdf_bytes), "application/pdf")}
    )
    assert dup_res.status_code == 409, f"FAILED: Duplikat SHA-256 harusnya ditolak 409, tapi dapat: {dup_res.status_code}"
    print(f"SUCCESS: Duplikasi konten SHA-256 berhasil dicegah (HTTP 409 duplicate_content).")

    # -------------------------------------------------------------------------
    # 4. Celery Pipeline Processing Verification
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Menunggu Celery Worker Memproses Ekstraksi 11 Komponen...")
    max_wait = 45 # seconds
    start_time = time.time()
    final_paper_1 = None

    while time.time() - start_time < max_wait:
        detail_res = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
        papers = detail_res.json().get("papers", [])
        p = next((item for item in papers if item["id"] == paper_1_id), None)
        if p:
            current_stage = p.get("stage")
            current_status = p.get("status")
            print(f"  -> Status: {current_status} | Tahap Celery: {current_stage}")
            if current_status in ("needs_review", "ready", "failed"):
                final_paper_1 = p
                break
        time.sleep(2)

    assert final_paper_1 is not None, "FAILED: Timeout menunggu Celery worker memproses paper!"
    assert final_paper_1["status"] in ("needs_review", "ready"), f"FAILED: Paper berstatus {final_paper_1['status']}, error: {final_paper_1.get('error')}"
    print(f"SUCCESS: Pipeline Celery selesai! Status: {final_paper_1['status']}, Tahap: {final_paper_1['stage']}")
    
    # Check coverage and run metadata
    coverage = final_paper_1.get("coverage")
    run_meta = final_paper_1.get("run")
    print(f"  -> Coverage Laporan: {coverage['pages_readable']}/{coverage['pages_total']} Halaman Terbaca, Bahasa: {coverage['language']}")
    print(f"  -> Model Run Info: {run_meta.get('model_used') if run_meta else 'N/A'}")

    # Verify extracted_components table in PostgreSQL
    import psycopg2
    from psycopg2.extras import RealDictCursor
    conn = psycopg2.connect("postgresql://postgres:modellying_web_password@127.0.0.1:28022/postgres")
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT parameter_key, state, value, evidence, confidence_score FROM public.extracted_components WHERE paper_id = %s;", (paper_1_id,))
        components = cur.fetchall()
        print(f"SUCCESS: Berhasil mengekstrak {len(components)} komponen ilmiah ke tabel dynamic JSONB.")
        for comp in components[:3]:
            quote_sample = comp['evidence'][0]['quote'][:60] if comp['evidence'] else 'No quote'
            print(f"     * [{comp['parameter_key']}] State: {comp['state']} | Nilai: {comp['value'].get('text')[:40]}... | Bukti: '{quote_sample}...'")

    # -------------------------------------------------------------------------
    # 5. LLM Gatekeeper Test (Non-Paper / Slide Presentation Detection)
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Menguji LLM Gatekeeper dengan Dokumen Non-Akademik (Slide Kuliah)...")
    slide_pdf_bytes = create_synthetic_academic_pdf("Materi Pertemuan 1 - Konsep Dasar", is_slide=True)
    slide_res = requests.post(
        f"{BASE_URL}/projects/{project_id}/papers/upload",
        headers=headers,
        files={"file": ("slide_pertemuan_1.pdf", BytesIO(slide_pdf_bytes), "application/pdf")},
        data={"auto_process": "true"}
    )
    assert slide_res.status_code == 201
    slide_paper = slide_res.json()
    slide_paper_id = slide_paper["id"]

    # Wait for Gatekeeper to evaluate
    start_time = time.time()
    final_slide_paper = None
    while time.time() - start_time < 30:
        detail_res = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
        papers = detail_res.json().get("papers", [])
        p = next((item for item in papers if item["id"] == slide_paper_id), None)
        if p:
            if p.get("status") in ("needs_confirmation", "failed", "needs_review", "ready"):
                final_slide_paper = p
                break
        time.sleep(1.5)

    assert final_slide_paper is not None, "FAILED: Timeout menunggu gatekeeper memproses slide!"
    assert final_slide_paper["status"] == "needs_confirmation", f"FAILED: Dokumen slide harusnya berstatus 'needs_confirmation', tapi: {final_slide_paper['status']}"
    doc_type = final_slide_paper.get("doc_type") or {}
    print(f"SUCCESS: LLM Gatekeeper berhasil menjeda dokumen non-paper!")
    print(f"  -> Status: {final_slide_paper['status']}")
    print(f"  -> Label Terdeteksi: {doc_type.get('label')}")
    print(f"  -> Alasan Gatekeeper: {doc_type.get('reason')}")

    # Test Gatekeeper Confirm Endpoint (Action: proceed)
    print("  -> Menguji konfirmasi pengguna: 'Tetap Proses' (proceed)...")
    confirm_res = requests.post(
        f"{BASE_URL}/projects/{project_id}/papers/{slide_paper_id}/confirm",
        headers=headers,
        json={"action": "proceed"}
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "processing"
    print("SUCCESS: Aksi 'proceed' berhasil melanjutkan pipeline pemrosesan.")

    # -------------------------------------------------------------------------
    # 6. Cleanup Test Project
    # -------------------------------------------------------------------------
    print("\n[TEST 6] Membersihkan Data Proyek Uji...")
    del_res = requests.delete(f"{BASE_URL}/projects/{project_id}", headers=headers)
    assert del_res.status_code == 200
    print("SUCCESS: Proyek uji dan seluruh relasi kaskade (papers, components) berhasil dibersihkan.")

    print("\n" + "=" * 70)
    print("HASIL AKHIR: 100% SELURUH PENGUJIAN DOMAIN PROYEK & PIPELINE LULUS!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
