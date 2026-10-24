/**
 * Kontrak tipe data TypeScript untuk modul Research Gap Map & Peta Konsep Bukti (Concept Map)
 * Meliputi perbandingan berpasangan terurut 5 tahap, diagram alur Mermaid, dan relasi limitasi.
 */

export type DecisionStepType = "concept" | "variables" | "data_object" | "method" | "problem"

export type StepDecisionOutcome = "yes" | "no" | "insufficient_evidence"

export type GapValidationStatus = "pending" | "accepted" | "rejected"

export interface PairwiseStepResult {
  step: DecisionStepType
  stepNumber: 1 | 2 | 3 | 4 | 5
  stepName: string
  aspectQuestion: string
  outcome: StepDecisionOutcome
  paper1Evidence: { quote: string; pageNumber: number }
  paper2Evidence: { quote: string; pageNumber: number }
  reasoning: string
}

export interface PaperPairComparison {
  pairId: string
  paper1: { id: string; title: string; authors: string[]; year?: number | null }
  paper2: { id: string; title: string; authors: string[]; year?: number | null }
  status: "evaluating" | "completed" | "failed"
  stoppingStep: DecisionStepType | "no_gap"
  finalVerdict: "unrelated" | "candidate_gap" | "no_gap" | "insufficient_evidence"
  gapCategory?: "variables" | "data_object" | "method" | "problem"
  coreIssue?: string
  proposedNovelty?: string
  similarityScore: number // 0 - 100
  steps: PairwiseStepResult[]
  lastEvaluatedAt: string
}

export interface GapCandidateItem {
  id: string
  pairId?: string
  sourceType: "pairwise" | "limitations_future_work"
  domain: string
  gapCategory: string
  coreIssue: string
  concreteSolution: string
  proposedTitle: string
  noveltyScore: "Tinggi (High Impact)" | "Sedang (Medium Impact)"
  validationStatus: GapValidationStatus
  reviewerNotes?: string
  sourcePapers: Array<{ id: string; title: string; authors: string[]; year?: number | null }>
  evidenceQuote?: string
  pageNumber?: number
}

export type LimitationNodeType = "paper" | "limitation" | "future_work" | "novelty_gap"

export interface LimitationNodeData extends Record<string, unknown> {
  id: string
  nodeType: LimitationNodeType
  title: string
  description: string
  sourcePaperTitle?: string
  pageNumber?: number
  noveltyPotential?: "Tinggi" | "Sedang"
}
