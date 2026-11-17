import type {
  GapTypology,
  GraphEvidence,
  KnowledgeGraphMap,
  SynthesizeGraphNodesPayload,
} from "@/features/research/knowledge-graph/types/knowledgeGraphTypes"
import { getGapRecommendation, type GapRecommendation } from "./gapRecommendation"

/** One research gap of a project, paired with its follow-up recommendation. */
export interface GapItem {
  /** Id of the underlying `gap` node in the knowledge graph. */
  id: string
  /** 1-based position shown as "Gap 01". */
  number: number
  label: string
  /** Full gap statement as written (or derived) from the paper. */
  statement: string
  typology?: GapTypology
  /** Average extraction confidence (0..1), when the source components report one. */
  confidence?: number
  paperIds: string[]
  evidence: GraphEvidence[]
  recommendation: GapRecommendation
}

/** Context sent to the AI together with a gap: the results / methods it grew out of. */
const MAX_CONTEXT_NODES = 3
const MAX_DETAIL_CHARS = 1200

/** Builds the gap list from the `gap` nodes of the knowledge graph (limitations and future work). */
export function buildGapItems(graph: KnowledgeGraphMap): GapItem[] {
  return graph.nodes
    .filter((node) => node.kind === "gap")
    .map((node, index) => {
      const statement = node.detail.trim() || node.label
      return {
        id: node.id,
        number: index + 1,
        label: node.label,
        statement,
        typology: node.gapTypology,
        confidence: node.confidence,
        paperIds: node.paperIds,
        evidence: node.evidence,
        recommendation: getGapRecommendation({
          label: node.label,
          statement,
          quotes: node.evidence.map((item) => item.quote),
          typology: node.gapTypology,
        }),
      }
    })
}

/** "Gap 01" style label. */
export function formatGapNumber(number: number): string {
  return `Gap ${String(number).padStart(2, "0")}`
}

/** Confidence (0..1) as a whole percentage, or null when unknown. */
export function confidencePercent(confidence: number | undefined): number | null {
  return confidence === undefined ? null : Math.round(confidence * 100)
}

/** Short wording of the confidence band used on gap cards. */
export function confidenceLabel(confidence: number | undefined): string {
  if (confidence === undefined) return "Keyakinan belum tersedia"
  if (confidence >= 0.8) return "Keyakinan tinggi"
  if (confidence >= 0.5) return "Keyakinan sedang"
  return "Keyakinan rendah"
}

/** Request body for the synthesis endpoint: the gap itself plus the result / method it came from. */
export function buildSynthesisPayload(graph: KnowledgeGraphMap, gapId: string): SynthesizeGraphNodesPayload | null {
  const gap = graph.nodes.find((node) => node.id === gapId && node.kind === "gap")
  if (!gap) return null

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
  const context = graph.edges
    .filter((edge) => edge.target === gap.id || edge.source === gap.id)
    .flatMap((edge) => {
      const other = nodeById.get(edge.target === gap.id ? edge.source : edge.target)
      return other && (other.kind === "result" || other.kind === "method") ? [other] : []
    })
    .slice(0, MAX_CONTEXT_NODES)

  return {
    nodes: [gap, ...context].map((node) => ({
      kind: node.kind,
      label: node.label,
      detail: node.detail.slice(0, MAX_DETAIL_CHARS),
    })),
  }
}
