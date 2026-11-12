import { cn } from "@/lib/utils"
import type { GraphZoneKey } from "../types/knowledgeGraphTypes"
import { ZONE_META } from "../utils/graphMeta"

interface ZoneChipProps {
  zone: GraphZoneKey
  /** Optional number shown after the zone title (e.g. node count). */
  count?: number
  className?: string
}

/** Small colored label of a saturation zone, shared by the zone bands and the detail panel. */
export function ZoneChip({ zone, count, className }: ZoneChipProps) {
  const meta = ZONE_META[zone]
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-badge border px-3 py-1 text-xs font-bold",
        meta.chip,
        className
      )}
    >
      <span className={cn("size-2 rounded-full", meta.dot)} />
      {meta.title}
      {count !== undefined && <span className="font-mono">{count}</span>}
    </span>
  )
}
