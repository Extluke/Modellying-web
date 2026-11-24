import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { ROUTES } from "@/app/routes"

interface ProtectedRouteProps {
  children?: React.ReactNode
}

/**
 * Route guard that prevents unauthenticated users from accessing protected pages.
 * Redirects to /login while preserving the intended destination path.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    const redirectTarget = `${location.pathname}${location.search}${location.hash}`
    return (
      <Navigate
        to={ROUTES.AUTH.LOGIN}
        state={{ from: redirectTarget }}
        replace
      />
    )
  }

  return children ? <>{children}</> : <Outlet />
}
