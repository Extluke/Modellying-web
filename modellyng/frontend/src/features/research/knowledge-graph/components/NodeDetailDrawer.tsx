import { useState } from "react"
import {
  X,
  Copy,
  Check,
  Quote,
  Flame,
  BookOpen,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import { useKnowledgeGraphStore } from "../store/useKnowledgeGraphStore"

export function NodeDetailDrawer() {
  const { selectedNode, isDrawerOpen, setIsDrawerOpen } = useKnowledgeGraphStore()
  const [copied, setCopied] = useState(false)

  if (!isDrawerOpen || !selectedNode) return null

  const handleCopySummary = async () => {
    try {
      const quotesText = selectedNode.sourcePapers
        .filter((p) => p.quote)
        .map((p) => `• "${p.quote}" (${p.title}, Hal. ${p.pageNumber || 1})`)
        .join("\n")

      const summary = `KONSEP: ${selectedNode.label}\nTIPE: ${selectedNode.nodeType}\nZONA SATURASI: ${selectedNode.saturationZone.toUpperCase()} (${selectedNode.saturationPercentage}% - ${selectedNode.frequencyCount}/${selectedNode.totalPapers} Paper)\nDESKRIPSI: ${selectedNode.description}\n\nBUKTI EMPIRIS:\n${quotesText}`

      await navigator.clipboard.writeText(summary)
      setCopied(true)
      toast.success("Ringkasan konsep dan bukti empiris berhasil disalin ke papan klip.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Gagal menyalin ringkasan konsep.")
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="node-drawer-title"
      className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 z-30 bg-card/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Header Drawer */}
      <div className="p-4 border-b border-border bg-muted/20 flex items-start justify-between gap-3 shrink-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                selectedNode.saturationZone === "low"
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                  : selectedNode.saturationZone === "medium"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              }`}
            >
              {selectedNode.saturationZone === "low" && <Flame className="size-3" />}
              <span>Saturasi: {selectedNode.saturationPercentage}%</span>
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase font-bold">
              {selectedNode.nodeType.replace("_", " ")}
            </span>
          </div>

          <h3
            id="node-drawer-title"
            className="text-sm font-bold text-foreground leading-snug line-clamp-2"
          >
            {selectedNode.label}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(false)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          aria-label="Tutup panel"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Callout Zona Saturasi */}
        <div
          className={`p-3 rounded-xl border text-[11px] space-y-1 ${
            selectedNode.saturationZone === "low"
              ? "bg-rose-500/10 border-rose-500/25 text-rose-950 dark:text-rose-200"
              : selectedNode.saturationZone === "medium"
              ? "bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-200"
              : "bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="size-3.5" />
            <span>
              {selectedNode.saturationZone === "low"
                ? "Peluang Novelty Tinggi (Saturasi Rendah)"
                : selectedNode.saturationZone === "medium"
                ? "Topik Transisi Riset (Saturasi Sedang)"
                : "Fondasi Teoretis Mapan (Saturasi Tinggi)"}
            </span>
          </div>
          <p className="leading-relaxed">
            {selectedNode.saturationZone === "low"
              ? "Konsep ini baru muncul pada sedikit paper, menjadikannya kandidat kuat untuk celah riset dan topik tesis."
              : selectedNode.saturationZone === "medium"
              ? "Konsep mulai dieksplorasi oleh beberapa naskah dan berada dalam tahap pengembangan aktif."
              : "Konsep standar yang telah terbukti mapan dan dipakai oleh mayoritas paper dalam proyek ini."}
          </p>
        </div>

        {/* Deskripsi Konsep */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Formulasi Konseptual:
          </span>
          <p className="text-foreground leading-relaxed bg-secondary/20 p-3 rounded-xl border border-border/70">
            {selectedNode.description}
          </p>
        </div>

        {/* Paper Pendukung & Bukti Kutipan */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="size-3 text-primary" />
              <span>Dokumen Rujukan ({selectedNode.sourcePapers.length}):</span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {selectedNode.frequencyCount} / {selectedNode.totalPapers} Paper
            </span>
          </div>

          <div className="space-y-2.5">
            {selectedNode.sourcePapers.map((paper, idx) => (
              <div
                key={paper.id || idx}
                className="p-3 rounded-xl border border-border bg-card space-y-2 shadow-2xs"
              >
                <div className="space-y-0.5">
                  <h5 className="font-bold text-foreground text-xs leading-snug">
                    {paper.title}
                  </h5>
                  <p className="text-[10px] text-muted-foreground">
                    {paper.authors.join(", ")} ({paper.year ?? "N/A"})
                  </p>
                </div>

                {paper.quote && (
                  <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                      <Quote className="size-2.5" />
                      <span>Kutipan Bukti:</span>
                      {paper.pageNumber && (
                        <span className="ml-auto font-mono text-[9px] bg-secondary px-1.5 py-0.2 rounded text-foreground font-bold">
                          Hal. {paper.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="italic text-muted-foreground leading-relaxed line-clamp-3">
                      &ldquo;{paper.quote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 border-t border-border bg-muted/10 shrink-0">
        <Button
          type="button"
          size="sm"
          onClick={handleCopySummary}
          className="w-full text-xs h-8.5 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          <span>{copied ? "Tersalin ke Papan Klip" : "Salin Ringkasan Konsep"}</span>
        </Button>
      </div>
    </div>
  )
}
