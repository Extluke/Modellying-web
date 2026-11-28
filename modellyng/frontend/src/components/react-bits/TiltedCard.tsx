import React, { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

export interface TiltedCardProps {
  children: React.ReactNode
  maxTiltDeg?: number
  scaleOnHover?: number
  className?: string
}

/**
 * Subtle 3D perspective card tilt for showcase previews on clean backgrounds.
 * Runs via rAF on desktop hover pointers only and cleans up pending frames on leave/unmount.
 */
export function TiltedCard({
  children,
  maxTiltDeg = 2.5,
  scaleOnHover = 1.008,
  className,
}: TiltedCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
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
    if (prefersReducedMotion || !containerRef.current) return
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) return

    const el = containerRef.current
    const clientX = event.clientX
    const clientY = event.clientY

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = window.requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      const px = (clientX - rect.left) / rect.width - 0.5
      const py = (clientY - rect.top) / rect.height - 0.5
      const rotateY = px * (maxTiltDeg * 2)
      const rotateX = -py * (maxTiltDeg * 2)
      el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, ${scaleOnHover})`
    })
  }

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
    }
    if (!containerRef.current) return
    containerRef.current.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={cn(className)}
    >
      {children}
    </div>
  )
}
