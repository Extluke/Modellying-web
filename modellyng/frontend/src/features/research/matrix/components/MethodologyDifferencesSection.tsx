import { useMemo, useState } from "react"
import {
  GitBranch,
  Cpu,
  Sliders,
  Copy,
  Check,
  Filter,
  Sparkles,
  BookOpen,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"
import {
  type ClassifiedVariable,
  type MethodologicalApproachItem,
  type VariableCategory,
  VARIABLE_CATEGORIES,
} from "../utils/variableClassifier"

export interface MethodologyDifferencesSectionProps {
  approaches: MethodologicalApproachItem[]
}

export function MethodologyDifferencesSection({
  approaches,
}: MethodologyDifferencesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | VariableCategory>("all")
  const [copiedVarId, setCopiedVarId] = useState<string | null>(null)

  // Compute counts per category across all papers
  const categoryCounts = useMemo(() => {
    const counts: Record<VariableCategory, number> = {
      independent: 0,
      dependent: 0,
      moderator: 0,
      control: 0,
      general: 0,
    }
    approaches.forEach((approach) => {
      approach.variables.forEach((v) => {
        counts[v.category]++
      })
    })
    return counts
  }, [approaches])

  const totalVariables = useMemo(
    () => Object.values(categoryCounts).reduce((sum, c) => sum + c, 0),
    [categoryCounts]
  )

  const handleCopyVariable = async (variable: ClassifiedVariable) => {
    try {
      await navigator.clipboard.writeText(variable.name)
      setCopiedVarId(variable.id)
      toast.success(
        `Variabel "${variable.name}" (${variable.categoryLabel}) berhasil disalin ke papan klip.`
      )
      setTimeout(() => setCopiedVarId(null), 2500)
    } catch {
      toast.error("Gagal menyalin nama variabel ke papan klip.")
    }
  }

  return (
    <div className="rounded-card border border-border bg-card p-4 sm:p-5 space-y-4">
      {/* 1. Header Bar: Title, Description, and Category Filter Tabs */}
      <div className="flex flex-col gap-3 border-b border-border/70 pb-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-status-blue/10 text-status-blue">
              <GitBranch className="size-4" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Perbedaan Pendekatan Metodologi &amp; Taksonomi Variabel
            </h4>
            <Badge variant="outline" className="text-[10px] font-semibold py-0 px-2 text-muted-foreground">
              {approaches.length} Paper
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Perbandingan menyeluruh paradigma metodologis, prosedur teknis, dan variabel penelitian
            (bebas, terikat, moderator, kontrol) tanpa pemotongan teks.
          </p>
        </div>

        {/* Filter Pills for Interactive Badges */}
        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="size-3 text-primary" />
            <span>Filter Kategori:</span>
          </span>

          {/* All Button */}
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted border-border/60"
            }`}
          >
            <span>Semua</span>
            <span className="rounded-full bg-background/20 px-1 py-0.2 text-[10px]">
              {totalVariables}
            </span>
          </button>

          {/* Category-Specific Pills */}
          {(Object.keys(VARIABLE_CATEGORIES) as VariableCategory[]).map((catKey) => {
            const count = categoryCounts[catKey]
            if (count === 0 && selectedCategory !== catKey) return null
            const meta = VARIABLE_CATEGORIES[catKey]
            const isSelected = selectedCategory === catKey

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? "all" : catKey)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                  isSelected
                    ? meta.pillActiveClass
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 border-border/60"
                }`}
                title={meta.description}
              >
                <span>{meta.shortLabel}</span>
                <span
                  className={`rounded-full px-1 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. List of Papers with Comprehensive Methodology & Interactive Variables */}
      <div className="space-y-4">
        {approaches.map((item) => {
          const visibleVariables =
            selectedCategory === "all"
              ? item.variables
              : item.variables.filter((v) => v.category === selectedCategory)

          return (
            <div
              key={item.paperId}
              className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3.5 transition-shadow hover:shadow-xs"
            >
              {/* Paper Identification Row */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/40 pb-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    {item.citation}
                  </span>
                  <h5 className="font-semibold text-xs text-foreground leading-snug">
                    {item.paperTitle}
                  </h5>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 font-medium">
                  <BookOpen className="size-3 text-muted-foreground" />
                  <span>{item.year ? `Tahun ${item.year}` : "Tahun n.d."}</span>
                </div>
              </div>

              {/* A. Full Methodology Description (TANPA PEMOTONGAN TEKS) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  <Cpu className="size-3.5 text-status-blue" />
                  <span>Pendekatan &amp; Prosedur Metodologi:</span>
                </div>
                <div className="rounded-lg border border-border/60 bg-card p-3">
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-normal">
                    {item.methodologyFullText}
                  </p>
                </div>
              </div>

              {/* B. Research Variables (Tag Badge Interaktif Tanpa Pemotongan Teks) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    <Sliders className="size-3.5 text-status-green" />
                    <span>Variabel Penelitian Teridentifikasi:</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {visibleVariables.length} dari {item.variables.length} variabel
                    {selectedCategory !== "all" && " (filtered)"}
                  </span>
                </div>

                {item.variables.length === 0 ? (
                  <div className="p-2.5 rounded-md border border-dashed border-border text-xs text-muted-foreground italic bg-muted/20">
                    Tidak ada variabel spesifik yang diekstraksi secara eksplisit pada naskah ini.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {item.variables.map((variable) => {
                      const isMatch =
                        selectedCategory === "all" || variable.category === selectedCategory
                      const isCopied = copiedVarId === variable.id

                      return (
                        <button
                          key={variable.id}
                          type="button"
                          onClick={() => handleCopyVariable(variable)}
                          title={`${variable.categoryLabel}: "${variable.name}" - ${variable.description || "Klik untuk menyalin"}`}
                          className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-left transition-all ${
                            variable.badgeColorClass
                          } ${
                            isMatch
                              ? "opacity-100 scale-100 hover:shadow-xs active:scale-98"
                              : "opacity-35 scale-95"
                          }`}
                        >
                          {/* Category Tag Prefix */}
                          <span className="font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-background/50 border border-current/20">
                            {variable.categoryShortLabel}
                          </span>

                          {/* Variable Name (Full Text, No Truncation, Wraps Cleanly) */}
                          <span className="font-semibold text-xs whitespace-normal break-words max-w-full">
                            {variable.name}
                          </span>

                          {/* Copy status icon */}
                          <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isCopied ? (
                              <Check className="size-3 text-status-green" />
                            ) : (
                              <Copy className="size-3 text-muted-foreground" />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. Taxonomy Legend & Educational Hint */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold flex items-center gap-1 text-foreground">
            <Sparkles className="size-3 text-primary" />
            <span>Keterangan Taksonomi:</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-blue-600" />
            <span>Bebas (Independen)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>Terikat (Dependen)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-600" />
            <span>Moderator / Mediasi</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-purple-600" />
            <span>Kontrol</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-slate-500" />
            <span>Konsep Operasional</span>
          </span>
        </div>
        <span className="italic">
          * Klik pada badge variabel mana pun untuk menyalin namanya secara instan.
        </span>
      </div>
    </div>
  )
}
