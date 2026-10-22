import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { ROUTES } from "@/app/routes"

interface GuestRouteProps {
  children?: React.ReactNode
}

/**
 * Route guard that prevents already authenticated users from accessing login/register.
 * Redirects to /dashboard if already logged in.
 */
export function GuestRoute({ children }: GuestRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
