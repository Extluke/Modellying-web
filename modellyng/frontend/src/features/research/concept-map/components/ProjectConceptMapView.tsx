import { useState, useMemo, useEffect, useRef } from "react"
import {
  Workflow,
  ArrowLeft,
  Layers,
  Sparkles,
  GitCompare,
  GitBranch,
  RotateCw,
  CheckCircle2,
  Clock,
  Activity,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import {
  useComparativeMatrix,
  useProjectDetail,
} from "@/features/projects/api/projectsApi"
import { useConceptMapStore } from "../store/useConceptMapStore"
import {
  generatePairwiseComparisons,
  extractGapCandidates,
  buildLimitationsGraph,
} from "../utils/pairwiseComparisonEngine"
import { GapValidationStatus, GapCandidateItem, LimitationNodeData } from "../types/conceptMapTypes"
import { LimitationsFutureWorkCanvas } from "./LimitationsFutureWorkCanvas"
import { PairwiseComparisonPanel } from "./PairwiseComparisonPanel"
import { FiveStepMermaidFlowchart } from "./FiveStepMermaidFlowchart"
import { GapCandidateCard } from "./GapCandidateCard"
import { GapDecisionModal } from "./GapDecisionModal"

interface ProjectConceptMapViewProps {
  projectId: string
  onBackToProjects: () => void
}

export function ProjectConceptMapView({
  projectId,
  onBackToProjects,
}: ProjectConceptMapViewProps) {
  // Global Store Zustand
  const {
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    selectedPairId,
    setSelectedPairId,
    openDecisionModal,
  } = useConceptMapStore()

  // Polling State 5 Detik
  const [pollingSecondsLeft, setPollingSecondsLeft] = useState<number>(5)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Filter Status Celah Riset
  const [candidateFilter, setCandidateFilter] = useState<"all" | GapValidationStatus>("all")

  // State lokal untuk override keputusan gap reviewer
  const [candidateOverrides, setCandidateOverrides] = useState<
    Record<string, { status: GapValidationStatus; notes: string }>
  >({})

  // TanStack Query untuk data komparatif dan detail proyek
  const {
    data: matrixData,
    isLoading: isMatrixLoading,
    refetch: refetchMatrix,
  } = useComparativeMatrix(projectId)

  const { data: projectDetail, isLoading: isProjectLoading } =
    useProjectDetail(projectId)

  // Polling 5 Detik Terukur
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPollingSecondsLeft((prev) => {
        if (prev <= 1) {
          // Trigger silent refetch saat timer mencapai 0
          refetchMatrix()
          return 5
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [refetchMatrix])

  // Manual Trigger Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    setPollingSecondsLeft(5)
    await refetchMatrix()
    setIsRefreshing(false)
    toast.info("Data evaluasi komparatif diperbarui secara otomatis.")
  }

  // 1. Ekstraksi Pasangan Paper
  const pairwiseComparisons = useMemo(() => {
    return generatePairwiseComparisons(matrixData)
  }, [matrixData])

  // Inisialisasi selectedPairId bila belum ada
  useEffect(() => {
    if (pairwiseComparisons.length > 0 && !selectedPairId) {
      setSelectedPairId(pairwiseComparisons[0].pairId)
    }
  }, [pairwiseComparisons, selectedPairId, setSelectedPairId])

  // 2. Ekstraksi Kandidat Celah (Gaps) dengan penggabungan override keputusan lokal
  const rawGapCandidates = useMemo(() => {
    return extractGapCandidates(matrixData, pairwiseComparisons)
  }, [matrixData, pairwiseComparisons])

  const gapCandidates: GapCandidateItem[] = useMemo(() => {
    return rawGapCandidates.map((gap) => {
      const override = candidateOverrides[gap.id]
      if (override) {
        return {
          ...gap,
          validationStatus: override.status,
          reviewerNotes: override.notes,
        }
      }
      return gap
    })
  }, [rawGapCandidates, candidateOverrides])

  // 3. React Flow Limitations & Future Work Graph
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    return buildLimitationsGraph(matrixData)
  }, [matrixData])

  // 4. Pasangan yang sedang aktif dipilih untuk Mermaid Flowchart
  const activePair = useMemo(() => {
    return (
      pairwiseComparisons.find((p) => p.pairId === selectedPairId) ||
      pairwiseComparisons[0]
    )
  }, [pairwiseComparisons, selectedPairId])

  // Simpan Keputusan Reviewer
  const handleSaveDecision = (
    gapId: string,
    status: GapValidationStatus,
    notes: string
  ) => {
    setCandidateOverrides((prev) => ({
      ...prev,
      [gapId]: { status, notes },
    }))
  }

  // Filter kandidat celah
  const filteredGaps = useMemo(() => {
    if (candidateFilter === "all") return gapCandidates
    return gapCandidates.filter((g) => g.validationStatus === candidateFilter)
  }, [gapCandidates, candidateFilter])

  // Statistik Ringkas
  const totalPairsCount = pairwiseComparisons.length
  const detectedGapsCount = gapCandidates.length
  const acceptedGapsCount = gapCandidates.filter(
    (g) => g.validationStatus === "accepted"
  ).length
  const limitationNodesCount = flowNodes.filter(
    (n: { data: LimitationNodeData }) => n.data.nodeType === "limitation"
  ).length

  const isLoading = isMatrixLoading || isProjectLoading

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      {/* Top Bar Header */}
      <div className="border-b bg-card/70 backdrop-blur-md px-4 sm:px-6 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Back button & Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToProjects}
              className="gap-1.5 text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Ganti Proyek</span>
            </Button>

            <div className="h-4 w-px bg-border" />

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Workflow className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                  {projectDetail?.name || "Memuat Proyek..."}
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="size-2.5" />
                  <span>Research Gap Map</span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {projectDetail?.ready_count || 0} Paper Terverifikasi &bull;{" "}
                {totalPairsCount} Pasangan Komparasi
              </p>
            </div>
          </div>

          {/* Polling Indicator & Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Polling Timer Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/40 border border-border/80 text-[11px] text-muted-foreground">
              <Activity className="size-3 text-emerald-500 animate-pulse" />
              <span>Polling Otomatis:</span>
              <span className="font-mono font-bold text-foreground">
                {pollingSecondsLeft}s
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="gap-1 text-xs h-8 cursor-pointer"
              title="Perbarui data pasangan sekarang"
            >
              <RotateCw
                className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Aggregate Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          <div className="rounded-xl border bg-muted/20 px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <GitCompare className="size-3 text-primary" />
              <span>Total Pasangan:</span>
            </span>
            <span className="text-xs font-bold font-mono text-foreground">
              {totalPairsCount}
            </span>
          </div>

          <div className="rounded-xl border bg-muted/20 px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Lightbulb className="size-3 text-amber-500" />
              <span>Kandidat Celah:</span>
            </span>
            <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
              {detectedGapsCount}
            </span>
          </div>

          <div className="rounded-xl border bg-muted/20 px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>Layak Diteliti:</span>
            </span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {acceptedGapsCount}
            </span>
          </div>

          <div className="rounded-xl border bg-muted/20 px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3 text-primary" />
              <span>Keterbatasan Terpetakan:</span>
            </span>
            <span className="text-xs font-bold font-mono text-foreground">
              {limitationNodesCount}
            </span>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/60 mt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("limitations_map")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeWorkspaceTab === "limitations_map"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Layers className="size-3.5" />
            <span>Peta Limitasi & Future Work (React Flow)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("pairwise_panel")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeWorkspaceTab === "pairwise_panel"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <GitCompare className="size-3.5" />
            <span>Perbandingan Berpasangan Terurut (5 Tahap)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-background/20">
              {totalPairsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("flowchart_view")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeWorkspaceTab === "flowchart_view"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <GitBranch className="size-3.5" />
            <span>Flowchart Keputusan Ilmiah (Mermaid)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {isLoading && (
          <div className="h-96 rounded-2xl border bg-card/40 flex items-center justify-center animate-pulse">
            <div className="text-center space-y-2">
              <RotateCw className="size-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">
                Memproses perbandingan berpasangan dan membangun graf limitasi...
              </p>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Tab 1: Limitations & Future Work Canvas */}
            {activeWorkspaceTab === "limitations_map" && (
              <div className="h-[650px] w-full">
                <LimitationsFutureWorkCanvas
                  graph={{ nodes: flowNodes, edges: flowEdges }}
                />
              </div>
            )}

            {/* Tab 2: Pairwise Comparison Panel */}
            {activeWorkspaceTab === "pairwise_panel" && (
              <PairwiseComparisonPanel
                pairs={pairwiseComparisons}
                isPollingActive={true}
              />
            )}

            {/* Tab 3: Mermaid Flowchart */}
            {activeWorkspaceTab === "flowchart_view" && activePair && (
              <div className="space-y-4">
                {/* Pair Selector for Flowchart */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border bg-card shadow-2xs">
                  <div className="flex items-center gap-2">
                    <GitBranch className="size-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Pilih Pasangan Paper untuk Diagram Flowchart:
                    </span>
                  </div>

                  <select
                    value={activePair.pairId}
                    onChange={(e) => setSelectedPairId(e.target.value)}
                    className="text-xs rounded-xl border border-border bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer max-w-md truncate"
                  >
                    {pairwiseComparisons.map((pair) => (
                      <option key={pair.pairId} value={pair.pairId}>
                        {pair.paper1.title.substring(0, 32)}... vs{" "}
                        {pair.paper2.title.substring(0, 32)}... (Sim:{" "}
                        {pair.similarityScore}%)
                      </option>
                    ))}
                  </select>
                </div>

                <FiveStepMermaidFlowchart pair={activePair} />
              </div>
            )}

            {/* Bottom Section: Gap Candidates Grid & Decision Hub */}
            <div className="border-t border-border/80 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Lightbulb className="size-4 text-primary" />
                    <span>Daftar Kandidat Celah Riset (Gap Candidates)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Hasil sintesis dari titik henti perbandingan berpasangan dan peta keterbatasan untuk agenda riset baru.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCandidateFilter("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      candidateFilter === "all"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Semua ({gapCandidates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter("accepted")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                      candidateFilter === "accepted"
                        ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    <span>Layak Diteliti ({acceptedGapsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter("pending")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                      candidateFilter === "pending"
                        ? "bg-card text-amber-600 dark:text-amber-400 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clock className="size-3 text-amber-500" />
                    <span>Perlu Tinjauan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter("rejected")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                      candidateFilter === "rejected"
                        ? "bg-card text-destructive shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Ditolak</span>
                  </button>
                </div>
              </div>

              {filteredGaps.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card/60 p-8 text-center space-y-2">
                  <Lightbulb className="size-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-foreground">
                    Tidak ada kandidat celah pada filter ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGaps.map((gap) => (
                    <GapCandidateCard
                      key={gap.id}
                      gap={gap}
                      onOpenDecision={openDecisionModal}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Decision Modal Reviewer */}
      <GapDecisionModal onSaveDecision={handleSaveDecision} />
    </div>
  )
}
