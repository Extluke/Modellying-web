import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-button border border-input bg-card px-4 py-2.5 text-body-md text-foreground shadow-sm transition-colors",
          "placeholder:text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          error && "border-status-red focus-visible:ring-status-red",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
