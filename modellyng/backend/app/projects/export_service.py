# modellyng/backend/app/projects/export_service.py
"""
Layanan Ekspor Matriks Sintesis Riset Akademik (CSV, XLSX, PDF)
Menyajikan 13 parameter ilmiah kanonik secara terstruktur, rapi, dan siap terbit.
"""

import csv
import io
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.database import get_db

# 13 Parameter Baku Modellyng (Fallback berurutan jika DB query dinamis)
DEFAULT_13_PARAMETERS = [
    ("masalah_utama", "1. Rumusan Masalah Utama"),
    ("tujuan_penelitian", "2. Tujuan Penelitian"),
    ("metodologi_pendekatan", "3. Metodologi & Desain Riset"),
    ("sampel_data", "4. Karakteristik Sampel & Data"),
    ("landasan_teori", "5. Landasan Teori Utama"),
    ("teknik_analisis", "6. Teknik Pengumpulan & Analisis"),
    ("temuan_utama", "7. Temuan & Hasil Kunci"),
    ("implikasi_praktis", "8. Implikasi Teoretis & Praktis"),
    ("keterbatasan_riset", "9. Keterbatasan Penelitian"),
    ("rekomendasi_lanjutan", "10. Rekomendasi Riset Lanjutan"),
    ("novelty_kebaruan", "11. Kebaruan Ilmiah (Novelty)"),
    ("celah_penelitian", "12. Celah Riset yang Ditutup"),
    ("kesimpulan_utama", "13. Kesimpulan Akhir"),
]


class NumberedCanvas(canvas.Canvas):
    """Canvas dua-lintasan untuk mencetak total halaman dinamis (Halaman X dari Y)."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header garis tipis
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(30, 565, 812, 565)
        self.drawString(30, 570, "MODELLYNG WEB — Laporan Sintesis Matriks 13 Parameter Akademik")

        # Footer
        self.line(30, 35, 812, 35)
        self.drawString(30, 24, "Dokumen resmi diekspor dari Modellyng Web Engine — Evidence-Centered Academic Analysis")
        page_str = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(812, 24, page_str)
        self.restoreState()


def fetch_project_export_data(project_id: str, user_id: str) -> Dict[str, Any]:
    """Mengambil seluruh data proyek, papers, parameter, dan komponen terekstraksi."""
    with get_db() as conn:
        with conn.cursor() as cur:
            # 1. Verifikasi kepemilikan proyek
            cur.execute(
                "SELECT id, name, description, created_at FROM public.projects WHERE id = %s AND user_id = %s;",
                (project_id, user_id),
            )
            p_row = cur.fetchone()
            if not p_row:
                raise ValueError("Proyek tidak ditemukan atau Anda tidak memiliki akses.")
            
            project_info = {
                "id": str(p_row[0]),
                "name": p_row[1],
                "description": p_row[2] or "",
                "created_at": p_row[3],
            }

            # 2. Ambil parameter 13 aktif terurut
            cur.execute(
                """
                SELECT key, label, sort_order 
                FROM public.extraction_parameters 
                WHERE status = 'active' 
                ORDER BY sort_order ASC;
                """
            )
            param_rows = cur.fetchall()
            params = []
            for r in param_rows:
                key = r[0]
                label_val = r[1]
                label_str = label_val.get("id") or label_val.get("en") if isinstance(label_val, dict) else str(label_val)
                params.append((key, label_str))
            
            if not params:
                params = DEFAULT_13_PARAMETERS

            # 3. Ambil seluruh paper dalam proyek
            cur.execute(
                """
                SELECT id, title, authors, year, journal, doi, file_name, file_size_bytes, 
                       status, source_verification, uploaded_at, total_pages
                FROM public.papers 
                WHERE project_id = %s 
                ORDER BY uploaded_at ASC;
                """,
                (project_id,),
            )
            paper_rows = cur.fetchall()
            papers = []
            paper_ids = []
            for r in paper_rows:
                pid = str(r[0])
                paper_ids.append(pid)
                authors_raw = r[2] or []
                authors_str = ", ".join(authors_raw) if isinstance(authors_raw, list) else str(authors_raw)
                
                papers.append({
                    "id": pid,
                    "title": r[1] or "Dokumen Tanpa Judul",
                    "authors": authors_str or "Anonim / Tim Penulis",
                    "year": str(r[3]) if r[3] else "-",
                    "journal": r[4] or "-",
                    "doi": r[5] or "-",
                    "file_name": r[6] or "",
                    "file_size": r[7] or 0,
                    "status": r[8] or "uploaded",
                    "source_verification": r[9],
                    "uploaded_at": r[10],
                    "total_pages": r[11] or 0,
                })

            # 4. Ambil komponen ekstraksi untuk paper-paper tersebut
            components_by_paper: Dict[str, Dict[str, str]] = {p["id"]: {} for p in papers}
            if paper_ids:
                cur.execute(
                    """
                    SELECT paper_id, parameter_key, value 
                    FROM public.extracted_components 
                    WHERE paper_id IN (SELECT id FROM public.papers WHERE project_id = %s);
                    """,
                    (project_id,),
                )
                for comp_row in cur.fetchall():
                    c_paper_id = str(comp_row[0])
                    param_key = comp_row[1]
                    val_json = comp_row[2] or {}
                    extracted_text = ""
                    if isinstance(val_json, dict):
                        extracted_text = val_json.get("text", "")
                    elif isinstance(val_json, str):
                        extracted_text = val_json
                    
                    if c_paper_id in components_by_paper:
                        components_by_paper[c_paper_id][param_key] = extracted_text.strip()

    return {
        "project": project_info,
        "parameters": params,
        "papers": papers,
        "components": components_by_paper,
    }


def generate_csv_export(data: Dict[str, Any]) -> bytes:
    """Menghasilkan file CSV bertipe UTF-8 dengan BOM (aman dibuka di Excel Windows)."""
    output = io.StringIO()
    # Tulis BOM UTF-8
    output.write("\ufeff")
    
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    
    # Header baris informasi proyek
    project = data["project"]
    writer.writerow(["# MODELLYNG ACADEMIC SYNTHESIS MATRIX"])
    writer.writerow(["# Nama Proyek", project["name"]])
    writer.writerow(["# Tanggal Ekspor", datetime.now().strftime("%d-%m-%Y %H:%M:%S")])
    writer.writerow(["# Total Dokumen", len(data["papers"])])
    writer.writerow([]) # Baris kosong
    
    # Kolom Header Tabel
    headers = [
        "No",
        "Judul Dokumen Paper",
        "Penulis",
        "Tahun",
        "Jurnal / Prosiding",
        "DOI",
        "Status Keabsahan Sumber",
        "Skor Kredibilitas",
    ]
    for _, param_label in data["parameters"]:
        headers.append(param_label)
    
    writer.writerow(headers)
    
    # Baris Data Paper
    for idx, paper in enumerate(data["papers"], start=1):
        pid = paper["id"]
        paper_comps = data["components"].get(pid, {})
        
        # Keabsahan
        sv = paper.get("source_verification")
        if sv and isinstance(sv, dict):
            status_keabsahan = sv.get("trust_verdict") or ("Terverifikasi" if sv.get("is_valid") else "Perlu Diwaspadai")
            score_keabsahan = f"{sv.get('trust_score', '-')}/100"
        else:
            status_keabsahan = "Belum Diverifikasi"
            score_keabsahan = "-"
        
        row = [
            idx,
            paper["title"],
            paper["authors"],
            paper["year"],
            paper["journal"],
            paper["doi"],
            status_keabsahan,
            score_keabsahan,
        ]
        
        # Tambahkan nilai masing-masing parameter
        for param_key, _ in data["parameters"]:
            val = paper_comps.get(param_key, "")
            # Bersihkan newline berlebih
            val_clean = re.sub(r"\s+", " ", val).strip()
            row.append(val_clean if val_clean else "-")
        
        writer.writerow(row)
        
    return output.getvalue().encode("utf-8")


def generate_xlsx_export(data: Dict[str, Any]) -> bytes:
    """Menghasilkan berkas Excel (.xlsx) dengan styling elegan standar Modellyng."""
    wb = Workbook()
    
    # -------------------------------------------------------------
    # SHEET 1: Matriks Ekstraksi 13 Parameter
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "Matriks Sintesis 13 Parameter"
    ws1.views.sheetView[0].showGridLines = True
    
    # Palet Warna Modellyng
    primary_indigo = "5147E5"
    light_indigo = "EEF2FF"
    text_ink = "172033"
    border_gray = "CBD5E1"
    alternate_row = "F8FAFC"
    white = "FFFFFF"
    
    font_title = Font(name="Calibri", size=15, bold=True, color=primary_indigo)
    font_subtitle = Font(name="Calibri", size=10, italic=True, color="64748B")
    font_header = Font(name="Calibri", size=10, bold=True, color=white)
    font_data = Font(name="Calibri", size=9, color=text_ink)
    font_data_bold = Font(name="Calibri", size=9, bold=True, color=text_ink)
    
    fill_header = PatternFill(start_color=primary_indigo, end_color=primary_indigo, fill_type="solid")
    fill_alt = PatternFill(start_color=alternate_row, end_color=alternate_row, fill_type="solid")
    fill_white = PatternFill(start_color=white, end_color=white, fill_type="solid")
    
    thin_border_side = Side(border_style="thin", color=border_gray)
    thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="top", wrap_text=True)
    
    # Judul Dokumen
    project = data["project"]
    ws1.merge_cells("A1:G1")
    ws1["A1"] = f"MODELLYNG — MATRIKS SINTESIS RISET AKADEMIK: {project['name'].upper()}"
    ws1["A1"].font = font_title
    
    ws1.merge_cells("A2:G2")
    ws1["A2"] = f"Ruang Lingkup: {project['description'] or 'Analisis multi-dokumen naskah ilmiah'} | Diekspor: {datetime.now().strftime('%d %B %Y, %H:%M WIB')} | Total Dokumen: {len(data['papers'])}"
    ws1["A2"].font = font_subtitle
    ws1.row_dimensions[1].height = 24
    ws1.row_dimensions[2].height = 18
    ws1.row_dimensions[3].height = 10 # Spacer
    
    # Header Kolom Tabel
    headers = [
        "No",
        "Judul Paper",
        "Penulis",
        "Tahun",
        "Jurnal / Prosiding",
        "DOI",
        "Keabsahan Sumber",
        "Skor Kredibilitas",
    ]
    for _, param_label in data["parameters"]:
        headers.append(param_label)
        
    start_row = 4
    ws1.row_dimensions[start_row].height = 32
    for col_idx, h_text in enumerate(headers, start=1):
        cell = ws1.cell(row=start_row, column=col_idx, value=h_text)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = thin_border
        
    # Isi Data
    for p_idx, paper in enumerate(data["papers"], start=1):
        current_row = start_row + p_idx
        ws1.row_dimensions[current_row].height = 55 # Ruang cukup untuk teks sintesis
        row_fill = fill_alt if p_idx % 2 == 0 else fill_white
        
        pid = paper["id"]
        paper_comps = data["components"].get(pid, {})
        sv = paper.get("source_verification")
        if sv and isinstance(sv, dict):
            status_keabsahan = sv.get("trust_verdict") or ("Terverifikasi" if sv.get("is_valid") else "Perlu Diwaspadai")
            score_str = f"{sv.get('trust_score', '-')}/100"
        else:
            status_keabsahan = "Belum Diverifikasi"
            score_str = "-"
            
        row_values = [
            p_idx,
            paper["title"],
            paper["authors"],
            paper["year"],
            paper["journal"],
            paper["doi"],
            status_keabsahan,
            score_str,
        ]
        
        for param_key, _ in data["parameters"]:
            val = paper_comps.get(param_key, "")
            row_values.append(val if val else "-")
            
        for c_idx, val in enumerate(row_values, start=1):
            cell = ws1.cell(row=current_row, column=c_idx, value=val)
            cell.font = font_data_bold if c_idx == 1 else font_data
            cell.fill = row_fill
            cell.alignment = align_center if c_idx in [1, 4, 8] else align_left
            cell.border = thin_border
            
    # Auto-width kolom
    ws1.column_dimensions["A"].width = 6   # No
    ws1.column_dimensions["B"].width = 32  # Judul
    ws1.column_dimensions["C"].width = 24  # Penulis
    ws1.column_dimensions["D"].width = 10  # Tahun
    ws1.column_dimensions["E"].width = 24  # Jurnal
    ws1.column_dimensions["F"].width = 22  # DOI
    ws1.column_dimensions["G"].width = 26  # Keabsahan
    ws1.column_dimensions["H"].width = 15  # Skor
    for col_letter_idx in range(9, len(headers) + 1):
        col_let = get_column_letter(col_letter_idx)
        ws1.column_dimensions[col_let].width = 38
        
    # -------------------------------------------------------------
    # SHEET 2: Ringkasan Proyek & Profil Sumber
    # -------------------------------------------------------------
    ws2 = wb.create_sheet(title="Profil Dokumen & Keabsahan")
    ws2.views.sheetView[0].showGridLines = True
    
    ws2["A1"] = "RINGKASAN STATUS DOKUMEN & KEABSAHAN SUMBER"
    ws2["A1"].font = font_title
    ws2.row_dimensions[1].height = 24
    
    ws2_headers = ["No", "Judul Dokumen", "File Fisik", "Halaman", "DOI", "Keabsahan", "Penerbit Resmi", "Ringkasan Auditor Keabsahan"]
    ws2.row_dimensions[3].height = 28
    for c_idx, h in enumerate(ws2_headers, start=1):
        cell = ws2.cell(row=3, column=c_idx, value=h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = thin_border
        
    for p_idx, paper in enumerate(data["papers"], start=1):
        c_row = 3 + p_idx
        ws2.row_dimensions[c_row].height = 45
        r_fill = fill_alt if p_idx % 2 == 0 else fill_white
        
        sv = paper.get("source_verification") or {}
        meta = sv.get("metadata") or {}
        publisher = meta.get("publisher") or "-"
        summary = sv.get("summary") or "Belum dilakukan Cek Keabsahan Sumber."
        trust_verdict = sv.get("trust_verdict") or "Belum Diverifikasi"
        
        vals = [
            p_idx,
            paper["title"],
            paper["file_name"],
            paper["total_pages"],
            paper["doi"],
            trust_verdict,
            publisher,
            summary,
        ]
        for c_idx, val in enumerate(vals, start=1):
            cell = ws2.cell(row=c_row, column=c_idx, value=val)
            cell.font = font_data
            cell.fill = r_fill
            cell.alignment = align_center if c_idx in [1, 4] else align_left
            cell.border = thin_border
            
    ws2.column_dimensions["A"].width = 6
    ws2.column_dimensions["B"].width = 32
    ws2.column_dimensions["C"].width = 24
    ws2.column_dimensions["D"].width = 10
    ws2.column_dimensions["E"].width = 24
    ws2.column_dimensions["F"].width = 28
    ws2.column_dimensions["G"].width = 24
    ws2.column_dimensions["H"].width = 50
    
    stream = io.BytesIO()
    wb.save(stream)
    return stream.getvalue()


def generate_pdf_export(data: Dict[str, Any]) -> bytes:
    """Menghasilkan berkas PDF Landscape profesional berbasis ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=30,
        rightMargin=30,
        topMargin=35,
        bottomMargin=45,
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand Styles
    style_title = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#5147E5"),
        spaceAfter=4,
    )
    style_subtitle = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=12,
    )
    style_section = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#172033"),
        spaceBefore=10,
        spaceAfter=6,
    )
    style_th = ParagraphStyle(
        "TableHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1, # Center
    )
    style_td = ParagraphStyle(
        "TableData",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#172033"),
    )
    style_td_bold = ParagraphStyle(
        "TableDataBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#172033"),
    )
    style_badge_verified = ParagraphStyle(
        "BadgeVerified",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#15803D"),
    )
    style_param_label = ParagraphStyle(
        "ParamLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#4338CA"),
    )
    
    elements = []
    project = data["project"]
    
    # Header Banner
    elements.append(Paragraph(f"MODELLYNG — Laporan Sintesis 13 Parameter Riset", style_title))
    elements.append(
        Paragraph(
            f"<b>Proyek:</b> {project['name']} &nbsp;|&nbsp; "
            f"<b>Total Dokumen:</b> {len(data['papers'])} Naskah &nbsp;|&nbsp; "
            f"<b>Tanggal Ekspor:</b> {datetime.now().strftime('%d %B %Y, %H:%M WIB')}<br/>"
            f"<i>{project['description'] or 'Pusat Analisis Bukti Akademik Dokumen PDF Kanonik'}</i>",
            style_subtitle,
        )
    )
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=10))
    
    # -----------------------------------------------------------------
    # Bagian 1: Ringkasan Dokumen & Keabsahan Sumber
    # -----------------------------------------------------------------
    elements.append(Paragraph("1. Ringkasan Dokumen Ilmiah & Status Keabsahan Sumber", style_section))
    
    overview_table_data = [
        [
            Paragraph("No", style_th),
            Paragraph("Judul Dokumen Paper", style_th),
            Paragraph("Penulis", style_th),
            Paragraph("Tahun", style_th),
            Paragraph("DOI", style_th),
            Paragraph("Status Keabsahan", style_th),
            Paragraph("Skor", style_th),
        ]
    ]
    
    for idx, paper in enumerate(data["papers"], start=1):
        sv = paper.get("source_verification")
        if sv and isinstance(sv, dict):
            status_text = sv.get("trust_verdict") or ("Terverifikasi" if sv.get("is_valid") else "Perlu Diwaspadai")
            score_text = f"{sv.get('trust_score', '-')}/100"
            status_p = Paragraph(f"✓ {status_text}", style_badge_verified)
        else:
            score_text = "-"
            status_p = Paragraph("Belum Diverifikasi", style_td)
            
        overview_table_data.append([
            Paragraph(str(idx), style_td_bold),
            Paragraph(paper["title"], style_td_bold),
            Paragraph(paper["authors"], style_td),
            Paragraph(paper["year"], style_td),
            Paragraph(paper["doi"], style_td),
            status_p,
            Paragraph(score_text, style_td_bold),
        ])
        
    t_overview = Table(overview_table_data, colWidths=[25, 230, 160, 45, 140, 130, 40])
    t_overview.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5147E5")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_overview)
    elements.append(Spacer(1, 15))
    
    # -----------------------------------------------------------------
    # Bagian 2: Dossier Rinci 13 Parameter per Dokumen
    # -----------------------------------------------------------------
    elements.append(PageBreak())
    elements.append(Paragraph("2. Dossier Lengkap Ekstraksi 13 Parameter Ilmiah per Dokumen", style_section))
    elements.append(Spacer(1, 6))
    
    for idx, paper in enumerate(data["papers"], start=1):
        pid = paper["id"]
        paper_comps = data["components"].get(pid, {})
        sv = paper.get("source_verification") or {}
        trust_verdict = sv.get("trust_verdict") or "Belum Diverifikasi"
        summary_verif = sv.get("summary") or "Pengecekan keabsahan DOI belum dilakukan untuk dokumen ini."
        
        # Paper Header Box
        header_text = (
            f"<b>DOKUMEN #{idx}: {paper['title']}</b><br/>"
            f"<font color='#64748B'>Penulis: {paper['authors']} | Tahun: {paper['year']} | Jurnal: {paper['journal']} | DOI: {paper['doi']}</font><br/>"
            f"<b>Status Keabsahan:</b> {trust_verdict} — <i>{summary_verif}</i>"
        )
        p_card_header = Paragraph(header_text, style_td)
        
        # Table of 13 Parameters for this paper
        comp_rows = [[Paragraph("Parameter Ilmiah", style_th), Paragraph("Hasil Sintesis Ekstraksi Naskah Kanonik", style_th)]]
        for param_key, param_label in data["parameters"]:
            val = paper_comps.get(param_key, "")
            val_display = val if val else "<i>Tidak ditemukan dalam naskah fisik</i>"
            comp_rows.append([
                Paragraph(param_label, style_param_label),
                Paragraph(val_display, style_td),
            ])
            
        t_paper = Table(comp_rows, colWidths=[170, 600])
        t_paper.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4338CA")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ]))
        
        paper_block = [
            Paragraph(f"Paper #{idx}: {paper['title']}", style_section),
            p_card_header,
            Spacer(1, 4),
            t_paper,
            Spacer(1, 14),
        ]
        elements.append(KeepTogether(paper_block))
        
    doc.build(elements, canvasmaker=NumberedCanvas)
    return buffer.getvalue()
