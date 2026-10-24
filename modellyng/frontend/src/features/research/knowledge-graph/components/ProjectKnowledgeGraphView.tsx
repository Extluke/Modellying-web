import { useMemo, useCallback, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  NodeMouseHandler,
  NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import {
  Network,
  ArrowLeft,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Focus,
  Lightbulb,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjects, useComparativeMatrix } from "@/features/projects/api/projectsApi"
import { toast } from "@/lib/store/useToastStore"
import { useKnowledgeGraphStore } from "../store/useKnowledgeGraphStore"
import {
  buildKnowledgeGraphData,
  BuiltGraphResult,
} from "../utils/graphDataBuilder"
import { KnowledgeGraphNodeData, KnowledgeNodeType } from "../types/knowledgeGraphTypes"
import { KnowledgeGraphNodeCard } from "./KnowledgeGraphNodeCard"
import { ZoneOverlayBackground } from "./ZoneOverlayBackground"
import { NodeDetailDrawer } from "./NodeDetailDrawer"

export interface ProjectKnowledgeGraphViewProps {
  projectId: string
  onBackToProjects: () => void
}

const nodeTypes: NodeTypes = {
  knowledgeNode: KnowledgeGraphNodeCard,
}

function InnerKnowledgeGraphCanvas({
  graphData,
  projectName,
  readyCount,
  onBackToProjects,
  projectList,
  projectId,
}: {
  graphData: BuiltGraphResult
  projectName: string
  readyCount: number
  onBackToProjects: () => void
  projectList: Array<{ id: string; name: string; ready_count: number }>
  projectId: string
}) {
  const [, setSearchParams] = useSearchParams()
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const {
    selectedNode,
    setSelectedNode,
    selectedZoneFilter,
    selectedTypeFilter,
    isFullscreen,
    toggleFullscreen,
  } = useKnowledgeGraphStore()

  // Saring simpul berdasarkan filter zona saturasi dan filter tipe
  const filteredNodes: Node[] = useMemo(() => {
    return graphData.nodes.filter((node) => {
      const data = node.data as KnowledgeGraphNodeData
      const matchZone =
        selectedZoneFilter === "all" ? true : data.saturationZone === selectedZoneFilter
      const matchType =
        selectedTypeFilter === "all" ? true : data.nodeType === selectedTypeFilter
      return matchZone && matchType
    })
  }, [graphData.nodes, selectedZoneFilter, selectedTypeFilter])

  // Saring edges agar hanya menghubungkan simpul yang terlihat
  const filteredEdges: Edge[] = useMemo(() => {
    const visibleIds = new Set(filteredNodes.map((n) => n.id))
    return graphData.edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
    )
  }, [graphData.edges, filteredNodes])

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges)

  // Sinkronkan state React Flow saat filter berubah
  useEffect(() => {
    setNodes(filteredNodes)
    setEdges(filteredEdges)
  }, [filteredNodes, filteredEdges, setNodes, setEdges])

  // Tandai node terpilih dengan properti selected
  useEffect(() => {
    setNodes((current) =>
      current.map((n) => ({
        ...n,
        selected: n.id === selectedNode?.id,
      }))
    )
  }, [selectedNode, setNodes])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedNode(node.data as KnowledgeGraphNodeData)
    },
    [setSelectedNode]
  )

  const handlePaneClick = useCallback(() => {
    // Tidak menutup drawer jika pengguna hanya menggeser kanvas
  }, [])

  const handleResetSpringLayout = () => {
    // Kembalikan posisi awal sesuai builder
    const initialMap = new Map<string, { x: number; y: number }>()
    graphData.nodes.forEach((n) => initialMap.set(n.id, n.position))

    setNodes((curr) =>
      curr.map((n) => {
        const initPos = initialMap.get(n.id)
        return initPos ? { ...n, position: { ...initPos } } : n
      })
    )
    fitView({ padding: 0.2, duration: 500 })
    toast.success("Posisi pegas kanvas dan tata letak zona saturasi berhasil diatur ulang.")
  }

  return (
    <div
      className={`relative w-full rounded-2xl border bg-card/60 backdrop-blur-xs overflow-hidden transition-all duration-300 flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none border-none bg-background p-0"
          : "h-[680px] shadow-sm"
      }`}
    >
      {/* Floating Canvas Top Bar Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Toolbar: Back, Title, Switcher */}
        <div className="pointer-events-auto flex items-center gap-2 bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToProjects}
            className="h-7 px-2 text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Kembali ke Katalog Pemilihan Proyek Knowledge Graph"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Pilih Proyek Lain</span>
          </Button>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5">
            <Network className="size-3.5 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground max-w-[180px] truncate" title={projectName}>
              {projectName}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-mono">
              {readyCount} Paper
            </span>
          </div>

          {projectList.length > 1 && (
            <select
              value={projectId}
              onChange={(e) => setSearchParams({ projectId: e.target.value })}
              className="h-7 rounded-lg border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring ml-1"
            >
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right Toolbar: Zoom, Reset, Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-card/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border shadow-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => zoomIn({ duration: 300 })}
            className="h-7 w-7 p-0 cursor-pointer"
            title="Perbesar Kanvas"
          >
            <ZoomIn className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => zoomOut({ duration: 300 })}
            className="h-7 w-7 p-0 cursor-pointer"
            title="Perkecil Kanvas"
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fitView({ padding: 0.2, duration: 400 })}
            className="h-7 w-7 p-0 cursor-pointer"
            title="Pusatkan Tampilan (Fit View)"
          >
            <Focus className="size-3.5" />
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetSpringLayout}
            className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
            title="Reset Posisi Pegas ke Slot Zona Saturasi"
          >
            <RotateCcw className="size-3" />
            <span className="hidden md:inline">Reset Posisi Pegas</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            className="h-7 w-7 p-0 cursor-pointer"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* React Flow Viewport with Spatial Saturation Zones */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          className="bg-muted/10"
        >
          {/* Spatial 3-Zone Demarcation Background */}
          <ZoneOverlayBackground />
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#94A3B8" />

          <MiniMap
            nodeColor={(n) => {
              const data = n.data as KnowledgeGraphNodeData
              if (data?.saturationZone === "high") return "#10B981"
              if (data?.saturationZone === "medium") return "#F59E0B"
              return "#F43F5E"
            }}
            className="!bottom-4 !left-4 !rounded-xl !border !bg-card/90 !shadow-sm !overflow-hidden"
            zoomable
            pannable
          />
        </ReactFlow>
      </div>

      {/* Slide-in Node Detail Drawer */}
      <NodeDetailDrawer />
    </div>
  )
}

export function ProjectKnowledgeGraphView({
  projectId,
  onBackToProjects,
}: ProjectKnowledgeGraphViewProps) {
  const { data: projectList = [] } = useProjects({ status: "active" })
  const { data: matrixData, isLoading, isError } = useComparativeMatrix(projectId)

  const {
    selectedZoneFilter,
    setSelectedZoneFilter,
    selectedTypeFilter,
    setSelectedTypeFilter,
  } = useKnowledgeGraphStore()

  const currentProject = projectList.find((p) => p.id === projectId)
  const projectName = currentProject?.name || matrixData?.project_name || "Proyek Riset"
  const readyCount = currentProject?.ready_count || matrixData?.papers?.length || 0

  // Pembangun dataset graf dari matriks ekstraksi dokumen
  const graphData = useMemo(() => {
    return buildKnowledgeGraphData(matrixData)
  }, [matrixData])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
      {/* Top Header Bar */}
      <div className="border-b bg-card px-4 sm:px-8 py-3.5 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToProjects}
              className="h-8 text-xs gap-1.5 cursor-pointer"
              title="Kembali ke Katalog Pemilihan Proyek"
            >
              <ArrowLeft className="size-3.5" />
              <span>Katalog Proyek</span>
            </Button>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <Network className="size-4 text-primary" />
              <h1 className="text-sm font-bold text-foreground truncate max-w-sm" title={projectName}>
                {projectName}
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-mono">
                {readyCount} Paper Siap
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 text-[11px] bg-secondary px-2.5 py-1 rounded-lg">
              <Sparkles className="size-3 text-primary" />
              <span>Kanvas Graf Spasial 2D (React Flow Engine)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* Saturation Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Total Nodes */}
          <div className="p-3.5 rounded-xl border bg-card space-y-1 shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-medium block">
              Total Simpul Pengetahuan
            </span>
            <div className="flex items-center gap-1.5">
              <Layers className="size-4 text-primary" />
              <span className="text-lg font-bold text-foreground font-mono">
                {graphData.metrics.totalNodes}
              </span>
              <span className="text-[10px] text-muted-foreground">konsep</span>
            </div>
          </div>

          {/* Low Saturation (Novelty) */}
          <div className="p-3.5 rounded-xl border bg-rose-500/5 border-rose-500/20 space-y-1 shadow-2xs">
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold block">
              Saturasi Rendah (&le; 20%)
            </span>
            <div className="flex items-center gap-1.5">
              <Flame className="size-4 text-rose-600" />
              <span className="text-lg font-bold text-rose-600 font-mono">
                {graphData.metrics.lowCount}
              </span>
              <span className="text-[10px] text-rose-600 font-medium">Novelty Tesis</span>
            </div>
          </div>

          {/* Medium Saturation (Transition) */}
          <div className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-1 shadow-2xs">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">
              Saturasi Sedang (21% - 50%)
            </span>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-amber-600" />
              <span className="text-lg font-bold text-amber-600 font-mono">
                {graphData.metrics.mediumCount}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">Transisi</span>
            </div>
          </div>

          {/* High Saturation (Established) */}
          <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-1 shadow-2xs">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
              Saturasi Tinggi (&gt; 50%)
            </span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="text-lg font-bold text-emerald-600 font-mono">
                {graphData.metrics.highCount}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Fondasi Mapan</span>
            </div>
          </div>

          {/* Research Gaps */}
          <div className="p-3.5 rounded-xl border bg-card space-y-1 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] text-muted-foreground font-medium block">
              Simpul Celah Riset
            </span>
            <div className="flex items-center gap-1.5">
              <Lightbulb className="size-4 text-purple-600" />
              <span className="text-lg font-bold text-purple-600 font-mono">
                {graphData.metrics.gapCount}
              </span>
              <span className="text-[10px] text-muted-foreground">potensi celah</span>
            </div>
          </div>
        </div>

        {/* Filters Bar: Zone Segmentation & Type Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          {/* Segmented Tab Zona Saturasi */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
            <span className="text-[11px] text-muted-foreground font-semibold mr-1 shrink-0">
              Zona Saturasi:
            </span>
            <button
              onClick={() => setSelectedZoneFilter("all")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                selectedZoneFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({graphData.metrics.totalNodes})
            </button>
            <button
              onClick={() => setSelectedZoneFilter("low")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                selectedZoneFilter === "low"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20"
              }`}
            >
              <span className="size-1.5 rounded-full bg-rose-500" />
              <span>Rendah / Novelty ({graphData.metrics.lowCount})</span>
            </button>
            <button
              onClick={() => setSelectedZoneFilter("medium")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                selectedZoneFilter === "medium"
                  ? "bg-amber-600 text-white shadow-xs font-bold"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span>Sedang ({graphData.metrics.mediumCount})</span>
            </button>
            <button
              onClick={() => setSelectedZoneFilter("high")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                selectedZoneFilter === "high"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Tinggi / Mapan ({graphData.metrics.highCount})</span>
            </button>
          </div>

          {/* Type Select Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground font-semibold">Tipe:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) =>
                setSelectedTypeFilter(e.target.value as "all" | KnowledgeNodeType)
              }
              className="h-8 rounded-lg border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">Semua Tipe Simpul</option>
              <option value="concept">Konsep Inti</option>
              <option value="variable">Variabel Peneliti</option>
              <option value="method">Metodologi / Algoritma</option>
              <option value="dataset">Dataset & Korpus</option>
              <option value="research_gap">Celah Riset (Gap)</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="h-[400px] flex items-center justify-center rounded-2xl border bg-card/50">
            <div className="text-center space-y-2">
              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">
                Memuat data matriks ekstraksi dan membangun graf pengetahuan...
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs">
            Gagal memuat matriks komparatif proyek. Menampilkan data representatif graf pengetahuan.
          </div>
        )}

        {/* Main Canvas View */}
        {!isLoading && (
          <ReactFlowProvider>
            <InnerKnowledgeGraphCanvas
              graphData={graphData}
              projectName={projectName}
              readyCount={readyCount}
              onBackToProjects={onBackToProjects}
              projectList={projectList}
              projectId={projectId}
            />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  )
}
