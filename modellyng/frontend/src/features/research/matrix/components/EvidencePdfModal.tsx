import { useEffect } from "react"
import { BookOpen, Quote, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EvidenceItem } from "@/features/projects/api/projectsApi"
import { PdfViewer } from "@/features/projects/paper-analysis/PdfViewer"

export interface EvidencePdfModalProps {
  projectId: string
  paperId: string
  paperTitle: string
  parameterLabel: string
  evidence: EvidenceItem
  onClose: () => void
}

/** Full-screen PDF viewer that highlights the canonical evidence quote of a matrix cell. */
export default function EvidencePdfModal({
  projectId,
  paperId,
  paperTitle,
  parameterLabel,
  evidence,
  onClose,
}: EvidencePdfModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Bukti kutipan: ${parameterLabel}`}
        onClick={(event) => event.stopPropagation()}
        className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-modal border border-border bg-card shadow-floating animate-in zoom-in-95 duration-150"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-button bg-primary-soft text-primary">
              <BookOpen className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">
                Bukti Kutipan: {parameterLabel}
              </h2>
              <p className="truncate text-xs text-muted-foreground" title={paperTitle}>
                {paperTitle} &middot; Halaman {evidence.page_index}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            title="Tutup"
            aria-label="Tutup dokumen bukti"
          >
            <X />
          </Button>
        </div>

        <div className="flex shrink-0 items-start gap-3 border-b border-primary/20 bg-primary-soft px-5 py-3">
          <Quote className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-primary">Kutipan yang disorot pada PDF</p>
            <p className="break-words text-xs italic leading-relaxed text-foreground">
              &ldquo;{evidence.quote}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <PdfViewer
            projectId={projectId}
            paperId={paperId}
            targetPage={evidence.page_index}
            activeEvidence={evidence}
            blocks={
              evidence.bbox
                ? [
                    {
                      block_id: evidence.block_id || "canonical-block",
                      page_number: evidence.page_index,
                      bbox: evidence.bbox,
                      text: evidence.quote,
                    },
                  ]
                : []
            }
          />
        </div>
      </div>
    </div>
  )
}
