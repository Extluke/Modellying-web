import { AlertTriangle, ArrowRight, Lightbulb, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { confidenceLabel, formatGapNumber, type GapItem } from "../utils/gapItems"

interface GapCardProps {
  gap: GapItem
  isActive: boolean
  onOpen: (gapId: string) => void
}

/** Compact card of one research gap (mobile: horizontal gap card under "Peta Alur Riset"). */
export function GapCard({ gap, isActive, onOpen }: GapCardProps) {
  const paperCount = gap.paperIds.length

  return (
    <button
      type="button"
      onClick={() => onOpen(gap.id)}
      aria-pressed={isActive}
      aria-label={`${formatGapNumber(gap.number)}: buka solusi dan kelanjutan`}
      className={cn(
        "group flex h-full w-full flex-col gap-3 rounded-card border bg-card p-4 text-left shadow-2xs transition-colors",
        "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive ? "border-primary ring-1 ring-primary/30" : "border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-button bg-primary-soft text-primary">
          <AlertTriangle className="size-4" />
        </span>
        <span className="flex-1 text-sm font-bold text-foreground">{formatGapNumber(gap.number)}</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="size-3" />
          Ada Solusi
        </span>
      </div>

      <p className="line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground" title={gap.statement}>
        {gap.statement}
      </p>

      <p className="flex items-center gap-1.5 rounded-button border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
        <Lightbulb className="size-3.5 shrink-0" />
        <span className="truncate" title={gap.recommendation.concreteSolution}>
          Aksi User: {gap.recommendation.concreteSolution}
        </span>
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
        <span>
          {paperCount} papers &bull; {confidenceLabel(gap.confidence)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
          Solusi &amp; Kelanjutan
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}
