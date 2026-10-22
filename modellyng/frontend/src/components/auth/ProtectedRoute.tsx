import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { ROUTES } from "@/app/routes"

interface ProtectedRouteProps {
  children?: React.ReactNode
}

/**
 * Route guard that prevents unauthenticated users from accessing protected pages.
 * Redirects to /login preserving the intended destination path in location state.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
