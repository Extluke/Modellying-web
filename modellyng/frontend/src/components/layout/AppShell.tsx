import { useState, useRef, useCallback } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

/**
 * AppShell provides the main responsive wrapper for authenticated application routes.
 * Contains persistent desktop sidebar, mobile slide-over drawer trigger, sticky top header bar,
 * keyboard skip link, and route entry transitions inside scrollable main content.
 */
export function AppShell() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const handleCloseMobile = useCallback(() => {
    setMobileMenuOpen(false)
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus()
    })
  }, [])

  return (
    <div className="flex h-screen h-dvh w-full overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        Lewati ke konten utama
      </a>

      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={handleCloseMobile}
      />

      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          mobileMenuTriggerRef={triggerRef}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto min-w-0 focus:outline-none">
          <div key={location.pathname} className="fx-page-enter min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
