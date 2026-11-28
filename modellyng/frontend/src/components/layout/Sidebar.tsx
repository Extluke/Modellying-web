import { useEffect, useRef } from "react"
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
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/app/routes"
import { useAuthStore } from "@/features/auth/store/authStore"
import modellyngLogo from "@/assets/modellyng-logo.jpg"
import { toast } from "@/lib/store/useToastStore"
import { useEscapeKey } from "@/hooks/useEscapeKey"

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

interface SidebarContentProps {
  onNavigate?: () => void
  showCloseButton?: boolean
  onClose?: () => void
}

function SidebarContent({ onNavigate, showCloseButton = false, onClose }: SidebarContentProps) {
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
    onNavigate?.()
    toast.info("Anda telah keluar dari sesi Modellyng.", 5000)
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  const roleDisplay = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "Researcher"

  return (
    <div className="flex h-full flex-col bg-card select-none">
      {/* 1. Header Sidebar: Logo & Badge */}
      <div className="flex h-14 items-center gap-2 border-b px-5 shrink-0">
        <Link to={ROUTES.DASHBOARD} onClick={onNavigate} className="flex items-center gap-2.5 group">
          <div className="size-7 rounded-lg overflow-hidden border border-border/60 shrink-0 shadow-xs group-hover:ring-2 group-hover:ring-primary/20 transition-[transform,box-shadow] duration-150 group-hover:scale-105">
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
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="ml-1 inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation List */}
      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 p-3 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Ruang Riset
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 min-h-[40px] py-2 text-xs font-medium transition-[transform,background-color,color] duration-150 active:scale-[0.98]",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white/90"
                    />
                  )}
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-150",
                      !isActive && "group-hover:scale-110"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </>
              )}
            </NavLink>
          )
        })}

        {isAdmin && (
          <div className="pt-3 mt-3 border-t space-y-1">
            <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Panel Administrator</span>
              <span className="rounded bg-primary-soft dark:bg-primary/15 text-primary border border-primary/20 px-1.5 py-0.5 text-[9px] font-bold">
                Admin
              </span>
            </div>
            {adminNavigationItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 min-h-[40px] py-2 text-xs font-medium transition-[transform,background-color,color] duration-150 active:scale-[0.98]",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white/90"
                        />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "size-4 shrink-0 transition-transform duration-150",
                          !isActive && "group-hover:scale-110"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </>
                  )}
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
            onClick={onNavigate}
            title={`Pengaturan Profil: ${user?.full_name || "Peneliti Modellyng"}${user?.email ? ` (${user.email})` : ""}`}
            className={cn(
              "flex items-center gap-2.5 rounded-xl p-1.5 min-h-[44px] transition-[background-color,box-shadow] cursor-pointer group flex-1 min-w-0",
              isSettingsActive
                ? "bg-primary/10 ring-1 ring-primary/25"
                : "hover:bg-muted"
            )}
          >
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 transition-[transform,background-color,box-shadow] shrink-0",
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
                <Settings className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
              </div>
              <span className="text-[10px] text-muted-foreground truncate">
                {roleDisplay}
              </span>
            </div>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Keluar dari akun"
            title="Keluar (Logout)"
            className="size-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 rounded-lg cursor-pointer"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const closeRef = useRef<HTMLDivElement | null>(null)
  useEscapeKey(mobileOpen, () => onMobileClose?.())

  useEffect(() => {
    if (mobileOpen && closeRef.current) {
      const firstFocusable = closeRef.current.querySelector<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      firstFocusable?.focus()
    }
  }, [mobileOpen])

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-full shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile slide-over navigation drawer */}
      {mobileOpen && (
        <div
          id="mobile-sidebar-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi Modellyng"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div
            ref={closeRef}
            className="relative z-10 w-72 max-w-[85vw] h-full border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200"
          >
            <SidebarContent
              onNavigate={onMobileClose}
              showCloseButton
              onClose={onMobileClose}
            />
          </div>
        </div>
      )}
    </>
  )
}
