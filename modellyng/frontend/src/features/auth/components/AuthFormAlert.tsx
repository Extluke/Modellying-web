import type { ReactNode } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export type AuthAlertVariant = "error" | "success" | "warning" | "info"

interface AuthFormAlertProps {
  variant: AuthAlertVariant
  title?: string
  message: string
  action?: ReactNode
  className?: string
}

const VARIANT_STYLES: Record<
  AuthAlertVariant,
  { container: string; icon: ReactNode }
> = {
  error: {
    container: "border-destructive/25 bg-destructive/10 text-destructive",
    icon: <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />,
  },
  success: {
    container: "border-status-green/25 bg-status-green-soft text-status-green",
    icon: <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-status-green" />,
  },
  warning: {
    container: "border-status-orange/25 bg-status-orange-soft text-status-orange",
    icon: <AlertTriangle className="size-4 shrink-0 mt-0.5 text-status-orange" />,
  },
  info: {
    container: "border-primary/25 bg-primary-soft text-primary-soft-foreground",
    icon: <Info className="size-4 shrink-0 mt-0.5 text-primary" />,
  },
}

export function AuthFormAlert({
  variant,
  title,
  message,
  action,
  className,
}: AuthFormAlertProps) {
  const style = VARIANT_STYLES[variant]

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed animate-in fade-in-50",
        style.container,
        className
      )}
    >
      {style.icon}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="break-words">
          {title && <span className="font-semibold">{title} </span>}
          <span>{message}</span>
        </p>
        {action && <div className="pt-0.5">{action}</div>}
      </div>
    </div>
  )
}
