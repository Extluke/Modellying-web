import { useEffect, useState, useId } from "react"
import mermaid from "mermaid"
import {
  Code2,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileText,
  Workflow,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaperPairComparison } from "../types/conceptMapTypes"
import { build5StepMermaidSyntax } from "../utils/mermaidSyntaxBuilder"
import { toast } from "@/lib/store/useToastStore"

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
})

interface FiveStepMermaidFlowchartProps {
  pair: PaperPairComparison
}

export function FiveStepMermaidFlowchart({ pair }: FiveStepMermaidFlowchartProps) {
  const [svgOutput, setSvgOutput] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState<boolean>(false)

  const rawId = useId()
  const uniqueId = `mermaid-${rawId.replace(/:/g, "")}`
  const chartCode = build5StepMermaidSyntax(pair)

  useEffect(() => {
    let isMounted = true

    async function renderMermaidChart() {
      if (!chartCode.trim()) return
      try {
        setError(null)
        const { svg } = await mermaid.render(uniqueId, chartCode)
        if (isMounted) {
          setSvgOutput(svg)
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : "Gagal merender diagram Mermaid."
          setError(errMsg)
          setSvgOutput("")
        }
      }
    }

    renderMermaidChart()

    return () => {
      isMounted = false
      const tempEl = document.getElementById(`d${uniqueId}`)
      if (tempEl) tempEl.remove()
    }
  }, [chartCode, uniqueId])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(chartCode)
      toast.success("Sintaks diagram alur Mermaid berhasil disalin ke clipboard.")
    } catch {
      toast.error("Gagal menyalin kode diagram.")
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Workflow className="size-4.5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Diagram Alur 5 Tahap Evaluasi Pasangan Dokumen
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Visualisasi Deterministic Stopping Rule (Konsep ➔ Variabel ➔ Objek ➔ Metode ➔ Masalah).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Code2 className="size-3.5" />
            <span>{showCode ? "Tutup Kode" : "Lihat Kode Mermaid"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="h-8 text-xs gap-1.5 cursor-pointer"
            title="Salin sintaks Mermaid diagram"
          >
            <Copy className="size-3.5" />
            <span>Salin Kode</span>
          </Button>
        </div>
      </div>

      {/* Stopping Point Summary Callout */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          pair.finalVerdict === "candidate_gap"
            ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
            : pair.finalVerdict === "no_gap"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
            : "bg-muted/30 border-border text-foreground"
        }`}
      >
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            {pair.finalVerdict === "candidate_gap" ? (
              <>
                <Sparkles className="size-4 text-rose-600" />
                <span>Titik Henti Terdeteksi: Celah Riset Ditemukan pada Tahap &ldquo;{pair.stoppingStep}&rdquo;</span>
              </>
            ) : pair.finalVerdict === "no_gap" ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Hasil: Kedua Naskah Identik pada Kelima Parameter (No Gap)</span>
              </>
            ) : (
              <>
                <AlertCircle className="size-4 text-muted-foreground" />
                <span>Hasil: Kedua Naskah Tidak Berhubungan pada Domain Konsep (Unrelated)</span>
              </>
            )}
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed max-w-2xl">
            {pair.coreIssue || "Evaluasi 5 tahap menghasilkan keputusan deterministik yang dapat diverifikasi."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-card border font-bold text-foreground">
            Skor Kemiripan: {pair.similarityScore}%
          </span>
        </div>
      </div>

      {/* Mermaid Code Preview Collapsible */}
      {showCode && (
        <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-muted-foreground pb-1 border-b">
            <span>Sintaks Mermaid (graph TD):</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="h-6 text-[11px] gap-1 cursor-pointer"
            >
              <Copy className="size-3" />
              <span>Salin</span>
            </Button>
          </div>
          <pre className="p-2.5 rounded-lg bg-card border text-[11px] leading-relaxed overflow-x-auto text-foreground">
            {chartCode}
          </pre>
        </div>
      )}

      {/* SVG Diagram Output Render Container */}
      <div className="rounded-2xl border bg-card/70 p-6 flex flex-col items-center justify-center min-h-[380px] overflow-x-auto">
        {error ? (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1 text-center">
            <span className="font-bold block">Gagal Memproses Diagram Mermaid:</span>
            <p className="text-[11px]">{error}</p>
          </div>
        ) : svgOutput ? (
          <div
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto select-none"
            dangerouslySetInnerHTML={{ __html: svgOutput }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Membuat diagram alur 5 tahap...</span>
          </div>
        )}
      </div>

      {/* Evidence Citations Footnote */}
      <div className="p-3 rounded-xl border bg-muted/15 space-y-2 text-xs">
        <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <FileText className="size-3 text-primary" />
          <span>Bukti Kutipan Naskah Primer yang Dibandingkan:</span>
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div className="p-2.5 rounded-lg bg-card border space-y-1">
            <span className="font-bold text-foreground block truncate">
              Naskah 1: {pair.paper1.title}
            </span>
            <p className="italic text-muted-foreground leading-relaxed line-clamp-3">
              &ldquo;{pair.steps[0]?.paper1Evidence.quote}&rdquo;
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-card border space-y-1">
            <span className="font-bold text-foreground block truncate">
              Naskah 2: {pair.paper2.title}
            </span>
            <p className="italic text-muted-foreground leading-relaxed line-clamp-3">
              &ldquo;{pair.steps[0]?.paper2Evidence.quote}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
