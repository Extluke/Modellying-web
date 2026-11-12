import { memo } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
} from "@xyflow/react"
import type { GraphFlowEdge } from "../types/flowTypes"
import { KIND_META, relationLabel } from "../utils/graphMeta"

interface Point {
  x: number
  y: number
}

function nodeBox(node: InternalNode) {
  const width = node.measured.width ?? node.width ?? 0
  const height = node.measured.height ?? node.height ?? node.initialHeight ?? 0
  const { x, y } = node.internals.positionAbsolute
  return { x, y, width, height, center: { x: x + width / 2, y: y + height / 2 } }
}

/** Point where the line from the node center towards `towards` leaves the node rectangle. */
function borderPoint(node: InternalNode, towards: Point): Point {
  const box = nodeBox(node)
  const dx = towards.x - box.center.x
  const dy = towards.y - box.center.y
  if (dx === 0 && dy === 0) return box.center

  const halfW = box.width / 2
  const halfH = box.height / 2
  const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH)
  return { x: box.center.x + dx * scale, y: box.center.y + dy * scale }
}

function sideOf(node: InternalNode, point: Point): Position {
  const box = nodeBox(node)
  const tolerance = 1.5
  if (Math.abs(point.x - box.x) <= tolerance) return Position.Left
  if (Math.abs(point.x - (box.x + box.width)) <= tolerance) return Position.Right
  if (Math.abs(point.y - box.y) <= tolerance) return Position.Top
  return Position.Bottom
}

function cssId(value: string): string {
  return `kg-edge-${value.replace(/[^a-zA-Z0-9]/g, "_")}`
}

const STROKE_BY_EMPHASIS = {
  normal: { width: 2, opacity: 0.45 },
  highlight: { width: 3, opacity: 0.95 },
  dimmed: { width: 1.5, opacity: 0.08 },
} as const

/**
 * Edge that leaves from the border of the source card and enters the border of the target card
 * on the side that faces it, drawn as a bezier curve with a gradient between the two node colors
 * (the mobile app draws a blue to purple curve between node centers).
 */
export const FloatingEdge = memo(function FloatingEdge({
  id,
  source,
  target,
  data,
}: EdgeProps<GraphFlowEdge>) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  if (!sourceNode || !targetNode || !data) return null

  const sourceCenter = nodeBox(sourceNode).center
  const targetCenter = nodeBox(targetNode).center
  const from = borderPoint(sourceNode, targetCenter)
  const to = borderPoint(targetNode, sourceCenter)

  const [path, labelX, labelY] = getBezierPath({
    sourceX: from.x,
    sourceY: from.y,
    sourcePosition: sideOf(sourceNode, from),
    targetX: to.x,
    targetY: to.y,
    targetPosition: sideOf(targetNode, to),
  })

  const gradientId = cssId(id)
  const stroke = STROKE_BY_EMPHASIS[data.emphasis]
  const isSimilarity = data.relation === "relates_to"

  return (
    <>
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={from.x} y1={from.y} x2={to.x} y2={to.y}>
          <stop offset="0%" stopColor={KIND_META[data.sourceKind].color} />
          <stop offset="100%" stopColor={KIND_META[data.targetKind].color} />
        </linearGradient>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={0}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: stroke.width,
          strokeOpacity: stroke.opacity,
          strokeDasharray: isSimilarity ? "7 6" : undefined,
          transition: "stroke-opacity 150ms, stroke-width 150ms",
        }}
      />
      {data.emphasis === "highlight" && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            className="pointer-events-none absolute z-10 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-card"
          >
            {relationLabel(data.relation, data.targetKind)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})
