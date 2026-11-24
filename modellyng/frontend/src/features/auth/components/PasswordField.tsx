import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input, type InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PasswordFieldProps
  extends Omit<InputProps, "type"> {
  showPassword: boolean
  onToggleVisibility: () => void
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, showPassword, onToggleVisibility, disabled, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          tabIndex={-1}
          aria-pressed={showPassword}
          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    )
  }
)

PasswordField.displayName = "PasswordField"
