import { useMemo, useState } from "react"
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Lightbulb,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"
import {
  type AiFutureWorkOpportunity,
  type PaperAnalysisContext,
  augmentFutureWork,
} from "../utils/futureWorkAugmentor"

interface FutureWorkCardContentProps {
  text?: string | null
  paperContext?: PaperAnalysisContext
}

export function FutureWorkCardContent({
  text,
  paperContext = {},
}: FutureWorkCardContentProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const augmented = useMemo(
    () => augmentFutureWork(text, paperContext),
    [text, paperContext]
  )

  const handleCopyOpportunity = async (opp: AiFutureWorkOpportunity) => {
    const formatted = `[Peluang Riset Temuan AI] ${opp.title}\nCelah yang Belum Disadari Penulis: ${opp.rationale}\nPotensi Nilai Tesis: ${opp.academicContribution}`
    try {
      await navigator.clipboard.writeText(formatted)
      setCopiedId(opp.id)
      toast.success(
        `Ide peluang riset "${opp.title}" berhasil disalin ke papan klip.`
      )
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      toast.error("Gagal menyalin ide peluang riset ke papan klip.")
    }
  }

  const handleCopyAuthorSection = async () => {
    try {
      await navigator.clipboard.writeText(augmented.authorSection.text)
      setCopiedId("author-section")
      toast.success("Agenda riset penulis berhasil disalin ke papan klip.")
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      toast.error("Gagal menyalin agenda riset ke papan klip.")
    }
  }

  return (
    <div className="space-y-4">
      {/* KELOMPOK 1: Peluang yang Disadari Penulis (Agenda Riset Eksplisit) */}
      <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2.5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpen className="size-3.5" />
            </div>
            <h5 className="text-xs font-bold text-foreground">
              1. Peluang yang Disadari Penulis
            </h5>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant={augmented.authorSection.isExplicit ? "paper" : "muted"}
              className="text-[10px] px-2 py-0.5 rounded-full"
            >
              {augmented.authorSection.isExplicit
                ? "Agenda Riset Penulis"
                : "Tidak Disebutkan Penulis"}
            </Badge>

            {augmented.authorSection.isExplicit && (
              <button
                type="button"
                onClick={handleCopyAuthorSection}
                title="Salin agenda riset penulis"
                className="size-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedId === "author-section" ? (
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

      {/* KELOMPOK 2: Peluang yang Belum Disadari Penulis (Peluang Riset Baru Temuan AI) */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-indigo-50/20 dark:from-indigo-950/25 dark:via-background dark:to-slate-900/40 p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/20 pb-2.5">
          <div className="flex items-start gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0 mt-0.5">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="text-xs font-bold text-foreground">
                  2. Peluang yang Belum Disadari Penulis
                </h5>
                <span className="text-[10px] font-semibold text-primary font-mono px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20">
                  Temuan AI
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                Sintesis ekstrapolasi cerdas mengenai celah kebaruan (novelty) yang belum dijangkau oleh penulis naskah.
              </p>
            </div>
          </div>

          <Badge
            variant="primary"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto bg-primary-soft text-primary-soft-foreground border-primary/30"
          >
            {augmented.aiSection.opportunities.length} Rekomendasi Kebaruan AI
          </Badge>
        </div>

        {/* List of AI Opportunity Cards */}
        <div className="grid grid-cols-1 gap-2.5">
          {augmented.aiSection.opportunities.map((opp, idx) => (
            <div
              key={opp.id}
              className="rounded-lg border border-border/70 bg-card/90 p-3.5 space-y-2 hover:border-primary/50 hover:shadow-xs transition-all group/opp"
            >
              {/* Header: Number, Title, Badge, and Copy Action */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold font-mono mt-0.5">
                    {idx + 1}
                  </span>
                  <h6 className="text-xs font-bold text-foreground leading-snug">
                    {opp.title}
                  </h6>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-medium py-0 px-2 text-muted-foreground border-border/60 bg-muted/30"
                  >
                    {opp.categoryTag}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleCopyOpportunity(opp)}
                    title="Salin poin peluang riset ini"
                    className="size-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedId === opp.id ? (
                      <Check className="size-3 text-status-green" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Rationale: Celah yang Terlewat oleh Penulis */}
              <div className="text-xs text-muted-foreground leading-relaxed pl-7">
                <span className="font-semibold text-foreground/90">
                  Celah yang Terlewat:{" "}
                </span>
                {opp.rationale}
              </div>

              {/* Potential Thesis / Research Contribution */}
              <div className="text-[11px] text-primary dark:text-indigo-300 font-medium pl-7 flex items-center gap-1.5 pt-1.5 border-t border-border/40 mt-1">
                <Lightbulb className="size-3 text-amber-500 shrink-0" />
                <span>
                  <strong className="font-semibold text-foreground/80">
                    Potensi Nilai Tesis:{" "}
                  </strong>
                  {opp.academicContribution}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
