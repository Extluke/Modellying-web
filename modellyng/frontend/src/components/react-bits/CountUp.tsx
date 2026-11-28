import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

export interface CountUpProps {
  to: number
  from?: number
  duration?: number
  delay?: number
  decimals?: number
  prefix?: string
  suffix?: string
  locale?: string
  className?: string
}

/**
 * React Bits inspired requestAnimationFrame counter with tabular-nums stability.
 */
export function CountUp({
  to,
  from = 0,
  duration = 750,
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "id-ID",
  className,
}: CountUpProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLSpanElement | null>(null)
  const [displayValue, setDisplayValue] = useState<number>(prefersReducedMotion ? to : from)
  const [hasStarted, setHasStarted] = useState<boolean>(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(to)
      setHasStarted(true)
      return
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setHasStarted(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [prefersReducedMotion, to])

  useEffect(() => {
    if (!hasStarted || prefersReducedMotion) {
      setDisplayValue(to)
      return
    }

    let rafId = 0
    let timeoutId: number | undefined
    const startVal = from
    const delta = to - startVal

    const startAnimation = () => {
      const startTime = performance.now()
      const tick = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(1, elapsed / duration)
        // easeOutCubic deceleration
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(startVal + delta * eased)
        if (progress < 1) {
          rafId = window.requestAnimationFrame(tick)
        } else {
          setDisplayValue(to)
        }
      }
      rafId = window.requestAnimationFrame(tick)
    }

    if (delay > 0) {
      timeoutId = window.setTimeout(startAnimation, delay)
    } else {
      startAnimation()
    }

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [hasStarted, to, from, duration, delay, prefersReducedMotion])

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(decimals > 0 ? Number(displayValue.toFixed(decimals)) : Math.round(displayValue))

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
