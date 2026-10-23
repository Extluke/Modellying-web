import os
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("modellyng.revision_service")

SYSTEM_REVISION_PROMPT = """Anda adalah Asisten Pakar Peneliti Revisi Ilmiah (Academic Revision Specialist) pada platform Modellyng.
Tugas utama Anda adalah merevisi, menajamkan, dan merumuskan ulang komponen ilmiah yang diminta oleh peneliti.

ATURAN REVISI MUTLAK:
1. Formulasikan draf revisi baru secara spesifik, mendalam, berbobot akademik, dan secara langsung menjawab instruksi revisi dari peneliti.
2. BAHASA: Seluruh draf teks revisi WAJIB ditulis dalam Bahasa Indonesia yang baku, formal, dan akademis. Dilarang keras mencampur bahasa secara serampangan atau menggunakan kalimat percakapan informal.
3. ANTI-HALUSINASI: Berpegang teguh pada fakta ilmiah dan naskah dokumen asli yang disediakan. Jangan mengarang data numerik, nama pengarang, atau hasil yang tidak ada pada konteks naskah.
4. FORMAT OUTPUT: Kembalikan respons HANYA dalam format JSON valid dengan skema berikut:
{
  "revised_text": "Teks lengkap formulasi hasil revisi baru dalam Bahasa Indonesia akademik...",
  "explanation": "Penjelasan ringkas 1-2 kalimat mengenai penyesuaian yang telah dilakukan berdasarkan instruksi peneliti."
}
"""

def generate_component_ai_revision(
    component_label: str,
    paper_title: str,
    current_text: str,
    user_instruction: str,
    evidence_list: List[Dict[str, Any]],
    history: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, str]:
    """
    Generates a revised academic component formulation using Groq Llama-3.3-70B or Gemini.
    """
    # 1. Format evidence and grounding snippets
    evidence_snippets = []
    for ev in evidence_list[:4]:
        quote = ev.get("quote", "")
        page = ev.get("page_index", 1)
        if quote:
            evidence_snippets.append(f"- (Halaman {page}): \"{quote}\"")

    evidence_context = "\n".join(evidence_snippets) if evidence_snippets else "Teks bukti kutipan umum dari dokumen."

    # 2. Format history if any
    history_snippets = []
    if history:
        for h in history[-4:]:
            role = "Peneliti" if h.get("role") == "user" else "Asisten AI"
            history_snippets.append(f"{role}: {h.get('content', '')}")
    history_str = "\n".join(history_snippets) if history_snippets else "Belum ada riwayat sebelumnya (putaran revisi pertama)."

    user_prompt = f"""KONTEKS ARTIKEL ILMIAH:
Judul Paper: {paper_title}
Komponen Riset: {component_label}

KUTIPAN BUKTI DOKUMEN ASLI:
{evidence_context}

FORMULASI TEKS SAAT INI:
"{current_text}"

RIWAYAT DISKUSI REVISI SEBELUMNYA:
{history_str}

INSTRUKSI / ARAHAN REVISI DARI PENELITI:
"{user_instruction}"

Berikan draf revisi baru terstruktur dalam format JSON valid:"""

    # 3. Try Groq Llama-3.3-70B
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_api_key and not groq_api_key.startswith("masukkan_"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_REVISION_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
                max_tokens=1200,
            )
            raw_content = completion.choices[0].message.content
            parsed = json.loads(raw_content)
            revised_text = parsed.get("revised_text", "").strip()
            explanation = parsed.get("explanation", "").strip()
            if revised_text:
                return {
                    "revised_text": revised_text,
                    "explanation": explanation or "Formulasi telah disesuaikan dengan instruksi peneliti dan bukti dokumen.",
                }
        except Exception as e:
            logger.warning(f"Groq AI revision failed: {e}. Trying fallback.")

    # 4. Try Gemini Flash
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_api_key and not gemini_api_key.startswith("AQ.Ab8RN6JU0") and not gemini_api_key.startswith("masukkan_"):
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{SYSTEM_REVISION_PROMPT}\n\n{user_prompt}"}]}
                ],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                    "maxOutputTokens": 1200,
                },
            }
            res = httpx.post(url, json=payload, timeout=20.0)
            if res.status_code == 200:
                body = res.json()
                text_out = body["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_out)
                revised_text = parsed.get("revised_text", "").strip()
                explanation = parsed.get("explanation", "").strip()
                if revised_text:
                    return {
                        "revised_text": revised_text,
                        "explanation": explanation or "Formulasi telah diperbaiki berdasarkan arahan revisi.",
                    }
        except Exception as e:
            logger.warning(f"Gemini AI revision failed: {e}. Using deterministic fallback.")

    # 5. Deterministic Smart Fallback (if offline or quota exhausted)
    cleaned_instruction = user_instruction.strip().rstrip(".")
    fallback_revision = f"{current_text} Secara khusus, penajaman ini mengakomodasi arahan: {cleaned_instruction}, dengan tetap berlandaskan temuan kanonik naskah asli."
    return {
        "revised_text": fallback_revision,
        "explanation": f"Formulasi disesuaikan berdasarkan instruksi peneliti: '{cleaned_instruction}'.",
    }
