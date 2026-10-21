import { Network, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function KnowledgeGraphScreen() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      <div className="flex h-12 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-2">
          <Network className="size-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">
            Graf Pengetahuan 2D & Saturasi Konsep (5000px Spatial Canvas)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500" /> Jenuh (Tinggi)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="size-2 rounded-full bg-amber-500" /> Sedang
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="size-2 rounded-full bg-destructive" /> Rendah (Novelty)
            </span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <Layers className="size-3.5" />
            <span>Reset Posisi Pegas</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
            <Network className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Kanvas Graf Spasial 2D (React Flow Engine)</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Node konsep ilmiah dirender berbasis algoritma spring layout dengan pengelompokan zona saturasi.
          </p>
        </div>
      </div>
    </div>
  )
}
