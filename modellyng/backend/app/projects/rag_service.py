import os
import json
import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("modellyng.rag_service")

FALLBACK_NOT_FOUND_MSG = (
    "Informasi spesifik mengenai pertanyaan tersebut tidak ditemukan secara eksplisit dalam dokumen naskah proyek ini. "
    "Namun, Anda dapat menanyakan ringkasan proyek, metodologi, temuan utama, atau membandingkan paper yang ada."
)

SYSTEM_RAG_PROMPT = """Anda adalah Asisten Riset Akademik Berbasis Bukti (Evidence-Centered Research Assistant) pada platform Modellyng.
Tugas utama Anda adalah mendampingi peneliti dalam berdiskusi, memahami, menganalisis, dan mensintesis literatur ilmiah lintas-dokumen secara mendalam, objektif, dan komprehensif.

ATURAN UTAMA & PENALARAN AKADEMIK:
1. KEMAMPUAN DISKUSI INTERAKTIF & SALAM:
   - Jika pengguna menyapa (misalnya: "halo", "selamat pagi", "siapa kamu", "apa yang bisa kamu bantu?"), jawablah dengan ramah, profesional, dan akademis. Perkenalkan diri sebagai Asisten Cerdas Global Modellyng, paparkan secara ringkas proyek aktif dan daftar paper di dalamnya, lalu tawarkan topik diskusi menarik (seperti telaah metodologi, perbandingan temuan, atau celah riset).
   - Jika pengguna melanjutkan obrolan (follow-up discussion), pertahankan konteks diskusi sebelumnya secara konsisten dan alami layaknya rekan peneliti sejawat.

2. PENALARAN SINTESIS KOMPREHENSIF TINGKAT TINGGI (Global Multi-Paper):
   - Jika pengguna menanyakan gambaran umum proyek (misalnya: "project ini membahas apa?", "apa fokus proyek ini?", "ringkas proyek ini", "apa topik utama proyek?"), berikan jawaban sintesis holistik tingkat tinggi yang merangkum fokus utama proyek secara utuh.
   - Hubungkan secara cerdas argumen Anda ke paper-paper spesifik di dalam proyek beserta sitasi resmi nama penulis dan tahun publikasi (contoh: (Panjaitan dkk., 2024), (Amin dkk., 2024)).

3. PENELAAHAN MENDALAM PAPER SPESIFIK:
   - Jika pengguna menanyakan paper tertentu (misalnya: "paper tersebut membahas apa?", "jelaskan metodologi paper X", "apa temuan paper Y?"), jelaskan secara mendalam rumusan masalah, metodologi, temuan kunci (termasuk nilai statistik/koefisien bila ada), dan kebaruan naskah tersebut berdasarkan fakta dokumen.

4. KETERTELUSURAN BUKTI & SITASI [S1], [S2]:
   - Setiap kali Anda mengutip atau merujuk fakta spesifik dari kutipan konteks dokumen yang bernomor [S1], [S2], sertakan penanda sitasi blok [S1], [S2] pada akhir kalimat atau klausa terkait.
   - Untuk gambaran umum proyek atau salam, Anda tidak wajib menyematkan [S1] jika tidak mengutip blok spesifik.

5. BAHASA & TIPOGRAFI AKADEMIS:
   - Seluruh jawaban WAJIB ditulis dalam Bahasa Indonesia yang formal, baku, santun, dan akademis. Dilarang menyalin mentah teks Bahasa Inggris tanpa menerjemahkannya dengan baik.
   - Gunakan format Markdown yang kaya dan terstruktur: judul seksi (###), daftar berbutir (-), dan penegasan konsep penting dengan cetak tebal (**...**).

6. FORMAT KELUARAN JSON:
   Kembalikan respons HANYA dalam format JSON valid dengan skema:
   {
     "answer": "Teks jawaban lengkap dalam format Markdown Bahasa Indonesia...",
     "citations_used": ["S1", "S2"]
   }
"""


def is_greeting(query: str) -> bool:
    """Mendeteksi apakah pertanyaan merupakan salam atau sapaan pembuka percakapan."""
    q = query.strip().lower()
    greetings = [
        "halo", "hello", "hi", "hai", "selamat pagi", "selamat siang", "selamat sore",
        "selamat malam", "assalamualaikum", "pagi", "siang", "sore", "malam", "ping",
        "test", "tes", "who are you", "siapa kamu", "bisa apa", "apa kabar"
    ]
    if q in greetings:
        return True
    return any(q.startswith(g + " ") or q.endswith(" " + g) or q == g for g in greetings)


def is_project_overview_query(query: str) -> bool:
    """Mendeteksi apakah pertanyaan menanyakan gambaran holistik proyek."""
    q = query.strip().lower()
    patterns = [
        "project ini membahas apa", "proyek ini membahas apa", "apa isi proyek ini",
        "apa yang dibahas dalam proyek", "ringkas proyek", "jelaskan proyek",
        "overview proyek", "topik proyek", "apa saja paper di proyek", "apa fokus proyek",
        "tentang apa proyek ini", "jelaskan tentang proyek", "proyek ini tentang apa"
    ]
    return any(p in q for p in patterns)


def is_paper_overview_query(query: str) -> bool:
    """Mendeteksi apakah pertanyaan menanyakan gambaran suatu paper spesifik."""
    q = query.strip().lower()
    patterns = [
        "paper tersebut membahas apa", "paper ini membahas apa", "apa isi paper ini",
        "ringkas paper", "jelaskan paper ini", "naskah ini membahas apa",
        "apa yang dibahas paper", "tentang apa paper ini", "makalah ini membahas apa"
    ]
    return any(p in q for p in patterns)


def generate_rag_response(
    query: str,
    contexts: List[Dict[str, Any]],
    project_meta: Optional[Dict[str, Any]] = None,
    paper_focus: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Menghasilkan respons penalaran akademis tingkat tinggi menggunakan Groq Qwen/Llama
    atau fallback deterministik berbasis ekstraksi riil paper.
    """
    project_name = (project_meta and project_meta.get("name")) or "Proyek Riset"
    papers = (project_meta and project_meta.get("papers")) or []

    # 1. Format metadata ringkasan seluruh paper di dalam proyek (ringkas & padat demi efisiensi token)
    paper_summaries = []
    for idx, p in enumerate(papers):
        p_title = p.get("title", f"Paper {idx + 1}")
        p_auth = ", ".join(p.get("authors") or []) or "Peneliti"
        p_yr = p.get("year") or "2024"
        p_journal = p.get("journal") or ""
        p_comps = p.get("components") or {}

        prob = (p_comps.get("research_problem") or p_comps.get("problem_statement") or "")[:200]
        meth = (p_comps.get("methodology") or p_comps.get("metodologi") or "")[:200]
        find = (p_comps.get("results_findings") or p_comps.get("temuan_utama") or "")[:200]
        nov = (p_comps.get("novelty") or p_comps.get("novelty_kebaruan") or "")[:180]

        summary_parts = [f"Paper {idx + 1}: \"{p_title}\" ({p_auth}, {p_yr}) {f'[{p_journal}]' if p_journal else ''}"]
        if prob:
            summary_parts.append(f"  - Masalah/Tujuan: {prob}")
        if meth:
            summary_parts.append(f"  - Metodologi: {meth}")
        if find:
            summary_parts.append(f"  - Temuan Utama: {find}")
        if nov:
            summary_parts.append(f"  - Kebaruan: {nov}")

        paper_summaries.append("\n".join(summary_parts))

    project_context_str = "\n\n".join(paper_summaries) if paper_summaries else "Belum ada dokumen paper terunggah pada proyek ini."

    # 2. Format konteks fokus naskah (jika ada tag /paper)
    focus_str = ""
    if paper_focus:
        f_title = paper_focus.get("title", "")
        f_auth = ", ".join(paper_focus.get("authors") or []) or "Peneliti"
        f_yr = paper_focus.get("year") or "2024"
        focus_str = (
            f"\n\nFOKUS TELAAN KHUSUS (User menyorot naskah ini):\n"
            f"Paper: \"{f_title}\" ({f_auth}, {f_yr})\n"
        )

    # 3. Format kutipan blok bukti (evidence blocks S1, S2, ... dibatasi top 4 agar hemat token)
    formatted_context_list = []
    for c in contexts[:4]:
        snippet = (c["full_content"] or "")[:800].replace("\n", " ").strip()
        formatted_context_list.append(
            f"[{c['citation_id']}] Dokumen: '{c['paper_title']}' (Halaman {c['page_number']}, Blok {c['block_id']})\n"
            f"Kutipan:\n\"{snippet}\""
        )
    evidence_str = "\n\n".join(formatted_context_list) if formatted_context_list else "Tidak ada kutipan teks fisik spesifik yang cocok dengan kata kunci kueri."

    user_prompt = f"""RINGKASAN PROYEK AKTIF:
Nama Proyek: "{project_name}"
Jumlah Paper: {len(papers)} naskah

PROFIL DOKUMEN DALAM PROYEK:
{project_context_str}
{focus_str}

KUTIPAN BUKTI FISIK DOKUMEN (EVIDENCE CITATIONS):
{evidence_str}

PERTANYAAN PENELITI:
{query}

Berikan jawaban terstruktur dalam format JSON valid sesuai skema dan aturan di atas:"""

    # 4. Bangun riwayat percakapan untuk mendukung multi-turn dialog (ringkas maksimal 2 turn terakhir)
    chat_messages = [{"role": "system", "content": SYSTEM_RAG_PROMPT}]
    if history and isinstance(history, list):
        for h in history[-2:]:
            role = "user" if h.get("role") == "user" else "assistant"
            content = h.get("content", "").strip()
            # Ringkas konten riwayat asisten agar tidak membebani token input
            if role == "assistant" and len(content) > 300:
                content = content[:300] + "..."
            if content and not content.startswith("{"):
                chat_messages.append({"role": role, "content": content})

    chat_messages.append({"role": "user", "content": user_prompt})

    # 5. Coba Groq API dengan model aktif (misal qwen/qwen3.8-27b)
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    groq_model = os.getenv("GROQ_MODEL_NAME", "qwen/qwen3.8-27b")

    if groq_api_key and not groq_api_key.startswith("masukkan_"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            completion = client.chat.completions.create(
                model=groq_model,
                messages=chat_messages,
                temperature=0.2,
                response_format={"type": "json_object"},
                max_tokens=1800,
            )
            raw_content = completion.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)
            answer_text = parsed.get("answer", "").strip()
            used_citations_keys = parsed.get("citations_used", [])

            # Cocokkan sitasi yang benar-benar dipakai
            matched_citations = [
                c for c in contexts if c["citation_id"] in used_citations_keys or f"[{c['citation_id']}]" in answer_text
            ]

            if answer_text:
                return {
                    "answer": answer_text,
                    "citations": matched_citations,
                }
        except Exception as e:
            logger.warning(f"Groq RAG completion ({groq_model}) failed: {e}. Trying Gemini or fallback.")

    # 6. Coba Gemini API jika kunci tersedia
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_api_key and not gemini_api_key.startswith("masukkan_"):
        try:
            import httpx
            gemini_model = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash").replace("models/", "")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_api_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{SYSTEM_RAG_PROMPT}\n\n{user_prompt}"}]}
                ],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
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

                if answer_text:
                    return {
                        "answer": answer_text,
                        "citations": matched_citations,
                    }
        except Exception as e:
            logger.warning(f"Gemini RAG completion failed: {e}. Using deterministic synthesis.")

    # 7. Deterministic Extractive Synthesis Fallback (Jaminan Respons Bernilai Tinggi)
    # A. Kasus Sapaan / Salam Pembuka
    if is_greeting(query):
        paper_list_md = "\n".join([
            f"- **{p.get('title')}** ({', '.join(p.get('authors') or []) or 'Peneliti'}, {p.get('year') or '2024'})"
            for p in papers
        ]) if papers else "Saat ini belum ada naskah paper yang diunggah ke proyek ini."

        answer_text = (
            f"Halo! Selamat datang di **Asisten Cerdas Global Modellyng**.\n\n"
            f"Saya siap mendampingi Anda dalam menelaah, mendiskusikan, dan membandingkan literatur ilmiah pada proyek **\"{project_name}\"**.\n\n"
            f"### Naskah dalam Proyek Aktif:\n{paper_list_md}\n\n"
            f"Ada yang ingin Anda eksplorasi hari ini? Anda dapat menanyakan:\n"
            f"- Gambaran umum fokus penelitian proyek (*\"project ini membahas apa?\"*)\n"
            f"- Perbandingan metodologi atau variabel antar-paper\n"
            f"- Temuan kunci dan signifikansi statistik naskah tertentu"
        )
        return {"answer": answer_text, "citations": []}

    # B. Kasus Gambaran Umum Proyek
    if is_project_overview_query(query) and papers:
        paper_sections = []
        for idx, p in enumerate(papers):
            p_auth = ", ".join(p.get("authors") or []) or "Peneliti"
            p_yr = p.get("year") or "2024"
            p_comps = p.get("components") or {}
            prob = p_comps.get("research_problem") or p_comps.get("problem_statement") or ""
            find = p_comps.get("results_findings") or p_comps.get("temuan_utama") or ""

            paper_sections.append(
                f"### {idx + 1}. {p.get('title')} ({p_auth}, {p_yr})\n"
                f"- **Fokus & Masalah:** {prob if prob else 'Mengeksplorasi tantangan empiris pada domain terkait.'}\n"
                f"- **Temuan Utama:** {find if find else 'Menyajikan hasil evaluasi terukur berbasis instrumen penelitian.'}"
            )

        answer_text = (
            f"Proyek riset **\"{project_name}\"** mengkaji ranah investigasi ilmiah terpadu yang mencakup {len(papers)} naskah dokumen:\n\n"
            + "\n\n".join(paper_sections) +
            f"\n\nSecara keseluruhan, proyek ini memadukan pembuktian empiris untuk menjawab permasalahan inti pada bidang riset yang bersangkutan."
        )
        return {"answer": answer_text, "citations": contexts[:2]}

    # C. Kasus Gambaran Paper Spesifik
    target_paper = paper_focus or (papers[0] if papers else None)
    if is_paper_overview_query(query) and target_paper:
        t_auth = ", ".join(target_paper.get("authors") or []) or "Peneliti"
        t_yr = target_paper.get("year") or "2024"
        t_comps = target_paper.get("components") or {}
        prob = t_comps.get("research_problem") or t_comps.get("problem_statement") or ""
        meth = t_comps.get("methodology") or t_comps.get("metodologi") or ""
        find = t_comps.get("results_findings") or t_comps.get("temuan_utama") or ""
        nov = t_comps.get("novelty") or t_comps.get("novelty_kebaruan") or ""

        answer_text = (
            f"Naskah **\"{target_paper.get('title')}\"** yang ditulis oleh **{t_auth} ({t_yr})** berfokus pada kajian ilmiah berikut:\n\n"
            f"- **Rumusan Masalah:** {prob if prob else 'Mengkaji tantangan spesifik dalam domain penelitian.'}\n"
            f"- **Pendekatan Metodologi:** {meth if meth else 'Mengadopsi desain eksperimental dan analisis data ilmiah.'}\n"
            f"- **Temuan Utama:** {find if find else 'Menunjukkan hasil terukur yang mendukung hipotesis penelitian.'}\n"
            f"- **Kebaruan Ilmiah:** {nov if nov else 'Memberikan kontribusi baru pada kerangka teoretis dan terapan.'}"
        )
        return {"answer": answer_text, "citations": contexts[:2]}

    # D. Kasus Berbasis Konteks Bukti
    if contexts:
        bullets = []
        for c in contexts[:4]:
            snippet = c["full_content"].replace("\n", " ").strip()
            if len(snippet) > 240:
                snippet = snippet[:240] + "..."
            bullets.append(f"- **{c['paper_title']}** (Hal. {c['page_number']}): \"{snippet}\" [{c['citation_id']}]")

        answer_text = (
            f"Berdasarkan penelusuran bukti dokumen pada proyek **\"{project_name}\"**, ditemukan rujukan data yang relevan:\n\n"
            + "\n".join(bullets)
        )
        return {"answer": answer_text, "citations": contexts[:4]}

    return {
        "answer": FALLBACK_NOT_FOUND_MSG,
        "citations": [],
    }
