import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Focus, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  isKnowledgeFlowNode,
  type GraphFlowEdge,
  type GraphFlowNode,
} from "../types/flowTypes"
import type { KnowledgeGraphMap } from "../types/knowledgeGraphTypes"
import {
  buildFlowEdges,
  buildFlowNodes,
  computeFocus,
  edgeEmphasis,
  isNodeDimmed,
  type FocusFilters,
} from "../utils/flowModel"
import { KIND_META } from "../utils/graphMeta"
import { FloatingEdge } from "./FloatingEdge"
import { KnowledgeGraphNodeCard } from "./KnowledgeGraphNodeCard"
import { ZoneBackdropNode } from "./ZoneBackdropNode"

const nodeTypes: NodeTypes = {
  knowledge: KnowledgeGraphNodeCard,
  zone: ZoneBackdropNode,
}

const edgeTypes: EdgeTypes = {
  floating: FloatingEdge,
}

/** Never zoom in beyond this when fitting the whole graph, so a tiny graph does not become huge. */
const FIT_MAX_ZOOM = 0.9
const FIT_PADDING = 0.1

/**
 * Space taken by the node detail panel (see NodeDetailPanel): a 380px column on the right from the
 * `md` breakpoint up, a bottom sheet of 62% of the canvas height below it.
 */
const PANEL_WIDTH = 380
const PANEL_SHEET_HEIGHT_RATIO = 0.62
const PANEL_SIDE_BREAKPOINT = 768
/** Distance kept between a revealed node and the edge of the free canvas area. */
const REVEAL_MARGIN = 32

export interface KnowledgeGraphCanvasProps {
  graph: KnowledgeGraphMap
  filters: FocusFilters
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  /** Rendered on top of the canvas (the node detail panel). */
  overlay?: ReactNode
  className?: string
}

function GraphCanvas({
  graph,
  filters,
  selectedNodeId,
  onSelectNode,
  isFullscreen,
  onToggleFullscreen,
  overlay,
  className,
}: KnowledgeGraphCanvasProps) {
  const { fitView, zoomIn, zoomOut, getInternalNode, getViewport, setViewport } = useReactFlow<
    GraphFlowNode,
    GraphFlowEdge
  >()
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphFlowEdge>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const nodesInitialized = useNodesInitialized()
  const needsFit = useRef(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeId = hoveredId ?? selectedNodeId
  const focus = useMemo(
    () => computeFocus(graph, { zone: filters.zone, kind: filters.kind, query: filters.query }, activeId),
    [graph, filters.zone, filters.kind, filters.query, activeId]
  )

  // Rebuild the flow when the graph itself changes (new project, refreshed matrix)
  useEffect(() => {
    setNodes(buildFlowNodes(graph))
    setEdges(buildFlowEdges(graph))
    needsFit.current = true
  }, [graph, setNodes, setEdges])

  // Fit the whole graph once the freshly built nodes have been measured
  useEffect(() => {
    if (nodesInitialized && needsFit.current) {
      needsFit.current = false
      fitView({ padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 0 })
    }
  }, [nodesInitialized, fitView])

  // Selection / filter / hover only change the visual state, so measured sizes and dragged positions survive
  useEffect(() => {
    setNodes((current) =>
      current.map((node) =>
        isKnowledgeFlowNode(node)
          ? {
              ...node,
              selected: node.id === selectedNodeId,
              data: { ...node.data, dimmed: isNodeDimmed(node.id, focus) },
            }
          : node
      )
    )
    setEdges((current) =>
      current.map((edge) =>
        edge.data ? { ...edge, data: { ...edge.data, emphasis: edgeEmphasis(edge, focus, activeId) } } : edge
      )
    )
  }, [focus, selectedNodeId, activeId, setNodes, setEdges])

  // The detail panel covers part of the canvas. Pan just enough to bring a newly selected node, together
  // with the nodes it is connected to, into the free part, so none of them ends up hidden behind the panel.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !selectedNodeId) return

    const { width, height } = container.getBoundingClientRect()
    const isSideColumn = window.innerWidth >= PANEL_SIDE_BREAKPOINT
    const freeWidth = isSideColumn ? width - PANEL_WIDTH : width
    const freeHeight = isSideColumn ? height : height * (1 - PANEL_SHEET_HEIGHT_RATIO)
    const { x, y, zoom } = getViewport()

    // Screen rectangle of a group of nodes
    const boundsOf = (ids: string[]) => {
      const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
      for (const id of ids) {
        const internal = getInternalNode(id)
        if (!internal) continue
        const left = internal.internals.positionAbsolute.x * zoom + x
        const top = internal.internals.positionAbsolute.y * zoom + y
        box.left = Math.min(box.left, left)
        box.top = Math.min(box.top, top)
        box.right = Math.max(box.right, left + (internal.measured.width ?? 0) * zoom)
        box.bottom = Math.max(box.bottom, top + (internal.measured.height ?? 0) * zoom)
      }
      return box
    }

    const neighbourIds = graph.edges.flatMap((edge) =>
      edge.source === selectedNodeId ? [edge.target] : edge.target === selectedNodeId ? [edge.source] : []
    )
    const withNeighbours = boundsOf([selectedNodeId, ...neighbourIds])
    const fitsAll =
      withNeighbours.right - withNeighbours.left <= freeWidth - 2 * REVEAL_MARGIN &&
      withNeighbours.bottom - withNeighbours.top <= freeHeight - 2 * REVEAL_MARGIN
    // When the neighbours do not fit at this zoom level, the selected node alone must still be visible
    const target = fitsAll ? withNeighbours : boundsOf([selectedNodeId])
    if (!Number.isFinite(target.left)) return

    const shiftOnAxis = (start: number, end: number, limit: number) => {
      if (start < REVEAL_MARGIN) return REVEAL_MARGIN - start
      if (end > limit - REVEAL_MARGIN) return Math.max(limit - REVEAL_MARGIN - end, REVEAL_MARGIN - start)
      return 0
    }
    const dx = shiftOnAxis(target.left, target.right, freeWidth)
    const dy = shiftOnAxis(target.top, target.bottom, freeHeight)
    if (dx !== 0 || dy !== 0) setViewport({ x: x + dx, y: y + dy, zoom }, { duration: 300 })
  }, [selectedNodeId, graph.edges, getInternalNode, getViewport, setViewport])

  const handleNodeClick: NodeMouseHandler<GraphFlowNode> = useCallback(
    (_, node) => {
      if (isKnowledgeFlowNode(node)) onSelectNode(node.id)
    },
    [onSelectNode]
  )

  const handleNodeEnter: NodeMouseHandler<GraphFlowNode> = useCallback((_, node) => {
    if (isKnowledgeFlowNode(node)) setHoveredId(node.id)
  }, [])

  const resetLayout = () => {
    const basePositions = new Map(buildFlowNodes(graph).map((node) => [node.id, node.position]))
    setNodes((current) =>
      current.map((node) => {
        const position = basePositions.get(node.id)
        return position ? { ...node, position } : node
      })
    )
    window.requestAnimationFrame(() => fitView({ padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 400 }))
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden border border-border bg-card shadow-card",
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : "rounded-card",
        className
      )}
    >
      <ReactFlow<GraphFlowNode, GraphFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeEnter}
        onNodeMouseLeave={() => setHoveredId(null)}
        onPaneClick={() => onSelectNode(null)}
        minZoom={0.15}
        maxZoom={1.6}
        nodesConnectable={false}
        elementsSelectable
        aria-label="Kanvas graf pengetahuan"
        className="bg-background"
      >
        {/* #C3C8D0 = --canvas-edge. SVG patterns cannot read CSS variables. */}
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.4} color="#C3C8D0" />
        <MiniMap
          pannable
          zoomable
          position="bottom-left"
          nodeColor={(node) => {
            const data = node.data as Partial<{ node: { kind: keyof typeof KIND_META } }>
            return data.node ? KIND_META[data.node.kind].color : "transparent"
          }}
          nodeStrokeWidth={0}
          className="!m-3 !overflow-hidden !rounded-button !border !border-border !bg-card/95 !shadow-card"
        />
      </ReactFlow>

      {/* Top left, so the node detail panel (right side) never covers the controls */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-button border border-border bg-card/95 p-1 shadow-card backdrop-blur-xs">
        <Button variant="ghost" size="icon-sm" onClick={() => zoomIn({ duration: 250 })} title="Perbesar" aria-label="Perbesar">
          <ZoomIn />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => zoomOut({ duration: 250 })} title="Perkecil" aria-label="Perkecil">
          <ZoomOut />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => fitView({ padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 400 })}
          title="Tampilkan seluruh graf"
          aria-label="Tampilkan seluruh graf"
        >
          <Focus />
        </Button>
        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
        <Button variant="ghost" size="icon-sm" onClick={resetLayout} title="Atur ulang tata letak simpul" aria-label="Atur ulang tata letak simpul">
          <RotateCcw />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Keluar dari layar penuh" : "Layar penuh"}
          aria-label={isFullscreen ? "Keluar dari layar penuh" : "Layar penuh"}
        >
          {isFullscreen ? <Minimize2 /> : <Maximize2 />}
        </Button>
      </div>

      {overlay}
    </div>
  )
}

export function KnowledgeGraphCanvas(props: KnowledgeGraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  )
}
