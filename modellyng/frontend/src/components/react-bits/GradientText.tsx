import React from "react"
import { cn } from "@/lib/utils"

export interface GradientTextProps {
  children: React.ReactNode
  colors?: string[]
  animationSpeed?: number
  className?: string
}

/**
 * Static rich brand gradient highlight (zero continuous repaint / safe WebKit text-clip compositing).
 */
export function GradientText({
  children,
  colors = ["#5147E5", "#3730A3"],
  className,
}: GradientTextProps) {
  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent pb-[0.08em]",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        WebkitBackgroundClip: "text",
      }}
    >
      {children}
    </span>
  )
}
