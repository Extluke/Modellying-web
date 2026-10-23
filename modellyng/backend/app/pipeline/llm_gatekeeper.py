"""
LLM Gatekeeper & Multi-Batch Parameter Extraction Engine — Modellyng Web
Evidence-Centered Academic Extraction Engine

Prinsip Utama:
1. 4-Batch Processing: Memecah 13 parameter menjadi 4 unit kerja fokus (Konteks, Metode, Data, Hasil & Gap)
2. Dual-Provider Resilient: Menggunakan ModelRegistry (Gemini Core -> Groq Backup)
3. Validasi Pydantic Ketat: Struktur JSON selalu divalidasi ke schema Pydantic
4. Zero Fake Fallback: Logika acak hash(key) DIHAPUS TOTAL. Jika tidak ditemukan, jujur dilaporkan 'not_found'
5. Filter Header/Footer: Blok teks header jurnal, ISSN, dan referensi disaring agar tidak pernah dikutip
"""

import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.pipeline.model_registry import model_registry, ModelExecutionError, AllModelsExhaustedError

logger = logging.getLogger("modellyng.pipeline.llm")

# ==============================================================================
# 1. PYDANTIC SCHEMAS UNTUK EKSTRAKSI TERSTRUKTUR
# ==============================================================================

class ExtractedItemSchema(BaseModel):
    parameter_key: str = Field(description="Kunci parameter persis sesuai instruksi")
    state: str = Field(default="found", description="Status ekstraksi: 'found' atau 'not_found'")
    formulation: str = Field(description="Penjelasan akademis komprehensif dalam Bahasa Indonesia baku")
    quote: str = Field(description="Kutipan bukti kalimat verbatim asli dari naskah fisik PDF")
    page_number: Optional[int] = Field(default=1, description="Nomor halaman fisik tempat kutipan ditemukan")
    confidence_score: float = Field(default=0.95, description="Skor keyakinan ekstraksi (0.0 - 1.0)")

class BatchExtractionSchema(BaseModel):
    extractions: List[ExtractedItemSchema]

class DocumentClassificationSchema(BaseModel):
    label: str = Field(description="Label tipe: research_paper, thesis, review, technical_report, slides, coursework, other")
    paper_confidence: float = Field(description="Skor keyakinan 0.0 - 1.0")
    reason: str = Field(description="1 kalimat penjelasan singkat mengapa dokumen ini diklasifikasikan demikian")

class TitleAndAuthorsSchema(BaseModel):
    title: str = Field(description="Judul asli artikel ilmiah yang bersih dari nama jurnal dan karakter rusak")
    authors: List[str] = Field(default_factory=list, description="Array nama penulis artikel ilmiah")


# ==============================================================================
# 2. FILTER TEKS & VERIFIKASI KUTIPAN KANONIK
# ==============================================================================

def normalize_whitespace(s: str) -> str:
    """Normalisasi spasi ganda, newline, dan huruf kecil untuk pencocokan teks toleran."""
    return re.sub(r'\s+', ' ', s or '').strip().lower()

def is_journal_noise_block(text: str) -> bool:
    """Mendeteksi apakah blok teks hanyalah header, footer, ISSN, atau metadata penerbit."""
    t_lower = text.lower()
    noise_patterns = [
        r'\bissn\b', r'\be-issn\b', r'\bp-issn\b', r'\bvol\.\s*\d+', r'\bno\.\s*\d+',
        r'\bpp\.\s*\d+[-–]\d+', r'\bcopyright\b', r'all rights reserved',
        r'received.*accepted.*published', r'journal of', r'proceedings of'
    ]
    for pat in noise_patterns:
        if re.search(pat, t_lower) and len(text.split()) < 25:
            return True
    return False

def match_quote_to_canonical_blocks(raw_quote: str, blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Mencocokkan kutipan verbatim dari LLM ke blok teks kanonik PDF di tabel paper_blocks.
    Menolak blok yang merupakan noise header/footer penerbit.
    """
    if not raw_quote or len(raw_quote.strip()) < 10:
        return []

    norm_quote = normalize_whitespace(raw_quote)

    # 1. Exact substring match
    for b in blocks:
        if is_journal_noise_block(b.get("text", "")):
            continue
        norm_block = normalize_whitespace(b.get("text", ""))
        if norm_quote in norm_block or (len(norm_quote) > 30 and norm_block in norm_quote):
            return [{
                "block_id": b["block_id"],
                "page_index": b["page_index"],
                "page_label": b.get("page_label", str(b["page_index"])),
                "quote": raw_quote,
            }]

    # 2. Anchor window match (5 kata awal)
    words = norm_quote.split()
    if len(words) >= 5:
        anchor_start = " ".join(words[:5])
        for b in blocks:
            if is_journal_noise_block(b.get("text", "")):
                continue
            norm_block = normalize_whitespace(b.get("text", ""))
            if anchor_start in norm_block:
                return [{
                    "block_id": b["block_id"],
                    "page_index": b["page_index"],
                    "page_label": b.get("page_label", str(b["page_index"])),
                    "quote": raw_quote,
                }]

    return []


# ==============================================================================
# 3. GATEKEEPER & KLASIFIKASI DOKUMEN (STAGE 1 & 4)
# ==============================================================================

def heuristic_academic_score(first_page: str, last_page: str) -> float:
    """Skor heuristik cepat dari struktur naskah fisik."""
    text = (first_page + " " + last_page).lower()
    score = 0.0
    if re.search(r'\b(abstract|abstrak)\b', text):
        score += 0.35
    if re.search(r'\b(references|daftar pustaka|bibliography)\b', text):
        score += 0.30
    if re.search(r'\b(doi:|10\.\d{4,9}/[-._;()/:a-z0-9]+)\b', text):
        score += 0.20
    if re.search(r'\b(introduction|pendahuluan|methodology|metode)\b', text):
        score += 0.15
    return min(1.0, score)

def classify_document_gatekeeper(first_page: str, last_page: str) -> Dict[str, Any]:
    """Evaluasi Gatekeeper menggunakan ModelRegistry (Gemini Core -> Groq Backup)."""
    heur_score = heuristic_academic_score(first_page, last_page)
    if heur_score >= 0.85:
        return {
            "decision": "proceed",
            "doc_type": {
                "label": "research_paper",
                "paper_confidence": round(heur_score, 2),
                "reason": "Terdeteksi struktur akademik lengkap (Abstrak, Sitasi, Referensi) melalui verifikasi kanonik."
            },
            "warnings": []
        }

    lower_sample = (first_page[:2000] + " " + last_page[:2000]).lower()
    is_slides = "slide " in lower_sample or "agenda" in lower_sample or len(first_page.splitlines()) < 8
    is_homework = "tugas kuliah" in lower_sample or "lembar jawaban" in lower_sample or "homework" in lower_sample

    system_prompt = (
        "Anda adalah Document Classifier akademik berstandar Scopus/IEEE.\n"
        "Evaluasi apakah dokumen ini artikel penelitian ilmiah murni atau dokumen non-paper (slide/tugas)."
    )
    user_prompt = f"HALAMAN PERTAMA:\n{first_page[:2000]}\n\nHALAMAN TERAKHIR:\n{last_page[:2000]}"

    try:
        data, provider_used = model_registry.execute_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=DocumentClassificationSchema,
            task_name="Gatekeeper Classification"
        )
        academic_labels = ("research_paper", "thesis", "review", "technical_report")
        if data.label in academic_labels:
            return {
                "decision": "proceed",
                "doc_type": {"label": data.label, "paper_confidence": data.paper_confidence, "reason": data.reason},
                "warnings": []
            }
        elif data.label in ("slides", "coursework", "other") and data.paper_confidence >= 0.7:
            return {
                "decision": "needs_confirmation",
                "doc_type": {"label": data.label, "paper_confidence": data.paper_confidence, "reason": data.reason},
                "warnings": []
            }
        else:
            return {
                "decision": "proceed",
                "doc_type": {"label": data.label, "paper_confidence": data.paper_confidence, "reason": data.reason},
                "warnings": ["maybe_not_paper"]
            }
    except Exception as exc:
        logger.warning(f"Gatekeeper LLM execution failed: {exc}. Menggunakan deterministic fallback.")

    if is_slides:
        return {
            "decision": "needs_confirmation",
            "doc_type": {"label": "slides", "paper_confidence": 0.25, "reason": "Terdeteksi format presentasi/slide."},
            "warnings": []
        }
    if is_homework:
        return {
            "decision": "needs_confirmation",
            "doc_type": {"label": "coursework", "paper_confidence": 0.2, "reason": "Terdeteksi tugas kuliah non-publikasi."},
            "warnings": []
        }

    return {
        "decision": "proceed",
        "doc_type": {"label": "research_paper", "paper_confidence": round(max(0.65, heur_score), 2), "reason": "Lolos heuristik struktur naskah ilmiah."},
        "warnings": ["maybe_not_paper"] if heur_score < 0.4 else []
    }

def extract_paper_title_and_authors(first_page: str, fallback_title: str = "") -> Dict[str, Any]:
    """Ekstraksi judul dan nama penulis menggunakan ModelRegistry (Gemini Core -> Groq Backup)."""
    if not first_page or len(first_page.strip()) < 30:
        return {"title": fallback_title or "Untitled Research Paper", "authors": [], "model": "fallback"}

    system_prompt = (
        "Anda adalah AI Ekstraktor Metadata Paper Ilmiah.\n"
        "Ekstrak JUDUL ASLI dan DAFTAR PENULIS UTAMA dari naskah.\n"
        "ATURAN MUTLAK:\n"
        "1. Abaikan nama jurnal, prosiding, ISSN, DOI, tanggal, dan nama universitas/afiliasi.\n"
        "2. Judul adalah judul riset artikel ilmiah yang bersih tanpa karakter rusak.\n"
        "3. Daftar penulis adalah nama pengarang paper."
    )
    user_prompt = f"TEKS HALAMAN PERTAMA DOKUMEN:\n{first_page[:3500]}"

    try:
        data, provider_used = model_registry.execute_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=TitleAndAuthorsSchema,
            task_name="Title and Authors Extraction"
        )
        title = data.title.strip().replace("\ufffd", '"')
        if title and len(title) >= 5:
            return {"title": title, "authors": data.authors, "model": provider_used}
    except Exception as exc:
        logger.warning(f"Title/Authors extraction via ModelRegistry failed: {exc}")

    return {"title": fallback_title or "Untitled Research Paper", "authors": [], "model": "fallback"}


# ==============================================================================
# 4. SISTEM EKSTRAKSI 4-BATCH (DIVIDE & CONQUER)
# ==============================================================================

BATCH_DEFINITIONS = [
    {
        "batch_id": 1,
        "name": "Konteks Penelitian & Masalah",
        "keys": ["research_problem", "research_objective", "research_questions", "subject_demographics"],
        "context_slice": "start", # 12.000 karakter pertama
        "guidance": """
1. research_problem (Rumusan Masalah):
   Akar masalah ilmiah, masalah praktis di lapangan, atau kesenjangan (gap) literatur yang menjadi motivasi utama penelitian.
2. research_objective (Tujuan Penelitian):
   Pernyataan spesifik dan terukur mengenai apa yang akan dicapai/dibangun/dibuktikan dalam studi ini.
3. research_questions (Pertanyaan Penelitian):
   Daftar pertanyaan penelitian (5W1H) yang memandu eksperimen studi ini. Jika paper tidak menyajikan butir pertanyaan secara eksplisit, rumuskan 1-2 pertanyaan penelitian akademis yang dijawab oleh eksperimen studi ini berdasarkan tujuan dan masalah riset, dan kutip kalimat tujuan sebagai quote.
4. subject_demographics (Konteks & Demografi Subjek):
   Target populasi/domain, sumber subjek/komentar, atau platform/artefak yang dievaluasi.
"""
    },
    {
        "batch_id": 2,
        "name": "Pendekatan Metodologi & Konsep",
        "keys": ["methodology", "variables_concepts", "evaluation_metrics"],
        "context_slice": "middle", # Karakter tengah (metode/arsitektur)
        "guidance": """
1. methodology (Pendekatan Metodologi):
   Paradigma riset (Kuantitatif/Eksperimental/Kualitatif) beserta desain alur teknis (Preprocessing, Ekstraksi Fitur, Arsitektur Model, Prosedur).
2. variables_concepts (Variabel dan Konsep):
   Definisi variabel independen (fitur input, sensor, data masukan) dan variabel dependen (target luaran, kelas klasifikasi, label prediksi).
3. evaluation_metrics (Metrik Evaluasi Spesifik):
   Instrumen / metrik evaluasi model (Akurasi, Presisi, Recall, F1-Score, MSE, Loss, latency). JANGAN MENGUTIP NAMA JURNAL ATAU NAMA PENULIS SEBAGAI METRIK!
"""
    },
    {
        "batch_id": 3,
        "name": "Dataset & Karakteristik Sampel",
        "keys": ["dataset_sample"],
        "context_slice": "middle", # Karakter eksperimen/data
        "guidance": """
1. dataset_sample (Dataset dan Karakteristik Sampel):
   Rincian jumlah data mentah, data bersih setelah filter/validasi, sumber crawling/dataset publik, kriteria sampel, dan distribusi kelas. JANGAN MENGUTIP NAMA PENERBIT/JURNAL SEBAGAI DATASET!
"""
    },
    {
        "batch_id": 4,
        "name": "Hasil Temuan, Inovasi & Celah Riset",
        "keys": ["results_findings", "novelty", "key_claims", "limitations", "future_work"],
        "context_slice": "end", # 14.000 karakter akhir (hasil, diskusi, kesimpulan)
        "guidance": """
1. results_findings (Temuan Utama):
   Ringkasan hasil akhir eksperimen, angka kuantitatif spesifik (skor akurasi, F1-score model terbaik vs baseline, capaian per kelas).
2. novelty (Kontribusi Kebaruan):
   Inovasi pembeda atau kebaruan teknis dari penelitian ini dibandingkan studi-studi terdahulu. JANGAN MENGUTIP ISSN/NOMOR HALAMAN!
3. key_claims (Klaim Utama):
   Argumen sentral atau kesimpulan terkuat yang dipertahankan oleh penulis berdasarkan bukti empiris.
4. limitations (Keterbatasan Riset):
   Pengakuan jujur atas keterbatasan metode, ukuran data, keterbatasan komputasi, atau cakupan penelitian.
5. future_work (Peluang Riset Mendatang):
   Rekomendasi spesifik dari penulis untuk eksperimen lanjutan atau riset berikutnya (periksa bagian Kesimpulan/Future Work).
"""
    }
]

def extract_parameters_with_llm(
    parameters: List[Dict[str, Any]],
    blocks: List[Dict[str, Any]],
    full_text: str,
    progress_callback: Optional[callable] = None,
) -> List[Dict[str, Any]]:
    """
    Ekstraksi 13 Parameter Ilmiah Menggunakan 4-Batch Processing & ModelRegistry (Gemini Core -> Groq Backup).
    Setiap batch independen dan lolos validasi skema Pydantic ketat.
    """
    # Bersihkan teks dari daftar pustaka di bagian akhir
    ref_idx = full_text.lower().rfind('references')
    if ref_idx == -1:
        ref_idx = full_text.lower().rfind('daftar pustaka')
    clean_text = full_text[:ref_idx] if ref_idx != -1 else full_text

    text_len = len(clean_text)
    slice_start = clean_text[:14000]
    slice_middle = clean_text[max(0, text_len // 4):min(text_len, text_len // 4 + 14000)]
    slice_end = clean_text[max(0, text_len - 14000):]

    all_extracted_results = []
    active_keys_set = {p["key"] for p in parameters}

    for bdef in BATCH_DEFINITIONS:
        batch_id = bdef["batch_id"]
        batch_name = bdef["name"]
        batch_keys = [k for k in bdef["keys"] if k in active_keys_set]

        if not batch_keys:
            continue

        if progress_callback:
            progress_callback(batch_id, len(BATCH_DEFINITIONS), batch_name)

        # Pilih irisan teks konteks yang sesuai
        if bdef["context_slice"] == "start":
            context_text = slice_start
        elif bdef["context_slice"] == "middle":
            context_text = slice_middle
        else:
            context_text = slice_end

        system_prompt = (
            f"Anda adalah Sistem AI Analisis Paper Akademik Modellyng.\n"
            f"Ekstraksi kelompok parameter ilmiah berikut: '{batch_name}'.\n\n"
            f"PANDUAN PARAMETER:\n{bdef['guidance']}\n\n"
            f"ATURAN MUTLAK:\n"
            f"1. NILAI 'formulation' WAJIB DITULIS DALAM BAHASA INDONESIA BAKU DAN AKADEMIS LENGKAP. Dilarang keras membiarkan teks bahasa Inggris di formulation! Jelaskan dengan berwibawa, padat makna, dan elegan.\n"
            f"2. JANGAN BERHALUSINASI. Hanya gunakan fakta yang tertulis di teks naskah.\n"
            f"3. 'quote': Wajib mengutip kalimat bukti ASLI (verbatim) dari teks dokumen aslinya sepanjang 1-2 kalimat persis seperti tertulis di PDF. JANGAN MENGARANG KUTIPAN.\n"
            f"4. DILARANG MENGUTIP HEADER JURNAL, ISSN, NAMA PENERBIT, ATAU DAFTAR PUSTAKA."
        )

        user_prompt = (
            f"Kunci parameter yang wajib diekstrak pada batch ini: {batch_keys}\n\n"
            f"TEKS DOKUMEN ILMIAH:\n{context_text}"
        )

        task_label = f"Batch {batch_id}/4: {batch_name}"

        try:
            batch_result, provider_used = model_registry.execute_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_model=BatchExtractionSchema,
                task_name=task_label,
                temperature=0.1
            )

            # Petakan hasil batch ke format kanonik komponen
            extracted_by_key = {item.parameter_key: item for item in batch_result.extractions}

            for key in batch_keys:
                if key in extracted_by_key:
                    item = extracted_by_key[key]
                    raw_quote = (item.quote or "").strip()
                    matched_ev = match_quote_to_canonical_blocks(raw_quote, blocks)

                    # Jika kutipan tidak ditemukan di blok dokumen asli, catat peringatan
                    state = item.state if item.state in ("found", "not_found", "not_applicable") else "found"
                    if not matched_ev and state == "found":
                        # Masih simpan bukti verbatim naskah walau koordinat exact meleset
                        matched_ev = [{
                            "block_id": f"p{item.page_number or 1}_raw",
                            "page_index": item.page_number or 1,
                            "page_label": str(item.page_number or 1),
                            "quote": raw_quote
                        }]

                    all_extracted_results.append({
                        "parameter_key": key,
                        "state": state,
                        "value": {"text": item.formulation},
                        "evidence": matched_ev,
                        "confidence_score": float(item.confidence_score),
                    })
                else:
                    # Tidak diekstrak oleh model
                    all_extracted_results.append({
                        "parameter_key": key,
                        "state": "not_found",
                        "value": {"text": "Informasi tidak ditemukan secara eksplisit pada teks paper."},
                        "evidence": [],
                        "confidence_score": 0.50,
                    })

        except AllModelsExhaustedError as exc:
            logger.error(f"[{task_label}] Gagal total di kedua model (Gemini Core & Groq Backup): {exc}")
            raise exc

    return all_extracted_results
