import React, { useMemo } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  FileText,
  AlertTriangle,
  Sparkles,
  Compass,
  Lightbulb,
} from "lucide-react"
import { LimitationNodeData } from "../types/conceptMapTypes"
import { useConceptMapStore } from "../store/useConceptMapStore"

interface LimitationsFutureWorkCanvasProps {
  graph: {
    nodes: Array<{
      id: string
      type: string
      position: { x: number; y: number }
      data: LimitationNodeData
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      animated?: boolean
      style?: { stroke?: string; strokeWidth?: number; strokeDasharray?: string }
    }>
  }
}

// -----------------------------------------------------------------------------
// Custom Node Component for Limitation & Future Work Chain
// -----------------------------------------------------------------------------
const LimitationNodeCard = React.memo(function LimitationNodeCard({
  data,
  selected,
}: NodeProps & { data: LimitationNodeData }) {
  const node = data

  const typeConfig = useMemo(() => {
    switch (node.nodeType) {
      case "paper":
        return {
          icon: FileText,
          badgeText: "Paper Sumber",
          badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
          cardBorder: "border-blue-500/50 hover:border-blue-500 bg-blue-500/[0.02]",
        }
      case "limitation":
        return {
          icon: AlertTriangle,
          badgeText: "Keterbatasan (Limitation)",
          badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          cardBorder: "border-amber-500/60 hover:border-amber-500 bg-amber-500/[0.02]",
        }
      case "future_work":
        return {
          icon: Lightbulb,
          badgeText: "Peluang (Future Work)",
          badgeColor: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
          cardBorder: "border-indigo-500/60 hover:border-indigo-500 bg-indigo-500/[0.02]",
        }
      case "novelty_gap":
        return {
          icon: Sparkles,
          badgeText: "Novelty Tesis (Research Gap)",
          badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          cardBorder: "border-emerald-500/70 hover:border-emerald-500 bg-emerald-500/[0.03]",
        }
    }
  }, [node.nodeType])

  const Icon = typeConfig.icon

  return (
    <div
      className={`w-64 rounded-2xl border bg-card p-3.5 shadow-xs transition-all duration-200 cursor-pointer ${
        typeConfig.cardBorder
      } ${
        selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md" : "hover:shadow-sm"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-2 !border-background !bg-primary"
      />

      <div className="flex items-center justify-between gap-1 pb-2 border-b">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${typeConfig.badgeColor}`}
        >
          <Icon className="size-2.5" />
          <span>{typeConfig.badgeText}</span>
        </span>

        {node.pageNumber && (
          <span className="text-[9px] font-mono font-medium text-muted-foreground">
            Hal. {node.pageNumber}
          </span>
        )}
      </div>

      <div className="py-2 space-y-1">
        <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
          {node.title}
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
          {node.description}
        </p>
      </div>

      {node.sourcePaperTitle && node.nodeType !== "paper" && (
        <div className="pt-1.5 border-t text-[10px] text-muted-foreground truncate italic">
          Naskah: {node.sourcePaperTitle}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-2 !border-background !bg-primary"
      />
    </div>
  )
})

const nodeTypes: NodeTypes = {
  limitationCard: LimitationNodeCard,
}

export function LimitationsFutureWorkCanvas({ graph }: LimitationsFutureWorkCanvasProps) {
  const { setSelectedLimitationNode } = useConceptMapStore()

  return (
    <div className="space-y-3">
      {/* Kolom Tahapan Spasial Horizontal di Atas Kanvas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-bold">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
          1. Dokumen Paper
        </div>
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          2. Keterbatasan (Limitations)
        </div>
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
          3. Peluang Riset (Future Work)
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          4. Celah Riset Novelty Tesis
        </div>
      </div>

      {/* Kanvas React Flow Utama */}
      <div className="h-[520px] w-full rounded-2xl border bg-card/60 backdrop-blur-xs relative overflow-hidden shadow-xs">
        <ReactFlowProvider>
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, n) => setSelectedLimitationNode(n.data as LimitationNodeData)}
            onPaneClick={() => setSelectedLimitationNode(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.6}
            className="bg-muted/15"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#94A3B8" />
            <Controls className="!bottom-4 !right-4 !rounded-xl !border !bg-card/90 !shadow-xs" />
            <MiniMap
              className="!bottom-4 !left-4 !rounded-xl !border !bg-card/90 !shadow-xs !overflow-hidden"
              zoomable
              pannable
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <div className="p-3 rounded-xl border bg-muted/15 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          <Compass className="size-3.5 text-primary" />
          <span>Navigasi: Geser kanvas untuk menjelajahi rantai limitasi. Klik salah satu kartu untuk memperbesar fokus.</span>
        </span>
        <span className="font-semibold text-primary">
          {graph.nodes.length} Simpul Relasi Aktif
        </span>
      </div>
    </div>
  )
}
