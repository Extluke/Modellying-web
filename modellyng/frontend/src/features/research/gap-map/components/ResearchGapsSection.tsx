import { AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GapItem } from "../utils/gapItems"
import { GapCard } from "./GapCard"

interface ResearchGapsSectionProps {
  gaps: GapItem[]
  isLoading: boolean
  isError: boolean
  activeGapId: string | null
  onOpenGap: (gapId: string) => void
  onRetry: () => void
}

/** "Research Gaps" list shown below the research flow canvas. */
export function ResearchGapsSection({
  gaps,
  isLoading,
  isError,
  activeGapId,
  onOpenGap,
  onRetry,
}: ResearchGapsSectionProps) {
  return (
    <section aria-labelledby="research-gaps-title" className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-primary" />
        <h2 id="research-gaps-title" className="text-sm font-bold text-foreground">
          Research Gaps
        </h2>
        {!isLoading && !isError && gaps.length > 0 && (
          <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
            {gaps.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-card p-8 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Memuat research gap...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card p-8 text-center">
          <p className="text-xs text-muted-foreground">Research gap belum dapat dimuat. Silakan coba kembali.</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RefreshCw />
            <span>Coba lagi</span>
          </Button>
        </div>
      ) : gaps.length === 0 ? (
        <div className="rounded-card border border-border bg-card p-8 text-center text-xs text-muted-foreground">
          Belum ada research gap untuk proyek ini.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gaps.map((gap) => (
            <li key={gap.id}>
              <GapCard gap={gap} isActive={gap.id === activeGapId} onOpen={onOpenGap} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
