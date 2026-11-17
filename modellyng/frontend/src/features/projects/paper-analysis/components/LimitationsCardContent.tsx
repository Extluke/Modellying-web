import { useMemo, useState } from "react"
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"
import {
  type AiLimitationItem,
  type PaperAnalysisContext,
  augmentLimitations,
} from "../utils/limitationsAugmentor"

interface LimitationsCardContentProps {
  text?: string | null
  paperContext?: PaperAnalysisContext
}

export function LimitationsCardContent({
  text,
  paperContext = {},
}: LimitationsCardContentProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const augmented = useMemo(
    () => augmentLimitations(text, paperContext),
    [text, paperContext]
  )

  const handleCopyLimitation = async (lim: AiLimitationItem) => {
    const formatted = `[Keterbatasan Temuan Kritis AI] ${lim.title}\nCelah yang Luput dari Penulis: ${lim.blindSpot}\nImplikasi terhadap Validitas: ${lim.academicImpact}`
    try {
      await navigator.clipboard.writeText(formatted)
      setCopiedId(lim.id)
      toast.success(
        `Keterbatasan implisit "${lim.title}" berhasil disalin ke papan klip.`
      )
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      toast.error("Gagal menyalin poin keterbatasan ke papan klip.")
    }
  }

  const handleCopyAuthorSection = async () => {
    try {
      await navigator.clipboard.writeText(augmented.authorSection.text)
      setCopiedId("author-limitation-section")
      toast.success("Keterbatasan penulis berhasil disalin ke papan klip.")
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      toast.error("Gagal menyalin keterbatasan penulis ke papan klip.")
    }
  }

  return (
    <div className="space-y-4">
      {/* KELOMPOK 1: Keterbatasan yang Disadari Penulis (Keterbatasan Eksplisit) */}
      <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2.5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookOpen className="size-3.5" />
            </div>
            <h5 className="text-xs font-bold text-foreground">
              1. Keterbatasan yang Disadari Penulis
            </h5>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant={augmented.authorSection.isExplicit ? "paper" : "muted"}
              className="text-[10px] px-2 py-0.5 rounded-full"
            >
              {augmented.authorSection.isExplicit
                ? "Keterbatasan Eksplisit Paper"
                : "Tidak Disebutkan Penulis"}
            </Badge>

            {augmented.authorSection.isExplicit && (
              <button
                type="button"
                onClick={handleCopyAuthorSection}
                title="Salin keterbatasan penulis"
                className="size-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedId === "author-limitation-section" ? (
                  <Check className="size-3 text-status-green" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            )}
          </div>
        </div>

        <p
          className={`text-xs leading-relaxed font-normal whitespace-pre-wrap ${
            augmented.authorSection.isExplicit
              ? "text-foreground"
              : "text-muted-foreground italic"
          }`}
        >
          {augmented.authorSection.text}
        </p>
      </div>

      {/* KELOMPOK 2: Keterbatasan yang Belum Disadari Penulis (Keterbatasan Implisit Temuan AI) */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-orange-50/20 dark:from-amber-950/25 dark:via-background dark:to-slate-900/40 p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
          <div className="flex items-start gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-600 dark:bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="text-xs font-bold text-foreground">
                  2. Keterbatasan yang Belum Disadari Penulis
                </h5>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                  Temuan Kritis AI
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                Sintesis evaluasi kritis metodologis dan validitas riset yang luput dari pembahasan eksplisit penulis naskah.
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
          >
            {augmented.aiSection.limitations.length} Evaluasi Kritis AI
          </Badge>
        </div>

        {/* List of Critical Limitation Cards */}
        <div className="grid grid-cols-1 gap-2.5">
          {augmented.aiSection.limitations.map((lim, idx) => (
            <div
              key={lim.id}
              className="rounded-lg border border-border/70 bg-card/90 p-3.5 space-y-2 hover:border-amber-500/50 hover:shadow-xs transition-all group/lim"
            >
              {/* Header: Number, Title, Badge, and Copy Action */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-bold font-mono mt-0.5">
                    {idx + 1}
                  </span>
                  <h6 className="text-xs font-bold text-foreground leading-snug">
                    {lim.title}
                  </h6>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-medium py-0 px-2 text-muted-foreground border-border/60 bg-muted/30"
                  >
                    {lim.categoryTag}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleCopyLimitation(lim)}
                    title="Salin poin keterbatasan riset ini"
                    className="size-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedId === lim.id ? (
                      <Check className="size-3 text-status-green" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Blind Spot: Celah yang Luput dari Penulis */}
              <div className="text-xs text-muted-foreground leading-relaxed pl-7">
                <span className="font-semibold text-foreground/90 flex items-center gap-1 mb-0.5">
                  <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  Celah yang Luput dari Penulis:
                </span>
                {lim.blindSpot}
              </div>

              {/* Academic Impact on Validity / Generalization */}
              <div className="text-[11px] text-amber-900 dark:text-amber-200/90 font-medium pl-7 flex items-start gap-1.5 pt-1.5 border-t border-border/40 mt-1">
                <ShieldAlert className="size-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-foreground/80">
                    Implikasi terhadap Validitas:{" "}
                  </strong>
                  {lim.academicImpact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
