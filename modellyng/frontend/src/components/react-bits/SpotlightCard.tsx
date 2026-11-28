import React, { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string
  hoverLift?: boolean
}

/**
 * React Bits SpotlightCard with GPU-isolated pseudo-element specular glow.
 * Updates CSS vars inside rAF (desktop hover only) and uses `contain: layout paint`
 * to avoid flexing layout disruption or Safari page-wide repaint lag.
 */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(81, 71, 229, 0.14)",
  hoverLift = true,
  onMouseMove,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(event)
    if (prefersReducedMotion || !cardRef.current) return
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) return

    const el = cardRef.current
    const clientX = event.clientX
    const clientY = event.clientY

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = window.requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty("--spotlight-x", `${clientX - rect.left}px`)
      el.style.setProperty("--spotlight-y", `${clientY - rect.top}px`)
    })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      style={{ "--spotlight-color": spotlightColor } as React.CSSProperties}
      className={cn(
        "rb-spotlight-card relative overflow-hidden rounded-xl border border-border/80 bg-card",
        hoverLift
          ? "transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
          : "transition-colors duration-150 hover:border-primary/35",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
