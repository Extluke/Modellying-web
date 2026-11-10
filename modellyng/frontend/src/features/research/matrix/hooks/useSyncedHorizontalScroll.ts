import { useCallback, useRef } from "react"
import type { RefCallback, UIEvent } from "react"

export interface SyncedScrollProps {
  ref: RefCallback<HTMLDivElement>
  onScroll: (event: UIEvent<HTMLDivElement>) => void
}

/**
 * Keeps the horizontal scroll position of several scroll containers in sync
 * (content table and writing-structure table share the same column layout).
 */
export function useSyncedHorizontalScroll(count: number) {
  const elements = useRef<(HTMLDivElement | null)[]>(Array.from({ length: count }, () => null))

  const getScrollProps = useCallback(
    (index: number): SyncedScrollProps => ({
      ref: (element) => {
        elements.current[index] = element
      },
      onScroll: (event) => {
        const left = event.currentTarget.scrollLeft
        elements.current.forEach((element, i) => {
          if (element && i !== index && Math.abs(element.scrollLeft - left) > 1) {
            element.scrollLeft = left
          }
        })
      },
    }),
    []
  )

  const scrollBy = useCallback((delta: number) => {
    elements.current.find((element) => element !== null)?.scrollBy({ left: delta, behavior: "smooth" })
  }, [])

  return { getScrollProps, scrollBy }
}
