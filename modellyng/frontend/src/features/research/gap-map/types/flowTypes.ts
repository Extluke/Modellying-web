/**
 * Tipe data TypeScript komprehensif untuk Kanvas Alur Riset (Research Flow Canvas)
 * Mendukung 4 tahapan alur berpikir: Topik -> Tema -> Masalah -> Solusi.
 */

export type FlowStage = "topic" | "theme" | "problem" | "solution"

export type NodeFrequencyStatus = "shared" | "gap"

export type FlowFilterMode = "all" | "shared_only" | "gap_only"

export interface SourcePaperRef {
  id: string
  title: string
  authors: string[]
  year?: number | null
  evidenceQuote?: string
  pageNumber?: number
}

export interface FlowNodeData extends Record<string, unknown> {
  id: string
  stage: FlowStage
  stageLabel: string // e.g. "Tahap 1: Topik Riset", "Tahap 4: Solusi Novelty"
  stageNumber: 1 | 2 | 3 | 4
  title: string
  description: string
  status: NodeFrequencyStatus // "shared" (Hijau >=2 paper) vs "gap" (Merah 1 paper)
  paperCount: number
  papers: SourcePaperRef[]
  noveltyNote?: string
  gapReason?: string
}

export interface ActionRecommendation {
  id: string
  stage: FlowStage
  stageNumber: 1 | 2 | 3 | 4
  stageTitle: string
  actionType: "harmonize" | "consolidate" | "validate" | "exploit"
  recommendationTitle: string
  concreteSteps: string[]
  badgeText: string
  statusAccent: "emerald" | "amber" | "indigo" | "rose"
  isHighPriority: boolean
}

export interface FlowGraphDataset {
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: FlowNodeData
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    animated?: boolean
    style?: { stroke?: string; strokeWidth?: number; strokeDasharray?: string }
    className?: string
  }>
  recommendations: ActionRecommendation[]
  metrics: {
    totalTopics: number
    totalThemes: number
    totalProblems: number
    totalSolutions: number
    sharedCount: number // >= 2 papers
    gapCount: number    // 1 paper / rare
  }
}
