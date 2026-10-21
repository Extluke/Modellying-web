import { BookmarkCheck, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EvidencePanel() {
  return (
    <div className="h-44 border-t bg-card p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <BookmarkCheck className="size-3.5 text-primary" />
            <span>Kutipan Bukti Terpilih (#Span-104)</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            Block: #sec-1-para-2 | Halaman 1
          </span>
        </div>
        <p className="mt-2 text-xs text-foreground bg-primary/5 p-2.5 rounded border border-primary/20 italic">
          "The Transformer is the first transduction model relying entirely on self-attention to compute representations..."
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
        <span>Ketertelusuran terverifikasi terhadap checksum PDF</span>
        <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 text-primary">
          <span>Buka di PDF Asli</span>
          <ExternalLink className="size-3" />
        </Button>
      </div>
    </div>
  )
}
