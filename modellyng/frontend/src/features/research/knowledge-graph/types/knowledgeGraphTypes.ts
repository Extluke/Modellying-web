/**
 * Kontrak tipe data TypeScript untuk modul Knowledge Graph Spasial 2D & Saturasi Konsep.
 * Memetakan simpul konsep ilmiah, variabel, metodologi, dan celah riset ke dalam
 * 3 zona saturasi (Low/Novelty, Medium/Transisi, High/Mapan) pada kanvas React Flow.
 */

export type SaturationZone = "low" | "medium" | "high"

export type KnowledgeNodeType =
  | "concept"
  | "variable"
  | "method"
  | "dataset"
  | "research_gap"

export interface SourcePaperReference {
  id: string
  title: string
  authors: string[]
  year?: number | null
  quote?: string
  pageNumber?: number
}

export interface KnowledgeGraphNodeData extends Record<string, unknown> {
  id: string
  label: string
  nodeType: KnowledgeNodeType
  saturationZone: SaturationZone
  frequencyCount: number
  totalPapers: number
  saturationPercentage: number
  description: string
  sourcePapers: SourcePaperReference[]
}

export interface KnowledgeGraphEdgeData {
  id: string
  source: string
  target: string
  relationLabel: string
  zoneImpact: SaturationZone
}

export interface SaturationZoneMetrics {
  totalNodes: number
  lowCount: number
  mediumCount: number
  highCount: number
  gapCount: number
}
