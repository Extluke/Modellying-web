import { useEffect } from "react"

/**
 * Closes open modals, drawers, or popovers when Escape is pressed.
 */
export function useEscapeKey(isActive: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!isActive) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, onEscape])
}
