import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  FolderKanban,
  TableProperties,
  GitBranch,
  Network,
  Settings,
  BookOpenCheck,
  Bell,
  Sparkles,
  Palette,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/app/routes"

const navigationItems = [
  { name: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Proyek Riset", href: ROUTES.PROJECTS.ROOT, icon: FolderKanban },
  { name: "Matriks Komparasi", href: ROUTES.RESEARCH.MATRIX, icon: TableProperties },
  { name: "Kanvas Alur Riset", href: ROUTES.RESEARCH.FLOW, icon: GitBranch },
  { name: "Graf Pengetahuan", href: ROUTES.RESEARCH.GRAPH, icon: Network },
  { name: "Notifikasi", href: ROUTES.USER.NOTIFICATIONS, icon: Bell },
  { name: "Pengaturan Akun", href: ROUTES.USER.SETTINGS, icon: Settings },
  { name: "Design System (UI)", href: ROUTES.STYLEGUIDE, icon: Palette },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-6">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          <BookOpenCheck className="size-4" />
        </div>
        <span className="font-bold tracking-tight text-foreground text-base">
          Modellyng
        </span>
        <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground ml-auto">
          WEB
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-secondary/50 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>Evidence-Centered</span>
          </div>
          <p className="text-muted-foreground text-[11px] mt-1">
            100% kutipan tertaut langsung ke teks asli pada PDF.
          </p>
        </div>
      </div>
    </aside>
  )
}
