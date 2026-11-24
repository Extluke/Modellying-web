import { NavLink, Link, useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  FolderKanban,
  TableProperties,
  Network,
  Sparkles,
  Palette,
  ShieldAlert,
  Users,
  Cpu,
  CreditCard,
  Megaphone,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/app/routes"
import { useAuthStore } from "@/features/auth/store/authStore"
import modellyngLogo from "@/assets/modellyng-logo.jpg"

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
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role === "admin"

  const isSettingsActive = location.pathname === ROUTES.USER.SETTINGS

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "MD"

  const handleLogout = () => {
    logout()
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  const roleDisplay = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "Researcher"

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card h-full shrink-0 select-none">
      {/* 1. Header Sidebar: Logo & Badge */}
      <div className="flex h-14 items-center gap-2 border-b px-6 shrink-0">
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5 group">
          <div className="size-7 rounded-lg overflow-hidden border border-border/60 shrink-0 shadow-xs group-hover:ring-2 group-hover:ring-primary/20 transition-all">
            <img
              src={modellyngLogo}
              alt="Logo Modellyng"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold tracking-tight text-foreground text-base group-hover:text-primary transition-colors">
            Modellyng
          </span>
        </Link>
        <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground ml-auto">
          WEB
        </span>
      </div>

      {/* 2. Scrollable Navigation List */}
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

      {/* 3. Permanent Sidebar Footer: User Profile & Logout Action */}
      <div className="shrink-0 border-t border-border p-3 bg-card/60">
        <div className="flex items-center justify-between gap-1.5">
          <Link
            to={ROUTES.USER.SETTINGS}
            title={`Pengaturan Profil: ${user?.full_name || "Peneliti Modellyng"}${user?.email ? ` (${user.email})` : ""}`}
            className={cn(
              "flex items-center gap-2.5 rounded-xl p-1.5 transition-all cursor-pointer group flex-1 min-w-0",
              isSettingsActive
                ? "bg-primary/10 ring-1 ring-primary/25"
                : "hover:bg-muted"
            )}
          >
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 transition-all shrink-0",
                isSettingsActive
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-primary/10 text-primary ring-primary/20 group-hover:ring-primary/40"
              )}
            >
              {initials}
            </div>
            <div className="flex flex-col text-left text-xs min-w-0 flex-1">
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-xs">
                  {user?.full_name || "Peneliti Modellyng"}
                </span>
                <Settings className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
              <span className="text-[10px] text-muted-foreground truncate">
                {roleDisplay}
              </span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Keluar (Logout)"
            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 rounded-lg cursor-pointer"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
