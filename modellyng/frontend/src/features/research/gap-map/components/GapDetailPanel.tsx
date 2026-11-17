import { BookOpen, CheckCircle2, Loader2, Quote, ShieldCheck, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { GraphEvidence } from "@/features/research/knowledge-graph/types/knowledgeGraphTypes"
import { GAP_TYPOLOGY_LABEL } from "@/features/research/knowledge-graph/utils/graphMeta"
import { confidencePercent, formatGapNumber, type GapItem } from "../utils/gapItems"
import { GapRecommendationCard } from "./GapRecommendationCard"

interface GapDetailPanelProps {
  gap: GapItem
  isSynthesizing: boolean
  onClose: () => void
  onFinish: () => void
  onSynthesize: () => void
  onOpenEvidence: (evidence: GraphEvidence) => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-extrabold uppercase tracking-wide text-foreground">{children}</h3>
}

/**
 * Detail of one research gap. A side panel on desktop and a bottom sheet on small screens
 * (mobile: draggable "GAP DETAIL" sheet).
 */
export function GapDetailPanel({
  gap,
  isSynthesizing,
  onClose,
  onFinish,
  onSynthesize,
  onOpenEvidence,
}: GapDetailPanelProps) {
  const percent = confidencePercent(gap.confidence)
  const firstEvidence = gap.evidence[0]

  return (
    <>
      {/* Backdrop only dims the page on small screens, desktop keeps the canvas usable */}
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden" onClick={onClose} aria-hidden="true" />

      <aside
        role="dialog"
        aria-label={`Detail ${formatGapNumber(gap.number)}`}
        className={cn(
          "fixed z-40 flex flex-col overflow-hidden border-border bg-card shadow-floating animate-in duration-200",
          "inset-x-0 bottom-0 h-[88%] rounded-t-card border-t slide-in-from-bottom",
          "md:inset-x-auto md:inset-y-0 md:right-0 md:h-auto md:w-[480px] md:rounded-none md:border-l md:border-t-0 md:slide-in-from-right"
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h2
            className="line-clamp-3 break-words text-sm font-bold uppercase leading-snug tracking-wide text-primary"
            title={gap.label}
          >
            Gap detail: {gap.label}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Tutup" aria-label="Tutup detail gap">
            <X />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <section className="flex flex-col gap-2">
            <SectionTitle>Gap statement</SectionTitle>
            <p className="break-words rounded-card border border-border bg-background p-4 text-sm font-semibold italic leading-relaxed text-foreground">
              &ldquo;{gap.statement}&rdquo;
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <SectionTitle>Jenis gap</SectionTitle>
            <p className="rounded-button border border-primary/15 bg-primary-soft/50 p-3 text-sm font-extrabold uppercase text-primary-soft-foreground">
              {gap.typology ? GAP_TYPOLOGY_LABEL[gap.typology] : "Relasi konsep belum diteliti"}
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" className="gap-1.5 rounded-full px-3 py-1.5 text-[11px]">
              <ShieldCheck className="size-3.5" />
              {percent === null ? "CONFIDENCE BELUM TERSEDIA" : `CONFIDENCE ${percent}%`}
            </Badge>
            <Badge variant="review" className="gap-1.5 rounded-full px-3 py-1.5 text-[11px]">
              Perlu ditinjau
            </Badge>
          </div>

          <GapRecommendationCard gapLabel={gap.label} recommendation={gap.recommendation} />

          <section className="flex flex-col gap-3">
            <SectionTitle>Bukti pendukung</SectionTitle>
            {gap.evidence.length === 0 ? (
              <p className="rounded-button border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Belum ada kutipan bukti untuk gap ini.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {gap.evidence.map((item, index) => (
                  <li
                    key={`${item.paperId}-${item.blockId ?? index}-${index}`}
                    className="flex flex-col gap-2 rounded-card border border-border bg-card p-3.5"
                  >
                    <p className="break-words text-xs font-bold leading-snug text-foreground">{item.paperTitle}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-semibold">Ditemukan pada: </span>
                      {item.section ?? "-"} &middot; Hal. {item.pageNumber ?? "-"}
                    </p>
                    <div className="flex items-start gap-2 rounded-button border-l-4 border-primary/50 bg-muted/40 p-2.5">
                      <Quote className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <p className="break-words text-xs italic leading-relaxed text-foreground">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEvidence(item)}
                      className="h-8 self-end gap-1.5 px-2.5 text-primary hover:text-primary"
                    >
                      <BookOpen />
                      <span>Lihat di PDF</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 py-3">
          <Button onClick={onFinish} className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <CheckCircle2 />
            <span>SELESAI</span>
          </Button>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button onClick={onSynthesize} disabled={isSynthesizing} className="gap-2">
              {isSynthesizing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span>{isSynthesizing ? "MENYUSUN..." : "SINTESIS RISET (AI)"}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => firstEvidence && onOpenEvidence(firstEvidence)}
              disabled={!firstEvidence}
              className="gap-2"
            >
              <BookOpen />
              <span>BACA PAPER SUMBER</span>
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Hasil AI berupa draf. Tinjau kembali sebelum dipakai pada proposal Anda.
          </p>
        </div>
      </aside>
    </>
  )
}
