import { Link, useNavigate } from "react-router-dom"
import { Bell, Search, Sparkles, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { useAuthStore } from "@/features/auth/store/authStore"

export function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

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
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link to={ROUTES.USER.NOTIFICATIONS}>
            <Bell className="size-4 text-muted-foreground" />
          </Link>
        </Button>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div
            title={`${user?.full_name || 'Peneliti'} (${user?.email || ''})`}
            className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/20 cursor-default"
          >
            {initials}
          </div>
          <div className="hidden md:flex flex-col text-left text-xs">
            <span className="font-semibold text-foreground truncate max-w-[120px]">
              {user?.full_name || "Peneliti Modellyng"}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {user?.role || "researcher"}
            </span>
          </div>
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

