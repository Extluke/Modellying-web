import { useEffect, useState } from "react"
import { BookOpen, Check, CheckCircle2, Copy, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EvidenceItem, MatrixCell } from "@/features/projects/api/projectsApi"
import { toast } from "@/lib/store/useToastStore"
import { CELL_STATUS_META, confidenceTextClass, formatCellText } from "../utils/matrixFormatters"

export interface ExpandableCellModalProps {
  isOpen: boolean
  onClose: () => void
  parameterLabel: string
  parameterGroup: string
  paperTitle: string
  paperId: string
  cell: MatrixCell
  onOpenPdfEvidence?: (evidence: EvidenceItem) => void
}

/** Full detail of a single matrix cell: complete extracted text, review status, and evidence quotes. */
export function ExpandableCellModal({
  isOpen,
  onClose,
  parameterLabel,
  parameterGroup,
  paperTitle,
  cell,
  onOpenPdfEvidence,
}: ExpandableCellModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const textValue = formatCellText(cell.value?.text || "")
  const confidencePercent = Math.round((cell.confidence_score || 0) * 100)
  const statusMeta = CELL_STATUS_META[cell.status]

  const handleCopyText = async () => {
    if (!textValue) return
    try {
      await navigator.clipboard.writeText(textValue)
      setCopied(true)
      toast.success("Teks ekstraksi berhasil disalin ke papan klip.")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Gagal menyalin teks ke papan klip.")
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detail ${parameterLabel}`}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-modal border border-border bg-card shadow-floating animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-button bg-primary-soft text-primary">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{parameterLabel}</h2>
                <Badge variant="muted">{parameterGroup}</Badge>
              </div>
              <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground" title={paperTitle}>
                {paperTitle}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Tutup" aria-label="Tutup dialog">
            <X />
          </Button>
        </div>

        {/* Status bar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-5 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {cell.state === "found" ? (
              <Badge variant="primary">
                <CheckCircle2 className="size-3" />
                Ditemukan
              </Badge>
            ) : (
              <Badge variant="muted">
                {cell.state === "not_found" ? "Tidak Ditemukan" : "Tidak Berlaku"}
              </Badge>
            )}
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>

          {confidencePercent > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Skor keyakinan</span>
              <span className={cn("font-mono font-bold", confidenceTextClass(confidencePercent))}>
                {confidencePercent}%
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold text-foreground">Teks hasil ekstraksi</h3>
              {textValue && (
                <Button variant="outline" size="sm" onClick={handleCopyText} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="text-status-green" />
                      <span className="text-status-green">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy />
                      <span>Salin Teks</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="whitespace-pre-line break-words rounded-button border border-border bg-background p-4 text-xs leading-relaxed text-foreground">
              {textValue || (
                <span className="italic text-muted-foreground">
                  Informasi parameter ini tidak ditemukan di dalam naskah paper.
                </span>
              )}
            </div>
          </div>

          {cell.evidence && cell.evidence.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <BookOpen className="size-3.5 text-primary" />
                Bukti kutipan ({cell.evidence.length} sumber)
              </h3>

              <ul className="flex flex-col gap-2">
                {cell.evidence.map((evidence, index) => (
                  <li
                    key={`${evidence.block_id ?? "evidence"}-${index}`}
                    className="flex flex-col gap-2 rounded-button border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-primary">
                        Halaman {evidence.page_index}
                      </span>
                      {onOpenPdfEvidence && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onClose()
                            onOpenPdfEvidence(evidence)
                          }}
                          className="h-8 gap-1.5 px-2.5 text-primary hover:text-primary"
                        >
                          <BookOpen />
                          <span>Lihat di PDF</span>
                        </Button>
                      )}
                    </div>
                    <p className="break-words text-xs italic leading-relaxed text-muted-foreground">
                      &ldquo;{evidence.quote}&rdquo;
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-border px-5 py-3">
          <Button size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
