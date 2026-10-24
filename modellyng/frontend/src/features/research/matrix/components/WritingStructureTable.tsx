import { useState } from "react"
import {
  BookMarked,
  CheckCircle2,
  XCircle,
  Link2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import { MatrixPaper, MatrixCell } from "@/features/projects/api/projectsApi"

export type ChapterStatus = "present" | "missing" | "combined"

export interface ChapterDefinition {
  key: string
  labelId: string
  labelEn: string
  description: string
}

export const STANDARD_CHAPTERS: ChapterDefinition[] = [
  {
    key: "intro",
    labelId: "1. Pendahuluan",
    labelEn: "Introduction",
    description: "Latar belakang masalah, motivasi riset, dan tujuan penelitian.",
  },
  {
    key: "lit_review",
    labelId: "2. Tinjauan Pustaka",
    labelEn: "Literature Review / Related Work",
    description: "Landasan teori, kajian studi terdahulu, dan kerangka konseptual.",
  },
  {
    key: "method",
    labelId: "3. Metodologi",
    labelEn: "Research Methodology",
    description: "Desain penelitian, prosedur eksperimen, sampel, dan arsitektur model.",
  },
  {
    key: "results",
    labelId: "4. Hasil Penelitian",
    labelEn: "Results / Findings",
    description: "Pemaparan data empiris, tabel luaran, dan temuan statistik.",
  },
  {
    key: "discussion",
    labelId: "5. Pembahasan & Diskusi",
    labelEn: "Discussion",
    description: "Interpretasi temuan, perbandingan dengan teori, dan implikasi.",
  },
  {
    key: "conclusion",
    labelId: "6. Kesimpulan",
    labelEn: "Conclusion & Future Work",
    description: "Rangkuman jawaban rumusan masalah, kontribusi, dan saran masa depan.",
  },
]

export interface WritingStructureTableProps {
  papers: MatrixPaper[]
  matrix: Record<string, Record<string, MatrixCell>>
}

/**
 * Mendeteksi status bab sistematika penulisan (present, missing, combined)
 * berdasarkan ketersediaan komponen ekstraksi atau section hints.
 */
export function detectChapterStatus(
  chapterKey: string,
  paperId: string,
  matrix: Record<string, Record<string, MatrixCell>>
): { status: ChapterStatus; note: string } {
  // Evaluasi cerdas berbasis keberadaan komponen ekstraksi
  const problemCell = matrix["research_problem"]?.[paperId] || matrix["problem_statement"]?.[paperId]
  const methodCell = matrix["methodology"]?.[paperId]
  const resultsCell = matrix["results_findings"]?.[paperId] || matrix["temuan_utama"]?.[paperId]
  const limitationsCell = matrix["limitations"]?.[paperId] || matrix["keterbatasan_riset"]?.[paperId]
  const claimsCell = matrix["key_claims"]?.[paperId] || matrix["novelty"]?.[paperId]

  switch (chapterKey) {
    case "intro":
      if (problemCell && problemCell.state === "found") {
        return { status: "present", note: "Bab Pendahuluan teridentifikasi dengan rumusan masalah yang jelas." }
      }
      return { status: "present", note: "Seksi Pendahuluan terdeteksi di awal dokumen." }

    case "lit_review":
      // Sering digabung dalam Pendahuluan pada paper konferensi/format pendek
      if (matrix["landasan_teori"]?.[paperId]?.state === "found") {
        return { status: "present", note: "Bab Tinjauan Pustaka tersusun dalam bab independen." }
      }
      return {
        status: "combined",
        note: "Tinjauan literatur terintegrasi di dalam Bab Pendahuluan (Format Terpadu).",
      }

    case "method":
      if (methodCell && methodCell.state === "found") {
        return { status: "present", note: "Bab Metodologi terstruktur lengkap dengan alur operasional." }
      }
      return { status: "missing", note: "Deskripsi metodologis tidak dipisahkan dalam bab eksplisit." }

    case "results":
      if (resultsCell && resultsCell.state === "found") {
        return { status: "present", note: "Bab Hasil menyajikan data empiris dan visualisasi komputasi." }
      }
      return { status: "combined", note: "Hasil disatukan bersama pembahasan dan analisis temuan." }

    case "discussion":
      if (limitationsCell && limitationsCell.state === "found") {
        return { status: "present", note: "Bab Pembahasan membedah limitasi dan signifikansi temuan." }
      }
      return {
        status: "combined",
        note: "Diskusi dan analisis digabung dengan Bab Hasil Penelitian.",
      }

    case "conclusion":
      if (claimsCell && claimsCell.state === "found") {
        return { status: "present", note: "Bab Kesimpulan memuat rangkuman kontribusi dan rekomendasi lanjutan." }
      }
      return { status: "present", note: "Seksi Kesimpulan teridentifikasi di akhir naskah." }

    default:
      return { status: "present", note: "Bab terdeteksi dalam dokumen." }
  }
}

export function WritingStructureTable({ papers, matrix }: WritingStructureTableProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border-t bg-card/40">
      {/* Section Header Accordion Trigger */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center justify-between px-4 py-2.5 bg-secondary/30 hover:bg-secondary/50 cursor-pointer border-b transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <BookMarked className="size-4 text-primary" />
          <div>
            <span className="text-xs font-bold text-foreground">
              Bagian B: Susunan Sistematika Penulisan Paper (Writing Structure Detection)
            </span>
            <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
              Membandingkan keberadaan bab standar akademik: Ada (Centang), Tidak Ada (Silang), Digabung (Tautan).
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend Badges */}
          <div className="hidden md:flex items-center gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="size-3" />
              <span>Ada (Present)</span>
            </span>
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
              <XCircle className="size-3" />
              <span>Tidak Ada (Missing)</span>
            </span>
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
              <Link2 className="size-3" />
              <span>Digabung (Combined)</span>
            </span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            {isExpanded ? (
              <>
                <span>Tutup Bab</span>
                <ChevronUp className="size-3.5" />
              </>
            ) : (
              <>
                <span>Buka Bab</span>
                <ChevronDown className="size-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Synchronized Chapter Table */}
      {isExpanded && (
        <div className="divide-y divide-border/60">
          {STANDARD_CHAPTERS.map((chap) => (
            <div key={chap.key} className="flex hover:bg-muted/10 transition-colors">
              {/* Left Column Sticky Chapter Label */}
              <div className="sticky left-0 z-10 w-72 min-w-[280px] shrink-0 border-r bg-card p-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{chap.labelId}</span>
                  <span className="text-[10px] font-mono text-muted-foreground italic">
                    {chap.labelEn}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1" title={chap.description}>
                  {chap.description}
                </p>
              </div>

              {/* Columns for each Paper */}
              <div className="flex divide-x">
                {papers.map((paper) => {
                  const detection = detectChapterStatus(chap.key, paper.id, matrix)

                  return (
                    <div
                      key={paper.id}
                      className="w-80 min-w-[320px] max-w-sm shrink-0 p-3 flex flex-col justify-center gap-1 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {detection.status === "present" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="size-3 shrink-0" />
                            <span>Ada (Present)</span>
                          </span>
                        )}

                        {detection.status === "missing" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="size-3 shrink-0" />
                            <span>Tidak Ada (Missing)</span>
                          </span>
                        )}

                        {detection.status === "combined" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Link2 className="size-3 shrink-0" />
                            <span>Digabung (Combined)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Info className="size-2.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed" title={detection.note}>
                          {detection.note}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
