import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

/**
 * AppShell provides the main responsive wrapper for authenticated application routes.
 * Contains persistent desktop sidebar, sticky top header bar, and scrollable main content area.
 * The outer container is locked to full viewport height (h-screen h-dvh overflow-hidden),
 * ensuring that the Sidebar and Navbar never disappear or scroll off-screen when the
 * page content is scrolled.
 */
export function AppShell() {
  return (
    <div className="flex h-screen h-dvh w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
