import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Target,
  Quote,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGapMapStore } from "../store/useGapMapStore"
import { toast } from "@/lib/store/useToastStore"

export function NodeDetailPanel() {
  const { selectedNode, setSelectedNode } = useGapMapStore()

  if (!selectedNode) return null

  const isShared = selectedNode.status === "shared"

  const handleCopyText = async () => {
    const textToCopy = `[${selectedNode.stageLabel}] ${selectedNode.title}\n${selectedNode.description}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      toast.success("Rincian simpul alur riset berhasil disalin ke clipboard.")
    } catch {
      toast.error("Gagal menyalin teks ke clipboard.")
    }
  }

  const handleMarkAsThesisFocus = () => {
    toast.success(
      `Simpul "${selectedNode.title.slice(0, 35)}..." berhasil ditandai sebagai fokus novelty riset.`
    )
  }

  return (
    <aside
      className="absolute top-0 right-0 z-20 h-full w-full sm:w-96 bg-card/95 backdrop-blur-md border-l shadow-2xl flex flex-col transition-all duration-300 ease-in-out animate-in slide-in-from-right duration-200"
      aria-label="Panel Rincian Simpul Alur Riset"
    >
      {/* Header Bar */}
      <div className="p-4 border-b flex items-start justify-between gap-3 bg-muted/20">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            {selectedNode.stageLabel}
          </span>
          <h3 className="text-sm font-bold text-foreground leading-snug">
            {selectedNode.title}
          </h3>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedNode(null)}
          className="size-7 rounded-full shrink-0 cursor-pointer"
          title="Tutup Panel Rincian"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Content Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Frequency & Consensus Status */}
        <div
          className={`p-3 rounded-xl border space-y-1.5 ${
            isShared
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-500/10 border-rose-500/25 text-rose-900 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {isShared ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Konsensus Literatur: Sering Diteliti ({selectedNode.paperCount} Paper)</span>
              </>
            ) : (
              <>
                <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
                <span>Peluang Kebaruan: Celah Riset Langka (1 Paper)</span>
              </>
            )}
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {isShared
              ? "Parameter ini diangkat oleh beberapa naskah primer sebagai landasan mapan yang relevan untuk tinjauan pustaka teoretis."
              : "Parameter ini baru diangkat oleh 1 dokumen naskah. Menjadikannya celah investigasi langka yang ideal untuk diangkat sebagai novelty tesis."}
          </p>
        </div>

        {/* Node Detailed Description */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Deskripsi Formulasi Ilmiah:
          </span>
          <div className="rounded-xl border bg-background p-3 text-xs leading-relaxed text-foreground">
            {selectedNode.description}
          </div>
        </div>

        {/* Source Papers List */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="size-3.5 text-primary" />
            <span>Dokumen Paper Rujukan ({selectedNode.papers.length}):</span>
          </span>

          <div className="space-y-2">
            {selectedNode.papers.map((p, idx) => (
              <div
                key={p.id || idx}
                className="p-3 rounded-xl border bg-muted/15 space-y-2 text-xs"
              >
                <div className="space-y-0.5">
                  <h5 className="font-bold text-foreground leading-snug">
                    {p.title}
                  </h5>
                  <p className="text-[10px] text-muted-foreground">
                    {p.authors.join(", ")} {p.year ? `(${p.year})` : ""}
                  </p>
                </div>

                {/* Evidence Quote if present */}
                {p.evidenceQuote && (
                  <div className="rounded-lg bg-card p-2.5 border border-primary/20 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Quote className="size-2.5" />
                      <span>Kutipan Bukti Verbatim Naskah:</span>
                      {p.pageNumber && (
                        <span className="ml-auto font-mono text-[9px] bg-secondary px-1.5 py-0.5 rounded">
                          Hal. {p.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="italic text-muted-foreground leading-relaxed pl-1">
                      &ldquo;{p.evidenceQuote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Novelty or Gap Rational */}
        {(selectedNode.noveltyNote || selectedNode.gapReason) && (
          <div className="p-3 rounded-xl border bg-secondary/30 space-y-1 text-xs">
            <div className="flex items-center gap-1 font-bold text-primary text-[11px]">
              <Sparkles className="size-3.5" />
              <span>Rasional Analitis:</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {selectedNode.noveltyNote || selectedNode.gapReason}
            </p>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="p-3 border-t bg-card space-y-2 shrink-0">
        <Button
          onClick={handleMarkAsThesisFocus}
          className="w-full text-xs h-8.5 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
        >
          <Target className="size-3.5" />
          <span>Jadikan Fokus Novelty Tesis</span>
        </Button>

        <Button
          variant="outline"
          onClick={handleCopyText}
          className="w-full text-xs h-8 gap-1.5 cursor-pointer"
        >
          <Copy className="size-3" />
          <span>Salin Ringkasan Simpul</span>
        </Button>
      </div>
    </aside>
  )
}
