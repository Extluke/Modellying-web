import { useEffect, useRef } from "react"
import { useAuthStore } from "@/features/auth/store/authStore"

const RESYNC_INTERVAL_MS = 5 * 60 * 1000

/**
 * Hydrates and verifies persisted auth sessions against /auth/me on app mount
 * and silently refreshes profile/tier changes when the browser tab regains focus.
 */
export function AuthSessionBootstrap() {
  const token = useAuthStore((state) => state.token)
  const hydrateSession = useAuthStore((state) => state.hydrateSession)
  const lastSyncRef = useRef<number>(0)

  useEffect(() => {
    if (!token) {
      return
    }
    lastSyncRef.current = Date.now()
    void hydrateSession()
  }, [token, hydrateSession])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return
      }
      if (!useAuthStore.getState().isAuthenticated) {
        return
      }
      const now = Date.now()
      if (now - lastSyncRef.current >= RESYNC_INTERVAL_MS) {
        lastSyncRef.current = now
        void useAuthStore.getState().hydrateSession()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  return null
}
