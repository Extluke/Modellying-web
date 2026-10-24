import { X, Copy, Check, BookOpen, CheckCircle2, Sparkles } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MatrixCell, EvidenceItem } from "@/features/projects/api/projectsApi"
import { toast } from "@/lib/store/useToastStore"

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

  if (!isOpen) return null

  const textValue = cell.value?.text || ""
  const confidencePct = Math.round((cell.confidence_score || 0) * 100)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-secondary/30 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {parameterLabel}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
                  {parameterGroup}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate" title={paperTitle}>
                {paperTitle}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 cursor-pointer shrink-0"
            title="Tutup dialog"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between border-b bg-muted/20 px-5 py-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                cell.state === "found"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground border"
              }`}
            >
              {cell.state === "found" ? (
                <>
                  <CheckCircle2 className="size-3" />
                  <span>Ditemukan</span>
                </>
              ) : (
                <span>{cell.state}</span>
              )}
            </span>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                cell.status === "accepted"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : cell.status === "edited"
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              }`}
            >
              Status: {cell.status.replace("_", " ")}
            </span>
          </div>

          {cell.confidence_score > 0 && (
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="text-muted-foreground">Confidence:</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded ${
                  confidencePct >= 85
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : confidencePct >= 70
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {confidencePct}%
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-foreground">
                Teks Hasil Ekstraksi Akademis Lengkap:
              </span>
              {textValue && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  className="h-7 text-[11px] gap-1 px-2 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 text-muted-foreground" />
                      <span>Salin Teks</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="rounded-xl border bg-background p-4 text-xs text-foreground leading-relaxed font-normal whitespace-pre-wrap shadow-inner">
              {textValue || (
                <span className="text-muted-foreground italic">
                  Informasi parameter ini tidak ditemukan di dalam naskah paper.
                </span>
              )}
            </div>
          </div>

          {/* Evidence Quotes */}
          {cell.evidence && cell.evidence.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-primary" />
                <span>Bukti Kutipan Kanonik ({cell.evidence.length} Sumber Bukti):</span>
              </span>

              <div className="space-y-2">
                {cell.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-secondary/20 p-3 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-primary">
                        Halaman {ev.page_index}
                      </span>
                      {onOpenPdfEvidence && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onClose()
                            onOpenPdfEvidence(ev)
                          }}
                          className="h-6 text-[10px] gap-1 px-2 text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          <BookOpen className="size-2.5" />
                          <span>Lihat di PDF</span>
                        </Button>
                      )}
                    </div>

                    <p className="italic text-muted-foreground text-[11px] leading-relaxed">
                      &ldquo;{ev.quote}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t px-5 py-3 bg-card shrink-0">
          <Button size="sm" variant="default" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
