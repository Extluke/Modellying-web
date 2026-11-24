import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { ROUTES } from "@/app/routes"

interface GuestRouteProps {
  children?: React.ReactNode
}

/**
 * Route guard that prevents already authenticated users from accessing login/register.
 * Redirects admins to /admin/dashboard and researchers to /dashboard.
 */
export function GuestRoute({ children }: GuestRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.user?.role)

  if (isAuthenticated) {
    const target = role === "admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.DASHBOARD
    return <Navigate to={target} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
