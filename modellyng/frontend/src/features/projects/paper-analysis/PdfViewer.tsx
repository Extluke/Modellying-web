import { FileText, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PdfViewer() {
  return (
    <div className="flex-1 flex flex-col border-b bg-card">
      {/* Viewer Toolbar */}
      <div className="flex h-10 items-center justify-between border-b px-4 bg-secondary/30">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <FileText className="size-3.5 text-primary" />
          <span>Halaman 1 / 15</span>
        </span>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7">
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground px-1">100%</span>
          <Button variant="ghost" size="icon" className="size-7">
            <ZoomIn className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7">
            <RotateCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF Viewport Canvas Placeholder (PDF.js Text Layer) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/20 overflow-y-auto">
        <div className="w-[480px] h-[640px] rounded-sm bg-white p-8 shadow-md border text-slate-800 space-y-4 text-xs font-serif leading-relaxed">
          <div className="text-center font-bold text-sm text-slate-900 border-b pb-3">
            Attention Is All You Need
          </div>
          <p className="text-[11px] leading-relaxed">
            Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin
          </p>
          <div className="p-2 rounded bg-amber-100/70 border border-amber-300 text-[11px]">
            <span className="font-sans font-bold text-amber-900 text-[10px] uppercase tracking-wider block">
              [Evidence Highlight Overlay]
            </span>
            "The Transformer is the first transduction model relying entirely on self-attention to compute representations of its input and output without using sequence-aligned RNNs or convolution."
          </div>
          <p className="text-[11px] text-slate-600">
            1. Introduction. Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling...
          </p>
        </div>
      </div>
    </div>
  )
}
