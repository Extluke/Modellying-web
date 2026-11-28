import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

export interface BlurTextProps {
  text: string
  delay?: number
  animateBy?: "words" | "letters"
  direction?: "top" | "bottom"
  className?: string
  wordClassName?: string
}

/**
 * GPU-composited staggered headline reveal (transform + opacity only, zero CSS blur filter cost).
 */
export function BlurText({
  text,
  delay = 40,
  animateBy = "words",
  direction = "bottom",
  className,
  wordClassName,
}: BlurTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLSpanElement | null>(null)
  const [visible, setVisible] = useState<boolean>(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  const segments = animateBy === "words" ? text.split(" ") : Array.from(text)
  const yOffset = direction === "top" ? -8 : 8

  return (
    <span ref={ref} aria-label={text} className={cn("inline-flex flex-wrap gap-x-[0.26em]", className)}>
      {segments.map((segment, index) => (
        <span
          key={`${segment}-${index}`}
          aria-hidden="true"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translate3d(0, 0, 0)" : `translate3d(0, ${yOffset}px, 0)`,
                  transitionProperty: "transform, opacity",
                  transitionDuration: "380ms",
                  transitionDelay: `${index * delay}ms`,
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }
          }
          className={cn("inline-block pb-[0.04em]", wordClassName)}
        >
          {segment === " " ? "\u00A0" : segment}
        </span>
      ))}
    </span>
  )
}
