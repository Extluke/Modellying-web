import { AlertTriangle, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGlobalChatStore } from "../store/useGlobalChatStore"

interface ClearHistoryConfirmModalProps {
  onConfirmClear: () => void
}

export function ClearHistoryConfirmModal({ onConfirmClear }: ClearHistoryConfirmModalProps) {
  const { clearHistoryModalOpen, setClearHistoryModalOpen } = useGlobalChatStore()

  if (!clearHistoryModalOpen) return null

  const handleConfirm = () => {
    onConfirmClear()
    setClearHistoryModalOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-modal-title"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0 mt-0.5">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1">
              <h3
                id="clear-modal-title"
                className="text-sm font-bold text-foreground"
              >
                Hapus Riwayat Percakapan?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tindakan ini akan menghapus seluruh percakapan yang tersimpan pada penyimpanan lokal peramban Anda. Pesan yang dihapus tidak dapat dipulihkan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setClearHistoryModalOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground ml-auto -mr-1 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-[11px] text-muted-foreground space-y-0.5">
            <span className="font-semibold text-foreground block">
              Informasi Kebijakan Caching:
            </span>
            <p>
              Riwayat percakapan asisten secara otomatis kedaluwarsa dan dipangkas setelah 24 jam. Anda dapat membersihkannya lebih cepat melalui tombol ini.
            </p>
          </div>
        </div>

        <div className="p-3.5 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setClearHistoryModalOpen(false)}
            className="text-xs h-8 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            className="text-xs h-8 gap-1.5 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Ya, Bersihkan Riwayat</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
