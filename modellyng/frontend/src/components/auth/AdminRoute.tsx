import { useEffect, useRef } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { ROUTES } from "@/app/routes"
import { toast } from "@/lib/store/useToastStore"

interface AdminRouteProps {
  children?: React.ReactNode
}

/**
 * Role guard that restricts /admin/* routes strictly to users with role === "admin".
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === "admin"
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (user && !isAdmin && !notifiedRef.current) {
      notifiedRef.current = true
      toast.warning("Halaman ini hanya dapat diakses oleh Administrator Sistem.", 5000)
    }
  }, [user, isAdmin])

  if (!isAdmin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
