import { useState } from "react"
import {
  FileText,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import { ComparativeMatrixResponse } from "@/features/projects/api/projectsApi"
import {
  CitationStyle,
  formatBibliography,
  formatInTextCitation,
} from "../utils/citationFormatter"
import {
  calculateIntelligenceMetrics,
  generateIntelligenceReportJson,
} from "../utils/synthesisEngine"

export interface IntelligenceReportCardProps {
  matrixData: ComparativeMatrixResponse
  defaultOpen?: boolean
}

const CITATION_STYLES: Array<{ key: CitationStyle; label: string; desc: string }> = [
  { key: "apa", label: "APA 7th Edition", desc: "American Psychological Association (Author-Date)" },
  { key: "ieee", label: "IEEE Style", desc: "Institute of Electrical and Electronics Engineers (Numbered [1])" },
  { key: "harvard", label: "Harvard Style", desc: "Harvard Referencing Standard (Author-Date)" },
  { key: "vancouver", label: "Vancouver Style", desc: "International Committee of Medical Journal Editors (Numbered 1.)" },
  { key: "chicago", label: "Chicago Author-Date", desc: "The Chicago Manual of Style (17th Edition)" },
]

export function IntelligenceReportCard({
  matrixData,
  defaultOpen = false,
}: IntelligenceReportCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [activeStyle, setActiveStyle] = useState<CitationStyle>("apa")
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const metrics = calculateIntelligenceMetrics(matrixData)
  const papers = matrixData.papers || []

  const formattedCitations = papers.map((p, idx) => ({
    paper: p,
    citation: formatBibliography(p, activeStyle, idx + 1),
    inText: formatInTextCitation(p),
  }))

  const handleCopyAll = async () => {
    const text = formattedCitations.map((c) => c.citation).join("\n\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      toast.success(`Seluruh sitasi format ${activeStyle.toUpperCase()} berhasil disalin ke papan klip.`)
      setTimeout(() => setCopiedAll(false), 2500)
    } catch {
      toast.error("Gagal menyalin sitasi ke papan klip.")
    }
  }

  const handleCopySingle = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      toast.success("Kutipan sitasi berhasil disalin.")
      setTimeout(() => setCopiedIndex(null), 2500)
    } catch {
      toast.error("Gagal menyalin kutipan sitasi.")
    }
  }

  const handleDownloadJson = () => {
    const reportData = generateIntelligenceReportJson(matrixData)
    const jsonStr = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Laporan_Intelijen_${matrixData.project_name.replace(/\s+/g, "_")}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Berkas laporan intelijen JSON berhasil diunduh.")
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all mb-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 border-b bg-secondary/20">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
            <Award className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Kartu Laporan Intelijen & Bibliografi Riset
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Intelligence Engine
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Generator sitasi multi-format standar (APA, IEEE, Harvard, Vancouver, Chicago), profil bibliografi, dan metrik reliabilitas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJson}
            className="h-7 text-[11px] gap-1 px-2.5 cursor-pointer shadow-xs bg-background"
            title="Unduh seluruh laporan intelijen dalam format JSON"
          >
            <Download className="size-3 text-muted-foreground" />
            <span>Unduh JSON</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen((prev) => !prev)}
            className="size-7 cursor-pointer"
            title={isOpen ? "Ciutkan kartu laporan intelijen" : "Perluas kartu laporan intelijen"}
          >
            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-5 animate-in fade-in duration-150">
          {/* 1. Intelligence Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border bg-background space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium block">
                Total Relasi Teranalisis
              </span>
              <div className="flex items-center gap-1.5">
                <Layers className="size-4 text-primary" />
                <span className="text-base font-bold text-foreground font-mono">
                  {metrics.totalRelations}
                </span>
                <span className="text-[10px] text-muted-foreground">sel data</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-background space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium block">
                Komponen Terverifikasi
              </span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-base font-bold text-foreground font-mono">
                  {metrics.verifiedCount}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">diterima</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-background space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium block">
                Rata-Rata Confidence
              </span>
              <div className="flex items-center gap-1.5">
                <Award className="size-4 text-blue-600" />
                <span className="text-base font-bold text-foreground font-mono">
                  {metrics.avgConfidenceScore}%
                </span>
                <span className="text-[10px] text-muted-foreground">skor AI</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-background space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium block">
                Klaim Butuh Bukti
              </span>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-500" />
                <span className="text-base font-bold text-foreground font-mono">
                  {metrics.unsupportedClaimsCount}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  evaluasi
                </span>
              </div>
            </div>
          </div>

          {/* 2. Citation Format Selector & Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <BookOpen className="size-3.5 text-primary shrink-0 mr-1" />
                <span className="text-xs font-bold text-foreground shrink-0 mr-2">
                  Gaya Sitasi:
                </span>
                {CITATION_STYLES.map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setActiveStyle(st.key)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                      activeStyle === st.key
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                    title={st.desc}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="h-7 text-[11px] gap-1 px-2.5 shrink-0"
                title="Salin seluruh daftar pustaka"
              >
                {copiedAll ? (
                  <>
                    <Check className="size-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Semua Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3 text-muted-foreground" />
                    <span>Salin Semua Sitasi</span>
                  </>
                )}
              </Button>
            </div>

            {/* Citations List */}
            <div className="space-y-2">
              {formattedCitations.map(({ paper, citation, inText }, idx) => (
                <div
                  key={paper.id}
                  className="rounded-lg border bg-background p-3 space-y-1.5 text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                      <FileText className="size-3" />
                      <span className="font-bold text-foreground">Sitasi In-Text:</span>
                      <code className="bg-secondary px-1.5 py-0.5 rounded text-primary">
                        {inText}
                      </code>
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySingle(citation, idx)}
                      className="h-6 text-[10px] gap-1 px-2 cursor-pointer text-muted-foreground hover:text-foreground"
                      title="Salin sitasi paper ini"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="size-2.5 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-2.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="font-serif text-foreground leading-relaxed pl-2 border-l-2 border-primary/30 select-text">
                    {citation}
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
