import { useState, useEffect } from "react"
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Sparkles,
  FileText,
  Quote,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import { useConceptMapStore } from "../store/useConceptMapStore"
import { GapValidationStatus } from "../types/conceptMapTypes"

interface GapDecisionModalProps {
  onSaveDecision: (
    gapId: string,
    status: GapValidationStatus,
    notes: string
  ) => void
}

export function GapDecisionModal({ onSaveDecision }: GapDecisionModalProps) {
  const { activeGapForDecision, decisionModalOpen, closeDecisionModal } =
    useConceptMapStore()

  const [selectedStatus, setSelectedStatus] =
    useState<GapValidationStatus>("accepted")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (activeGapForDecision) {
      setSelectedStatus(
        activeGapForDecision.validationStatus === "pending"
          ? "accepted"
          : activeGapForDecision.validationStatus
      )
      setNotes(activeGapForDecision.reviewerNotes || "")
    }
  }, [activeGapForDecision])

  if (!decisionModalOpen || !activeGapForDecision) {
    return null
  }

  const handleSave = () => {
    onSaveDecision(activeGapForDecision.id, selectedStatus, notes.trim())
    if (selectedStatus === "accepted") {
      toast.success(
        "Kandidat celah riset berhasil disetujui (Layak Diteliti) ke dalam agenda penelitian."
      )
    } else {
      toast.info(
        "Kandidat celah riset ditolak atau ditandai sebagai duplikasi/tidak relevan."
      )
    }
    closeDecisionModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-modal-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Lightbulb className="size-5" />
            </div>
            <div>
              <h3
                id="decision-modal-title"
                className="text-base font-bold text-foreground"
              >
                Tinjauan & Validasi Celah Riset
              </h3>
              <p className="text-xs text-muted-foreground">
                Tentukan kelayakan akademik kandidat celah novelty berdasarkan bukti empiris.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDecisionModal}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Tutup jendela"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Card Info Ringkasan Celah */}
          <div className="rounded-xl border border-border p-4 bg-secondary/15 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-primary uppercase tracking-wider text-[11px]">
                Kategori: {activeGapForDecision.gapCategory}
              </span>
              <span className="text-muted-foreground font-medium">
                Domain: {activeGapForDecision.domain}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground leading-snug">
                {activeGapForDecision.proposedTitle}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeGapForDecision.coreIssue}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-background/80 border border-border/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px]">
                <Sparkles className="size-3.5" />
                <span>Rekomendasi Solusi Pengganti:</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                {activeGapForDecision.concreteSolution}
              </p>
            </div>

            {/* Bukti Naskah */}
            {activeGapForDecision.evidenceQuote && (
              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
                  <Quote className="size-3" />
                  <span>Kutipan Bukti Naskah:</span>
                  {activeGapForDecision.pageNumber && (
                    <span className="ml-auto text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                      Halaman {activeGapForDecision.pageNumber}
                    </span>
                  )}
                </div>
                <p className="italic text-muted-foreground text-[11px] leading-relaxed">
                  &ldquo;{activeGapForDecision.evidenceQuote}&rdquo;
                </p>
              </div>
            )}

            {/* Paper Sumber */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <FileText className="size-3.5 shrink-0" />
              <span>Sumber:</span>
              <div className="flex flex-wrap gap-1">
                {activeGapForDecision.sourcePapers.map((p, idx) => (
                  <span
                    key={p.id || idx}
                    className="inline-block bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-foreground"
                  >
                    {p.title} ({p.year ?? "N/A"})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Opsi Keputusan */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-foreground block">
              Pilih Keputusan Validasi:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedStatus("accepted")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  selectedStatus === "accepted"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30"
                    : "border-border hover:bg-muted/50 text-foreground"
                }`}
              >
                <CheckCircle2
                  className={`size-5 mt-0.5 shrink-0 ${
                    selectedStatus === "accepted"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                />
                <div>
                  <h5 className="text-xs font-bold">Layak Diteliti (Accept)</h5>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    Celah riset orisinal, terbukti secara empiris belum terjawab, dan bernilai kontribusi tinggi.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus("rejected")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  selectedStatus === "rejected"
                    ? "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/30"
                    : "border-border hover:bg-muted/50 text-foreground"
                }`}
              >
                <XCircle
                  className={`size-5 mt-0.5 shrink-0 ${
                    selectedStatus === "rejected"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground"
                  }`}
                />
                <div>
                  <h5 className="text-xs font-bold">Ditolak / Duplikasi (Reject)</h5>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    Telah diselesaikan oleh paper lain, kontribusi terlalu marginal, atau di luar fokus riset.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Catatan Ilmiah Reviewer */}
          <div className="space-y-1.5">
            <label
              htmlFor="reviewer-notes"
              className="text-xs font-bold text-foreground flex items-center gap-1.5"
            >
              <MessageSquare className="size-3.5 text-primary" />
              <span>Catatan Ilmiah & Pertimbangan Akademik (Opsional):</span>
            </label>
            <textarea
              id="reviewer-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Sangat direkomendasikan untuk bab 1 usulan tesis. Variabel mediasi dapat ditambahkan sesuai rekomendasi naskah Smith et al..."
              className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <HelpCircle className="size-4" />
            <span>Keputusan dapat diubah sewaktu-waktu.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeDecisionModal}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Simpan Keputusan</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
