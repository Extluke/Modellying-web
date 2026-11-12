import { useEffect, useState } from "react"
import { Check, Copy, Lightbulb, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import type { AiResearchSynthesis } from "../types/knowledgeGraphTypes"

interface SynthesisResultDialogProps {
  synthesis: AiResearchSynthesis
  gapLabel: string
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  )
}

function toPlainText(synthesis: AiResearchSynthesis): string {
  return [
    "USULAN JUDUL",
    ...synthesis.usulan_judul.map((item, index) => `${index + 1}. ${item}`),
    "",
    "PERTANYAAN PENELITIAN",
    ...synthesis.rumusan_masalah.map((item, index) => `${index + 1}. ${item}`),
    "",
    "PERNYATAAN NOVELTY",
    synthesis.pernyataan_novelty,
    "",
    "ALASAN PEMILIHAN",
    synthesis.alasan_pemilihan,
  ].join("\n")
}

/** Result of "Buat Rumusan Masalah (AI)": same four sections as the mobile app. */
export function SynthesisResultDialog({ synthesis, gapLabel, onClose }: SynthesisResultDialogProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(synthesis))
      setCopied(true)
      toast.success("Rumusan masalah berhasil disalin ke papan klip.")
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Rumusan masalah belum dapat disalin. Coba lagi.")
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rumusan masalah hasil sintesis"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-modal border border-border bg-card shadow-floating animate-in zoom-in-95 duration-150"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-button bg-primary-soft text-primary">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Rumusan Masalah (Hasil Sintesis)</h2>
              <p className="line-clamp-2 break-words text-xs text-muted-foreground" title={gapLabel}>
                Berdasarkan celah: {gapLabel}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Tutup" aria-label="Tutup">
            <X />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <Section title="Usulan judul">
            <ol className="flex flex-col gap-2">
              {synthesis.usulan_judul.map((title, index) => (
                <li key={index} className="flex items-start gap-3 rounded-button border border-border bg-muted/30 p-3 text-xs">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="break-words font-medium leading-relaxed text-foreground">{title}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Pertanyaan penelitian">
            <ul className="flex flex-col gap-2">
              {synthesis.rumusan_masalah.map((question, index) => (
                <li key={index} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="break-words">{question}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Pernyataan novelty">
            <p className="break-words rounded-button border border-primary/20 bg-primary-soft p-3 text-xs leading-relaxed text-foreground">
              {synthesis.pernyataan_novelty}
            </p>
          </Section>

          <Section title="Alasan pemilihan">
            <p className="break-words text-xs leading-relaxed text-foreground">{synthesis.alasan_pemilihan}</p>
          </Section>

          <p className="flex items-start gap-2 rounded-button bg-status-orange-soft p-3 text-xs leading-relaxed text-muted-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-status-orange" />
            <span>Hasil ini adalah draf dari AI. Periksa kembali kesesuaiannya dengan paper sumber sebelum dipakai.</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="text-status-green" /> : <Copy />}
            <span>{copied ? "Tersalin" : "Salin"}</span>
          </Button>
          <Button size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
