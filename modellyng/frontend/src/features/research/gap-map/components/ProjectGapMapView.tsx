import { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Compass,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  XCircle,
  GitBranch,
  Layers,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjects, useComparativeMatrix } from "@/features/projects/api/projectsApi"
import { toast } from "@/lib/store/useToastStore"
import { useGapMapStore } from "../store/useGapMapStore"
import { buildResearchFlowGraph } from "../utils/flowDataBuilder"
import { ResearchFlowCanvas } from "./ResearchFlowCanvas"
import { FourStageActionCard } from "./FourStageActionCard"

export interface ProjectGapMapViewProps {
  projectId: string
  onBackToProjects: () => void
}

interface GapItem {
  id: string
  domain: string
  sourceType: "limitations" | "pairwise"
  status: "accepted" | "needs_review" | "rejected"
  coreIssue: string
  concreteSolution: string
  proposedTitle: string
  noveltyScore: "Tinggi (High Impact)" | "Sedang (Medium Impact)"
  sourcePaperTitles: string[]
}

export function ProjectGapMapView({ projectId, onBackToProjects }: ProjectGapMapViewProps) {
  const [, setSearchParams] = useSearchParams()
  const { data: projectList = [] } = useProjects({ status: "active" })
  const { data: matrixData } = useComparativeMatrix(projectId)
  const { activeWorkspaceTab, setActiveWorkspaceTab } = useGapMapStore()

  const currentProject = projectList.find((p) => p.id === projectId)
  const projectName = currentProject?.name || matrixData?.project_name || "Proyek Riset"

  // Pembangun dataset graf alur riset 4 tahap terpadu
  const graphData = useMemo(() => {
    return buildResearchFlowGraph(matrixData)
  }, [matrixData])

  // Segmentation and Filters untuk Tab List View
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<"all" | "limitations" | "pairwise">("all")

  // Data awal kandidat celah analitis
  const [gaps, setGaps] = useState<GapItem[]>([
    {
      id: "gap-1",
      domain: "Efisiensi Komputasi & Model Hibrida",
      sourceType: "pairwise",
      status: "accepted",
      coreIssue:
        "Belum ada mekanisme attention adaptif yang mampu bekerja sub-kuadratik pada konteks panjang di perangkat komputasi terbatas.",
      concreteSolution:
        "Mengintegrasikan State Space Models (Mamba) dengan Sparse Attention berbasis bobot entropi kalimat.",
      proposedTitle:
        "Arsitektur Hibrida State-Space Attention untuk Komputasi Dokumen Ilmiah Berkonteks Panjang pada Edge Device",
      noveltyScore: "Tinggi (High Impact)",
      sourcePaperTitles: ["Studi Komparasi Attention", "Eksplorasi Algoritma Transformer"],
    },
    {
      id: "gap-2",
      domain: "Kekurangan Korpus Bahasa Spesifik",
      sourceType: "limitations",
      status: "needs_review",
      coreIssue:
        "Keterbatasan generalisasi model pra-pelatihan yang didominasi oleh korpus bahasa berdaya tinggi (high-resource languages).",
      concreteSolution:
        "Penerapan Cross-Lingual Knowledge Distillation dengan data augmentation berdasar semantik blok teks.",
      proposedTitle:
        "Distilasi Pengetahuan Lintas-Bahasa untuk Analisis Literatur Akademik Berbahasa Indonesia",
      noveltyScore: "Sedang (Medium Impact)",
      sourcePaperTitles: ["Analisis Keterbatasan Korpus Ilmiah"],
    },
    {
      id: "gap-3",
      domain: "Ketertelusuran Bukti & Verifikasi Deterministik",
      sourceType: "pairwise",
      status: "accepted",
      coreIssue:
        "Tingginya risiko halusinasi generative AI dalam mengekstraksi parameter metodologis tanpa pembuktian koordinat kanonik.",
      concreteSolution:
        "Implementasi Multi-Tier Normalized Text Matching dengan fallback bounding-box fuzzy verification.",
      proposedTitle:
        "Kerangka Kerja Verifikasi Deterministik Multi-Tahap untuk Mencegah Halusinasi Model Bahasa Besar",
      noveltyScore: "Tinggi (High Impact)",
      sourcePaperTitles: ["Audit Bukti Kanonik", "Evaluasi Keandalan LLM"],
    },
  ])

  const handleUpdateStatus = (gapId: string, newStatus: "accepted" | "rejected") => {
    setGaps((prev) =>
      prev.map((g) => (g.id === gapId ? { ...g, status: newStatus } : g))
    )
    if (newStatus === "accepted") {
      toast.success("Celah penelitian ditandai sebagai Layak Diteliti (Accepted).")
    } else {
      toast.info("Celah penelitian ditolak (Rejected).")
    }
  }

  const handleSynthesizeAi = () => {
    toast.success("AI sedang menyintesis kandidat celah baru dari keterbatasan dokumen paper...")
  }

  const filteredGaps = gaps.filter((g) => {
    if (selectedSourceFilter === "all") return true
    return g.sourceType === selectedSourceFilter
  })

  const acceptedCount = gaps.filter((g) => g.status === "accepted").length

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
      {/* Top Header Bar */}
      <div className="border-b bg-card px-4 sm:px-8 py-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToProjects}
            className="h-8 text-xs gap-1.5 cursor-pointer"
            title="Kembali ke Katalog Pemilihan Proyek Gap Map"
          >
            <ArrowLeft className="size-3.5" />
            <span>Pilih Proyek Lain</span>
          </Button>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary" />
            <h1 className="text-sm font-bold text-foreground truncate max-w-sm" title={projectName}>
              {projectName}
            </h1>
            {currentProject && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0 font-mono">
                {currentProject.ready_count} Paper Siap
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Project Switcher */}
        <div className="flex items-center gap-2">
          {projectList.length > 1 && (
            <select
              value={projectId}
              onChange={(e) => setSearchParams({ projectId: e.target.value })}
              className="h-8 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.ready_count} Siap)
                </option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            onClick={handleSynthesizeAi}
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
          >
            <Sparkles className="size-3.5" />
            <span>Sintesis Celah Baru dengan AI</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* Gap Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border bg-card space-y-1 shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-medium block">
              Total Simpul Alur Riset
            </span>
            <div className="flex items-center gap-1.5">
              <GitBranch className="size-4 text-primary" />
              <span className="text-lg font-bold text-foreground font-mono">
                {graphData.nodes.length}
              </span>
              <span className="text-[10px] text-muted-foreground">simpul 4 tahap</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-card space-y-1 shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-medium block">
              Fokus Bersama (&ge; 2 Paper)
            </span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="text-lg font-bold text-emerald-600 font-mono">
                {graphData.metrics.sharedCount}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">simpul hijau</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-card space-y-1 shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-medium block">
              Celah Riset Langka (Novelty)
            </span>
            <div className="flex items-center gap-1.5">
              <Target className="size-4 text-rose-600" />
              <span className="text-lg font-bold text-rose-600 font-mono">
                {graphData.metrics.gapCount}
              </span>
              <span className="text-[10px] text-rose-600 font-medium">simpul merah</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-card space-y-1 shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-medium block">
              Celah Tervalidasi (Accepted)
            </span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              <span className="text-lg font-bold text-foreground font-mono">{acceptedCount}</span>
              <span className="text-[10px] text-muted-foreground">kandidat</span>
            </div>
          </div>
        </div>

        {/* Primary Workspace Tab Switcher (Kanvas Alur Riset vs Daftar Celah) */}
        <div className="flex items-center justify-between border-b pb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveWorkspaceTab("canvas")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === "canvas"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <GitBranch className="size-3.5" />
              <span>Kanvas Alur Riset (React Flow)</span>
              <span className="ml-1 text-[10px] font-mono opacity-85 px-1.5 py-0.2 bg-black/15 dark:bg-white/15 rounded-full">
                {graphData.nodes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab("list")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === "list"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5" />
              <span>Daftar Kandidat Celah (List View)</span>
              <span className="ml-1 text-[10px] font-mono opacity-85 px-1.5 py-0.2 bg-black/15 dark:bg-white/15 rounded-full">
                {gaps.length}
              </span>
            </button>
          </div>

          <span className="text-xs text-muted-foreground italic hidden md:inline">
            {activeWorkspaceTab === "canvas"
              ? "Klik simpul pada kanvas untuk menelaah kutipan bukti dan naskah primer."
              : "Validasi usulan celah penelitian dan judul tesis potensial."}
          </span>
        </div>

        {/* TAB 1: KANVAS ALUR RISET (REACT FLOW) */}
        {activeWorkspaceTab === "canvas" && (
          <div className="space-y-6">
            {/* Interactive React Flow Canvas */}
            <ResearchFlowCanvas graphData={graphData} />

            {/* 4-Stage Strategic Action Recommendations */}
            <FourStageActionCard recommendations={graphData.recommendations} />
          </div>
        )}

        {/* TAB 2: DAFTAR KANDIDAT CELAH (LIST VIEW) */}
        {activeWorkspaceTab === "list" && (
          <div className="space-y-6">
            {/* Source Filter Tabs */}
            <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto text-xs">
              <span className="text-muted-foreground font-medium shrink-0 mr-1">Sumber Celah:</span>
              <button
                onClick={() => setSelectedSourceFilter("all")}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedSourceFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Sumber ({gaps.length})
              </button>
              <button
                onClick={() => setSelectedSourceFilter("limitations")}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedSourceFilter === "limitations"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Keterbatasan & Future Work
              </button>
              <button
                onClick={() => setSelectedSourceFilter("pairwise")}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedSourceFilter === "pairwise"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Perbandingan Berpasangan Lintas-Paper
              </button>
            </div>

            {/* Gaps List Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredGaps.map((gap) => (
                <div
                  key={gap.id}
                  className="rounded-2xl border bg-card p-5 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-2.5">
                    {/* Domain & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Lightbulb className="size-3.5" />
                        <span>{gap.domain}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          gap.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : gap.status === "rejected"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {gap.status === "accepted"
                          ? "Layak Diteliti"
                          : gap.status === "rejected"
                          ? "Ditolak"
                          : "Perlu Validasi"}
                      </span>
                    </div>

                    {/* Core Issue */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Akar Isu Ilmiah:
                      </span>
                      <p className="text-xs text-foreground leading-relaxed font-medium">
                        {gap.coreIssue}
                      </p>
                    </div>

                    {/* Concrete Solution */}
                    <div className="rounded-xl border bg-secondary/15 p-3 space-y-1">
                      <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        <Sparkles className="size-3" />
                        <span>Rekomendasi Solusi Konkret:</span>
                      </span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {gap.concreteSolution}
                      </p>
                    </div>

                    {/* Proposed Title */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        Usulan Judul Riset / Tesis:
                      </span>
                      <p className="text-xs font-semibold text-foreground italic leading-snug">
                        &ldquo;{gap.proposedTitle}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Potensi Kebaruan:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {gap.noveltyScore}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={gap.status === "accepted" ? "default" : "outline"}
                        onClick={() => handleUpdateStatus(gap.id, "accepted")}
                        className="flex-1 text-xs h-7.5 gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="size-3" />
                        <span>Layak Diteliti</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(gap.id, "rejected")}
                        className="text-xs h-7.5 gap-1 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <XCircle className="size-3" />
                        <span>Tolak</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
