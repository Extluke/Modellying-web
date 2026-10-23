import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { ROUTES } from "@/app/routes"

interface ProtectedRouteProps {
  children?: React.ReactNode
}

/**
 * Route guard that prevents unauthenticated users from accessing protected pages.
 * Redirects to /login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
