import type { User } from "@/lib/api/auth"

export const STORAGE_KEY_TOKEN = "modellyng_token"
export const STORAGE_KEY_USER = "modellyng_user"
export const STORAGE_KEY_EXPIRES_AT = "modellyng_auth_expires_at"

function getSafeStorage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function isUserShape(value: unknown): value is User {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.email === "string" &&
    typeof record.full_name === "string" &&
    typeof record.role === "string"
  )
}

function isExpiredTimestamp(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false
  }
  const parsedMs = Date.parse(expiresAt)
  if (Number.isNaN(parsedMs)) {
    return false
  }
  return Date.now() >= parsedMs
}

function getActiveStorage(): Storage | null {
  const local = getSafeStorage("local")
  const session = getSafeStorage("session")

  if (local && local.getItem(STORAGE_KEY_TOKEN)) {
    return local
  }
  if (session && session.getItem(STORAGE_KEY_TOKEN)) {
    return session
  }
  return null
}

function clearStorageKeys(storage: Storage | null): void {
  if (!storage) {
    return
  }
  try {
    storage.removeItem(STORAGE_KEY_TOKEN)
    storage.removeItem(STORAGE_KEY_USER)
    storage.removeItem(STORAGE_KEY_EXPIRES_AT)
  } catch {
    // Ignore storage access errors
  }
}

export const tokenStorage = {
  getToken(): string | null {
    const active = getActiveStorage()
    if (!active) {
      return null
    }
    try {
      const token = active.getItem(STORAGE_KEY_TOKEN)
      if (!token) {
        return null
      }
      const expiresAt = active.getItem(STORAGE_KEY_EXPIRES_AT)
      if (isExpiredTimestamp(expiresAt)) {
        this.clearSession()
        return null
      }
      return token
    } catch {
      return null
    }
  },

  getUser(): User | null {
    const active = getActiveStorage() ?? getSafeStorage("local") ?? getSafeStorage("session")
    if (!active) {
      return null
    }
    try {
      const raw = active.getItem(STORAGE_KEY_USER)
      if (!raw) {
        return null
      }
      const parsed: unknown = JSON.parse(raw)
      return isUserShape(parsed) ? parsed : null
    } catch {
      return null
    }
  },

  setSession(
    token: string,
    user: User,
    rememberMe: boolean,
    expiresAt?: string | null
  ): void {
    const target = rememberMe ? getSafeStorage("local") : getSafeStorage("session")
    const other = rememberMe ? getSafeStorage("session") : getSafeStorage("local")

    clearStorageKeys(other)
    if (!target) {
      return
    }
    try {
      target.setItem(STORAGE_KEY_TOKEN, token)
      target.setItem(STORAGE_KEY_USER, JSON.stringify(user))
      if (expiresAt) {
        target.setItem(STORAGE_KEY_EXPIRES_AT, expiresAt)
      } else {
        target.removeItem(STORAGE_KEY_EXPIRES_AT)
      }
    } catch {
      // Ignore storage quota errors
    }
  },

  updateUser(user: User): void {
    const active = getActiveStorage() ?? getSafeStorage("local")
    if (!active) {
      return
    }
    try {
      active.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    } catch {
      // Ignore storage quota errors
    }
  },

  clearSession(): void {
    clearStorageKeys(getSafeStorage("local"))
    clearStorageKeys(getSafeStorage("session"))
  },

  isAuthStorageKey(key: string | null): boolean {
    return (
      key === null ||
      key === STORAGE_KEY_TOKEN ||
      key === STORAGE_KEY_USER ||
      key === STORAGE_KEY_EXPIRES_AT
    )
  },
}
