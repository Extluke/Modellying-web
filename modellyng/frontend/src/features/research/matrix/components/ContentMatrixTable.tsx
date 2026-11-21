import { Fragment } from "react"
import { BookOpen, CheckCircle2, Clock, Crown, FileText, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  EvidenceItem,
  MatrixCell,
  MatrixPaper,
  MatrixParameter,
} from "@/features/projects/api/projectsApi"
import type { SyncedScrollProps } from "../hooks/useSyncedHorizontalScroll"
import {
  CELL_STATUS_META,
  confidenceTextClass,
  formatCellText,
  formatGroupName,
  formatPaperAuthors,
} from "../utils/matrixFormatters"
import { MatrixTableFrame, PAPER_CELL, STICKY_LABEL_CELL } from "./MatrixTableFrame"

/** Cells with more characters than this get a "Selengkapnya" link in compact mode (same as mobile). */
const LONG_TEXT_THRESHOLD = 150

/** Parameter keys yang memiliki akses penuh pada tingkatan Freemium */
export const FREE_ALLOWED_PARAMETER_KEYS = new Set([
  "research_problem", // Rumusan Masalah
  "subject_demographics", // Konteks & Demografi Subjek
  "research_objective", // Tujuan Penelitian (kelompok konteks)
  "research_questions", // Pertanyaan Penelitian (kelompok konteks)
])

export interface CellDetailRequest {
  parameter: MatrixParameter
  paper: MatrixPaper
  cell: MatrixCell
}

export interface EvidenceRequest extends CellDetailRequest {
  evidence: EvidenceItem
}

interface ContentMatrixTableProps {
  parameters: MatrixParameter[]
  papers: MatrixPaper[]
  matrix: Record<string, Record<string, MatrixCell>>
  compact: boolean
  scrollProps: SyncedScrollProps
  isFreeUser?: boolean
  onTriggerUpgrade?: () => void
  onOpenCell: (request: CellDetailRequest) => void
  onOpenEvidence: (request: EvidenceRequest) => void
}

export function ContentMatrixTable({
  parameters,
  papers,
  matrix,
  compact,
  scrollProps,
  isFreeUser = false,
  onTriggerUpgrade,
  onOpenCell,
  onOpenEvidence,
}: ContentMatrixTableProps) {
  return (
    <MatrixTableFrame paperCount={papers.length} scrollProps={scrollProps}>
      <thead>
        <tr>
          <th scope="col" className={cn(STICKY_LABEL_CELL, "bg-primary-soft")}>
            <span className="text-xs font-semibold text-foreground">Parameter</span>
          </th>
          {papers.map((paper) => (
            <th
              key={paper.id}
              scope="col"
              className={cn(PAPER_CELL, "bg-primary-soft font-normal")}
            >
              <div className="flex flex-col gap-1.5">
                <span
                  title={paper.title}
                  className="line-clamp-3 break-words text-[13px] font-semibold leading-snug text-foreground"
                >
                  {paper.title}
                </span>
                <span className="line-clamp-1 text-[11px] text-muted-foreground">
                  {formatPaperAuthors(paper)}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <FileText className="size-3" />
                  {paper.total_pages} halaman
                </span>
              </div>
            </th>
          ))}
        </tr>
      </thead>

      <tbody className="[&>tr:last-child>*]:border-b-0">
        {parameters.map((parameter, index) => {
          const showGroupRow = index === 0 || parameters[index - 1].group_name !== parameter.group_name
          const label = parameter.label.id || parameter.label.en || parameter.key
          const secondaryLabel =
            parameter.label.en && parameter.label.en !== label ? parameter.label.en : null
          const isLocked =
            isFreeUser &&
            !FREE_ALLOWED_PARAMETER_KEYS.has(parameter.key) &&
            parameter.group_name !== "konteks_masalah"

          return (
            <Fragment key={parameter.key}>
              {showGroupRow && (
                <tr>
                  <td colSpan={papers.length + 1} className="border-b border-border bg-muted/50 p-0">
                    <div className="sticky left-0 w-fit px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {formatGroupName(parameter.group_name)}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <th
                  scope="row"
                  title={parameter.instruction || undefined}
                  className={cn(STICKY_LABEL_CELL, "bg-card font-normal")}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="break-words text-xs font-semibold leading-snug text-foreground">
                        {label}
                      </span>
                      {isLocked && (
                        <span
                          title="Kolom lanjutan khusus akun Student Pro"
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20 shrink-0"
                        >
                          <Lock className="size-2.5" />
                          <span>Pro</span>
                        </span>
                      )}
                    </div>
                    {secondaryLabel && (
                      <span className="break-words text-[11px] leading-snug text-muted-foreground">
                        {secondaryLabel}
                      </span>
                    )}
                  </div>
                </th>

                {papers.map((paper) => {
                  const cell = matrix[parameter.key]?.[paper.id]
                  const cellLocked = isLocked || Boolean(cell?.is_locked)
                  return (
                    <td key={paper.id} className={cn(PAPER_CELL, "bg-card")}>
                      <ContentCell
                        cell={cell}
                        compact={compact}
                        isLocked={cellLocked}
                        onTriggerUpgrade={onTriggerUpgrade}
                        onOpenDetail={(cell) => onOpenCell({ parameter, paper, cell })}
                        onOpenEvidence={(cell, evidence) =>
                          onOpenEvidence({ parameter, paper, cell, evidence })
                        }
                      />
                    </td>
                  )
                })}
              </tr>
            </Fragment>
          )
        })}
      </tbody>
    </MatrixTableFrame>
  )
}

interface ContentCellProps {
  cell: MatrixCell | undefined
  compact: boolean
  isLocked?: boolean
  onTriggerUpgrade?: () => void
  onOpenDetail: (cell: MatrixCell) => void
  onOpenEvidence: (cell: MatrixCell, evidence: EvidenceItem) => void
}

function ContentCell({
  cell,
  compact,
  isLocked = false,
  onTriggerUpgrade,
  onOpenDetail,
  onOpenEvidence,
}: ContentCellProps) {
  if (!cell) {
    return (
      <span className="flex items-center gap-1.5 text-xs italic text-muted-foreground">
        <Clock className="size-3.5 shrink-0" />
        Belum diekstraksi
      </span>
    )
  }

  const text = formatCellText(cell.value?.text ?? "")
  const isLong = text.length > LONG_TEXT_THRESHOLD
  const confidencePercent = Math.round((cell.confidence_score || 0) * 100)
  const primaryEvidence = cell.evidence?.[0]
  const statusMeta = CELL_STATUS_META[cell.status]
  const emptyMessage =
    cell.state === "not_found"
      ? "Tidak ditemukan dalam dokumen paper ini."
      : cell.state === "not_applicable"
        ? "Tidak berlaku untuk paper ini."
        : "Nilai belum terisi."

  // Tampilan Terkunci (Freemium Paywall: Baris pertama teaser + efek blur + tombol CTA)
  if (isLocked) {
    const firstLine = text.split("\n")[0] || text

    return (
      <div className="flex flex-col gap-2.5">
        {text ? (
          <div className="flex flex-col gap-1.5">
            {/* Teaser: Baris pertama tampak jelas sebagai penggugah minat */}
            <p className="line-clamp-1 text-xs font-medium leading-relaxed text-foreground select-none">
              {firstLine}
            </p>

            {/* Konten lanjutan dikaburkan dengan efek blur */}
            <div className="relative overflow-hidden rounded-md border border-border/60 bg-muted/20 p-2">
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground filter blur-[3.5px] select-none pointer-events-none">
                {text}
              </p>

              {/* Overlay CTA Upgrade Pro */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/65 backdrop-blur-[2px] p-2 text-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Lock className="size-3" />
                  <span>Kolom Lanjutan Pro</span>
                </span>
                <button
                  type="button"
                  onClick={onTriggerUpgrade}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary hover:bg-primary/90 px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-xs transition-transform hover:scale-105 cursor-pointer"
                  title="Upgrade ke Student Pro untuk membuka analisis parameter ini"
                >
                  <Crown className="size-2.5" />
                  <span>Upgrade Pro</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs italic leading-relaxed text-muted-foreground">{emptyMessage}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/60 pt-2">
          {primaryEvidence ? (
            <button
              type="button"
              onClick={onTriggerUpgrade}
              title="Kutipan bukti PDF terkunci. Klik untuk upgrade ke Student Pro."
              className="inline-flex items-center gap-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Lock className="size-3 text-amber-500" />
              <span>Hal. {primaryEvidence.page_index}</span>
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground">Tanpa bukti</span>
          )}

          <div className="flex items-center gap-2">
            {confidencePercent > 0 && (
              <span
                title={`Skor keyakinan model: ${confidencePercent}%`}
                className={cn("font-mono text-[11px] font-bold", confidenceTextClass(confidencePercent))}
              >
                {confidencePercent}%
              </span>
            )}
            {cell.status === "accepted" ? (
              <span title={statusMeta.label} className="inline-flex text-status-green">
                <CheckCircle2 className="size-4" />
                <span className="sr-only">{statusMeta.label}</span>
              </span>
            ) : (
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Tampilan Akses Penuh (Full Access)
  return (
    <div className="flex flex-col gap-3">
      {text ? (
        <div className="flex flex-col gap-1.5">
          <p
            className={cn(
              "whitespace-pre-line break-words text-xs leading-relaxed text-foreground",
              compact && "line-clamp-4"
            )}
          >
            {text}
          </p>
          {compact && isLong && (
            <button
              type="button"
              onClick={() => onOpenDetail(cell)}
              className="self-start text-xs font-semibold text-primary hover:underline"
            >
              Selengkapnya
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs italic leading-relaxed text-muted-foreground">{emptyMessage}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/60 pt-2.5">
        {primaryEvidence ? (
          <button
            type="button"
            onClick={() => onOpenEvidence(cell, primaryEvidence)}
            title="Buka dokumen PDF dan sorot bukti kutipan"
            className="inline-flex items-center gap-1 rounded-md text-[11px] font-semibold text-primary hover:underline"
          >
            <BookOpen className="size-3.5" />
            Hal. {primaryEvidence.page_index}
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground">Tanpa bukti</span>
        )}

        <div className="flex items-center gap-2">
          {confidencePercent > 0 && (
            <span
              title={`Skor keyakinan model: ${confidencePercent}%`}
              className={cn("font-mono text-[11px] font-bold", confidenceTextClass(confidencePercent))}
            >
              {confidencePercent}%
            </span>
          )}
          {cell.status === "accepted" ? (
            <span title={statusMeta.label} className="inline-flex text-status-green">
              <CheckCircle2 className="size-4" />
              <span className="sr-only">{statusMeta.label}</span>
            </span>
          ) : (
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          )}
        </div>
      </div>
    </div>
  )
}
