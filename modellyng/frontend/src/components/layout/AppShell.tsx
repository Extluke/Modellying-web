import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

/**
 * AppShell provides the main responsive wrapper for authenticated application routes.
 * Contains persistent desktop sidebar, top header bar, and main content area.
 */
export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
