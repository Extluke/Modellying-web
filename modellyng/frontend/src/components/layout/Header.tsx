import { Link, useNavigate, useLocation } from "react-router-dom"
import { Bell, Search, Sparkles, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { useAuthStore } from "@/features/auth/store/authStore"
import { cn } from "@/lib/utils"

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const isNotificationsActive = location.pathname === ROUTES.USER.NOTIFICATIONS
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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Cari paper, proyek, atau konsep..."
            className="h-9 w-64 rounded-md border bg-background pl-9 pr-4 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-80"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs">
          <Link to={ROUTES.USER.CHAT}>
            <Sparkles className="size-3.5 text-primary" />
            <span>Asisten Global</span>
          </Link>
        </Button>

        {/* Tombol Notifikasi di Navbar */}
        <Button
          asChild
          variant="ghost"
          size="icon"
          className={cn(
            "relative size-8 transition-colors",
            isNotificationsActive
              ? "bg-primary/10 text-primary border border-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Buka Halaman Notifikasi & Status Pekerjaan"
        >
          <Link to={ROUTES.USER.NOTIFICATIONS} aria-label="Notifikasi">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
          </Link>
        </Button>

        {/* User Account / Profile Button (Pindah dari Sidebar ke Navbar) */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <Link
            to={ROUTES.USER.SETTINGS}
            title="Klik untuk membuka Pengaturan Akun"
            className={cn(
              "flex items-center gap-2 rounded-lg p-1 sm:px-2 sm:py-1 transition-all cursor-pointer group",
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
            <div className="hidden md:flex flex-col text-left text-xs min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground truncate max-w-[120px] group-hover:text-primary transition-colors">
                  {user?.full_name || "Peneliti Modellyng"}
                </span>
                <Settings className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
              <span className="text-[10px] text-muted-foreground capitalize">
                {user?.role || "researcher"}
              </span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Keluar (Logout)"
            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

