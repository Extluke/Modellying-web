import { Link } from "react-router-dom"
import { Bell, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"

export function Header() {
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

      <div className="flex items-center gap-2">
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
        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
          MD
        </div>
      </div>
    </header>
  )
}
