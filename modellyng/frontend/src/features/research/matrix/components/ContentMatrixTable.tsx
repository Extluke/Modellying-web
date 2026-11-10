import { Fragment } from "react"
import { BookOpen, CheckCircle2, Clock, FileText } from "lucide-react"
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
  onOpenCell: (request: CellDetailRequest) => void
  onOpenEvidence: (request: EvidenceRequest) => void
}

export function ContentMatrixTable({
  parameters,
  papers,
  matrix,
  compact,
  scrollProps,
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
                    <span className="break-words text-xs font-semibold leading-snug text-foreground">
                      {label}
                    </span>
                    {secondaryLabel && (
                      <span className="break-words text-[11px] leading-snug text-muted-foreground">
                        {secondaryLabel}
                      </span>
                    )}
                  </div>
                </th>

                {papers.map((paper) => (
                  <td key={paper.id} className={cn(PAPER_CELL, "bg-card")}>
                    <ContentCell
                      cell={matrix[parameter.key]?.[paper.id]}
                      compact={compact}
                      onOpenDetail={(cell) => onOpenCell({ parameter, paper, cell })}
                      onOpenEvidence={(cell, evidence) =>
                        onOpenEvidence({ parameter, paper, cell, evidence })
                      }
                    />
                  </td>
                ))}
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
  onOpenDetail: (cell: MatrixCell) => void
  onOpenEvidence: (cell: MatrixCell, evidence: EvidenceItem) => void
}

function ContentCell({ cell, compact, onOpenDetail, onOpenEvidence }: ContentCellProps) {
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
