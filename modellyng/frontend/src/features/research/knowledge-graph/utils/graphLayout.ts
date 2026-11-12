/**
 * Zone-based layered layout of the knowledge graph.
 *
 * Same idea as the mobile backend (`layout.py`): nodes are grouped into vertical zones by
 * saturation status, ordered left to right as none (research gaps), low, medium, high.
 * Inside each zone nodes are stacked in columns and ordered by the average position of their
 * neighbours (barycenter heuristic), which keeps connected nodes close and edges short.
 */

import type {
  GraphZoneKey,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeGraphZone,
} from "../types/knowledgeGraphTypes"

export const NODE_WIDTH = 248
/** Typical rendered height of a node card; real heights are measured by React Flow. */
export const NODE_HEIGHT = 96

/** Left to right. Paper nodes always live in the `source` band at the right edge. */
export const ZONE_ORDER: GraphZoneKey[] = ["none", "low", "medium", "high", "source"]

export function zoneOf(node: Pick<KnowledgeGraphNode, "kind" | "saturation">): GraphZoneKey {
  return node.kind === "paper" ? "source" : node.saturation
}

const ROW_GAP = 40
const COLUMN_GAP = 72
const ZONE_GAP = 140
const ZONE_PADDING_X = 36
const ZONE_PADDING_TOP = 96
const ZONE_PADDING_BOTTOM = 56
const MAX_NODES_PER_COLUMN = 8
const BARYCENTER_PASSES = 6

const ROW_PITCH = NODE_HEIGHT + ROW_GAP

const KIND_RANK: Record<KnowledgeGraphNode["kind"], number> = {
  research_area: 0,
  concept: 1,
  object: 2,
  method: 3,
  result: 4,
  gap: 5,
  paper: 6,
}

type LayoutNode = Pick<KnowledgeGraphNode, "id" | "kind" | "label" | "saturation">
type LayoutEdge = Pick<KnowledgeGraphEdge, "source" | "target">

interface Column {
  x: number
  nodes: LayoutNode[]
  /** Vertical position of each node in this column, by node id. */
  y: Map<string, number>
}

export interface GraphLayout {
  positions: Map<string, { x: number; y: number }>
  zones: KnowledgeGraphZone[]
}

function chunkEvenly<T>(items: T[], maxPerChunk: number): T[][] {
  if (items.length === 0) return []
  const chunkCount = Math.ceil(items.length / maxPerChunk)
  const size = Math.ceil(items.length / chunkCount)
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

function compareNodes(a: LayoutNode, b: LayoutNode): number {
  return KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.label.localeCompare(b.label, "id")
}

export function layoutKnowledgeGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): GraphLayout {
  if (nodes.length === 0) return { positions: new Map(), zones: [] }

  // 1. Build columns zone by zone
  const columnsByZone = new Map<GraphZoneKey, Column[]>()
  const allColumns: Column[] = []

  for (const zone of ZONE_ORDER) {
    const zoneNodes = nodes.filter((node) => zoneOf(node) === zone).sort(compareNodes)
    if (zoneNodes.length === 0) continue

    const columns = chunkEvenly(zoneNodes, MAX_NODES_PER_COLUMN).map((group) => ({
      x: 0,
      nodes: group,
      y: new Map<string, number>(),
    }))
    columnsByZone.set(zone, columns)
    allColumns.push(...columns)
  }

  // 2. Horizontal position of every column
  let cursorX = 0
  for (const zone of ZONE_ORDER) {
    const columns = columnsByZone.get(zone)
    if (!columns) continue
    columns.forEach((column, index) => {
      column.x = cursorX
      cursorX += NODE_WIDTH + (index === columns.length - 1 ? ZONE_GAP : COLUMN_GAP)
    })
  }

  const columnOf = new Map<string, Column>()
  allColumns.forEach((column) => column.nodes.forEach((node) => columnOf.set(node.id, column)))

  const neighbours = new Map<string, string[]>()
  for (const edge of edges) {
    if (!columnOf.has(edge.source) || !columnOf.has(edge.target)) continue
    neighbours.set(edge.source, [...(neighbours.get(edge.source) ?? []), edge.target])
    neighbours.set(edge.target, [...(neighbours.get(edge.target) ?? []), edge.source])
  }

  const tallest = Math.max(...allColumns.map((column) => column.nodes.length))
  const assignRows = (column: Column) => {
    const offset = ((tallest - column.nodes.length) * ROW_PITCH) / 2
    column.nodes.forEach((node, index) => column.y.set(node.id, offset + index * ROW_PITCH))
  }
  allColumns.forEach(assignRows)

  // 3. Reduce edge crossings: reorder each column by the average row of its neighbours
  const reorder = (column: Column) => {
    const score = (node: LayoutNode): number => {
      const rows = (neighbours.get(node.id) ?? [])
        .filter((id) => columnOf.get(id) !== column)
        .map((id) => columnOf.get(id)?.y.get(id))
        .filter((value): value is number => value !== undefined)
      if (rows.length === 0) return column.y.get(node.id) ?? 0
      return rows.reduce((sum, value) => sum + value, 0) / rows.length
    }
    const scored = column.nodes.map((node) => ({ node, score: score(node) }))
    scored.sort((a, b) => a.score - b.score || compareNodes(a.node, b.node))
    column.nodes = scored.map((entry) => entry.node)
    assignRows(column)
  }

  for (let pass = 0; pass < BARYCENTER_PASSES; pass++) {
    const sweep = pass % 2 === 0 ? allColumns : [...allColumns].reverse()
    sweep.forEach(reorder)
  }

  // 4. Final coordinates and one rectangle per zone (all zones share the same vertical extent)
  const positions = new Map<string, { x: number; y: number }>()
  allColumns.forEach((column) =>
    column.nodes.forEach((node) =>
      positions.set(node.id, { x: column.x, y: column.y.get(node.id) ?? 0 })
    )
  )

  const maxY = Math.max(...Array.from(positions.values(), (position) => position.y)) + NODE_HEIGHT
  const zones: KnowledgeGraphZone[] = []
  for (const zone of ZONE_ORDER) {
    const columns = columnsByZone.get(zone)
    if (!columns) continue
    zones.push({
      key: zone,
      minX: columns[0].x - ZONE_PADDING_X,
      maxX: columns[columns.length - 1].x + NODE_WIDTH + ZONE_PADDING_X,
      minY: -ZONE_PADDING_TOP,
      maxY: maxY + ZONE_PADDING_BOTTOM,
    })
  }

  return { positions, zones }
}
