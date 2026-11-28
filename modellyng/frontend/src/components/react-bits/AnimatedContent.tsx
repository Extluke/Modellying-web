import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

export interface AnimatedContentProps {
  children: React.ReactNode
  distance?: number
  direction?: "vertical" | "horizontal"
  reverse?: boolean
  duration?: number
  delay?: number
  initialOpacity?: number
  scale?: number
  threshold?: number
  immediate?: boolean
  className?: string
}

/**
 * React Bits inspired GPU-composited reveal container.
 * Uses IntersectionObserver (once) and strictly animates transform + opacity to prevent lag or CLS.
 */
export function AnimatedContent({
  children,
  distance = 22,
  direction = "vertical",
  reverse = false,
  duration = 520,
  delay = 0,
  initialOpacity = 0,
  scale = 1,
  threshold = 0.06,
  immediate = false,
  className,
}: AnimatedContentProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState<boolean>(prefersReducedMotion || immediate)

  useEffect(() => {
    if (prefersReducedMotion) {
      setInView(true)
      return
    }
    if (immediate) {
      const raf = window.requestAnimationFrame(() => setInView(true))
      return () => window.cancelAnimationFrame(raf)
    }

    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin: "0px 0px -24px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [prefersReducedMotion, immediate, threshold])

  const offset = reverse ? -distance : distance
  const hiddenTransform =
    direction === "horizontal"
      ? `translate3d(${offset}px, 0, 0) scale(${scale})`
      : `translate3d(0, ${offset}px, 0) scale(${scale})`

  const style: React.CSSProperties = prefersReducedMotion
    ? {}
    : {
        opacity: inView ? 1 : initialOpacity,
        transform: inView ? "translate3d(0, 0, 0) scale(1)" : hiddenTransform,
        transitionProperty: "transform, opacity",
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }

  return (
    <div ref={ref} style={style} className={cn(className)}>
      {children}
    </div>
  )
}
