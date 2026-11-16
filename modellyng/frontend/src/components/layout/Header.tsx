import { Link, useLocation } from "react-router-dom"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { cn } from "@/lib/utils"

export function Header() {
  const location = useLocation()
  const isNotificationsActive = location.pathname === ROUTES.USER.NOTIFICATIONS

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-card px-6 select-none">
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
        {/* Tombol Notifikasi di Navbar */}
        <Button
          asChild
          variant="ghost"
          size="icon"
          className={cn(
            "relative size-8 transition-colors cursor-pointer",
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
      </div>
    </header>
  )
}
