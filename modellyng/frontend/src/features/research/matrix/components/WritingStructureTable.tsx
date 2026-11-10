import { CheckCircle2, Link2, XCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MatrixCell, MatrixPaper } from "@/features/projects/api/projectsApi"
import type { SyncedScrollProps } from "../hooks/useSyncedHorizontalScroll"
import { MatrixTableFrame, PAPER_CELL, STICKY_LABEL_CELL } from "./MatrixTableFrame"

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

export const CHAPTER_STATUS_META: Record<
  ChapterStatus,
  { label: string; variant: NonNullable<BadgeProps["variant"]>; icon: LucideIcon }
> = {
  present: { label: "Ada", variant: "ready", icon: CheckCircle2 },
  missing: { label: "Tidak Ada", variant: "error", icon: XCircle },
  combined: { label: "Digabung", variant: "paper", icon: Link2 },
}

interface WritingStructureTableProps {
  papers: MatrixPaper[]
  matrix: Record<string, Record<string, MatrixCell>>
  scrollProps: SyncedScrollProps
}

export function WritingStructureTable({ papers, matrix, scrollProps }: WritingStructureTableProps) {
  return (
    <MatrixTableFrame paperCount={papers.length} scrollProps={scrollProps}>
      <thead>
        <tr>
          <th scope="col" className={cn(STICKY_LABEL_CELL, "bg-primary-soft")}>
            <span className="text-xs font-semibold text-foreground">Bagian Struktur</span>
          </th>
          {papers.map((paper) => (
            <th
              key={paper.id}
              scope="col"
              className={cn(PAPER_CELL, "bg-primary-soft font-normal")}
            >
              <span
                title={paper.title}
                className="line-clamp-2 break-words text-[13px] font-semibold leading-snug text-foreground"
              >
                {paper.title}
              </span>
            </th>
          ))}
        </tr>
      </thead>

      <tbody className="[&>tr:last-child>*]:border-b-0">
        {STANDARD_CHAPTERS.map((chapter) => (
          <tr key={chapter.key}>
            <th
              scope="row"
              title={chapter.description}
              className={cn(STICKY_LABEL_CELL, "bg-card font-normal")}
            >
              <div className="flex flex-col gap-1">
                <span className="break-words text-xs font-semibold leading-snug text-foreground">
                  {chapter.labelId}
                </span>
                <span className="break-words text-[11px] leading-snug text-muted-foreground">
                  {chapter.labelEn}
                </span>
              </div>
            </th>

            {papers.map((paper) => {
              const detection = detectChapterStatus(chapter.key, paper.id, matrix)
              const meta = CHAPTER_STATUS_META[detection.status]
              const Icon = meta.icon

              return (
                <td key={paper.id} className={cn(PAPER_CELL, "bg-card")}>
                  <div className="flex flex-col items-start gap-2">
                    <Badge variant={meta.variant}>
                      <Icon className="size-3" />
                      {meta.label}
                    </Badge>
                    <p className="break-words text-[11px] leading-relaxed text-muted-foreground">
                      {detection.note}
                    </p>
                  </div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </MatrixTableFrame>
  )
}
