/**
 * Builds the project knowledge graph from the comparative matrix.
 *
 * Follows the data model of the mobile app:
 *  - one `paper` node per paper;
 *  - entity nodes (research area, concept, method, object, result, gap) taken from extracted components;
 *  - relations paper -> entity (`studies` / `uses`), method -> result (`produces`) and
 *    result -> gap (`reveals`), so every entity is connected to the paper that reported it;
 *  - the same idea reported by several papers becomes ONE shared node, which links the papers together;
 *  - similar (but not identical) entities of different papers are linked with `relates_to`;
 *  - saturation = share of papers that mention the node (<= 20% low, <= 50% medium, otherwise high);
 *    research gaps are always `none`, like the mobile backend.
 *
 * Nothing is invented: every node text and every evidence quote comes from a matrix cell.
 */

import type {
  ComparativeMatrixResponse,
  MatrixCell,
  MatrixPaper,
} from "@/features/projects/api/projectsApi"
import type {
  GraphEvidence,
  GraphNodeKind,
  GraphRelation,
  KnowledgeGraphEdge,
  KnowledgeGraphMap,
  KnowledgeGraphNode,
  KnowledgeGraphSummary,
  SaturationStatus,
} from "../types/knowledgeGraphTypes"
import { layoutKnowledgeGraph } from "./graphLayout"
import {
  contentTokens,
  inferGapTypology,
  jaccard,
  shortLabel,
  sharedTokens,
  splitIntoItems,
} from "./graphText"

type EntityKind = Exclude<GraphNodeKind, "paper">

interface GraphSource {
  parameterKey: string
  kind: EntityKind
  relation: GraphRelation
  /** Which node of the same paper this entity hangs on. */
  parent: "paper" | "method" | "result"
}

/** Matrix parameters that become graph nodes. Order matters: parents are created before children. */
const GRAPH_SOURCES: GraphSource[] = [
  { parameterKey: "research_problem", kind: "research_area", relation: "studies", parent: "paper" },
  { parameterKey: "variables_concepts", kind: "concept", relation: "studies", parent: "paper" },
  { parameterKey: "dataset_sample", kind: "object", relation: "uses", parent: "paper" },
  { parameterKey: "methodology", kind: "method", relation: "uses", parent: "paper" },
  { parameterKey: "results_findings", kind: "result", relation: "produces", parent: "method" },
  { parameterKey: "limitations", kind: "gap", relation: "reveals", parent: "result" },
  { parameterKey: "future_work", kind: "gap", relation: "reveals", parent: "result" },
]

/** Two items of the same kind with at least this token overlap are the same node. */
const MERGE_SIMILARITY = 0.7
/** Looser overlap that only creates a `relates_to` link between different papers. */
const RELATE_MIN_SIMILARITY = 0.15
const RELATE_MIN_SHARED_TOKENS = 2
const MAX_RELATED_LINKS_PER_NODE = 3
/** Ranks "a short term contained in a longer one" (Transformer / Vision Transformer) above weak overlaps. */
const CONTAINMENT_BONUS = 0.3
/** Joining separate groups of papers requires at least 1 significant shared word. */
const BRIDGE_MIN_SHARED_TOKENS = 1

const SATURATION_LOW_MAX = 0.2
const SATURATION_MEDIUM_MAX = 0.5

const MAX_EVIDENCE_PER_CELL = 3

/** Paper statuses whose extraction is finished. Same rule as the project picker (`ready_count`). */
const ANALYZED_PAPER_STATUSES: ReadonlySet<string> = new Set(["ready", "needs_review"])

interface WorkingNode {
  id: string
  kind: GraphNodeKind
  label: string
  detail: string
  paperIds: string[]
  evidence: GraphEvidence[]
  confidenceSamples: number[]
  tokens: Set<string>
}

function saturationFor(kind: GraphNodeKind, paperCount: number, totalPapers: number): SaturationStatus {
  if (kind === "gap") return "none"
  if (kind === "paper") return "high"
  const ratio = paperCount / Math.max(totalPapers, 1)
  if (ratio <= SATURATION_LOW_MAX) return "low"
  if (ratio <= SATURATION_MEDIUM_MAX) return "medium"
  return "high"
}

function isUsableCell(cell: MatrixCell | undefined): cell is MatrixCell {
  return Boolean(cell && cell.state === "found" && cell.value?.text && cell.value.text.trim().length >= 4)
}

function toEvidence(cell: MatrixCell, paper: MatrixPaper, section: string): GraphEvidence[] {
  return (cell.evidence ?? [])
    .filter((item) => item.quote && item.quote.trim().length > 0)
    .slice(0, MAX_EVIDENCE_PER_CELL)
    .map((item) => ({
      paperId: paper.id,
      paperTitle: paper.title,
      section,
      pageNumber: item.page_index,
      quote: item.quote,
      blockId: item.block_id,
      bbox: item.bbox,
    }))
}

function normalizeConfidence(score: number | null | undefined): number | undefined {
  if (score === null || score === undefined || score <= 0) return undefined
  return score > 1 ? Math.min(score / 100, 1) : score
}

function describePaper(paper: MatrixPaper): string {
  const authors = paper.authors.length > 0 ? paper.authors.join(", ") : "Penulis tidak terdata"
  const year = paper.year ? ` (${paper.year})` : ""
  return `${authors}${year} \u00b7 ${paper.total_pages} halaman`
}

export function buildKnowledgeGraph(matrix: ComparativeMatrixResponse): KnowledgeGraphMap {
  // Papers still being processed (or failed) have no reliable extraction yet. Keeping them would
  // add isolated nodes and inflate the paper total that saturation is measured against.
  const papers = matrix.papers.filter((paper) => ANALYZED_PAPER_STATUSES.has(paper.status))
  const sectionLabel = new Map(
    matrix.parameters.map((parameter) => [parameter.key, parameter.label.id || parameter.label.en || parameter.key])
  )

  const nodes = new Map<string, WorkingNode>()
  const nodesByKind = new Map<GraphNodeKind, WorkingNode[]>()
  const edges = new Map<string, KnowledgeGraphEdge>()
  const counters = new Map<GraphNodeKind, number>()

  const addEdge = (source: string, target: string, relation: GraphRelation, detail?: string) => {
    if (source === target) return
    const id = `${source}->${target}:${relation}`
    if (!edges.has(id)) edges.set(id, { id, source, target, relation, detail })
  }

  // 1. Paper nodes
  const paperNodeId = (paperId: string) => `paper:${paperId}`
  for (const paper of papers) {
    const node: WorkingNode = {
      id: paperNodeId(paper.id),
      kind: "paper",
      label: paper.title,
      detail: describePaper(paper),
      paperIds: [paper.id],
      evidence: [],
      confidenceSamples: [],
      tokens: new Set(),
    }
    nodes.set(node.id, node)
    nodesByKind.set("paper", [...(nodesByKind.get("paper") ?? []), node])
  }

  // 2. Entity nodes, per paper, parents before children
  const upsertEntity = (
    kind: EntityKind,
    text: string,
    paper: MatrixPaper,
    evidence: GraphEvidence[],
    confidence: number | undefined
  ): WorkingNode => {
    const tokens = contentTokens(text)
    const sameKind = nodesByKind.get(kind) ?? []
    const duplicate = sameKind.find((candidate) => jaccard(candidate.tokens, tokens) >= MERGE_SIMILARITY)

    if (duplicate) {
      if (!duplicate.paperIds.includes(paper.id)) duplicate.paperIds.push(paper.id)
      duplicate.evidence.push(...evidence)
      if (confidence !== undefined) duplicate.confidenceSamples.push(confidence)
      return duplicate
    }

    const next = (counters.get(kind) ?? 0) + 1
    counters.set(kind, next)
    const node: WorkingNode = {
      id: `${kind}:${next}`,
      kind,
      label: shortLabel(text),
      detail: text,
      paperIds: [paper.id],
      evidence: [...evidence],
      confidenceSamples: confidence !== undefined ? [confidence] : [],
      tokens,
    }
    nodes.set(node.id, node)
    nodesByKind.set(kind, [...sameKind, node])
    return node
  }

  for (const paper of papers) {
    const anchors: { method?: string; result?: string } = {}

    for (const source of GRAPH_SOURCES) {
      const cell = matrix.matrix[source.parameterKey]?.[paper.id]
      if (!isUsableCell(cell)) continue

      const section = sectionLabel.get(source.parameterKey) ?? source.parameterKey
      const evidence = toEvidence(cell, paper, section)
      const confidence = normalizeConfidence(cell.confidence_score)

      const parentId =
        source.parent === "method"
          ? (anchors.method ?? paperNodeId(paper.id))
          : source.parent === "result"
            ? (anchors.result ?? anchors.method ?? paperNodeId(paper.id))
            : paperNodeId(paper.id)

      const items = splitIntoItems(cell.value.text ?? "")
      items.forEach((item, index) => {
        const node = upsertEntity(source.kind, item, paper, evidence, confidence)
        addEdge(parentId, node.id, source.relation)
        if (index === 0) {
          if (source.kind === "method") anchors.method = node.id
          if (source.kind === "result") anchors.result = node.id
        }
      })
    }
  }

  // 3. Cross-paper links between similar (not identical) entities
  const entityKinds = Array.from(nodesByKind.keys()).filter((kind) => kind !== "paper")
  const relatedCount = new Map<string, number>()
  const linkRelated = (a: WorkingNode, b: WorkingNode, shared: string[]) => {
    relatedCount.set(a.id, (relatedCount.get(a.id) ?? 0) + 1)
    relatedCount.set(b.id, (relatedCount.get(b.id) ?? 0) + 1)
    addEdge(a.id, b.id, "relates_to", `Kata kunci yang sama: ${shared.slice(0, 5).join(", ")}`)
  }

  for (const kind of entityKinds) {
    const sameKind = nodesByKind.get(kind) ?? []
    const candidates: Array<{ a: WorkingNode; b: WorkingNode; score: number; shared: string[] }> = []

    for (let i = 0; i < sameKind.length; i++) {
      for (let j = i + 1; j < sameKind.length; j++) {
        const a = sameKind[i]
        const b = sameKind[j]
        if (a.paperIds.some((id) => b.paperIds.includes(id))) continue

        const shared = sharedTokens(a.tokens, b.tokens)
        const score = jaccard(a.tokens, b.tokens)
        const similar = shared.length >= RELATE_MIN_SHARED_TOKENS && score >= RELATE_MIN_SIMILARITY
        if (similar || isContainedTerm(a.tokens, b.tokens)) {
          candidates.push({ a, b, score: similar ? score : score + CONTAINMENT_BONUS, shared })
        }
      }
    }

    candidates.sort((x, y) => y.score - x.score || x.a.id.localeCompare(y.a.id) || x.b.id.localeCompare(y.b.id))
    for (const { a, b, shared } of candidates) {
      if ((relatedCount.get(a.id) ?? 0) >= MAX_RELATED_LINKS_PER_NODE) continue
      if ((relatedCount.get(b.id) ?? 0) >= MAX_RELATED_LINKS_PER_NODE) continue
      linkRelated(a, b, shared)
    }
  }

  // 4. If the papers still form separate groups, join them through their most similar pair of entities
  for (let attempt = 0; attempt < nodes.size; attempt++) {
    const groupOf = connectedGroups(Array.from(nodes.keys()), Array.from(edges.values()))
    if (new Set(groupOf.values()).size <= 1) break

    let best: { a: WorkingNode; b: WorkingNode; score: number; shared: string[] } | null = null
    for (const kind of entityKinds) {
      const sameKind = nodesByKind.get(kind) ?? []
      for (let i = 0; i < sameKind.length; i++) {
        for (let j = i + 1; j < sameKind.length; j++) {
          const a = sameKind[i]
          const b = sameKind[j]
          if (groupOf.get(a.id) === groupOf.get(b.id)) continue
          const shared = sharedTokens(a.tokens, b.tokens)
          if (shared.length < BRIDGE_MIN_SHARED_TOKENS) continue
          const score = jaccard(a.tokens, b.tokens)
          if (!best || score > best.score) best = { a, b, score, shared }
        }
      }
    }
    if (!best) break
    linkRelated(best.a, best.b, best.shared)
  }

  // 5. Fallback bridge: ensure all papers within the same research project stay connected
  const finalGroupMap = connectedGroups(Array.from(nodes.keys()), Array.from(edges.values()))
  const distinctGroups = Array.from(new Set(finalGroupMap.values()))
  if (distinctGroups.length > 1) {
    for (let g = 0; g < distinctGroups.length - 1; g++) {
      const rootA = distinctGroups[g]
      const rootB = distinctGroups[g + 1]
      const nodesInA = Array.from(nodes.values()).filter((n) => finalGroupMap.get(n.id) === rootA)
      const nodesInB = Array.from(nodes.values()).filter((n) => finalGroupMap.get(n.id) === rootB)

      const anchorA =
        nodesInA.find((n) => n.kind === "research_area") ??
        nodesInA.find((n) => n.kind === "concept") ??
        nodesInA.find((n) => n.kind === "paper") ??
        nodesInA[0]

      const anchorB =
        nodesInB.find((n) => n.kind === "research_area") ??
        nodesInB.find((n) => n.kind === "concept") ??
        nodesInB.find((n) => n.kind === "paper") ??
        nodesInB[0]

      if (anchorA && anchorB) {
        addEdge(anchorA.id, anchorB.id, "relates_to", "Topik riset dalam proyek yang sama")
      }
    }
  }

  // 6. Saturation, layout, zones
  const totalPapers = papers.length
  const graphEdges = Array.from(edges.values())
  const layoutInput = Array.from(nodes.values(), (node) => ({
    id: node.id,
    kind: node.kind,
    label: node.label,
    saturation: saturationFor(node.kind, node.paperIds.length, totalPapers),
  }))
  const layout = layoutKnowledgeGraph(layoutInput, graphEdges)

  const finalNodes: KnowledgeGraphNode[] = Array.from(nodes.values(), (node) => {
    const position = layout.positions.get(node.id) ?? { x: 0, y: 0 }
    const confidence =
      node.confidenceSamples.length > 0
        ? node.confidenceSamples.reduce((sum, value) => sum + value, 0) / node.confidenceSamples.length
        : undefined

    return {
      id: node.id,
      kind: node.kind,
      label: node.label,
      detail: node.detail,
      saturation: saturationFor(node.kind, node.paperIds.length, totalPapers),
      paperIds: node.paperIds,
      evidence: node.evidence,
      confidence,
      gapTypology: node.kind === "gap" ? inferGapTypology(node.detail) : undefined,
      x: position.x,
      y: position.y,
    }
  })

  return {
    projectId: matrix.project_id,
    projectTitle: matrix.project_name,
    totalPapers,
    pendingPaperCount: matrix.papers.length - papers.length,
    nodes: finalNodes,
    edges: graphEdges,
    zones: layout.zones,
  }
}

/** Maps every node id to the id of its connected group (union-find). */
function connectedGroups(
  nodeIds: string[],
  edges: Array<Pick<KnowledgeGraphEdge, "source" | "target">>
): Map<string, string> {
  const parent = new Map<string, string>(nodeIds.map((id) => [id, id]))
  const find = (id: string): string => {
    let root = id
    while (parent.get(root) !== root) root = parent.get(root) ?? root
    return root
  }
  for (const edge of edges) {
    if (parent.has(edge.source) && parent.has(edge.target)) {
      parent.set(find(edge.source), find(edge.target))
    }
  }
  return new Map(nodeIds.map((id) => [id, find(id)]))
}

function countComponents(nodes: KnowledgeGraphNode[], edges: KnowledgeGraphEdge[]): number {
  const groups = connectedGroups(nodes.map((node) => node.id), edges)
  return new Set(groups.values()).size
}

/**
 * True when the shorter term is fully contained in the longer one, e.g. "Transformer" in
 * "Vision Transformer". Only short terms with a distinctive word qualify.
 */
function isContainedTerm(a: Set<string>, b: Set<string>): boolean {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  if (small.size === 0 || small.size > 2 || large.size <= small.size) return false
  const distinctive = Array.from(small).some((token) => token.length >= 5)
  return distinctive && Array.from(small).every((token) => large.has(token))
}

export function summarizeGraph(graph: KnowledgeGraphMap): KnowledgeGraphSummary {
  const zoneCounts: Record<SaturationStatus, number> = { none: 0, low: 0, medium: 0, high: 0 }
  let paperCount = 0
  let gapCount = 0

  for (const node of graph.nodes) {
    if (node.kind === "paper") {
      paperCount++
      continue
    }
    zoneCounts[node.saturation]++
    if (node.kind === "gap") gapCount++
  }

  return {
    paperCount,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    gapCount,
    zoneCounts,
    componentCount: countComponents(graph.nodes, graph.edges),
  }
}
