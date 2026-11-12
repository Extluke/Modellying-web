/**
 * Converts the knowledge graph into React Flow nodes and edges, and computes which nodes are
 * in focus for the current filters, search text and selected / hovered node.
 */

import type {
  GraphFlowEdge,
  GraphFlowNode,
  KnowledgeFlowNode,
} from "../types/flowTypes"
import type {
  GraphNodeKind,
  GraphZoneKey,
  KnowledgeGraphMap,
  KnowledgeGraphNode,
} from "../types/knowledgeGraphTypes"
import { NODE_HEIGHT, NODE_WIDTH, zoneOf } from "./graphLayout"
import { normalizeText } from "./graphText"

export function buildFlowNodes(graph: KnowledgeGraphMap): GraphFlowNode[] {
  const zoneNodes: GraphFlowNode[] = graph.zones.map((zone) => ({
    id: `zone:${zone.key}`,
    type: "zone",
    position: { x: zone.minX, y: zone.minY },
    width: zone.maxX - zone.minX,
    height: zone.maxY - zone.minY,
    data: {
      zone,
      count: graph.nodes.filter((node) => zoneOf(node) === zone.key).length,
    },
    draggable: false,
    selectable: false,
    focusable: false,
    connectable: false,
    zIndex: -1,
    style: { pointerEvents: "none" },
  }))

  const knowledgeNodes: KnowledgeFlowNode[] = graph.nodes.map((node) => ({
    id: node.id,
    type: "knowledge",
    position: { x: node.x, y: node.y },
    width: NODE_WIDTH,
    initialHeight: NODE_HEIGHT,
    data: { node, totalPapers: graph.totalPapers, dimmed: false },
    connectable: false,
  }))

  return [...zoneNodes, ...knowledgeNodes]
}

export function buildFlowEdges(graph: KnowledgeGraphMap): GraphFlowEdge[] {
  const kindOf = new Map<string, GraphNodeKind>(graph.nodes.map((node) => [node.id, node.kind]))

  return graph.edges.flatMap((edge) => {
    const sourceKind = kindOf.get(edge.source)
    const targetKind = kindOf.get(edge.target)
    if (!sourceKind || !targetKind) return []
    return [
      {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "floating" as const,
        selectable: false,
        focusable: false,
        data: {
          relation: edge.relation,
          sourceKind,
          targetKind,
          detail: edge.detail,
          emphasis: "normal" as const,
        },
      },
    ]
  })
}

export interface FocusFilters {
  zone: "all" | GraphZoneKey
  kind: "all" | GraphNodeKind
  query: string
}

export interface FocusState {
  /** Nodes that match the filters and the search text. */
  visible: Set<string>
  /** The active node and its direct neighbours, or `null` when no node is in focus. */
  related: Set<string> | null
}

function matchesQuery(node: KnowledgeGraphNode, query: string): boolean {
  if (!query) return true
  return normalizeText(`${node.label} ${node.detail}`).includes(query)
}

export function computeFocus(
  graph: KnowledgeGraphMap,
  filters: FocusFilters,
  activeId: string | null
): FocusState {
  const query = normalizeText(filters.query)
  const visible = new Set<string>()

  for (const node of graph.nodes) {
    const zoneOk = filters.zone === "all" || zoneOf(node) === filters.zone
    const kindOk = filters.kind === "all" || node.kind === filters.kind
    if (zoneOk && kindOk && matchesQuery(node, query)) visible.add(node.id)
  }

  if (!activeId) return { visible, related: null }

  const related = new Set<string>([activeId])
  for (const edge of graph.edges) {
    if (edge.source === activeId) related.add(edge.target)
    if (edge.target === activeId) related.add(edge.source)
  }
  return { visible, related }
}

export function isNodeDimmed(id: string, focus: FocusState): boolean {
  if (!focus.visible.has(id)) return true
  return focus.related !== null && !focus.related.has(id)
}

export function edgeEmphasis(
  edge: Pick<GraphFlowEdge, "source" | "target">,
  focus: FocusState,
  activeId: string | null
): "normal" | "highlight" | "dimmed" {
  if (activeId && (edge.source === activeId || edge.target === activeId)) return "highlight"
  if (activeId) return "dimmed"
  return focus.visible.has(edge.source) && focus.visible.has(edge.target) ? "normal" : "dimmed"
}
