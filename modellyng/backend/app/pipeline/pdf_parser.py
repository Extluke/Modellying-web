import re
from pathlib import Path
from typing import Dict, Any, List, Tuple
import pymupdf as fitz # PyMuPDF

class PDFParseError(Exception):
    def __init__(self, code: str, user_message: str):
        super().__init__(user_message)
        self.code = code
        self.user_message = user_message

def is_garbage_title(title: str) -> bool:
    if not title or len(title.strip()) < 5:
        return True
    t = title.strip().lower()
    # Word template junk like Author,+Information+Retrieval+Research
    if "+" in t and "," in t:
        return True
    # UUIDs
    if re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", t):
        return True
    # Publisher paper submission ids (e.g. 7952_2, 8025_3)
    if re.match(r"^\d+_\d+$", t):
        return True
    # Common generic doc strings
    if any(k in t for k in ["untitled", "microsoft word", "word template", "paper submission"]):
        return True
    return False

def inspect_pdf_metadata(file_path: Path, original_filename: str = "") -> Tuple[int, str]:
    """
    Quickly opens PDF using PyMuPDF to get total page count and genuine paper title.
    Rejects publisher/Word metadata garbage and uses page 0 font-size heuristic if needed.
    Raises PDFParseError if corrupted or encrypted.
    """
    try:
        doc = fitz.open(str(file_path))
    except Exception as e:
        raise PDFParseError("pdf_corrupt", f"File PDF rusak atau tidak dapat dibuka: {str(e)}")

    if doc.is_encrypted:
        doc.close()
        raise PDFParseError("pdf_encrypted", "File PDF terkunci oleh kata sandi (password).")

    total_pages = len(doc)
    meta = doc.metadata or {}
    raw_title = (meta.get("title") or "").strip()

    title = ""
    if raw_title and not is_garbage_title(raw_title):
        title = raw_title
    else:
        # Heuristic from page 0 font sizes
        try:
            page0 = doc[0]
            blocks = page0.get_text("dict").get("blocks", [])
            spans_by_size = {}
            for b in blocks:
                if "lines" in b:
                    for l in b["lines"]:
                        for s in l["spans"]:
                            text = s["text"].strip()
                            size = round(s["size"], 1)
                            if len(text) > 3 and not text.isdigit():
                                lower = text.lower()
                                if any(jh in lower for jh in ["journal", "vol.", "volume", "issn", "doi.org", "http", "pp.", "hal.", "conference"]):
                                    continue
                                spans_by_size.setdefault(size, []).append(text)

            if spans_by_size:
                max_size = max(spans_by_size.keys())
                largest_texts = spans_by_size[max_size]
                candidate = " ".join(largest_texts).strip()
                candidate = re.sub(r"\s+", " ", candidate)
                candidate = candidate.replace("\ufffd", '"')
                if len(candidate) >= 8:
                    title = candidate
        except Exception:
            pass

    if not title or len(title) < 5 or is_garbage_title(title):
        base_name = original_filename or file_path.name
        title = Path(base_name).stem.replace("_", " ").title()

    doc.close()
    return total_pages, title

def extract_canonical_blocks_and_coverage(file_path: Path) -> Dict[str, Any]:
    """
    Extracts text, blocks, and coverage report using PyMuPDF.
    Calculates readable pages, detects scanned/image-only pages.
    """
    try:
        doc = fitz.open(str(file_path))
    except Exception as e:
        raise PDFParseError("pdf_corrupt", f"Gagal membaca struktur PDF: {str(e)}")

    if doc.is_encrypted:
        doc.close()
        raise PDFParseError("pdf_encrypted", "File PDF terkunci oleh kata sandi.")

    total_pages = len(doc)
    blocks = []
    unreadable_pages = []
    total_chars = 0
    full_text_list = []

    for page_idx in range(total_pages):
        page = doc[page_idx]
        page_label = str(page_idx + 1)
        page_text = page.get_text("text").strip()
        full_text_list.append(page_text)

        # Count readable characters
        char_count = len(page_text)
        total_chars += char_count

        if char_count < 40:
            # Page has virtually no extractable text (likely an image or scanned page)
            unreadable_pages.append(page_idx + 1)

        # Extract text blocks
        page_blocks = page.get_text("blocks")
        for b_idx, b in enumerate(page_blocks):
            # b: (x0, y0, x1, y1, text, block_no, block_type)
            if len(b) >= 7 and b[6] == 0: # text block
                text_content = b[4].strip()
                if text_content:
                    block_id = f"p{page_idx + 1}_b{b_idx + 1}"
                    blocks.append({
                        "block_id": block_id,
                        "page_index": page_idx + 1,
                        "page_label": page_label,
                        "bbox": [round(b[0], 2), round(b[1], 2), round(b[2], 2), round(b[3], 2)],
                        "text": text_content,
                    })

    doc.close()

    pages_readable = total_pages - len(unreadable_pages)

    # Detect language simple heuristic
    sample_text = " ".join(full_text_list[:3]).lower()
    id_words = ["yang", "dan", "dengan", "penelitian", "metode", "hasil", "dari"]
    en_words = ["the", "and", "with", "research", "method", "results", "from"]
    id_score = sum(1 for w in id_words if re.search(r'\b' + w + r'\b', sample_text))
    en_score = sum(1 for w in en_words if re.search(r'\b' + w + r'\b', sample_text))
    language = "id" if id_score > en_score else "en"

    coverage = {
        "pages_total": total_pages,
        "pages_readable": pages_readable,
        "unreadable_pages": unreadable_pages,
        "language": language,
    }

    # Quality rules from document:
    # 1. All pages without text -> failed with needs_ocr
    if total_chars == 0 or pages_readable == 0:
        raise PDFParseError("needs_ocr", "Tidak ada teks yang dapat dibaca. Dokumen terdeteksi sebagai scan gambar penuh.")

    warnings = []
    # 2. Some pages empty -> warning partial_scan
    if len(unreadable_pages) > 0:
        warnings.append("partial_scan")

    # Detect canonical DOI in first 3 pages
    extracted_doi = ""
    for p_text in full_text_list[:3]:
        match = re.search(r'\b(10\.\d{4,9}/[-._;()/:a-zA-Z0-9]+)\b', p_text)
        if match:
            extracted_doi = match.group(1).rstrip(".,;)>]")
            break

    return {
        "coverage": coverage,
        "blocks": blocks,
        "warnings": warnings,
        "extracted_doi": extracted_doi,
        "first_page_text": full_text_list[0] if full_text_list else "",
        "last_page_text": full_text_list[-1] if full_text_list else "",
        "full_text": "\n\n".join(full_text_list),
    }

