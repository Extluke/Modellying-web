import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Quote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GapCandidateItem } from "../types/conceptMapTypes"

interface GapCandidateCardProps {
  gap: GapCandidateItem
  onOpenDecision: (gap: GapCandidateItem) => void
}

export function GapCandidateCard({ gap, onOpenDecision }: GapCandidateCardProps) {
  const isAccepted = gap.validationStatus === "accepted"
  const isRejected = gap.validationStatus === "rejected"

  return (
    <div
      className={`rounded-2xl border p-5 shadow-2xs space-y-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xs ${
        isAccepted
          ? "bg-emerald-500/[0.02] border-emerald-500/30"
          : isRejected
          ? "bg-rose-500/[0.02] border-rose-500/30"
          : "bg-card border-border"
      }`}
    >
      <div className="space-y-3">
        {/* Header: Domain, Source Tag, & Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <Lightbulb className="size-3" />
              <span>{gap.gapCategory}</span>
            </span>
            <h4 className="text-xs font-bold text-foreground leading-snug">
              {gap.domain}
            </h4>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
              isAccepted
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                : isRejected
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
            }`}
          >
            {isAccepted ? (
              <>
                <CheckCircle2 className="size-3 text-emerald-600" />
                <span>Layak Diteliti</span>
              </>
            ) : isRejected ? (
              <>
                <XCircle className="size-3 text-destructive" />
                <span>Ditolak</span>
              </>
            ) : (
              <>
                <AlertTriangle className="size-3 text-amber-600" />
                <span>Perlu Tinjauan</span>
              </>
            )}
          </span>
        </div>

        {/* Core Issue */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Akar Masalah Ilmiah (Core Issue):
          </span>
          <p className="text-xs text-foreground leading-relaxed">
            {gap.coreIssue}
          </p>
        </div>

        {/* Concrete Solution */}
        <div className="p-3 rounded-xl border bg-secondary/20 space-y-1">
          <span className="text-[10px] font-bold text-primary flex items-center gap-1">
            <Sparkles className="size-3" />
            <span>Rekomendasi Solusi Pengganti:</span>
          </span>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {gap.concreteSolution}
          </p>
        </div>

        {/* Proposed Title */}
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold text-muted-foreground block">
            Usulan Judul Tesis:
          </span>
          <p className="text-xs font-semibold text-foreground italic leading-snug">
            &ldquo;{gap.proposedTitle}&rdquo;
          </p>
        </div>

        {/* Evidence Quote if exists */}
        {gap.evidenceQuote && (
          <div className="p-2.5 rounded-lg border bg-muted/15 space-y-1 text-[11px]">
            <div className="flex items-center gap-1 font-bold text-[10px] text-muted-foreground">
              <Quote className="size-2.5" />
              <span>Bukti Naskah:</span>
              {gap.pageNumber && (
                <span className="ml-auto font-mono text-[9px] bg-secondary px-1.5 py-0.2 rounded">
                  Hal. {gap.pageNumber}
                </span>
              )}
            </div>
            <p className="italic text-muted-foreground line-clamp-2">
              &ldquo;{gap.evidenceQuote}&rdquo;
            </p>
          </div>
        )}

        {/* Reviewer Note if available */}
        {gap.reviewerNotes && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-900 dark:text-emerald-200">
            <span className="font-bold block text-[10px]">Catatan Ilmiah Reviewer:</span>
            <span>{gap.reviewerNotes}</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="size-3" />
            <span>{gap.sourcePapers.length} Paper Terkait</span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {gap.noveltyScore}
          </span>
        </div>

        <Button
          size="sm"
          variant={isAccepted ? "default" : "outline"}
          onClick={() => onOpenDecision(gap)}
          className="w-full text-xs h-8 gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="size-3.5" />
          <span>{isAccepted ? "Ubah Keputusan Reviewer" : "Tinjau & Validasi Celah"}</span>
        </Button>
      </div>
    </div>
  )
}
