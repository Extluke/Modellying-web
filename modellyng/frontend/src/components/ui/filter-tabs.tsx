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

/** Segmented filter control with crisp active feedback and responsive scrolling. */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      className={cn(
        "flex h-10 items-center overflow-x-auto no-scrollbar rounded-button border border-input bg-card p-1 shadow-card max-w-full",
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
              "flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-xs font-medium transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.97] cursor-pointer",
              isActive
                ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden="true" />}
            <span className="tabular-nums">
              {option.label}
              {option.count !== undefined && ` (${option.count})`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
