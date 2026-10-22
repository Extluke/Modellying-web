/**
 * Client-side validation utilities for Authentication forms.
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) {
    return "Email wajib diisi."
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Format email tidak valid (contoh: nama@institusi.ac.id)."
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
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasLetter || !hasNumber) {
    return "Kata sandi harus merupakan kombinasi huruf dan angka."
  }
  return null
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
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
  return null
}
