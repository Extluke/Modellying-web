import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { KnowledgeFlowNode } from "../types/flowTypes"
import { NODE_WIDTH } from "../utils/graphLayout"
import { GAP_TYPOLOGY_LABEL, KIND_META } from "../utils/graphMeta"

/**
 * Graph node card. Same look as the mobile app: gradient card, round icon badge,
 * upper-case kind label and a two-line title. The footer adds how many papers mention the node.
 */
export const KnowledgeGraphNodeCard = memo(function KnowledgeGraphNodeCard({
  data,
  selected,
}: NodeProps<KnowledgeFlowNode>) {
  const { node, totalPapers, dimmed } = data
  const meta = KIND_META[node.kind]
  const Icon = meta.icon

  const footer =
    node.kind === "paper"
      ? node.detail
      : node.kind === "gap" && node.gapTypology
        ? `${GAP_TYPOLOGY_LABEL[node.gapTypology]} \u00b7 ${node.paperIds.length}/${totalPapers} paper`
        : `${node.paperIds.length}/${totalPapers} paper`

  return (
    <div
      style={{ width: NODE_WIDTH }}
      title={node.label}
      className={cn(
        "cursor-pointer select-none rounded-2xl border border-white/25 bg-gradient-to-br px-4 py-3 text-white shadow-lg transition-[opacity,box-shadow,filter] duration-150",
        meta.gradient,
        meta.glow,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        dimmed && "opacity-25 saturate-50"
      )}
    >
      {/* Edges are drawn floating (see FloatingEdge); the handles only register the node for React Flow */}
      <Handle type="target" position={Position.Left} isConnectable={false} className="!pointer-events-none !opacity-0" />
      <Handle type="source" position={Position.Right} isConnectable={false} className="!pointer-events-none !opacity-0" />

      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/80">
            {meta.label}
          </p>
          <p className="mt-1 line-clamp-2 break-words text-sm font-bold leading-tight">{node.label}</p>
        </div>
      </div>

      <p className="mt-2.5 truncate border-t border-white/20 pt-2 text-[11px] font-medium text-white/80">
        {footer}
      </p>
    </div>
  )
})
