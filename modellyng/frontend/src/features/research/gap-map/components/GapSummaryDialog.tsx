import { useEffect } from "react"
import { CheckCircle2, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GapItem } from "../utils/gapItems"

interface GapSummaryDialogProps {
  gap: GapItem
  onClose: () => void
}

function SectionTitle({ className, children }: { className: string; children: React.ReactNode }) {
  return <h3 className={`text-[11px] font-bold uppercase tracking-wide ${className}`}>{children}</h3>
}

/** "Summary Gap & Rekomendasi": closing recap shown after the user presses SELESAI. */
export function GapSummaryDialog({ gap, onClose }: GapSummaryDialogProps) {
  const { recommendation } = gap

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Summary Gap dan Rekomendasi"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-modal border border-border bg-card shadow-floating animate-in zoom-in-95 duration-150"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-4">
          <CheckCircle2 className="size-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-foreground">Summary Gap &amp; Rekomendasi</h2>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <p className="flex items-center gap-2 rounded-button border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-foreground">
            <Flag className="size-4 shrink-0 text-emerald-600" />
            Selamat anda sudah berada di akhir
          </p>

          <section className="flex flex-col gap-1.5">
            <SectionTitle className="text-muted-foreground">Kutipan gap yang di-klik:</SectionTitle>
            <p className="break-words rounded-button border border-border bg-background p-3 text-xs font-semibold italic leading-relaxed text-foreground">
              &ldquo;{gap.statement}&rdquo;
            </p>
          </section>

          <section className="flex flex-col gap-1.5">
            <SectionTitle className="text-emerald-700 dark:text-emerald-300">
              Hasil rekomendasi (apa yang bisa dilakukan user):
            </SectionTitle>
            <p className="break-words text-xs font-bold leading-relaxed text-emerald-900 dark:text-emerald-100">
              {recommendation.concreteSolution}
            </p>
            <p className="break-words text-xs leading-relaxed text-foreground">{recommendation.whatUserCanDo}</p>
          </section>

          <section className="flex flex-col gap-1.5">
            <SectionTitle className="text-primary">Bagaimana kelanjutannya (roadmap riset):</SectionTitle>
            <ul className="flex flex-col gap-1.5">
              {recommendation.roadmapSteps.map((step) => (
                <li key={step} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="break-words">{step}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border px-5 py-3">
          <Button onClick={onClose} className="bg-emerald-600 text-white hover:bg-emerald-700">
            OK / Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
