import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Modellyng Official Button Primitive.
 * Reference: modellyng/rekomendasi_arsitektur_web_dan_transisi.md (Section C)
 * Fully tokenized with border-radius: 12px (rounded-button).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-label-btn font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // 1. Primary Action (Indigo #5147E5 -> Hover #3730A3)
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover rounded-button",
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover rounded-button",

        // 2. Outlined Action (Border #E5E8EF -> Text #172033 -> Hover #F6F7FB)
        outline:
          "border border-border bg-card text-foreground shadow-sm hover:bg-background hover:text-primary rounded-button",

        // 3. Tonal / Soft Action (Surface #EEECFF -> Text #3730A3)
        soft:
          "bg-primary-soft text-primary-soft-foreground hover:bg-[#E0DCFF] rounded-[10px]",
        secondary:
          "bg-primary-soft text-primary-soft-foreground hover:bg-[#E0DCFF] rounded-[10px]",

        // 4. Destructive Action (Red #D64555 -> Hover #B83241)
        destructive:
          "bg-status-red text-white shadow-sm hover:bg-[#B83241] rounded-button",

        // 5. Subtle Ghost Action
        ghost:
          "text-foreground hover:bg-background hover:text-primary rounded-button",

        // 6. Inline Text Link
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-11 px-5 py-3 text-label-btn",   // 12px 20px (Desktop standard)
        sm: "h-9 px-4 py-2 text-xs",               // 10px 16px (Compact table/header)
        lg: "h-12 px-7 text-base rounded-button",
        icon: "size-10 rounded-button",
        "icon-sm": "size-8 rounded-button",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
