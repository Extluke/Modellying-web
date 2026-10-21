import { Button } from "@/components/ui/button"
import { UploadCloud, X } from "lucide-react"

interface UploadPdfModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadPdfModal({ isOpen, onClose }: UploadPdfModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-foreground text-sm">Unggah Dokumen Paper PDF</h3>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center hover:border-primary/50 transition-colors">
          <UploadCloud className="size-10 text-primary mb-2" />
          <p className="text-xs font-medium text-foreground">
            Tarik & Lepas file PDF ke sini, atau klik untuk memilih
          </p>
          <span className="text-[11px] text-muted-foreground mt-1">
            Maks 15 file sekaligus, hingga 50 MB per file (Validasi %PDF-)
          </span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Batal</Button>
          <Button size="sm">Mulai Ekstraksi AI</Button>
        </div>
      </div>
    </div>
  )
}
