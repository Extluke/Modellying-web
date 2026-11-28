import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

export type RotatingStaggerFrom = "first" | "last" | "center"

export interface RotatingTextProps {
  /** Primary React Bits prop: list of strings to rotate through */
  texts?: string[]
  /** Legacy alias supported for convenience */
  phrases?: string[]
  /** Rotation interval in milliseconds (default: 2600) */
  rotationInterval?: number
  /** Legacy alias for rotationInterval */
  intervalMs?: number
  /** How text splits when animating: 'characters' or 'words' (default: 'characters') */
  splitBy?: "characters" | "words"
  /** Stagger delay per character/word in seconds (default: 0.025) */
  staggerDuration?: number
  /** Direction where character stagger originates (default: 'last') */
  staggerFrom?: RotatingStaggerFrom
  /** Loop back to start after last item (default: true) */
  loop?: boolean
  /** Auto rotate items on timer (default: true) */
  auto?: boolean
  /** Pause rotation while hovered (default: false) */
  pauseOnHover?: boolean
  /** Container pill class names */
  mainClassName?: string
  /** Outer className alias */
  className?: string
  /** Wrapper class around word/line group */
  splitLevelClassName?: string
  /** Class for individual character or word element */
  elementLevelClassName?: string
  /** Optional legacy item className */
  itemClassName?: string
  /** Callback when active index advances */
  onNext?: (index: number) => void
}

function splitWordUnits(text: string, splitBy: "characters" | "words"): Array<{ text: string; needsSpace: boolean }> {
  if (splitBy === "words") {
    const words = text.split(" ")
    return words.map((word, idx) => ({
      text: word,
      needsSpace: idx < words.length - 1,
    }))
  }

  const words = text.split(" ")
  return words.map((word, idx) => ({
    text: word,
    needsSpace: idx < words.length - 1,
  }))
}

function getStaggerMs(
  index: number,
  total: number,
  from: RotatingStaggerFrom,
  staggerSec: number
): number {
  const stepMs = staggerSec * 1000
  if (from === "first") return index * stepMs
  if (from === "last") return Math.max(0, total - 1 - index) * stepMs
  const center = Math.floor(total / 2)
  return Math.abs(center - index) * stepMs
}

/**
 * React Bits RotatingText (pill highlight + staggered character slide animation).
 * Pure GPU transform + opacity + adaptive width smoothing for zero lag in Safari/WebKit.
 */
export function RotatingText({
  texts,
  phrases,
  rotationInterval,
  intervalMs = 2600,
  splitBy = "characters",
  staggerDuration = 0.025,
  staggerFrom = "last",
  loop = true,
  auto = true,
  pauseOnHover = false,
  mainClassName,
  className,
  splitLevelClassName,
  elementLevelClassName,
  itemClassName,
  onNext,
}: RotatingTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const items = useMemo(() => {
    const source = texts && texts.length > 0 ? texts : phrases && phrases.length > 0 ? phrases : [""]
    return source
  }, [texts, phrases])

  const effectiveInterval = rotationInterval ?? intervalMs
  const [activeIndex, setActiveIndex] = useState(0)
  const [exitingIndex, setExitingIndex] = useState<number | null>(null)
  const [animStage, setAnimStage] = useState<"idle" | "prepare" | "run">("idle")
  const [isHovered, setIsHovered] = useState(false)
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null)

  const measureRef = useRef<HTMLSpanElement | null>(null)

  const measureActiveWidth = useCallback(() => {
    if (!measureRef.current) return
    const width = Math.ceil(measureRef.current.getBoundingClientRect().width)
    if (width > 0) {
      setMeasuredWidth(width)
    }
  }, [])

  useLayoutEffect(() => {
    measureActiveWidth()
  }, [activeIndex, items, measureActiveWidth])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = () => measureActiveWidth()
    window.addEventListener("resize", onResize)
    let cancelled = false
    if ("fonts" in document) {
      void document.fonts.ready.then(() => {
        if (!cancelled) measureActiveWidth()
      })
    }
    return () => {
      cancelled = true
      window.removeEventListener("resize", onResize)
    }
  }, [measureActiveWidth])

  useEffect(() => {
    if (
      prefersReducedMotion ||
      !auto ||
      items.length <= 1 ||
      (pauseOnHover && isHovered)
    ) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const atEnd = prev === items.length - 1
        if (atEnd && !loop) return prev
        const nextIdx = atEnd ? 0 : prev + 1
        setExitingIndex(prev)
        setAnimStage("prepare")
        onNext?.(nextIdx)
        return nextIdx
      })
    }, effectiveInterval)

    return () => window.clearInterval(timer)
  }, [prefersReducedMotion, auto, items.length, pauseOnHover, isHovered, loop, effectiveInterval, onNext])

  useEffect(() => {
    if (animStage !== "prepare") return
    let raf2 = 0
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setAnimStage("run")
      })
    })
    const clearTimer = window.setTimeout(() => {
      setExitingIndex(null)
      setAnimStage("idle")
    }, 620)

    return () => {
      window.cancelAnimationFrame(raf1)
      if (raf2) window.cancelAnimationFrame(raf2)
      window.clearTimeout(clearTimer)
    }
  }, [animStage])

  const currentText = items[activeIndex] ?? ""
  const exitingText = exitingIndex !== null ? items[exitingIndex] ?? null : null

  if (prefersReducedMotion || items.length === 1) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-xl",
          mainClassName,
          className
        )}
      >
        <span className={cn(elementLevelClassName, itemClassName)}>{currentText}</span>
      </span>
    )
  }

  const renderAnimatedLine = (
    text: string,
    mode: "enter" | "exit" | "static"
  ) => {
    const words = splitWordUnits(text, splitBy)
    const totalChars =
      splitBy === "characters"
        ? words.reduce((sum, w) => sum + Array.from(w.text).length, 0)
        : words.length

    let charCursor = 0

    return (
      <span className="inline-flex flex-nowrap items-center whitespace-nowrap">
        {words.map((wordObj, wordIdx) => {
          if (splitBy === "words") {
            const idx = charCursor++
            const delayMs = getStaggerMs(idx, totalChars, staggerFrom, staggerDuration)
            const transformValue =
              mode === "exit"
                ? animStage === "run"
                  ? "translate3d(0, -115%, 0)"
                  : "translate3d(0, 0, 0)"
                : mode === "enter" && animStage === "prepare"
                ? "translate3d(0, 110%, 0)"
                : "translate3d(0, 0, 0)"
            const opacityValue =
              mode === "exit"
                ? animStage === "run"
                  ? 0
                  : 1
                : mode === "enter" && animStage === "prepare"
                ? 0
                : 1

            return (
              <span
                key={`w-${wordIdx}`}
                className={cn("inline-flex overflow-hidden", splitLevelClassName)}
              >
                <span
                  style={{
                    transform: transformValue,
                    opacity: opacityValue,
                    transitionProperty: mode === "static" || animStage === "prepare" ? "none" : "transform, opacity",
                    transitionDuration: "420ms",
                    transitionDelay: mode === "static" ? "0ms" : `${delayMs}ms`,
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  className={cn("inline-block", elementLevelClassName, itemClassName)}
                >
                  {wordObj.text}
                </span>
                {wordObj.needsSpace && <span>&nbsp;</span>}
              </span>
            )
          }

          const chars = Array.from(wordObj.text)
          return (
            <span
              key={`wg-${wordIdx}`}
              className={cn("inline-flex overflow-hidden", splitLevelClassName)}
            >
              {chars.map((char, cIdx) => {
                const idx = charCursor++
                const delayMs = getStaggerMs(idx, totalChars, staggerFrom, staggerDuration)

                const transformValue =
                  mode === "exit"
                    ? animStage === "run"
                      ? "translate3d(0, -118%, 0)"
                      : "translate3d(0, 0, 0)"
                    : mode === "enter" && animStage === "prepare"
                    ? "translate3d(0, 112%, 0)"
                    : "translate3d(0, 0, 0)"

                const opacityValue =
                  mode === "exit"
                    ? animStage === "run"
                      ? 0
                      : 1
                    : mode === "enter" && animStage === "prepare"
                    ? 0
                    : 1

                const isNoTransition = mode === "static" || (mode === "enter" && animStage === "prepare") || (mode === "exit" && animStage === "prepare")

                return (
                  <span
                    key={`c-${wordIdx}-${cIdx}`}
                    style={{
                      transform: transformValue,
                      opacity: opacityValue,
                      transitionProperty: isNoTransition ? "none" : "transform, opacity",
                      transitionDuration: "400ms",
                      transitionDelay: isNoTransition ? "0ms" : `${delayMs}ms`,
                      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    className={cn("inline-block", elementLevelClassName, itemClassName)}
                  >
                    {char}
                  </span>
                )
              })}
              {wordObj.needsSpace && <span>&nbsp;</span>}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <span
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => pauseOnHover && setIsHovered(true)}
      onMouseLeave={() => pauseOnHover && setIsHovered(false)}
    >
      {/* Hidden intrinsic width measurer matching exact animated DOM structure */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className={cn(
          "fixed -left-[9999px] top-0 invisible pointer-events-none whitespace-nowrap inline-flex items-center",
          mainClassName,
          className
        )}
      >
        {renderAnimatedLine(currentText, "static")}
      </span>

      {/* Animated Adaptive-Width Pill Container */}
      <span
        aria-live="polite"
        style={
          measuredWidth
            ? {
                width: `${measuredWidth}px`,
                transition: "width 380ms cubic-bezier(0.22, 1, 0.36, 1)",
              }
            : undefined
        }
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap select-none",
          mainClassName,
          className
        )}
      >
        <span className="sr-only">{currentText}</span>

        {/* Exiting phrase overlay */}
        {exitingText !== null && animStage !== "idle" && (
          <span
            key={`exit-${exitingIndex}`}
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {renderAnimatedLine(exitingText, "exit")}
          </span>
        )}

        {/* Active / Entering phrase */}
        <span
          key={`enter-${activeIndex}`}
          aria-hidden="true"
          className="relative inline-flex items-center justify-center"
        >
          {renderAnimatedLine(currentText, animStage === "idle" ? "static" : "enter")}
        </span>
      </span>
    </span>
  )
}
