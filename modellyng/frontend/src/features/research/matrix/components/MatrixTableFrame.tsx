import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { SyncedScrollProps } from "../hooks/useSyncedHorizontalScroll"

/** Width of every paper column. Shared by all matrix tables so their columns stay aligned. */
export const PAPER_COLUMN_WIDTH_PX = 300

/** Sticky first column (parameter / chapter label). Width comes from the `--param-w` variable. */
export const STICKY_LABEL_CELL =
  "sticky left-0 z-10 border-b border-r border-border p-4 text-left align-top shadow-[2px_0_4px_-2px_rgba(23,32,51,0.08)]"

export const PAPER_CELL = "border-b border-r border-border p-4 align-top last:border-r-0"

interface MatrixTableFrameProps {
  paperCount: number
  scrollProps: SyncedScrollProps
  children: ReactNode
}

/**
 * Card + horizontal scroll container + fixed-layout table.
 * Narrow screens use a slimmer sticky label column so papers stay visible.
 */
export function MatrixTableFrame({ paperCount, scrollProps, children }: MatrixTableFrameProps) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
      <div
        ref={scrollProps.ref}
        onScroll={scrollProps.onScroll}
        className={cn("relative overflow-x-auto", "[--param-w:140px] sm:[--param-w:220px]")}
      >
        <table
          className="table-fixed border-separate border-spacing-0 text-left"
          style={{
            width: `calc(var(--param-w) + ${paperCount * PAPER_COLUMN_WIDTH_PX}px)`,
            minWidth: "100%",
          }}
        >
          <colgroup>
            <col style={{ width: "var(--param-w)" }} />
            {Array.from({ length: paperCount }, (_, index) => (
              <col key={index} />
            ))}
          </colgroup>
          {children}
        </table>
      </div>
    </div>
  )
}
