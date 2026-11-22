import { useState } from "react"
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Lightbulb,
  Compass,
  BookOpen,
  Layers,
  Crown,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/lib/store/useToastStore"
import { cn } from "@/lib/utils"
import { ProjectSynthesisData } from "../utils/synthesisEngine"
import { MethodologyDifferencesSection } from "./MethodologyDifferencesSection"

export interface ProjectSynthesisCardProps {
  synthesis: ProjectSynthesisData
  projectName: string
  defaultOpen?: boolean
  isFreeUser?: boolean
  onTriggerUpgrade?: () => void
}

export function ProjectSynthesisCard({
  synthesis,
  projectName,
  defaultOpen = false,
  isFreeUser = false,
  onTriggerUpgrade,
}: ProjectSynthesisCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [copiedType, setCopiedType] = useState<"points" | "narrative" | null>(null)

  const handleCopyPoints = async () => {
    if (isFreeUser) {
      onTriggerUpgrade?.()
      toast.info("Fitur salin ringkasan sintesis komprehensif eksklusif untuk akun Student Pro.", 5000)
      return
    }

    const lines: string[] = [
      `# SINTESIS RISET KOMPARATIF: ${projectName}`,
      "",
      "## 1. Persamaan Antar Paper:",
      ...synthesis.similarities.map((s) => `- ${s}`),
      "",
      "## 2. Perbedaan Pendekatan Metodologis & Variabel Penelitian:",
      ...synthesis.methodologicalApproaches.map((item) => {
        const varList =
          item.variables.length > 0
            ? item.variables.map((v) => `    * [${v.categoryLabel}] ${v.name}`).join("\n")
            : "    * (Tidak ada variabel spesifik yang dicatat)"
        return `- ${item.citation} (${item.paperTitle}):\n  Pendekatan: "${item.methodologyFullText}"\n  Variabel:\n${varList}`
      }),
      "",
      "## 3. Pola Riset yang Teridentifikasi:",
      ...synthesis.researchPatterns.map((p) => `- ${p}`),
      "",
      "## 4. Kesenjangan & Peluang Riset:",
      ...synthesis.gapsAndOpportunities.map((g) => `- ${g}`),
      "",
      "## 5. Ide Penelitian Lanjutan:",
      ...synthesis.followUpIdeas.map(
        (idea) => `[Rank ${idea.rank}] ${idea.title}\nRasional: ${idea.rationale}`
      ),
      "",
      "## 6. Posisi Spesifik Tiap Paper:",
      ...synthesis.paperPositions.map((pos) => `- ${pos.citation}: ${pos.positionSummary}`),
    ]

    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      setCopiedType("points")
      toast.success("Poin-poin sintesis komparatif berhasil disalin ke papan klip.")
      setTimeout(() => setCopiedType(null), 2500)
    } catch {
      toast.error("Gagal menyalin poin sintesis ke papan klip.")
    }
  }

  const handleCopyNarrative = async () => {
    if (isFreeUser) {
      onTriggerUpgrade?.()
      toast.info("Fitur salin naskah narasi akademik formal eksklusif untuk akun Student Pro.", 5000)
      return
    }

    const fullText = [
      synthesis.academicNarrative,
      "",
      "DAFTAR PUSTAKA:",
      ...synthesis.bibliography,
    ].join("\n\n")

    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedType("narrative")
      toast.success("Paragraf akademik formal bersitasi berhasil disalin ke papan klip.")
      setTimeout(() => setCopiedType(null), 2500)
    } catch {
      toast.error("Gagal menyalin naskah akademik ke papan klip.")
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="group flex min-w-0 items-center gap-3 text-left"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-button bg-primary-soft text-primary">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                Sintesis AI Global Komparatif
              </h3>
              {isFreeUser && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  <Lock className="size-2.5" />
                  <span>Khusus Student Pro</span>
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Persamaan, perbedaan, kesenjangan, dan naskah akademik lintas paper dalam proyek ini.
            </p>
          </div>
        </button>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPoints}
            title={
              isFreeUser
                ? "Buka Student Pro untuk menyalin ringkasan sintesis"
                : "Salin seluruh poin ringkasan sintesis"
            }
          >
            {copiedType === "points" ? (
              <>
                <Check className="text-status-green" />
                <span className="text-status-green">Tersalin</span>
              </>
            ) : (
              <>
                {isFreeUser ? <Lock className="size-3.5 text-amber-500" /> : <Copy />}
                <span>Salin Poin</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleCopyNarrative}
            title={
              isFreeUser
                ? "Buka Student Pro untuk menyalin naskah akademik"
                : "Salin naskah narasi akademik formal bersitasi pengarang-tahun"
            }
          >
            {copiedType === "narrative" ? (
              <>
                <Check />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                {isFreeUser ? <Lock className="size-3.5" /> : <FileCheck2 />}
                <span>Salin Paragraf Akademik</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen((prev) => !prev)}
            title={isOpen ? "Ciutkan kartu sintesis" : "Perluas kartu sintesis"}
            aria-label={isOpen ? "Ciutkan kartu sintesis" : "Perluas kartu sintesis"}
          >
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-5 animate-in fade-in duration-150">
          {/* 1. Academic Narrative Box (Naskah Formal / Teaser) */}
          <div className="rounded-xl border border-primary/20 bg-background p-4 space-y-2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-primary" />
                <span>Naskah Narasi Akademik Formal (Sitasi Penulis-Tahun):</span>
              </span>
              {isFreeUser ? (
                <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                  <Lock className="size-3" /> Teaser Penggugah Minat
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground font-mono">
                  Siap Dikutip untuk Bab Tinjauan Pustaka
                </span>
              )}
            </div>
            <p
              className={cn(
                "text-xs text-foreground leading-relaxed whitespace-pre-wrap font-normal",
                isFreeUser && "line-clamp-2 select-none"
              )}
            >
              {synthesis.academicNarrative}
            </p>
          </div>

          {/* Tampilan Paywall jika Akun Free: Efek Blur + Kartu CTA Upgrade Pro */}
          {isFreeUser ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/10 p-6 min-h-[380px] flex items-center justify-center">
              {/* Blurred background teaser simulation */}
              <div className="absolute inset-0 filter blur-[5px] opacity-35 pointer-events-none select-none p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-28 rounded-card bg-card border border-border p-3" />
                  <div className="h-28 rounded-card bg-card border border-border p-3" />
                </div>
                <div className="h-28 rounded-card bg-card border border-border p-3" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-24 rounded-card bg-card border border-border p-3" />
                  <div className="h-24 rounded-card bg-card border border-border p-3" />
                  <div className="h-24 rounded-card bg-card border border-border p-3" />
                </div>
              </div>

              {/* Centered Paywall CTA Card */}
              <div className="relative z-10 flex flex-col items-center justify-center max-w-lg p-6 sm:p-8 bg-card/95 backdrop-blur-md rounded-2xl border border-primary/25 shadow-xl text-center">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3.5 shadow-inner">
                  <Crown className="size-6" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Buka Seluruh Sintesis AI Global Komparatif
                </h4>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Buka analisis komparatif komprehensif tanpa batas: komparasi perbedaan metodologi lengkap, ekstraksi seluruh variabel riset, penemuan celah riset (*research gaps*), serta 3 rekomendasi ide tesis/disertasi berperingkat.
                </p>
                <Button
                  onClick={onTriggerUpgrade}
                  size="sm"
                  className="mt-4 gap-2 px-5 py-2 font-semibold shadow-md hover:shadow-primary/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <Crown className="size-4" />
                  <span>Upgrade ke Student Pro Sekarang</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* 2. Grid: Persamaan & Pola Riset */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Similarities */}
                <div className="rounded-card border border-border bg-card p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Layers className="size-3.5 text-status-green" />
                    <span>Persamaan Antar Paper (Similarities)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {synthesis.similarities.map((sim, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="size-1.5 rounded-full bg-status-green mt-1.5 shrink-0" />
                        <span>{sim}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Research Patterns */}
                <div className="rounded-card border border-border bg-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Compass className="size-3.5 text-primary" />
                      <span>Pola Riset yang Teridentifikasi</span>
                    </div>
                    <span className="text-[10px] font-semibold text-primary font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      Data Riil Paper Proyek
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {synthesis.researchPatterns.map((pat, idx) => {
                      const colonIndex = pat.indexOf(":")
                      const hasPrefix = colonIndex > 0 && colonIndex < 45
                      return (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>
                            {hasPrefix ? (
                              <>
                                <strong className="font-semibold text-foreground">
                                  {pat.slice(0, colonIndex + 1)}
                                </strong>{" "}
                                {pat.slice(colonIndex + 1).trim()}
                              </>
                            ) : (
                              pat
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              {/* 3. Perbedaan Pendekatan Metodologi & Variabel Penelitian (Render Komprehensif Seluruh Variabel & Metodologi) */}
              <MethodologyDifferencesSection
                approaches={synthesis.methodologicalApproaches}
              />

              {/* 4. Gaps and Opportunities */}
              <div className="rounded-card border border-border bg-card p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Lightbulb className="size-3.5 text-status-orange" />
                  <span>Kesenjangan &amp; Peluang Riset Terbuka</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {synthesis.gapsAndOpportunities.map((gap, idx) => {
                    const colonIndex = gap.indexOf(":")
                    const hasPrefix = colonIndex > 0 && colonIndex < 80
                    return (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="size-1.5 rounded-full bg-status-orange mt-1.5 shrink-0" />
                        <span>
                          {hasPrefix ? (
                            <>
                              <strong className="font-semibold text-foreground">
                                {gap.slice(0, colonIndex + 1)}
                              </strong>{" "}
                              {gap.slice(colonIndex + 1).trim()}
                            </>
                          ) : (
                            gap
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* 5. Follow-up Research Ideas */}
              <div className="rounded-card border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lightbulb className="size-3.5 text-primary" />
                    <span>3 Rekomendasi Ide Penelitian Lanjutan (Berperingkat & Rasionil):</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">Peluang Tesis / Disertasi</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {synthesis.followUpIdeas.map((idea) => (
                    <div
                      key={idea.rank}
                      className="rounded-lg border bg-secondary/20 p-3.5 space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                          {idea.rank}
                        </span>
                        <h5 className="font-bold text-foreground leading-snug">
                          {idea.title}
                        </h5>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1.5 border-t border-border/40">
                        {idea.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Paper Position Summary */}
              <div className="rounded-card border border-border bg-card p-4 space-y-2.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Compass className="size-3.5 text-primary" />
                  <span>Posisi Spesifik Tiap Dokumen dalam Peta Literatur:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {synthesis.paperPositions.map((pos) => (
                    <div key={pos.paperId} className="p-2.5 rounded-lg border bg-secondary/15 space-y-1">
                      <span className="font-bold text-primary text-xs block">{pos.citation}</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {pos.positionSummary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  )
}
