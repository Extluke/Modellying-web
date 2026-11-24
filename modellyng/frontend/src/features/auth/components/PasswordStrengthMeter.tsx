import { Check } from "lucide-react"
import { evaluatePasswordStrength } from "@/features/auth/utils/validation"
import { cn } from "@/lib/utils"

interface PasswordStrengthMeterProps {
  password: string
}

const SEGMENT_ACTIVE_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted",
  1: "bg-status-red",
  2: "bg-status-orange",
  3: "bg-primary",
  4: "bg-status-green",
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, label, checks } = evaluatePasswordStrength(password)
  const activeColorClass = SEGMENT_ACTIVE_CLASSES[score]

  return (
    <div className="flex flex-col gap-2 pt-1">
      {password.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
            {([1, 2, 3, 4] as const).map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-200",
                  score >= level ? activeColorClass : "bg-muted"
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Kekuatan kata sandi</span>
            <span className="font-semibold text-foreground">{label}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 transition-colors",
            checks.minLength
              ? "bg-status-green-soft text-status-green font-semibold"
              : "bg-muted text-muted-foreground"
          )}
        >
          {checks.minLength && <Check className="size-3" />}
          <span>Minimal 8 karakter</span>
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 transition-colors",
            checks.hasLetter && checks.hasNumber
              ? "bg-status-green-soft text-status-green font-semibold"
              : "bg-muted text-muted-foreground"
          )}
        >
          {checks.hasLetter && checks.hasNumber && <Check className="size-3" />}
          <span>Kombinasi Huruf & Angka</span>
        </span>
      </div>
    </div>
  )
}
