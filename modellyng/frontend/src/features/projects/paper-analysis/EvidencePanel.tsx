import { useRef } from "react"
import { BookmarkCheck, ExternalLink, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EvidenceItem } from "../api/projectsApi"

interface EvidencePanelProps {
  activeEvidence?: EvidenceItem | null
  componentLabel?: string
  onJumpToEvidence?: (page: number) => void
  onClose?: () => void
  height?: number
  onHeightChange?: (height: number) => void
}

export function EvidencePanel({
  activeEvidence,
  componentLabel,
  onJumpToEvidence,
  onClose,
  height = 220,
  onHeightChange,
}: EvidencePanelProps) {
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(height)

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    startYRef.current = e.clientY
    startHeightRef.current = height
    document.body.style.cursor = "row-resize"
    document.body.style.userSelect = "none"

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return
      const deltaY = startYRef.current - ev.clientY
      const newHeight = Math.max(140, Math.min(520, startHeightRef.current + deltaY))
      if (onHeightChange) {
        onHeightChange(newHeight)
      }
    }

    const onPointerUp = () => {
      isDraggingRef.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  if (!activeEvidence) {
    return null
  }

  const pageNum = activeEvidence.page_index || 1

  return (
    <div
      style={{ height: `${height}px` }}
      className="relative flex flex-col border-t border-border bg-card shadow-xl shrink-0 transition-[height] duration-75 select-none"
    >
      {/* Resizable Drag Handle (Like VS Code Terminal) */}
      <div
        onPointerDown={handlePointerDown}
        className="group absolute -top-1.5 left-0 right-0 h-3 cursor-row-resize flex items-center justify-center z-20"
        title="Tarik ke atas atau ke bawah untuk mengubah ukuran panel bukti"
      >
        <div className="h-1 w-14 rounded-full bg-border group-hover:bg-primary transition-colors flex items-center justify-center" />
      </div>

      {/* Header Bar */}
      <div className="flex h-11 items-center justify-between border-b px-4 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <BookmarkCheck className="size-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">
            Kutipan Bukti Dokumen Asli:{" "}
            <strong className="text-primary font-bold">
              {componentLabel || "Komponen Riset"}
            </strong>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full shrink-0">
            Halaman {pageNum}
          </span>
        </div>

        {/* Strategic Jump Button & Close Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onJumpToEvidence && onJumpToEvidence(pageNum)}
            className="h-7 text-xs gap-1.5 text-primary border-primary/25 hover:bg-primary/10 cursor-pointer"
            title={`Lompat langsung ke halaman ${pageNum} dokumen PDF`}
          >
            <span>Lompat ke Hal {pageNum}</span>
            <ExternalLink className="size-3" />
          </Button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Tutup Panel Bukti"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quote Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <FileText className="size-3.5" />
            <span>Kutipan Langsung dari Naskah:</span>
          </div>
          <p className="text-xs text-foreground italic leading-relaxed font-serif">
            &ldquo;{activeEvidence.quote}&rdquo;
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Kutipan di atas diverifikasi langsung terhadap koordinat fisik teks kanonik pada naskah PDF.
        </p>
      </div>
    </div>
  )
}
