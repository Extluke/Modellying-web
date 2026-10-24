import { useMemo, useCallback, useEffect } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeMouseHandler,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import type { NodeTypes } from "@xyflow/react"
import { FlowNodeCard } from "./FlowNodeCard"
import { CanvasToolbar } from "./CanvasToolbar"
import { NodeDetailPanel } from "./NodeDetailPanel"
import { FlowGraphDataset, FlowNodeData } from "../types/flowTypes"
import { useGapMapStore } from "../store/useGapMapStore"

interface ResearchFlowCanvasProps {
  graphData: FlowGraphDataset
}

const nodeTypes: NodeTypes = {
  flowCard: FlowNodeCard,
}

function InnerFlowCanvas({ graphData }: ResearchFlowCanvasProps) {
  const { filterMode, setSelectedNode, isFullscreen, selectedNode } = useGapMapStore()

  // Saring simpul berdasarkan filterMode (all / shared_only / gap_only)
  const filteredNodes: Node[] = useMemo(() => {
    return graphData.nodes.filter((node) => {
      const data = node.data as FlowNodeData
      if (filterMode === "shared_only") return data.status === "shared"
      if (filterMode === "gap_only") return data.status === "gap"
      return true
    })
  }, [graphData.nodes, filterMode])

  // Saring edges agar hanya menghubungkan simpul yang tampak
  const filteredEdges: Edge[] = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id))
    return graphData.edges.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )
  }, [graphData.edges, filteredNodes])

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges)

  // Sinkronkan nodes & edges saat graphData atau filterMode berubah
  useEffect(() => {
    setNodes(filteredNodes)
    setEdges(filteredEdges)
  }, [filteredNodes, filteredEdges, setNodes, setEdges])

  // Pastikan simpul yang sedang dipilih mendapatkan penanda selected
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((n) => ({
        ...n,
        selected: n.id === selectedNode?.id,
      }))
    )
  }, [selectedNode, setNodes])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedNode(node.data as FlowNodeData)
    },
    [setSelectedNode]
  )

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  return (
    <div
      className={`relative w-full rounded-2xl border bg-card/60 backdrop-blur-xs overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none border-none p-4 bg-background"
          : "h-[620px] shadow-sm"
      }`}
    >
      {/* Floating Toolbar di Atas Kanvas */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto">
          <CanvasToolbar
            sharedCount={graphData.metrics.sharedCount}
            gapCount={graphData.metrics.gapCount}
          />
        </div>

        {/* Kolom Indikator 4 Tahap Horizontal di Atas Kanvas */}
        <div className="hidden lg:grid grid-cols-4 gap-4 px-2 py-1 text-center pointer-events-none">
          <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 py-1 px-2.5 rounded-lg border border-indigo-500/20 backdrop-blur-xs">
            Tahap 1: Topik Riset
          </div>
          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 py-1 px-2.5 rounded-lg border border-blue-500/20 backdrop-blur-xs">
            Tahap 2: Tema Bersama
          </div>
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 py-1 px-2.5 rounded-lg border border-amber-500/20 backdrop-blur-xs">
            Tahap 3: Masalah Ilmiah
          </div>
          <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 py-1 px-2.5 rounded-lg border border-purple-500/20 backdrop-blur-xs">
            Tahap 4: Solusi & Novelty
          </div>
        </div>
      </div>

      {/* Kanvas Utama React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={1.75}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        className="bg-muted/15"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#94A3B8" />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as FlowNodeData
            return data?.status === "shared" ? "#10B981" : "#EF4444"
          }}
          className="!bottom-4 !left-4 !rounded-xl !border !bg-card/90 !shadow-sm !overflow-hidden"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Slide-in Panel Rincian Simpul Terpilih */}
      <NodeDetailPanel />
    </div>
  )
}

export function ResearchFlowCanvas({ graphData }: ResearchFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerFlowCanvas graphData={graphData} />
    </ReactFlowProvider>
  )
}
