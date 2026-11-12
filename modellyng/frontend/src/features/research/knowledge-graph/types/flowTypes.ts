import type { Edge, Node } from "@xyflow/react"
import type {
  GraphNodeKind,
  GraphRelation,
  KnowledgeGraphNode,
  KnowledgeGraphZone,
} from "./knowledgeGraphTypes"

export interface KnowledgeNodeData extends Record<string, unknown> {
  node: KnowledgeGraphNode
  totalPapers: number
  /** Not matching the active filter / search, or not related to the node in focus. */
  dimmed: boolean
}

export interface ZoneNodeData extends Record<string, unknown> {
  zone: KnowledgeGraphZone
  /** Number of graph nodes inside the zone. */
  count: number
}

export type EdgeEmphasis = "normal" | "highlight" | "dimmed"

export interface FloatingEdgeData extends Record<string, unknown> {
  relation: GraphRelation
  sourceKind: GraphNodeKind
  targetKind: GraphNodeKind
  detail?: string
  emphasis: EdgeEmphasis
}

export type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">
export type ZoneFlowNode = Node<ZoneNodeData, "zone">
export type GraphFlowNode = KnowledgeFlowNode | ZoneFlowNode
export type GraphFlowEdge = Edge<FloatingEdgeData, "floating">

export function isKnowledgeFlowNode(node: GraphFlowNode): node is KnowledgeFlowNode {
  return node.type === "knowledge"
}
