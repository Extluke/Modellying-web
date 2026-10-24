import { useReactFlow } from "@xyflow/react"
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGapMapStore } from "../store/useGapMapStore"

interface CanvasToolbarProps {
  sharedCount: number
  gapCount: number
}

export function CanvasToolbar({ sharedCount, gapCount }: CanvasToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { filterMode, setFilterMode, isFullscreen, toggleFullscreen } = useGapMapStore()

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 400 })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-card/90 backdrop-blur-md border rounded-xl shadow-xs">
      {/* Group 1: Filter Kategori Cepat (Semua, Hijau, Merah) */}
      <div className="flex items-center gap-1.5 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground mr-1 text-[11px] font-medium hidden sm:flex">
          <Filter className="size-3.5" />
          <span>Filter Simpul:</span>
        </div>

        <button
          type="button"
          onClick={() => setFilterMode("all")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            filterMode === "all"
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua ({sharedCount + gapCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("shared_only")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            filterMode === "shared_only"
              ? "bg-emerald-600 text-white shadow-2xs font-bold"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          }`}
          title="Tampilkan hanya topik dan solusi yang diteliti oleh >= 2 paper"
        >
          <CheckCircle2 className="size-3" />
          <span>Shared ({sharedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("gap_only")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            filterMode === "gap_only"
              ? "bg-rose-600 text-white shadow-2xs font-bold"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
          }`}
          title="Tampilkan hanya celah riset dan solusi langka (1 paper)"
        >
          <Sparkles className="size-3" />
          <span>Celah Langka ({gapCount})</span>
        </button>
      </div>

      {/* Group 2: Zoom & Navigation Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => zoomIn({ duration: 250 })}
          className="size-8 cursor-pointer"
          title="Perbesar Kanvas (Zoom In)"
        >
          <ZoomIn className="size-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => zoomOut({ duration: 250 })}
          className="size-8 cursor-pointer"
          title="Perkecil Kanvas (Zoom Out)"
        >
          <ZoomOut className="size-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleFitView}
          className="size-8 cursor-pointer"
          title="Sesuaikan Seluruh Kanvas ke Layar (Fit View)"
        >
          <RotateCcw className="size-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-0.5" />

        <Button
          variant={isFullscreen ? "default" : "outline"}
          size="sm"
          onClick={toggleFullscreen}
          className="h-8 text-xs gap-1.5 cursor-pointer"
          title={isFullscreen ? "Keluar dari Layar Penuh" : "Mode Layar Penuh (Fullscreen)"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="size-3.5" />
              <span className="hidden sm:inline">Kecilkan</span>
            </>
          ) : (
            <>
              <Maximize2 className="size-3.5" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
