import { ROUTES } from "@/app/routes"

/**
 * Client-side validation utilities for Authentication forms.
 * Strictly enforces Google (@gmail.com) addresses on registration while
 * preserving compatibility with seeded internal @modellyng.ac.id accounts at login.
 */

export const BASIC_EMAIL_REGEX =
  /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/

export const GMAIL_EMAIL_REGEX =
  /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?@gmail\.com$/

export const LOGIN_INTERNAL_EMAIL_REGEX =
  /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?@modellyng\.ac\.id$/

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  checks: {
    minLength: boolean
    hasLetter: boolean
    hasNumber: boolean
    hasUpperOrSymbol: boolean
  }
}

export function validateRegisterEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase()
  if (!cleaned) {
    return "Email wajib diisi."
  }
  if (cleaned.length > 255 || !BASIC_EMAIL_REGEX.test(cleaned)) {
    return "Format email tidak valid (contoh: nama@gmail.com)."
  }
  if (!GMAIL_EMAIL_REGEX.test(cleaned)) {
    return "Hanya alamat email Google (@gmail.com) yang diperbolehkan untuk mendaftar."
  }
  return null
}

export function validateLoginEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase()
  if (!cleaned) {
    return "Email wajib diisi."
  }
  if (cleaned.length > 255 || !BASIC_EMAIL_REGEX.test(cleaned)) {
    return "Format email tidak valid (contoh: nama@gmail.com)."
  }
  if (GMAIL_EMAIL_REGEX.test(cleaned) || LOGIN_INTERNAL_EMAIL_REGEX.test(cleaned)) {
    return null
  }
  return "Hanya alamat email Google (@gmail.com) yang diperbolehkan."
}

/** Backwards-compatible alias for login/recovery email validation. */
export const validateEmail = validateLoginEmail

export function validateLoginPassword(password: string): string | null {
  if (!password) {
    return "Kata sandi wajib diisi."
  }
  if (password.length > 128) {
    return "Kata sandi maksimal 128 karakter."
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Kata sandi wajib diisi."
  }
  if (password.length < 8) {
    return "Kata sandi minimal 8 karakter."
  }
  if (password.length > 128) {
    return "Kata sandi maksimal 128 karakter."
  }
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasLetter || !hasNumber) {
    return "Kata sandi harus merupakan kombinasi huruf dan angka."
  }
  return null
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return "Konfirmasi kata sandi wajib diisi."
  }
  if (password !== confirmPassword) {
    return "Konfirmasi kata sandi tidak cocok."
  }
  return null
}

export function validateFullName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return "Nama lengkap wajib diisi."
  }
  if (trimmed.length < 2) {
    return "Nama lengkap minimal 2 karakter."
  }
  if (trimmed.length > 100) {
    return "Nama lengkap maksimal 100 karakter."
  }
  return null
}

export function validateInstitution(institution: string): string | null {
  const trimmed = institution.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.length > 150) {
    return "Nama institusi maksimal 150 karakter."
  }
  return null
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const minLength = password.length >= 8
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasUpperOrSymbol = /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)

  let rawScore = 0
  if (password.length > 0) rawScore += 1
  if (minLength) rawScore += 1
  if (hasLetter && hasNumber) rawScore += 1
  if (minLength && hasLetter && hasNumber && (password.length >= 12 || hasUpperOrSymbol)) {
    rawScore += 1
  }

  const score = Math.min(4, Math.max(0, rawScore)) as 0 | 1 | 2 | 3 | 4
  const labels: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: "Belum diisi",
    1: "Lemah",
    2: "Cukup",
    3: "Kuat",
    4: "Sangat Kuat",
  }

  return {
    score,
    label: labels[score],
    checks: {
      minLength,
      hasLetter,
      hasNumber,
      hasUpperOrSymbol,
    },
  }
}

const AUTH_PREFIXES: readonly string[] = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.REGISTER,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
  "/auth",
]

export function resolveSafeRedirectPath(from: unknown, role?: string): string {
  const defaultTarget =
    role === "admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.DASHBOARD

  if (typeof from !== "string") {
    return defaultTarget
  }

  const candidate = from.trim()
  // Prevent open redirects (must start with a single '/' and not '//')
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return defaultTarget
  }

  const pathOnly = candidate.split("?")[0].split("#")[0]
  if (AUTH_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`))) {
    return defaultTarget
  }

  if (pathOnly.startsWith("/admin") && role !== "admin") {
    return ROUTES.DASHBOARD
  }

  return candidate
}
