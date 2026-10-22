import { create } from "zustand"
import { authApi, type User, type LoginPayload, type RegisterPayload } from "@/lib/api/auth"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => void
  clearError: () => void
}

const STORAGE_KEY_TOKEN = "modellyng_token"
const STORAGE_KEY_USER = "modellyng_user"

// Retrieve cached credentials on initial load
function getInitialAuth(): { token: string | null; user: User | null } {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    const userStr = localStorage.getItem(STORAGE_KEY_USER)
    const user = userStr ? (JSON.parse(userStr) as User) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

const initial = getInitialAuth()

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: !!initial.token,
  isLoading: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login(payload)
      localStorage.setItem(STORAGE_KEY_TOKEN, response.token)
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.user))

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return response.user
    } catch (err: any) {
      const msg = err?.message || "Gagal masuk ke sistem."
      set({ isLoading: false, error: msg })
      throw err
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.register(payload)
      localStorage.setItem(STORAGE_KEY_TOKEN, response.token)
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.user))

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return response.user
    } catch (err: any) {
      const msg = err?.message || "Gagal melakukan pendaftaran."
      set({ isLoading: false, error: msg })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_USER)
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })
  },

  clearError: () => set({ error: null }),
}))

// Global listener for automatic session expiry handling
if (typeof window !== "undefined") {
  window.addEventListener("auth:unauthorized", () => {
    useAuthStore.getState().logout()
  })
}
