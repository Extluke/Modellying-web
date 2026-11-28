import React, { useState, useMemo, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Bell, Search, Menu, FolderKanban, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { cn } from "@/lib/utils"
import { useProjects } from "@/features/projects/api/projectsApi"

export interface HeaderProps {
  onOpenMobileMenu?: () => void
  mobileMenuOpen?: boolean
  mobileMenuTriggerRef?: React.RefObject<HTMLButtonElement | null>
}

export function Header({
  onOpenMobileMenu,
  mobileMenuOpen = false,
  mobileMenuTriggerRef,
}: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isNotificationsActive = location.pathname === ROUTES.USER.NOTIFICATIONS

  const [query, setQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement | null>(null)

  const { data: projects = [] } = useProjects({ status: "active" })

  const matchingProjects = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return []
    return projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          (p.description?.toLowerCase().includes(trimmed) ?? false)
      )
      .slice(0, 5)
  }, [projects, query])

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    setIsSearchFocused(false)
    if (!trimmed) {
      navigate(ROUTES.PROJECTS.ROOT)
      return
    }
    navigate(`${ROUTES.PROJECTS.ROOT}?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-card px-3 sm:px-6 select-none">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Mobile navigation drawer trigger */}
        {onOpenMobileMenu && (
          <Button
            ref={mobileMenuTriggerRef}
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-sidebar-drawer"
            aria-label="Buka menu navigasi"
            className="md:hidden h-10 px-2.5 gap-1.5 shrink-0"
          >
            <Menu className="size-4" aria-hidden="true" />
            <span className="text-xs font-semibold">Menu</span>
          </Button>
        )}

        {/* Functional Quick Search Bar */}
        <div ref={searchWrapperRef} className="relative flex-1 max-w-xs sm:max-w-sm">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari proyek atau konsep riset..."
              aria-label="Cari proyek atau konsep riset"
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground fx-input-glow focus:outline-none focus:border-primary"
            />
          </form>

          {isSearchFocused && query.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-11 z-40 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-floating animate-in fade-in zoom-in-95 duration-150">
              {matchingProjects.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Proyek Cocok ({matchingProjects.length})
                  </div>
                  {matchingProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false)
                        navigate(`/projects/${project.id}/overview`)
                      }}
                      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderKanban className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                        <span className="truncate font-medium text-foreground">{project.name}</span>
                      </div>
                      <ArrowRight className="size-3 text-muted-foreground shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="mt-1 border-t border-border/60 px-2.5 py-1.5 text-left text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Lihat semua hasil untuk &quot;{query.trim()}&quot;
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Tekan Enter untuk mencari &quot;{query.trim()}&quot; di Proyek Riset
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications shortcut */}
        <Button
          asChild
          variant="ghost"
          size="icon"
          className={cn(
            "relative size-10 transition-colors cursor-pointer",
            isNotificationsActive
              ? "bg-primary/10 text-primary border border-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Buka Halaman Notifikasi & Status Pekerjaan"
        >
          <Link to={ROUTES.USER.NOTIFICATIONS} aria-label="Notifikasi">
            <Bell className="size-4" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-primary"
            />
          </Link>
        </Button>
      </div>
    </header>
  )
}
