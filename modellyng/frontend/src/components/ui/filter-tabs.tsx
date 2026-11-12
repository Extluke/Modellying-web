import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterTabOption<T extends string> {
  id: T
  label: string
  count?: number
  icon?: LucideIcon
}

interface FilterTabsProps<T extends string> {
  options: FilterTabOption<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
}

/** Segmented filter control (same pattern as the Proyek Riset status filter). */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      className={cn(
        "flex h-10 items-center overflow-x-auto rounded-button border border-input bg-card p-1 shadow-card",
        className
      )}
    >
      {options.map((option) => {
        const Icon = option.icon
        const isActive = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-xs font-medium transition-all",
              isActive
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            <span>
              {option.label}
              {option.count !== undefined && ` (${option.count})`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
