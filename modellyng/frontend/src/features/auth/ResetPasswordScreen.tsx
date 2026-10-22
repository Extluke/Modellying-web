import React, { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, Check } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { validatePassword, validatePasswordMatch } from "./utils/validation"
import { authApi } from "@/lib/api/auth"

export default function ResetPasswordScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const hasMinLength = password.length >= 8
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!token) {
      setApiError("Token reset tidak ditemukan di URL. Silakan minta tautan pemulihan baru.")
      return
    }

    const passErr = validatePassword(password)
    const matchErr = validatePasswordMatch(password, confirmPassword)

    if (passErr || matchErr) {
      setErrors({
        password: passErr || undefined,
        confirmPassword: matchErr || undefined,
      })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const res = await authApi.resetPassword({
        token,
        new_password: password,
        confirm_password: confirmPassword,
      })

      // Navigate to login with success message banner
      navigate(ROUTES.AUTH.LOGIN, {
        state: { message: res.message || "Kata sandi berhasil diperbarui. Silakan masuk." },
        replace: true,
      })
    } catch (err: any) {
      setApiError(err?.message || "Gagal memperbarui kata sandi. Token mungkin sudah kedaluwarsa.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div>
        <div className="mb-6 text-center sm:text-left">
          <div className="mb-3 inline-flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Buat Kata Sandi Baru
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Kata sandi baru Anda harus berbeda dari kata sandi yang digunakan sebelumnya.
          </p>
        </div>

        {apiError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="reset-password" className="block text-xs font-medium text-foreground mb-1">
              Kata Sandi Baru <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="reset-password"
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
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

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

          {/* Confirm New Password */}
          <div>
            <label htmlFor="reset-confirm" className="block text-xs font-medium text-foreground mb-1">
              Konfirmasi Kata Sandi Baru <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="reset-confirm"
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
                placeholder="Ulangi kata sandi baru"
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

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full gap-2 font-semibold shadow-sm transition-all mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Menyimpan Kata Sandi...</span>
              </>
            ) : (
              <span>Simpan Kata Sandi Baru</span>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Ingat kata sandi Anda?{" "}
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Kembali ke login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
