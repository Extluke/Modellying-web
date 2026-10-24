import {
  Compass,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Layers,
  HelpCircle,
} from "lucide-react"
import { ActionRecommendation } from "../types/flowTypes"

interface FourStageActionCardProps {
  recommendations: ActionRecommendation[]
}

const STAGE_ICONS = {
  topic: Lightbulb,
  theme: Layers,
  problem: HelpCircle,
  solution: Sparkles,
}

export function FourStageActionCard({ recommendations }: FourStageActionCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="size-4.5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Rekomendasi Aksi Akademis 4 Tahap (Topik → Tema → Masalah → Solusi)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Panduan strategi penulisan tesis dan perumusan novelty berdasarkan distribusi simpul alur riset.
          </p>
        </div>

        <span className="text-[11px] font-semibold text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shrink-0 self-start sm:self-auto">
          Framework 4 Tahap Modellyng
        </span>
      </div>

      {/* Grid of 4 Stage Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {recommendations.map((rec) => {
          const Icon = STAGE_ICONS[rec.stage] || Compass

          return (
            <div
              key={rec.id}
              className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between transition-all duration-200 hover:shadow-xs ${
                rec.isHighPriority
                  ? "bg-rose-500/[0.02] border-rose-500/30"
                  : "bg-muted/10 border-border"
              }`}
            >
              <div className="space-y-2.5">
                {/* Header: Stage Pill & Priority Badge */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <Icon className="size-3" />
                    <span>{rec.stageTitle}</span>
                  </span>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      rec.isHighPriority
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25"
                        : "bg-secondary text-muted-foreground border"
                    }`}
                  >
                    {rec.badgeText}
                  </span>
                </div>

                {/* Recommendation Title */}
                <h4 className="text-xs font-bold text-foreground leading-snug">
                  {rec.recommendationTitle}
                </h4>

                {/* Concrete Steps */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Langkah Tindakan Konkret:
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                    {rec.concreteSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <CheckCircle2 className="size-3 text-primary shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer Indicator */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-medium">
                  {rec.isHighPriority ? "Peluang Tesis Kritis" : "Fondasi Literatur"}
                </span>
                <ArrowRight className="size-3 text-muted-foreground" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
