import { memo } from "react"
import type { NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { ZoneFlowNode } from "../types/flowTypes"
import { ZONE_META } from "../utils/graphMeta"
import { ZoneChip } from "./ZoneChip"

/** Background band of a saturation zone. It lives in the flow coordinate space, so it pans and zooms with the graph. */
export const ZoneBackdropNode = memo(function ZoneBackdropNode({ data }: NodeProps<ZoneFlowNode>) {
  const meta = ZONE_META[data.zone.key]

  return (
    <div className={cn("relative size-full rounded-[28px] border-2 border-dashed", meta.band)}>
      <div className="absolute left-5 top-5 flex max-w-[calc(100%-2.5rem)] flex-col gap-1.5">
        <ZoneChip zone={data.zone.key} count={data.count} />
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{meta.hint}</p>
      </div>
    </div>
  )
})
