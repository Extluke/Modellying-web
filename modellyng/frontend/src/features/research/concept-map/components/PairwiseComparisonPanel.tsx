import {
  Layers,
  ArrowRight,
  Workflow,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaperPairComparison } from "../types/conceptMapTypes"
import { useConceptMapStore } from "../store/useConceptMapStore"

interface PairwiseComparisonPanelProps {
  pairs: PaperPairComparison[]
  isPollingActive: boolean
}

export function PairwiseComparisonPanel({
  pairs,
  isPollingActive,
}: PairwiseComparisonPanelProps) {
  const { selectedPairId, setSelectedPairId, setActiveWorkspaceTab } = useConceptMapStore()

  const activePair = pairs.find((p) => p.pairId === selectedPairId) || pairs[0]

  return (
    <div className="space-y-6">
      {/* Polling Indicator & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Layers className="size-4.5 text-primary" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">
              Total Kombinasi Pasangan Paper: {pairs.length} Pasangan
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Perhitungan pasangan terurut: N x (N - 1) / 2 berdasarkan naskah berstatus Siap.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPollingActive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              <Activity className="size-3 animate-pulse" />
              <span>Sinkronisasi Polling Otomatis (5 detik)</span>
            </span>
          )}
          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            {pairs.filter((p) => p.finalVerdict === "candidate_gap").length} Celah Terdeteksi
          </span>
        </div>
      </div>

      {/* Grid: Left Column Pair Selector (1/3), Right Column Detail Steps (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Daftar Pasangan Paper */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1 text-xs text-muted-foreground font-semibold">
            <span>Daftar Pasangan Dokumen:</span>
            <span>Skor Kemiripan</span>
          </div>

          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {pairs.map((pair) => {
              const isSelected = pair.pairId === activePair?.pairId

              return (
                <div
                  key={pair.pairId}
                  onClick={() => setSelectedPairId(pair.pairId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? "border-primary bg-primary/[0.03] ring-1 ring-primary shadow-xs"
                      : "bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        pair.finalVerdict === "candidate_gap"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
                          : pair.finalVerdict === "no_gap"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {pair.finalVerdict === "candidate_gap" ? (
                        <>
                          <Sparkles className="size-2.5" />
                          <span>Candidate Gap</span>
                        </>
                      ) : pair.finalVerdict === "no_gap" ? (
                        <>
                          <CheckCircle2 className="size-2.5" />
                          <span>Identik (No Gap)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="size-2.5" />
                          <span>Unrelated</span>
                        </>
                      )}
                    </span>

                    <span className="text-[10px] font-mono font-bold text-foreground">
                      {pair.similarityScore}%
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1 font-bold text-foreground truncate">
                      <FileText className="size-3 text-primary shrink-0" />
                      <span className="truncate">{pair.paper1.title}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-center font-bold">vs</div>
                    <div className="flex items-center gap-1 font-bold text-foreground truncate">
                      <FileText className="size-3 text-primary shrink-0" />
                      <span className="truncate">{pair.paper2.title}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="truncate">
                      Henti: <strong className="text-foreground capitalize">{pair.stoppingStep}</strong>
                    </span>
                    <span className="text-primary font-semibold flex items-center gap-0.5">
                      <span>Rincian</span>
                      <ArrowRight className="size-2.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Rincian Evaluasi 5 Tahap Pasangan Terpilih */}
        {activePair && (
          <div className="lg:col-span-7 rounded-2xl border bg-card p-5 space-y-5 shadow-xs">
            {/* Header Pasangan Aktif */}
            <div className="space-y-3 border-b pb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Evaluasi Pasangan Aktif:
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedPairId(activePair.pairId)
                    setActiveWorkspaceTab("flowchart_view")
                  }}
                  className="h-7.5 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
                >
                  <Workflow className="size-3.5" />
                  <span>Lihat Diagram Alur 5 Tahap (Mermaid)</span>
                </Button>
              </div>

              <div className="p-3 rounded-xl border bg-muted/20 space-y-1.5 text-xs">
                <div className="font-bold text-foreground truncate">
                  Paper A: {activePair.paper1.title}
                </div>
                <div className="font-bold text-foreground truncate">
                  Paper B: {activePair.paper2.title}
                </div>
              </div>
            </div>

            {/* 5-Step Evaluation Cards */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Hasil Evaluasi 5 Tahap Deterministic:
              </span>

              {activePair.steps.map((st) => (
                <div
                  key={st.step}
                  className={`p-3.5 rounded-xl border space-y-2 text-xs transition-colors ${
                    st.outcome === "no"
                      ? "bg-rose-500/[0.03] border-rose-500/40"
                      : "bg-muted/10 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono">
                        {st.stepNumber}
                      </span>
                      <span>{st.stepName}</span>
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        st.outcome === "yes"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {st.outcome === "yes" ? "Sama (Yes)" : "Berbeda (No / Gap)"}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {st.reasoning}
                  </p>

                  {/* Evidence Comparison Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[10px]">
                    <div className="p-2 rounded bg-card border space-y-0.5">
                      <span className="font-bold text-muted-foreground block truncate">
                        Bukti Paper A (Hal. {st.paper1Evidence.pageNumber}):
                      </span>
                      <p className="italic text-foreground line-clamp-2">
                        &ldquo;{st.paper1Evidence.quote}&rdquo;
                      </p>
                    </div>

                    <div className="p-2 rounded bg-card border space-y-0.5">
                      <span className="font-bold text-muted-foreground block truncate">
                        Bukti Paper B (Hal. {st.paper2Evidence.pageNumber}):
                      </span>
                      <p className="italic text-foreground line-clamp-2">
                        &ldquo;{st.paper2Evidence.quote}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
