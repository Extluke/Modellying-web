import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Compass, ArrowLeft, CheckCircle2, GitBranch, AlertTriangle, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useProjects,
  useComparativeMatrix,
  type EvidenceItem,
} from "@/features/projects/api/projectsApi"
import { useSynthesizeGraphNodes } from "@/features/research/knowledge-graph/api/knowledgeGraphApi"
import { SynthesisResultDialog } from "@/features/research/knowledge-graph/components/SynthesisResultDialog"
import type {
  AiResearchSynthesis,
  GraphEvidence,
} from "@/features/research/knowledge-graph/types/knowledgeGraphTypes"
import { buildKnowledgeGraph } from "@/features/research/knowledge-graph/utils/graphBuilder"
import { toast } from "@/lib/store/useToastStore"
import { useGapMapStore } from "../store/useGapMapStore"
import { buildResearchFlowGraph } from "../utils/flowDataBuilder"
import { buildGapItems, buildSynthesisPayload } from "../utils/gapItems"
import { ResearchFlowCanvas } from "./ResearchFlowCanvas"
import { FourStageActionCard } from "./FourStageActionCard"
import { ResearchGapsSection } from "./ResearchGapsSection"
import { GapDetailPanel } from "./GapDetailPanel"
import { GapSummaryDialog } from "./GapSummaryDialog"

// The PDF viewer pulls in pdfjs-dist, so it is only loaded when an evidence quote is opened.
const EvidencePdfModal = lazy(() => import("@/features/projects/paper-analysis/EvidencePdfModal"))

export interface ProjectGapMapViewProps {
  projectId: string
  onBackToProjects: () => void
}

interface EvidenceTarget {
  paperId: string
  paperTitle: string
  parameterLabel: string
  evidence: EvidenceItem
}

interface SynthesisOutcome {
  gapLabel: string
  synthesis: AiResearchSynthesis
}

function toEvidenceItem(evidence: GraphEvidence): EvidenceItem {
  return {
    page_index: evidence.pageNumber ?? 1,
    quote: evidence.quote,
    block_id: evidence.blockId,
    bbox: evidence.bbox,
  }
}

export function ProjectGapMapView({ projectId, onBackToProjects }: ProjectGapMapViewProps) {
  const [, setSearchParams] = useSearchParams()
  const { data: projectList = [] } = useProjects({ status: "active" })
  const { data: matrixData, isLoading, isError, refetch } = useComparativeMatrix(projectId)
  const { selectedGapId, setSelectedGapId, summaryGapId, setSummaryGapId, resetStore } = useGapMapStore()

  const [evidenceTarget, setEvidenceTarget] = useState<EvidenceTarget | null>(null)
  const [synthesisOutcome, setSynthesisOutcome] = useState<SynthesisOutcome | null>(null)
  const synthesize = useSynthesizeGraphNodes(projectId)

  const currentProject = projectList.find((p) => p.id === projectId)
  const projectName = currentProject?.name || matrixData?.project_name || "Proyek Riset"

  // Every project starts from a clean view, and the view is cleaned up again when leaving the page
  useEffect(() => {
    resetStore()
    return () => resetStore()
  }, [projectId, resetStore])

  // Pembangun dataset graf alur riset 4 tahap terpadu
  const graphData = useMemo(() => {
    return buildResearchFlowGraph(matrixData)
  }, [matrixData])

  // Research gaps come from the same knowledge graph the /knowledge-graph page uses
  const knowledgeGraph = useMemo(() => (matrixData ? buildKnowledgeGraph(matrixData) : null), [matrixData])
  const gaps = useMemo(() => (knowledgeGraph ? buildGapItems(knowledgeGraph) : []), [knowledgeGraph])
  const selectedGap = useMemo(() => gaps.find((gap) => gap.id === selectedGapId) ?? null, [gaps, selectedGapId])
  const summaryGap = useMemo(() => gaps.find((gap) => gap.id === summaryGapId) ?? null, [gaps, summaryGapId])

  const hasOverlay = Boolean(evidenceTarget || synthesisOutcome || summaryGap)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !hasOverlay) setSelectedGapId(null)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasOverlay, setSelectedGapId])

  const openEvidence = useCallback((evidence: GraphEvidence) => {
    setEvidenceTarget({
      paperId: evidence.paperId,
      paperTitle: evidence.paperTitle,
      parameterLabel: evidence.section ?? "Bukti kutipan",
      evidence: toEvidenceItem(evidence),
    })
  }, [])

  const handleSynthesize = useCallback(() => {
    if (!knowledgeGraph || !selectedGap) return
    const payload = buildSynthesisPayload(knowledgeGraph, selectedGap.id)
    if (!payload) return

    synthesize.mutate(payload, {
      onSuccess: (synthesis) => setSynthesisOutcome({ gapLabel: selectedGap.label, synthesis }),
      onError: (error) =>
        toast.error(error.message || "Rumusan masalah belum dapat disusun. Silakan coba kembali."),
    })
  }, [knowledgeGraph, selectedGap, synthesize])

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

        {/* Project Switcher */}
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
            <span className="text-[10px] text-muted-foreground font-medium block">Research Gaps</span>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-primary" />
              <span className="text-lg font-bold text-foreground font-mono">{gaps.length}</span>
              <span className="text-[10px] text-muted-foreground">gap ditemukan</span>
            </div>
          </div>
        </div>

        {/* Kanvas Alur Riset (React Flow) */}
        <div className="flex items-center justify-between border-b pb-3 gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs">
            <GitBranch className="size-3.5" />
            <span>Kanvas Alur Riset (React Flow)</span>
            <span className="ml-1 rounded-full bg-black/15 px-1.5 font-mono text-[10px] opacity-85 dark:bg-white/15">
              {graphData.nodes.length}
            </span>
          </span>
          <span className="text-xs text-muted-foreground italic hidden md:inline">
            Klik simpul pada kanvas untuk menelaah kutipan bukti dan naskah primer.
          </span>
        </div>

        <div className="space-y-6">
          {/* Interactive React Flow Canvas */}
          <ResearchFlowCanvas graphData={graphData} />

          {/* Research Gaps (below the canvas, as in the mobile app) */}
          <ResearchGapsSection
            gaps={gaps}
            isLoading={isLoading}
            isError={isError}
            activeGapId={selectedGapId}
            onOpenGap={setSelectedGapId}
            onRetry={() => void refetch()}
          />

          {/* 4-Stage Strategic Action Recommendations */}
          <FourStageActionCard recommendations={graphData.recommendations} />
        </div>
      </div>

      {selectedGap && (
        <GapDetailPanel
          gap={selectedGap}
          isSynthesizing={synthesize.isPending}
          onClose={() => setSelectedGapId(null)}
          onFinish={() => setSummaryGapId(selectedGap.id)}
          onSynthesize={handleSynthesize}
          onOpenEvidence={openEvidence}
        />
      )}

      {summaryGap && <GapSummaryDialog gap={summaryGap} onClose={() => setSummaryGapId(null)} />}

      {evidenceTarget && (
        <Suspense fallback={null}>
          <EvidencePdfModal
            projectId={projectId}
            paperId={evidenceTarget.paperId}
            paperTitle={evidenceTarget.paperTitle}
            parameterLabel={evidenceTarget.parameterLabel}
            evidence={evidenceTarget.evidence}
            onClose={() => setEvidenceTarget(null)}
          />
        </Suspense>
      )}

      {synthesisOutcome && (
        <SynthesisResultDialog
          synthesis={synthesisOutcome.synthesis}
          gapLabel={synthesisOutcome.gapLabel}
          onClose={() => setSynthesisOutcome(null)}
        />
      )}
    </div>
  )
}
