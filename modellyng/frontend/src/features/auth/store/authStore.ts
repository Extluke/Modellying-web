import { create } from "zustand"
import {
  authApi,
  type LoginPayload,
  type RegisterPayload,
  type RegisterResponse,
  type User,
} from "@/lib/api/auth"
import { isApiError } from "@/lib/api/client"
import { tokenStorage } from "@/lib/auth/tokenStorage"
import { queryClient } from "@/lib/query-client"
import { toast } from "@/lib/store/useToastStore"

interface LogoutOptions {
  reason?: string
  skipApi?: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrating: boolean
  hasHydrated: boolean
  error: string | null
  sessionNotice: string | null

  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<RegisterResponse>
  logout: (options?: LogoutOptions) => void
  hydrateSession: () => Promise<void>
  clearError: () => void
  clearSessionNotice: () => void
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.message.trim()) {
    return error.message
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

const initialToken = tokenStorage.getToken()
const initialUser = initialToken ? tokenStorage.getUser() : null

let lastUnauthorizedToastAt = 0

function showDeduplicatedWarning(message: string): void {
  const now = Date.now()
  if (now - lastUnauthorizedToastAt < 1500) {
    return
  }
  lastUnauthorizedToastAt = now
  toast.warning(message, 5000)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),
  isLoading: false,
  isHydrating: false,
  hasHydrated: !initialToken,
  error: null,
  sessionNotice: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null, sessionNotice: null })
    try {
      // Purge query cache to prevent any account data leakage
      queryClient.clear()
      const response = await authApi.login(payload)
      tokenStorage.setSession(
        response.token,
        response.user,
        Boolean(payload.remember_me),
        response.expires_at
      )

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        hasHydrated: true,
        error: null,
        sessionNotice: null,
      })
      return response.user
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Gagal masuk ke sistem.")
      set({ isLoading: false, error: msg })
      throw err
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null, sessionNotice: null })
    try {
      // Purge query cache before redirecting to email verification
      queryClient.clear()
      const response = await authApi.register(payload)
      set({
        isLoading: false,
        error: null,
      })
      return response
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Gagal melakukan pendaftaran.")
      set({ isLoading: false, error: msg })
      throw err
    }
  },

  logout: (options?: LogoutOptions) => {
    const currentToken = get().token ?? tokenStorage.getToken()
    if (currentToken && !options?.skipApi) {
      void authApi.logout().catch(() => {
        // Non-blocking acknowledgement
      })
    }

    tokenStorage.clearSession()
    // Clear all TanStack Query cache to guarantee zero cross-account project leakage
    queryClient.clear()
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrating: false,
      hasHydrated: true,
      error: null,
      sessionNotice: options?.reason ?? null,
    })
  },

  hydrateSession: async () => {
    const activeToken = tokenStorage.getToken()
    if (!activeToken) {
      tokenStorage.clearSession()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isHydrating: false,
        hasHydrated: true,
      })
      return
    }

    if (get().isHydrating) {
      return
    }

    set({ isHydrating: true })
    try {
      const freshUser = await authApi.getMe()
      tokenStorage.updateUser(freshUser)
      set({
        user: freshUser,
        token: activeToken,
        isAuthenticated: true,
        isHydrating: false,
        hasHydrated: true,
      })
    } catch (err: unknown) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        const reason =
          err.message || "Sesi Anda telah berakhir. Silakan masuk kembali."
        get().logout({ reason, skipApi: true })
        showDeduplicatedWarning(reason)
        return
      }
      // Keep local session intact on transient network / 5xx server outages
      set({ isHydrating: false, hasHydrated: true })
    }
  },

  clearError: () => set({ error: null }),

  clearSessionNotice: () => set({ sessionNotice: null }),
}))

// Global listeners for automatic session expiry and cross-tab synchronization
if (typeof window !== "undefined") {
  window.addEventListener("auth:unauthorized", (event: Event) => {
    const detail = (event as CustomEvent<{ message?: string }>).detail
    const reason =
      detail?.message || "Sesi Anda telah berakhir. Silakan masuk kembali."
    const state = useAuthStore.getState()
    if (state.isAuthenticated || tokenStorage.getToken()) {
      state.logout({ reason, skipApi: true })
      showDeduplicatedWarning(reason)
    }
  })

  window.addEventListener("storage", (event: StorageEvent) => {
    if (!tokenStorage.isAuthStorageKey(event.key)) {
      return
    }

    const latestToken = tokenStorage.getToken()
    const latestUser = latestToken ? tokenStorage.getUser() : null
    const currentState = useAuthStore.getState()

    if (!latestToken) {
      if (currentState.isAuthenticated) {
        queryClient.clear()
        useAuthStore.setState({
          user: null,
          token: null,
          isAuthenticated: false,
          hasHydrated: true,
          sessionNotice: null,
        })
      }
      return
    }

    const userChanged =
      currentState.token !== latestToken ||
      currentState.user?.id !== latestUser?.id

    if (userChanged) {
      queryClient.clear()
      useAuthStore.setState({
        token: latestToken,
        user: latestUser,
        isAuthenticated: true,
        hasHydrated: true,
        sessionNotice: null,
      })
    }
  })
}
