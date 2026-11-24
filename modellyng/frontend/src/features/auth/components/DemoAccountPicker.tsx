import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DemoAccountPreset {
  id: "admin" | "cahayu_pro" | "lawren_free"
  name: string
  badge: string
  email: string
  password: string
  cardClass: string
  titleHoverClass: string
  badgeClass: string
  ctaClass: string
  showCrown?: boolean
}

const DEMO_ACCOUNTS: readonly DemoAccountPreset[] = [
  {
    id: "admin",
    name: "Admin",
    badge: "Developer",
    email: "admin@modellyng.ac.id",
    password: "Password123",
    cardClass:
      "border-purple-200/80 dark:border-purple-900/60 hover:border-purple-600 hover:bg-purple-500/5",
    titleHoverClass: "group-hover:text-purple-600",
    badgeClass:
      "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border-purple-300/40",
    ctaClass: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "cahayu_pro",
    name: "Cahayu",
    badge: "Pro 30 Hari",
    email: "cahayu@modellyng.ac.id",
    password: "Password123",
    cardClass:
      "border-indigo-200/80 dark:border-indigo-900/60 hover:border-primary hover:bg-primary/5",
    titleHoverClass: "group-hover:text-primary",
    badgeClass: "text-primary bg-primary/10 border-primary/25",
    ctaClass: "text-primary",
    showCrown: true,
  },
  {
    id: "lawren_free",
    name: "Lawren",
    badge: "Free Plan",
    email: "lawren@modellyng.ac.id",
    password: "Password123",
    cardClass:
      "border-slate-200/90 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-500/5",
    titleHoverClass: "group-hover:text-slate-800 dark:group-hover:text-slate-200",
    badgeClass:
      "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    ctaClass: "text-muted-foreground group-hover:text-foreground",
  },
]

interface DemoAccountPickerProps {
  onSelect: (email: string, password: string) => void
  disabled?: boolean
}

export function DemoAccountPicker({ onSelect, disabled = false }: DemoAccountPickerProps) {
  if (import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === "false") {
    return null
  }

  return (
    <div className="mb-5 flex flex-col gap-2.5 rounded-xl border border-indigo-200/90 bg-indigo-50/70 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300">
          Pilihan Akun Uji Coba:
        </span>
        <span className="text-[10px] text-muted-foreground">
          Klik salah satu untuk isi otomatis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(account.email, account.password)}
            className={cn(
              "flex flex-col items-start justify-between rounded-lg border bg-background/95 p-2 text-left transition-all shadow-2xs group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              account.cardClass
            )}
          >
            <div className="flex items-center justify-between w-full gap-1 mb-1">
              <span
                className={cn(
                  "text-[11px] font-bold text-foreground transition-colors truncate",
                  account.titleHoverClass
                )}
              >
                {account.name}
              </span>
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 flex items-center gap-0.5",
                  account.badgeClass
                )}
              >
                {account.showCrown && <Crown className="size-2.5 text-amber-500" />}
                <span>{account.badge}</span>
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full font-mono mb-1.5">
              {account.email}
            </span>
            <span className={cn("text-[9px] font-semibold group-hover:underline", account.ctaClass)}>
              Isi Otomatis &rarr;
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
