import { useState } from "react"
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  GitBranch,
  Lightbulb,
  Compass,
  BookOpen,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import { ProjectSynthesisData } from "../utils/synthesisEngine"

export interface ProjectSynthesisCardProps {
  synthesis: ProjectSynthesisData
  projectName: string
  defaultOpen?: boolean
}

export function ProjectSynthesisCard({
  synthesis,
  projectName,
  defaultOpen = false,
}: ProjectSynthesisCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [copiedType, setCopiedType] = useState<"points" | "narrative" | null>(null)

  const handleCopyPoints = async () => {
    const lines: string[] = [
      `# SINTESIS RISET KOMPARATIF: ${projectName}`,
      "",
      "## 1. Persamaan Antar Paper:",
      ...synthesis.similarities.map((s) => `- ${s}`),
      "",
      "## 2. Perbedaan Pendekatan Metodologis:",
      ...synthesis.approachDifferences.map((d) => `- ${d}`),
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
      ...synthesis.paperPositions.map((pos) => `- ${pos.positionSummary}`),
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
    <div className="rounded-xl border border-primary/20 bg-linear-to-b from-primary/5 via-card to-card shadow-sm overflow-hidden transition-all mb-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 border-b bg-primary/5">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Kartu Sintesis AI Global Komparatif
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Multi-Paper Synthesis
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Sintesis komprehensif lintas-dokumen: persamaan, perbedaan, kesenjangan, dan naskah akademik formal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPoints}
            className="h-7 text-[11px] gap-1 px-2.5 cursor-pointer shadow-xs bg-background"
            title="Salin seluruh poin ringkasan sintesis"
          >
            {copiedType === "points" ? (
              <>
                <Check className="size-3 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="size-3 text-muted-foreground" />
                <span>Salin Poin</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleCopyNarrative}
            className="h-7 text-[11px] gap-1 px-2.5 cursor-pointer shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            title="Salin naskah narasi akademik formal bersitasi pengarang-tahun"
          >
            {copiedType === "narrative" ? (
              <>
                <Check className="size-3 text-white" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <FileCheck2 className="size-3" />
                <span>Salin Paragraf Akademik</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen((prev) => !prev)}
            className="size-7 cursor-pointer"
            title={isOpen ? "Ciutkan kartu sintesis" : "Perluas kartu sintesis"}
          >
            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-5 animate-in fade-in duration-150">
          {/* 1. Academic Narrative Box (Naskah Formal) */}
          <div className="rounded-xl border border-primary/20 bg-background p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-primary" />
                <span>Naskah Narasi Akademik Formal (Sitasi Penulis-Tahun):</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Siap Dikutip untuk Bab Tinjauan Pustaka
              </span>
            </div>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-normal">
              {synthesis.academicNarrative}
            </p>
          </div>

          {/* 2. Grid: Persamaan & Perbedaan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Similarities */}
            <div className="rounded-xl border bg-card p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Layers className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Persamaan Antar Paper (Similarities)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {synthesis.similarities.map((sim, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{sim}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Approach Differences */}
            <div className="rounded-xl border bg-card p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <GitBranch className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Perbedaan Pendekatan Metodologi</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {synthesis.approachDifferences.map((diff, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Grid: Pola Riset & Celah / Peluang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Research Patterns */}
            <div className="rounded-xl border bg-card p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Compass className="size-3.5 text-primary" />
                <span>Pola Riset yang Teridentifikasi</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {synthesis.researchPatterns.map((pat, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{pat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps and Opportunities */}
            <div className="rounded-xl border bg-card p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Lightbulb className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span>Kesenjangan & Peluang Riset Terbuka</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {synthesis.gapsAndOpportunities.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. Follow-up Research Ideas */}
          <div className="rounded-xl border bg-card p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Lightbulb className="size-3.5 text-primary" />
                <span>3 Rekomendasi Ide Penelitian Lanjutan (Berperingkat & Rasionil):</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Peluang Tesis / Disertasi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {synthesis.followUpIdeas.map((idea) => (
                <div
                  key={idea.rank}
                  className="rounded-lg border bg-secondary/20 p-3 space-y-1.5 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {idea.rank}
                    </span>
                    <h5 className="font-bold text-foreground leading-snug line-clamp-2">
                      {idea.title}
                    </h5>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                    {idea.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Paper Position Summary */}
          <div className="rounded-xl border bg-card p-4 space-y-2.5 shadow-2xs">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Compass className="size-3.5 text-primary" />
              <span>Posisi Spesifik Tiap Dokumen dalam Peta Literatur:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {synthesis.paperPositions.map((pos) => (
                <div key={pos.paperId} className="p-2.5 rounded-lg border bg-secondary/15 space-y-1">
                  <span className="font-bold text-primary text-[11px] block">{pos.citation}</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {pos.positionSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
