/**
 * Data contract of the Knowledge Graph module.
 *
 * It mirrors the mobile app (`KnowledgeGraphMap`): nodes with a `kind`, edges with a `relation`,
 * and saturation zones that group nodes spatially. On web the graph is derived from the
 * comparative matrix (see `utils/graphBuilder.ts`), so every node keeps its evidence chain:
 * node -> evidence quote -> paper -> page.
 */

/** How widely a node is covered by the papers of the project. `none` is reserved for research gaps. */
export type SaturationStatus = "none" | "low" | "medium" | "high"

/** Spatial band of the canvas: the four saturation zones plus the column that holds the paper nodes. */
export type GraphZoneKey = SaturationStatus | "source"

export type GraphNodeKind =
  | "paper"
  | "research_area"
  | "concept"
  | "method"
  | "object"
  | "result"
  | "gap"

export type GapTypology =
  | "methodological"
  | "dataset"
  | "population"
  | "empirical"
  | "theoretical"
  | "unexplored_concept"

/** Mobile `EdgeType` values that the web graph produces. */
export type GraphRelation = "studies" | "uses" | "produces" | "reveals" | "relates_to"

export interface GraphEvidence {
  paperId: string
  paperTitle: string
  /** Label of the extraction parameter the quote belongs to (e.g. "Pendekatan Metodologi"). */
  section?: string
  pageNumber?: number
  quote: string
  blockId?: string
  bbox?: [number, number, number, number]
}

export interface KnowledgeGraphNode {
  id: string
  kind: GraphNodeKind
  label: string
  detail: string
  saturation: SaturationStatus
  /** Papers that mention this node. A paper node lists only itself. */
  paperIds: string[]
  evidence: GraphEvidence[]
  /** Average model confidence (0..1) of the source components, when available. */
  confidence?: number
  gapTypology?: GapTypology
  x: number
  y: number
}

export interface KnowledgeGraphEdge {
  id: string
  source: string
  target: string
  relation: GraphRelation
  detail?: string
}

export interface KnowledgeGraphZone {
  key: GraphZoneKey
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface KnowledgeGraphMap {
  projectId: string
  projectTitle: string
  /** Papers shown on the graph (extraction finished). Saturation is measured against this number. */
  totalPapers: number
  /** Papers of the project that are left out because their analysis is not finished yet. */
  pendingPaperCount: number
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
  zones: KnowledgeGraphZone[]
}

export interface KnowledgeGraphSummary {
  paperCount: number
  nodeCount: number
  edgeCount: number
  gapCount: number
  /** Number of nodes per saturation zone (paper nodes excluded). */
  zoneCounts: Record<SaturationStatus, number>
  /** Number of separate groups of connected nodes. 1 means the whole graph is connected. */
  componentCount: number
}

/** Response of `POST /projects/{id}/knowledge-graph/synthesize` (same shape as the mobile app). */
export interface AiResearchSynthesis {
  usulan_judul: string[]
  rumusan_masalah: string[]
  pernyataan_novelty: string
  alasan_pemilihan: string
}

export interface SynthesizeGraphNodesPayload {
  nodes: Array<{ kind: GraphNodeKind; label: string; detail: string }>
}
