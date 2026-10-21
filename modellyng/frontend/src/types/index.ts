/**
 * Core Domain Types for Modellyng Web.
 * Single Source of Truth based on modellyng/audit_fitur_dan_state_modellyng.md.
 */

export type PaperStatus =
  | "uploading"
  | "validating"
  | "processing"
  | "needs_review"
  | "ready"
  | "failed"

export type CitationStyle = "APA" | "IEEE" | "Harvard" | "Chicago" | "MLA"

export interface UserProfile {
  id: string
  email: string
  name: string
  avatarUrl?: string
  citationPreference: CitationStyle
  aiConfidenceThreshold: number // 0.0 to 1.0
}

export interface Project {
  id: string
  name: string
  description?: string
  paperCount: number
  readyPaperCount: number
  needsReviewCount: number
  createdAt: string
  updatedAt: string
}

export interface EvidenceSpan {
  id: string
  paperId: string
  pageNumber: number
  quoteText: string
  blockId?: string
  rectCoords?: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

export interface PaperComponent {
  id: string
  paperId: string
  componentKey:
    | "problem_formulation"
    | "research_question"
    | "methodology"
    | "sample_dataset"
    | "main_findings"
    | "limitations"
    | "future_work"
    | "theoretical_framework"
    | "key_variables"
    | "practical_implications"
    | "novelty"
  title: string
  content: string
  confidenceScore: number
  modelName: string
  status: "pending" | "accepted" | "revised" | "rejected"
  evidence: EvidenceSpan[]
}

export interface Paper {
  id: string
  projectId: string
  title: string
  fileName: string
  fileSize: number
  pageCount?: number
  doi?: string
  status: PaperStatus
  processingProgress: number // 0 to 100
  uploadedAt: string
  components?: PaperComponent[]
}
