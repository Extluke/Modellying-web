import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, AlertCircle, Loader2, Check } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
} from "./utils/validation"
import { useAuthStore } from "./store/authStore"

export default function RegisterScreen() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validation & Error states
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
  }>({})
  const [apiError, setApiError] = useState<string | null>(null)

  // Password requirement flags for dynamic helper UI
  const hasMinLength = password.length >= 8
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    const nameErr = validateFullName(fullName)
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    const matchErr = validatePasswordMatch(password, confirmPassword)
    const termsErr = !agreedTerms ? "Anda wajib menyetujui Syarat & Ketentuan." : null

    if (nameErr || emailErr || passErr || matchErr || termsErr) {
      setErrors({
        fullName: nameErr || undefined,
        email: emailErr || undefined,
        password: passErr || undefined,
        confirmPassword: matchErr || undefined,
        terms: termsErr || undefined,
      })
      return
    }

    setErrors({})

    try {
      await register({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
      })

      // On successful registration, redirect to dashboard
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err: any) {
      setApiError(err?.message || "Pendaftaran gagal. Silakan coba kembali.")
    }
  }

  return (
    <AuthLayout>
      <div>
        <div className="text-center sm:text-left mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Buat Akun Peneliti
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Mulai ekstraksi paper ilmiah dan temukan celah riset hari ini.
          </p>
        </div>

        {/* API Error Toast Banner */}
        {apiError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            <div className="flex-1">
              <span className="font-semibold">Gagal Mendaftar: </span>
              <span>{apiError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className="block text-xs font-medium text-foreground mb-1">
              Nama Lengkap & Gelar <span className="text-destructive">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (errors.fullName) {
                  setErrors((p) => ({ ...p, fullName: validateFullName(e.target.value) || undefined }))
                }
              }}
              placeholder="Dr. Nama Lengkap, M.Sc."
              disabled={isLoading}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 ${
                errors.fullName
                  ? "border-destructive bg-destructive/5 text-destructive focus:ring-destructive"
                  : "border-input bg-background focus:ring-primary hover:border-muted-foreground/40"
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-[11px] text-destructive animate-in fade-in-50">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-foreground mb-1">
              Alamat Email <span className="text-destructive">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors((p) => ({ ...p, email: validateEmail(e.target.value) || undefined }))
                }
              }}
              placeholder="nama@institusi.ac.id"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-destructive bg-destructive/5 text-destructive focus:ring-destructive"
                  : "border-input bg-background focus:ring-primary hover:border-muted-foreground/40"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-destructive animate-in fade-in-50">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-foreground mb-1">
              Kata Sandi <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) {
                    setErrors((p) => ({ ...p, password: validatePassword(e.target.value) || undefined }))
                  }
                  if (confirmPassword && errors.confirmPassword) {
                    setErrors((p) => ({
                      ...p,
                      confirmPassword: validatePasswordMatch(e.target.value, confirmPassword) || undefined,
                    }))
                  }
                }}
                placeholder="Minimal 8 karakter"
                disabled={isLoading}
                className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 ${
                  errors.password
                    ? "border-destructive bg-destructive/5 text-destructive focus:ring-destructive"
                    : "border-input bg-background focus:ring-primary hover:border-muted-foreground/40"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Password dynamic strength requirement chips */}
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
                hasMinLength ? "bg-emerald-500/10 text-emerald-600 font-semibold" : "bg-muted text-muted-foreground"
              }`}>
                {hasMinLength && <Check className="size-3" />} Minimal 8 karakter
              </span>
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
                hasLetter && hasNumber ? "bg-emerald-500/10 text-emerald-600 font-semibold" : "bg-muted text-muted-foreground"
              }`}>
                {hasLetter && hasNumber && <Check className="size-3" />} Huruf & Angka
              </span>
            </div>

            {errors.password && (
              <p className="mt-1 text-[11px] text-destructive animate-in fade-in-50">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm" className="block text-xs font-medium text-foreground mb-1">
              Konfirmasi Kata Sandi <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors((p) => ({
                      ...p,
                      confirmPassword: validatePasswordMatch(password, e.target.value) || undefined,
                    }))
                  }
                }}
                placeholder="Ulangi kata sandi"
                disabled={isLoading}
                className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 ${
                  errors.confirmPassword
                    ? "border-destructive bg-destructive/5 text-destructive focus:ring-destructive"
                    : "border-input bg-background focus:ring-primary hover:border-muted-foreground/40"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-destructive animate-in fade-in-50">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="pt-1">
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => {
                  setAgreedTerms(e.target.checked)
                  if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }))
                }}
                disabled={isLoading}
                className="size-4 mt-0.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-muted-foreground cursor-pointer select-none">
                Saya menyetujui{" "}
                <span className="font-medium text-primary hover:underline">Syarat & Ketentuan Riset</span> serta{" "}
                <span className="font-medium text-primary hover:underline">Kebijakan Privasi Data PDF</span>.
              </label>
            </div>
            {errors.terms && (
              <p className="mt-1 text-[11px] text-destructive animate-in fade-in-50">
                {errors.terms}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full gap-2 font-semibold shadow-sm transition-all mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Mendaftarkan Akun...</span>
              </>
            ) : (
              <span>Daftar Akun Peneliti</span>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Sudah memiliki akun riset?{" "}
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
