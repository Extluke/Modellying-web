import { tokenStorage } from "@/lib/auth/tokenStorage"

/**
 * API Client for Modellyng Web.
 * Connects directly to the FastAPI REST backend.
 * Manages JWT authorization tokens and standard error normalization.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"

const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
]

export interface ApiError {
  status: number
  message: string
  detail?: unknown
  retryAfter?: number
  fieldErrors?: Record<string, string>
}

interface PydanticErrorItem {
  loc?: Array<string | number>
  msg?: string
  type?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isApiError(error: unknown): error is ApiError {
  return (
    isRecord(error) &&
    typeof error.status === "number" &&
    typeof error.message === "string"
  )
}

function isPublicAuthEndpoint(endpoint: string): boolean {
  const path = endpoint.split("?")[0]
  return PUBLIC_AUTH_ENDPOINTS.some((publicPath) => path === publicPath)
}

function stripPydanticPrefix(raw: string): string {
  return raw.replace(/^Value error,\s*/i, "").trim()
}

function formatIndonesianFieldError(raw: string, fieldName?: string): string {
  const cleaned = stripPydanticPrefix(raw)
  const lower = cleaned.toLowerCase()

  if (lower.includes("at least 2 characters") || lower.includes("min_length")) {
    if (fieldName === "full_name") {
      return "Nama lengkap minimal harus terdiri dari 2 karakter."
    }
    if (fieldName === "password" || fieldName === "new_password") {
      return "Kata sandi minimal harus terdiri dari 8 karakter."
    }
    if (fieldName === "name") {
      return "Nama proyek minimal harus terdiri dari 2 karakter."
    }
    return "Panjang teks terlalu pendek."
  }

  if (lower.includes("at least 8 characters")) {
    return "Kata sandi minimal harus terdiri dari 8 karakter."
  }

  if (lower.includes("field required")) {
    return "Kolom ini wajib diisi."
  }

  if (lower.includes("value is not a valid")) {
    return "Format data yang dimasukkan tidak valid."
  }

  if (lower.includes("string should have at most")) {
    return "Panjang teks melebihi batas maksimal yang diizinkan."
  }

  return cleaned
}

function extractErrorInfo(
  errorDetail: unknown,
  fallbackStatusText: string
): { message: string; fieldErrors?: Record<string, string> } {
  if (isRecord(errorDetail) && "detail" in errorDetail) {
    const detail = errorDetail.detail

    if (typeof detail === "string" && detail.trim()) {
      return { message: formatIndonesianFieldError(detail) }
    }

    if (Array.isArray(detail)) {
      const fieldErrors: Record<string, string> = {}
      let firstMessage = "Validasi data gagal. Periksa kembali isian Anda."

      for (const item of detail) {
        if (!isRecord(item)) {
          continue
        }
        const entry = item as PydanticErrorItem
        const rawMsg = typeof entry.msg === "string" ? entry.msg : ""
        const locList = Array.isArray(entry.loc) ? entry.loc : []
        const lastKey = locList.length > 0 ? String(locList[locList.length - 1]) : undefined
        const formatted = rawMsg
          ? formatIndonesianFieldError(rawMsg, lastKey)
          : "Nilai tidak valid."

        if (lastKey && lastKey !== "body" && !fieldErrors[lastKey]) {
          fieldErrors[lastKey] = formatted
        }
        if (firstMessage === "Validasi data gagal. Periksa kembali isian Anda." && formatted) {
          firstMessage = formatted
        }
      }

      return {
        message: firstMessage,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      }
    }

    if (isRecord(detail) && typeof detail.message === "string" && detail.message.trim()) {
      return { message: formatIndonesianFieldError(detail.message) }
    }

    return { message: "Permintaan gagal diproses." }
  }

  if (typeof errorDetail === "string" && errorDetail.trim()) {
    return { message: formatIndonesianFieldError(errorDetail) }
  }

  return { message: fallbackStatusText || "Permintaan gagal diproses." }
}

function parseRetryAfterHeader(headerValue: string | null): number | undefined {
  if (!headerValue) {
    return undefined
  }
  const parsed = Number.parseInt(headerValue, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function notifyUnauthorized(endpoint: string, hadToken: boolean, message: string): void {
  if (!hadToken || isPublicAuthEndpoint(endpoint)) {
    return
  }
  tokenStorage.clearSession()
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("auth:unauthorized", {
        detail: { message },
      })
    )
  }
}

async function parseErrorBody(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown
  } catch {
    try {
      return await response.text()
    } catch {
      return null
    }
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    const networkError: ApiError = {
      status: 0,
      message: "Tidak dapat terhubung ke server. Periksa koneksi internet atau layanan backend.",
    }
    throw networkError
  }

  if (!response.ok) {
    const errorDetail = await parseErrorBody(response)
    const { message, fieldErrors } = extractErrorInfo(errorDetail, response.statusText)

    if (response.status === 401) {
      notifyUnauthorized(endpoint, Boolean(token), message)
    }

    if (response.status === 403 && isRecord(errorDetail)) {
      const nestedDetail = isRecord(errorDetail.detail) ? errorDetail.detail : null
      const code = nestedDetail?.code ?? errorDetail.code
      if (code === "DAILY_QUOTA_EXCEEDED" && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("quota:exceeded", {
            detail: nestedDetail ?? errorDetail,
          })
        )
      }
    }

    const retryAfter =
      response.status === 429
        ? parseRetryAfterHeader(response.headers.get("Retry-After"))
        : undefined

    const error: ApiError = {
      status: response.status,
      message,
      detail: errorDetail,
      retryAfter,
      fieldErrors,
    }
    throw error
  }

  return (await response.json()) as T
}

export function uploadFileWithProgress<T>(
  endpoint: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const token = tokenStorage.getToken()
    xhr.open("POST", `${API_BASE_URL}${endpoint}`)

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    }
    xhr.setRequestHeader("Accept", "application/json")

    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort()
        reject(new DOMException("Aborted", "AbortError"))
      })
    }

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      }
    }

    xhr.onload = () => {
      let data: unknown
      try {
        data = JSON.parse(xhr.responseText) as unknown
      } catch {
        data = xhr.responseText
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T)
        return
      }

      const { message, fieldErrors } = extractErrorInfo(
        data,
        `Gagal mengunggah file (${xhr.status})`
      )

      if (xhr.status === 401) {
        notifyUnauthorized(endpoint, Boolean(token), message)
      }

      if (xhr.status === 403 && isRecord(data)) {
        const nestedDetail = isRecord(data.detail) ? data.detail : null
        const code = nestedDetail?.code ?? data.code
        if (code === "DAILY_QUOTA_EXCEEDED" && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("quota:exceeded", {
              detail: nestedDetail ?? data,
            })
          )
        }
      }

      const apiError: ApiError = {
        status: xhr.status,
        message,
        detail: data,
        fieldErrors,
      }
      reject(apiError)
    }

    xhr.onerror = () => {
      const networkError: ApiError = {
        status: 0,
        message: "Terjadi gangguan koneksi jaringan saat mengunggah file.",
      }
      reject(networkError)
    }

    xhr.send(formData)
  })
}

export async function requestArrayBuffer(
  endpoint: string,
  options: RequestInit = {}
): Promise<ArrayBuffer> {
  const token = tokenStorage.getToken()

  const headers: Record<string, string> = {
    Accept: "application/pdf, application/octet-stream, */*",
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
    const errorDetail = await parseErrorBody(response)
    const fallbackMessage = `Gagal memuat berkas biner (${response.status}: ${response.statusText})`
    const { message } = extractErrorInfo(errorDetail, fallbackMessage)

    if (response.status === 401) {
      notifyUnauthorized(endpoint, Boolean(token), message)
    }

    const error: ApiError = {
      status: response.status,
      message: message || fallbackMessage,
      detail: errorDetail,
    }
    throw error
  }

  return response.arrayBuffer()
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  getArrayBuffer: (endpoint: string, options?: RequestInit) =>
    requestArrayBuffer(endpoint, { ...options, method: "GET" }),
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
  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
  uploadWithProgress: uploadFileWithProgress,
}
