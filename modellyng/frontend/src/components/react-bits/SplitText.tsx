import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

export interface SplitTextProps {
  text: string
  delay?: number
  duration?: number
  immediate?: boolean
  className?: string
  wordClassName?: string
}

/**
 * React Bits inspired masked word-by-word rise reveal.
 * Uses pure GPU transform + opacity inside overflow-hidden line clips for 60fps+ Safari rendering.
 */
export function SplitText({
  text,
  delay = 42,
  duration = 480,
  immediate = true,
  className,
  wordClassName,
}: SplitTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLSpanElement | null>(null)
  const [visible, setVisible] = useState<boolean>(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true)
      return
    }
    if (immediate) {
      const raf = window.requestAnimationFrame(() => setVisible(true))
      return () => window.cancelAnimationFrame(raf)
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
  }, [prefersReducedMotion, immediate])

  const words = text.split(" ")

  return (
    <span ref={ref} aria-label={text} className={cn("inline-flex flex-wrap gap-x-[0.26em]", className)}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom pb-[0.06em]"
        >
          <span
            style={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translate3d(0, 0, 0)" : "translate3d(0, 105%, 0)",
                    transitionProperty: "transform, opacity",
                    transitionDuration: `${duration}ms`,
                    transitionDelay: `${index * delay}ms`,
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  }
            }
            className={cn("inline-block", wordClassName)}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  )
}
