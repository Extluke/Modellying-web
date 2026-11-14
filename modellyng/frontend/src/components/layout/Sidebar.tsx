import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  FolderKanban,
  TableProperties,
  Network,
  BookOpenCheck,
  Sparkles,
  Palette,
  ShieldAlert,
  Users,
  Cpu,
  CreditCard,
  Megaphone,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/app/routes"
import { useAuthStore } from "@/features/auth/store/authStore"

const navigationItems = [
  { name: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Proyek Riset", href: ROUTES.PROJECTS.ROOT, icon: FolderKanban },
  { name: "Matriks Komparasi", href: ROUTES.RESEARCH.MATRIX, icon: TableProperties },
  { name: "Graf Pengetahuan", href: ROUTES.RESEARCH.GRAPH, icon: Network },
  { name: "Asisten Global", href: ROUTES.USER.CHAT, icon: Sparkles },
  { name: "Design System (UI)", href: ROUTES.STYLEGUIDE, icon: Palette },
]

const adminNavigationItems = [
  { name: "Dasbor Sistem", href: ROUTES.ADMIN.DASHBOARD, icon: ShieldAlert },
  { name: "Kelola Pengguna", href: ROUTES.ADMIN.USERS, icon: Users },
  { name: "Paket Langganan", href: ROUTES.ADMIN.SUBSCRIPTIONS, icon: CreditCard },
  { name: "CMS Berita & Promo", href: ROUTES.ADMIN.CMS, icon: Megaphone },
  { name: "Konfigurasi API AI", href: ROUTES.ADMIN.API_CONFIG, icon: Cpu },
  { name: "Tata Kelola Admin", href: ROUTES.ADMIN.ADMINS, icon: ShieldCheck },
]

export function Sidebar() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === "admin"

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

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
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

        {isAdmin && (
          <div className="pt-3 mt-3 border-t">
            <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Panel Administrator</span>
              <span className="rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 text-[9px] font-bold">
                Admin
              </span>
            </div>
            {adminNavigationItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-purple-600 text-white"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              )
            })}
          </div>
        )}
      </nav>
    </aside>
  )
}
