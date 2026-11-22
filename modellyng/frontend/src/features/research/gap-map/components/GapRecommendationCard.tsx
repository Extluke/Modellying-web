import { useState } from "react"
import { Bookmark, Check, Copy, Lightbulb, Rocket, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import { formatRecommendationForCopy, type GapRecommendation } from "../utils/gapRecommendation"

interface GapRecommendationCardProps {
  gapLabel: string
  recommendation: GapRecommendation
}

/** "Rekomendasi Aksi & Tindak Lanjut": what the user can do, a 4-stage roadmap and example titles. */
export function GapRecommendationCard({ gapLabel, recommendation }: GapRecommendationCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatRecommendationForCopy(gapLabel, recommendation))
      setCopied(true)
      toast.success("Rekomendasi tindakan dan roadmap berhasil disalin ke papan klip.")
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Rekomendasi belum dapat disalin. Silakan coba kembali.")
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-primary/25 bg-primary-soft/40 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <Lightbulb className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-foreground">
            Rekomendasi Aksi &amp; Tindak Lanjut
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Panduan solusi konkret yang bisa Anda lakukan dari gap ini.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-button border border-emerald-500/25 bg-emerald-500/5 p-3">
        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
          <Wrench className="size-3.5" />
          Apa yang bisa dilakukan user (solusi konkret)
        </h4>
        <p className="break-words text-xs font-bold leading-relaxed text-emerald-900 dark:text-emerald-100">
          {recommendation.concreteSolution}
        </p>
        <p className="break-words text-xs leading-relaxed text-foreground">{recommendation.whatUserCanDo}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground">
          <Rocket className="size-3.5 text-primary" />
          Bagaimana kelanjutannya (roadmap riset)
        </h4>
        <ol className="flex flex-col gap-2">
          {recommendation.roadmapSteps.map((step, index) => (
            <li key={step} className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="break-words text-xs leading-relaxed text-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2 rounded-button border border-border bg-card p-3">
        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <Bookmark className="size-3.5 text-amber-600" />
          Contoh usulan topik / judul riset baru
        </h4>
        <ul className="flex flex-col gap-1.5">
          {recommendation.proposedTitles.map((title) => (
            <li key={title} className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="break-words">{title}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button variant="outline" onClick={handleCopy} className="w-full gap-2 text-xs font-bold uppercase">
        {copied ? <Check className="text-status-green" /> : <Copy />}
        <span>{copied ? "Tersalin" : "Salin rekomendasi lengkap"}</span>
      </Button>
    </section>
  )
}
