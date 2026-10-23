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

    const formatIndonesianError = (raw: string): string => {
      const lower = (raw || "").toLowerCase()
      if (lower.includes("at least 2 characters") || lower.includes("min_length")) {
        return "Nama proyek minimal harus terdiri dari 2 karakter."
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
      return raw
    }

    const rawMessage =
      typeof errorDetail === "object" && errorDetail !== null && errorDetail.detail
        ? typeof errorDetail.detail === "string"
          ? errorDetail.detail
          : Array.isArray(errorDetail.detail)
          ? errorDetail.detail[0]?.msg || "Validasi gagal."
          : "Permintaan gagal diproses."
        : response.statusText || "Permintaan gagal diproses."

    const message = formatIndonesianError(rawMessage)

    const error: ApiError = {
      status: response.status,
      message,
      detail: errorDetail,
    }
    throw error
  }

  return response.json() as Promise<T>
}

export function uploadFileWithProgress<T>(
  endpoint: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const token = localStorage.getItem("modellyng_token")
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
      let data: any
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        data = xhr.responseText
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T)
      } else {
        const message =
          (typeof data === "object" && data !== null && data.detail)
            ? (typeof data.detail === "string"
                ? data.detail
                : data.detail?.message || "Upload gagal.")
            : `Gagal mengunggah file (${xhr.status})`
        reject({ status: xhr.status, message, detail: data })
      }
    }

    xhr.onerror = () => {
      reject({ status: 0, message: "Terjadi gangguan koneksi jaringan saat mengunggah file." })
    }

    xhr.send(formData)
  })
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

