import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ResearchFlowScreen() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      <div className="flex h-12 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">
            Kanvas Alur Riset Interaktif (Topik → Tema → Masalah → Solusi)
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-0.5 bg-background">
            <Button variant="ghost" size="icon" className="size-7">
              <ZoomOut className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7">
              <ZoomIn className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7">
              <Maximize2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-muted/30 p-8">
        <div className="flex items-center gap-8">
          <div className="rounded-xl border bg-card p-4 shadow-sm w-48 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Tahap 1</span>
            <h4 className="text-xs font-semibold">Natural Language Processing</h4>
            <p className="text-[11px] text-muted-foreground">Domain Utama</p>
          </div>
          <span className="text-muted-foreground text-sm">➔</span>
          <div className="rounded-xl border bg-card p-4 shadow-sm w-48 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Tahap 2</span>
            <h4 className="text-xs font-semibold">Sequence Modeling</h4>
            <p className="text-[11px] text-muted-foreground">Tema Pendekatan</p>
          </div>
          <span className="text-muted-foreground text-sm">➔</span>
          <div className="rounded-xl border bg-card p-4 shadow-sm w-48 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-destructive tracking-wider">Tahap 3</span>
            <h4 className="text-xs font-semibold">Sequential Computation Limit</h4>
            <p className="text-[11px] text-muted-foreground">Masalah Ilmiah</p>
          </div>
          <span className="text-muted-foreground text-sm">➔</span>
          <div className="rounded-xl border bg-card p-4 shadow-sm w-48 text-center space-y-1 border-emerald-500/50">
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Tahap 4</span>
            <h4 className="text-xs font-semibold">Self-Attention Transformer</h4>
            <p className="text-[11px] text-muted-foreground">Solusi Novelty</p>
          </div>
        </div>
      </div>
    </div>
  )
}
