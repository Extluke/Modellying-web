import { X, Quote, FileText, Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import { useGlobalChatStore } from "../store/useGlobalChatStore"

export function CitationPreviewModal() {
  const { activeCitationForModal, closeCitationModal } = useGlobalChatStore()
  const [copied, setCopied] = useState(false)

  if (!activeCitationForModal) return null

  const handleCopyQuote = async () => {
    try {
      await navigator.clipboard.writeText(activeCitationForModal.quote)
      setCopied(true)
      toast.success("Kutipan teks bukti naskah berhasil disalin ke papan klip.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Gagal menyalin teks kutipan.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-modal-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {activeCitationForModal.citation_id}
            </span>
            <div>
              <h3
                id="citation-modal-title"
                className="text-xs font-bold text-foreground leading-snug"
              >
                Rujukan Bukti Naskah Ilmiah
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Kutipan empiris yang mendasari formulasi jawaban asisten.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCitationModal}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Tutup jendela"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5">
          {/* Metadata Paper */}
          <div className="rounded-xl border border-border/80 bg-secondary/15 p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-semibold">
              <FileText className="size-3.5 text-primary shrink-0" />
              <span>Naskah Dokumen:</span>
            </div>
            <h4 className="font-bold text-foreground leading-snug">
              {activeCitationForModal.paper_title}
            </h4>
            <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-foreground">
                Halaman {activeCitationForModal.page_number}
              </span>
              {activeCitationForModal.file_name && (
                <span className="truncate max-w-[200px]">
                  Berkas: {activeCitationForModal.file_name}
                </span>
              )}
            </div>
          </div>

          {/* Kutipan Naskah (Quote) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
              <Quote className="size-3 text-primary" />
              <span>Kutipan Teks Asli (Verbatim Evidence):</span>
            </div>
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/[0.03] text-xs italic text-foreground/90 leading-relaxed max-h-48 overflow-y-auto">
              &ldquo;{activeCitationForModal.quote}&rdquo;
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-border flex items-center justify-between bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyQuote}
            className="text-xs h-8 gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Tersalin" : "Salin Kutipan"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={closeCitationModal}
              className="text-xs h-8 cursor-pointer"
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
