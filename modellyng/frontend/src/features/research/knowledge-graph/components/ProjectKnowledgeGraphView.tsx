import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { Link, generatePath, useParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  Link2,
  Network,
  RotateCw,
  TableProperties,
  Unlink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FilterTabs, type FilterTabOption } from "@/components/ui/filter-tabs"
import { SearchField } from "@/components/ui/search-field"
import { ROUTES } from "@/app/routes"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/store/useToastStore"
import { useComparativeMatrix, type EvidenceItem } from "@/features/projects/api/projectsApi"
import { useSynthesizeGraphNodes } from "../api/knowledgeGraphApi"
import { useKnowledgeGraphStore } from "../store/useKnowledgeGraphStore"
import type {
  AiResearchSynthesis,
  GraphEvidence,
  GraphNodeKind,
  GraphZoneKey,
  KnowledgeGraphNode,
} from "../types/knowledgeGraphTypes"
import { buildKnowledgeGraph, summarizeGraph } from "../utils/graphBuilder"
import { ZONE_ORDER, zoneOf } from "../utils/graphLayout"
import { KIND_META, KIND_ORDER, ZONE_META } from "../utils/graphMeta"
import { KnowledgeGraphCanvas } from "./KnowledgeGraphCanvas"
import { NodeDetailPanel } from "./NodeDetailPanel"
import { SynthesisResultDialog } from "./SynthesisResultDialog"

// The PDF viewer pulls in pdfjs-dist, so it is only loaded when an evidence quote is opened.
const EvidencePdfModal = lazy(
  () => import("@/features/projects/paper-analysis/EvidencePdfModal")
)

/** Context sent to the AI together with a research gap: the results / methods it grew out of. */
const MAX_CONTEXT_NODES = 3
const MAX_DETAIL_CHARS = 1200

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

export function ProjectKnowledgeGraphView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: matrix, isLoading, isError, refetch } = useComparativeMatrix(projectId)

  const {
    selectedNodeId,
    setSelectedNodeId,
    zoneFilter,
    setZoneFilter,
    kindFilter,
    setKindFilter,
    query,
    setQuery,
    isFullscreen,
    toggleFullscreen,
    setFullscreen,
    reset,
  } = useKnowledgeGraphStore()

  const [evidenceTarget, setEvidenceTarget] = useState<EvidenceTarget | null>(null)
  const [synthesisOutcome, setSynthesisOutcome] = useState<SynthesisOutcome | null>(null)
  const synthesize = useSynthesizeGraphNodes(projectId ?? "")

  // Every project starts from a clean view, and the view is cleaned up again when leaving the page
  useEffect(() => {
    reset()
    return () => reset()
  }, [projectId, reset])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || evidenceTarget || synthesisOutcome) return
      if (isFullscreen) setFullscreen(false)
      else setSelectedNodeId(null)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen, evidenceTarget, synthesisOutcome, setFullscreen, setSelectedNodeId])

  const graph = useMemo(() => (matrix ? buildKnowledgeGraph(matrix) : null), [matrix])
  const summary = useMemo(() => (graph ? summarizeGraph(graph) : null), [graph])

  const zoneOptions = useMemo<FilterTabOption<"all" | GraphZoneKey>[]>(() => {
    if (!graph) return []
    const counts = new Map<GraphZoneKey, number>()
    graph.nodes.forEach((node) => counts.set(zoneOf(node), (counts.get(zoneOf(node)) ?? 0) + 1))
    return [
      { id: "all", label: "Semua", count: graph.nodes.length },
      ...ZONE_ORDER.filter((zone) => counts.has(zone)).map((zone) => ({
        id: zone,
        label: ZONE_META[zone].title,
        count: counts.get(zone) ?? 0,
      })),
    ]
  }, [graph])

  const selectedNode = useMemo<KnowledgeGraphNode | null>(
    () => graph?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [graph, selectedNodeId]
  )

  const openEvidence = useCallback((evidence: GraphEvidence) => {
    setEvidenceTarget({
      paperId: evidence.paperId,
      paperTitle: evidence.paperTitle,
      parameterLabel: evidence.section ?? "Bukti kutipan",
      evidence: toEvidenceItem(evidence),
    })
  }, [])

  const handleSynthesize = useCallback(() => {
    if (!graph || !selectedNode || selectedNode.kind !== "gap") return

    // The gap itself plus the result / method it was derived from, so the draft stays grounded
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
    const context = graph.edges
      .filter((edge) => edge.target === selectedNode.id || edge.source === selectedNode.id)
      .flatMap((edge) => {
        const other = nodeById.get(edge.target === selectedNode.id ? edge.source : edge.target)
        return other && (other.kind === "result" || other.kind === "method") ? [other] : []
      })
      .slice(0, MAX_CONTEXT_NODES)

    synthesize.mutate(
      {
        nodes: [selectedNode, ...context].map((node) => ({
          kind: node.kind,
          label: node.label,
          detail: node.detail.slice(0, MAX_DETAIL_CHARS),
        })),
      },
      {
        onSuccess: (synthesis) => setSynthesisOutcome({ gapLabel: selectedNode.label, synthesis }),
        onError: (error) =>
          toast.error(error.message || "Rumusan masalah belum dapat disusun. Silakan coba kembali."),
      }
    )
  }, [graph, selectedNode, synthesize])

  const backLink = (
    <Link
      to={ROUTES.RESEARCH.GRAPH}
      className="group inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      <span>Kembali ke Graf Pengetahuan</span>
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-muted-foreground">Menyusun graf pengetahuan...</span>
        </div>
      </div>
    )
  }

  if (isError || !graph || !summary || !projectId) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6 md:p-8">
        {backLink}
        <Card className="flex flex-col items-center gap-3 border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <h1 className="text-base font-semibold text-foreground">Graf Pengetahuan Gagal Dimuat</h1>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Proyek tidak ditemukan atau data ekstraksi belum dapat diambil. Periksa koneksi lalu coba lagi.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-1 gap-2">
            <RotateCw />
            <span>Coba Muat Ulang</span>
          </Button>
        </Card>
      </div>
    )
  }

  const entityCount = summary.nodeCount - summary.paperCount

  if (entityCount === 0) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6 md:p-8">
        {backLink}
        <div className="flex flex-col items-center gap-4 rounded-card border-2 border-dashed border-border/80 bg-card/50 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-card bg-primary-soft text-primary">
            <Network className="size-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h1 className="text-base font-semibold text-foreground">Graf Masih Kosong</h1>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Belum ada hasil ekstraksi yang dapat dipetakan pada proyek {graph.projectTitle}. Pastikan paper sudah
              selesai diproses dan ditinjau, lalu buka kembali halaman ini.
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link to={generatePath(ROUTES.PROJECTS.OVERVIEW, { projectId })}>Kelola Paper Proyek</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isConnected = summary.componentCount === 1

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">{backLink}</div>

      {/* Hero header */}
      <Card className="p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-card bg-primary-soft text-primary">
                <Network className="size-5" />
              </div>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground">{graph.projectTitle}</h1>
            </div>
            <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Graf Pengetahuan. Peta konsep, metode, hasil, dan celah riset yang terhubung ke paper sumbernya, dikelompokkan
              menurut zona saturasi. Klik simpul untuk melihat uraian dan bukti kutipannya.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="paper">{summary.paperCount} Paper</Badge>
              <Badge variant="primary">{summary.nodeCount} Simpul</Badge>
              <Badge variant="primary">{summary.edgeCount} Relasi</Badge>
              <Badge variant="review">{summary.gapCount} Celah Riset</Badge>
              {isConnected ? (
                <Badge variant="ready">
                  <Link2 className="size-3" />
                  Terhubung utuh
                </Badge>
              ) : (
                <Badge variant="outline" title="Beberapa paper belum memiliki topik yang sama, sehingga grafnya terpisah.">
                  <Unlink className="size-3" />
                  {summary.componentCount} kelompok terpisah
                </Badge>
              )}
              {graph.pendingPaperCount > 0 && (
                <Badge
                  variant="outline"
                  title="Paper yang masih diproses atau gagal dianalisis belum ditampilkan pada graf."
                >
                  {graph.pendingPaperCount} paper belum dianalisis
                </Badge>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="h-10 gap-2 px-4 text-xs font-medium">
              <Link to={generatePath(ROUTES.PROJECTS.MATRIX, { projectId })}>
                <TableProperties className="text-primary" />
                <span>Matriks Komparasi</span>
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Search and filters */}
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        <SearchField
          className="flex-1"
          value={query}
          onChange={setQuery}
          placeholder="Cari simpul berdasarkan judul atau uraian..."
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterTabs options={zoneOptions} value={zoneFilter} onChange={setZoneFilter} />
          <select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as "all" | GraphNodeKind)}
            aria-label="Filter jenis simpul"
            className="h-10 rounded-button border border-input bg-card px-3 text-xs font-medium text-foreground shadow-card focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <option value="all">Semua jenis simpul</option>
            {KIND_ORDER.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_META[kind].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-col gap-3">
        <KnowledgeGraphCanvas
          graph={graph}
          filters={{ zone: zoneFilter, kind: kindFilter, query }}
          selectedNodeId={selectedNode?.id ?? null}
          onSelectNode={setSelectedNodeId}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          className={isFullscreen ? undefined : "h-[calc(100vh-4rem)] min-h-[560px]"}
          overlay={
            selectedNode && (
              <NodeDetailPanel
                graph={graph}
                node={selectedNode}
                onClose={() => setSelectedNodeId(null)}
                onSelectNode={setSelectedNodeId}
                onOpenEvidence={openEvidence}
                onSynthesize={handleSynthesize}
                isSynthesizing={synthesize.isPending}
              />
            )
          }
        />

        {!isFullscreen && (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Legenda graf">
            {KIND_ORDER.map((kind) => {
              const meta = KIND_META[kind]
              const Icon = meta.icon
              return (
                <li key={kind} className="inline-flex items-center gap-1.5">
                  <span className={cn("flex size-5 items-center justify-center rounded-full bg-gradient-to-br text-white", meta.gradient)}>
                    <Icon className="size-3" />
                  </span>
                  {meta.label}
                </li>
              )
            })}
            <li className="inline-flex items-center gap-1.5">
              <span className="w-6 border-t-2 border-primary/60" aria-hidden />
              Relasi langsung
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="w-6 border-t-2 border-dashed border-primary/60" aria-hidden />
              Serupa antar paper
            </li>
          </ul>
        )}
      </div>

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
