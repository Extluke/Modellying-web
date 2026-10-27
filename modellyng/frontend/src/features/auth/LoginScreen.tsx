import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { validateEmail, validatePassword } from "./utils/validation"
import { useAuthStore } from "./store/authStore"

export default function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Validation & API Error states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(
    (location.state as any)?.message || null
  )

  // Real-time email validation on blur or change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmail(val)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(val) || undefined }))
    }
    if (apiError) setApiError(null)
    if (successBanner) setSuccessBanner(null)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPassword(val)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(val) || undefined }))
    }
    if (apiError) setApiError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    // 1. Client-side validation check
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)

    if (emailErr || passErr) {
      setErrors({
        email: emailErr || undefined,
        password: passErr || undefined,
      })
      return
    }

    setErrors({})

    // 2. Submit to backend API
    try {
      const loggedInUser = await login({
        email,
        password,
        remember_me: rememberMe,
      })

      // Always navigate directly to appropriate dashboard
      if (loggedInUser?.role === "admin") {
        navigate(ROUTES.ADMIN.DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.DASHBOARD, { replace: true })
      }
    } catch (err: any) {
      setApiError(err?.message || "Email atau kata sandi salah. Silakan coba lagi.")
    }
  }

  // Quick fill demo credentials for reviewer convenience (Researcher or Admin)
  const handleFillDemo = (type: "researcher" | "admin" = "researcher") => {
    if (type === "admin") {
      setEmail("admin@modellyng.ac.id")
      setPassword("Password123!")
    } else {
      setEmail("cahayu@modellyng.ac.id")
      setPassword("Password123")
    }
    setErrors({})
    setApiError(null)
  }

  return (
    <AuthLayout>
      <div>
        <div className="text-center sm:text-left mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Selamat Datang Kembali
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Silakan masukkan detail akun riset Anda untuk mengakses workspace.
          </p>
        </div>

        {/* Success Banner (e.g. from password reset) */}
        {successBanner && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* API Error Toast Banner */}
        {apiError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            <div className="flex-1">
              <span className="font-semibold">Gagal Masuk: </span>
              <span>{apiError}</span>
            </div>
          </div>
        )}

        {/* Quick Demo Hint */}
        <div className="mb-5 rounded-xl border border-indigo-200/90 bg-indigo-50/70 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300">
              Akun Uji Coba:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo("researcher")}
              className="flex flex-col items-start rounded-lg border border-indigo-200/80 bg-background/90 p-2 text-left hover:border-primary hover:bg-primary/5 transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                  Peneliti
                </span>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Isi Otomatis
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-full mt-0.5 font-mono">
                cahayu@modellyng.ac.id
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo("admin")}
              className="flex flex-col items-start rounded-lg border border-purple-200/80 bg-background/90 p-2 text-left hover:border-purple-600 hover:bg-purple-500/5 transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-foreground group-hover:text-purple-600 transition-colors">
                  Administrator
                </span>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 px-1.5 py-0.5 rounded">
                  Isi Otomatis
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-full mt-0.5 font-mono">
                admin@modellyng.ac.id
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-foreground mb-1">
              Email Institusi / Peneliti <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => setErrors((p) => ({ ...p, email: validateEmail(email) || undefined }))}
                placeholder="nama@institusi.ac.id"
                disabled={isLoading}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 ${
                  errors.email
                    ? "border-destructive bg-destructive/5 text-destructive focus:ring-destructive"
                    : "border-input bg-background focus:ring-primary hover:border-muted-foreground/40"
                }`}
              />
              {errors.email && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <AlertCircle className="size-4 text-destructive" />
                </div>
              )}
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-destructive animate-in fade-in-50">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block text-xs font-medium text-foreground">
                Kata Sandi <span className="text-destructive">*</span>
              </label>
              <Link
                to={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-[11px] font-medium text-primary hover:underline transition-colors"
              >
                Lupa Kata Sandi?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => setErrors((p) => ({ ...p, password: validatePassword(password) || undefined }))}
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
            {errors.password && (
              <p className="mt-1 text-[11px] text-destructive animate-in fade-in-50">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center pt-1">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 text-xs text-muted-foreground cursor-pointer select-none">
              Ingat saya di perangkat ini
            </label>
          </div>

          {/* Submit Button with Spinner */}
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full gap-2 font-semibold shadow-sm transition-all mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <span>Masuk ke Ruang Riset</span>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-background px-3 text-muted-foreground">
                Atau masuk dengan
              </span>
            </div>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => alert("Fitur Google Workspace SSO akan aktif setelah integrasi domain universitas.")}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-input bg-card px-4 py-2 text-xs sm:text-sm font-medium text-foreground shadow-sm hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google Workspace / SSO</span>
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Belum memiliki akun riset?{" "}
          <Link
            to={ROUTES.AUTH.REGISTER}
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
