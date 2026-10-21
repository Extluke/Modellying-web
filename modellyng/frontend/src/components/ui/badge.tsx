import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Modellyng Official Badge & Status Chip Primitive.
 * Reference: modellyng/rekomendasi_arsitektur_web_dan_transisi.md (Section A & C)
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-bold transition-colors select-none tracking-wide",
  {
    variants: {
      variant: {
        // 1. Ready / Verified Status (Green #158466 on #E8F7F1)
        ready:
          "bg-status-green-soft text-status-green border border-status-green/20",
        success:
          "bg-status-green-soft text-status-green border border-status-green/20",

        // 2. Needs Review Status (Orange #E17A15 on #FFF3E4)
        review:
          "bg-status-orange-soft text-status-orange border border-status-orange/20",
        warning:
          "bg-status-orange-soft text-status-orange border border-status-orange/20",

        // 3. Error / Rejected Status (Red #D64555 on #FDECEF)
        error:
          "bg-status-red-soft text-status-red border border-status-red/20",
        destructive:
          "bg-status-red-soft text-status-red border border-status-red/20",

        // 4. Paper / Document Ingest (Blue #2878F0 on #EAF3FF)
        paper:
          "bg-status-blue-soft text-status-blue border border-status-blue/20",
        info:
          "bg-status-blue-soft text-status-blue border border-status-blue/20",

        // 5. Brand Primary Accent (Indigo #5147E5 on #EEECFF)
        primary:
          "bg-primary-soft text-primary-soft-foreground border border-primary/20",

        // 6. Neutral / Outline
        outline:
          "border border-border bg-card text-muted-foreground",

        // 7. Subtle Gray Fill
        muted:
          "bg-muted text-muted-foreground",
      },
      shape: {
        pill: "rounded-badge",        // 9999px (Standard pill chip)
        square: "rounded-badge-sm",   // 8px (Square mini status)
      },
      size: {
        default: "px-2.5 py-0.5 text-badge-mini",
        sm: "px-2 py-0.2 text-[10px] tracking-normal font-semibold",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      shape: "pill",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, shape, size, className }))} {...props} />
  )
}

export { Badge, badgeVariants }
