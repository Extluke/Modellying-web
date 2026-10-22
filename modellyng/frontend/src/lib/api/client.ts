/**
 * API Client for Modellyng Web.
 * Connects directly to the FastAPI REST backend (47 endpoints).
 * Manages JWT authorization tokens and standard error normalization.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"

export interface ApiError {
  status: number
  message: string
  detail?: unknown
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("modellyng_token")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Automatic session expiry handling
      localStorage.removeItem("modellyng_token")
      window.dispatchEvent(new Event("auth:unauthorized"))
    }

    let errorDetail: any
    try {
      errorDetail = await response.json()
    } catch {
      errorDetail = await response.text()
    }

    const message =
      (typeof errorDetail === "object" && errorDetail !== null && errorDetail.detail)
        ? (typeof errorDetail.detail === "string"
            ? errorDetail.detail
            : Array.isArray(errorDetail.detail)
            ? errorDetail.detail[0]?.msg || "Validasi gagal."
            : "Request failed")
        : response.statusText || "Request failed"

    const error: ApiError = {
      status: response.status,
      message,
      detail: errorDetail,
    }
    throw error
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
}
