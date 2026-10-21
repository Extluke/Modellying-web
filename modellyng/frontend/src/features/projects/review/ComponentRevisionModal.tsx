import { Button } from "@/components/ui/button"
import { Sparkles, Send, X } from "lucide-react"

interface ComponentRevisionModalProps {
  isOpen: boolean
  onClose: () => void
  componentTitle?: string
}

export function ComponentRevisionModal({
  isOpen,
  onClose,
  componentTitle = "Metodologi Penelitian",
}: ComponentRevisionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              Dialog Percakapan Revisi AI: {componentTitle}
            </h3>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="h-60 overflow-y-auto rounded-lg bg-secondary/30 p-3 space-y-3 text-xs">
          <div className="rounded-lg bg-primary/10 p-3 text-foreground self-start">
            <p className="font-semibold text-primary text-[10px] uppercase tracking-wider mb-1">
              Hasil Ekstraksi Awal AI
            </p>
            "Model menggunakan arsitektur Transformer 6 encoder dan 6 decoder layers dengan Multi-Head Attention..."
          </div>

          <div className="rounded-lg bg-card border p-3 text-foreground ml-6 shadow-sm">
            <p className="font-semibold text-muted-foreground text-[10px] mb-1">Instruksi Anda</p>
            "Tolong tambahkan spesifikasi optimizer Adam dan learning rate schedule yang tercantum pada Section 5."
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ketik instruksi perbaikan untuk AI..."
            className="h-9 flex-1 rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button size="sm" className="gap-1.5">
            <Send className="size-3.5" />
            <span>Kirim</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
