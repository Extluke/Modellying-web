import React, { useEffect, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { AuthFormAlert } from "./components/AuthFormAlert"
import { DemoAccountPicker } from "./components/DemoAccountPicker"
import { PasswordField } from "./components/PasswordField"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/app/routes"
import { isApiError } from "@/lib/api/client"
import { toast } from "@/lib/store/useToastStore"
import { useLoginMutation } from "./api/authQueries"
import { useAuthStore } from "./store/authStore"
import {
  resolveSafeRedirectPath,
  validateLoginEmail,
  validateLoginPassword,
} from "./utils/validation"

interface LoginLocationState {
  message?: string
  email?: string
  from?: string
}

function getLoginLocationState(raw: unknown): LoginLocationState {
  if (typeof raw !== "object" || raw === null) {
    return {}
  }
  const record = raw as Record<string, unknown>
  return {
    message: typeof record.message === "string" ? record.message : undefined,
    email: typeof record.email === "string" ? record.email : undefined,
    from: typeof record.from === "string" ? record.from : undefined,
  }
}

export default function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = getLoginLocationState(location.state)

  const sessionNotice = useAuthStore((state) => state.sessionNotice)
  const clearSessionNotice = useAuthStore((state) => state.clearSessionNotice)
  const loginMutation = useLoginMutation()

  const [email, setEmail] = useState(locationState.email || "")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [successBanner, setSuccessBanner] = useState<string | null>(
    locationState.message || null
  )

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return
    }
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  const isBusy = loginMutation.isPending
  const isSubmitDisabled = isBusy || cooldownSeconds > 0

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmail(val)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: validateLoginEmail(val) || undefined }))
    }
    if (apiError) setApiError(null)
    if (unverifiedEmail) setUnverifiedEmail(null)
    if (successBanner) setSuccessBanner(null)
    if (sessionNotice) clearSessionNotice()
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPassword(val)
    if (errors.password) {
      setErrors((prev) => ({
        ...prev,
        password: validateLoginPassword(val) || undefined,
      }))
    }
    if (apiError) setApiError(null)
    if (unverifiedEmail) setUnverifiedEmail(null)
    if (sessionNotice) clearSessionNotice()
  }

  const handleFillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setErrors({})
    setApiError(null)
    setUnverifiedEmail(null)
    if (sessionNotice) clearSessionNotice()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (cooldownSeconds > 0) {
      return
    }

    setApiError(null)
    setUnverifiedEmail(null)
    if (sessionNotice) clearSessionNotice()

    const emailErr = validateLoginEmail(email)
    const passErr = validateLoginPassword(password)

    if (emailErr || passErr) {
      setErrors({
        email: emailErr || undefined,
        password: passErr || undefined,
      })
      return
    }

    setErrors({})

    try {
      const loggedInUser = await loginMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
        remember_me: rememberMe,
      })

      toast.success(`Selamat datang kembali, ${loggedInUser.full_name}!`, 5000)
      const destination = resolveSafeRedirectPath(
        locationState.from,
        loggedInUser.role
      )
      navigate(destination, { replace: true })
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 429 && err.retryAfter) {
          setCooldownSeconds(err.retryAfter)
        }
        if (err.status === 403 && err.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(email.trim().toLowerCase())
        }
        if (err.fieldErrors) {
          setErrors((prev) => ({
            email: err.fieldErrors?.email || prev.email,
            password: err.fieldErrors?.password || prev.password,
          }))
        }
        setApiError(err.message)
      } else if (err instanceof Error && err.message.trim()) {
        setApiError(err.message)
      } else {
        setApiError("Email atau kata sandi salah. Silakan coba lagi.")
      }
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-5">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Selamat Datang Kembali
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Silakan masukkan akun Google (@gmail.com) atau akun riset Anda untuk mengakses workspace.
          </p>
        </div>

        {successBanner && (
          <AuthFormAlert variant="success" message={successBanner} />
        )}

        {!apiError && sessionNotice && (
          <AuthFormAlert
            variant="warning"
            title="Sesi Berakhir:"
            message={sessionNotice}
          />
        )}

        {apiError && (
          <AuthFormAlert
            variant={unverifiedEmail ? "warning" : "error"}
            title={unverifiedEmail ? "Verifikasi Diperlukan:" : "Gagal Masuk:"}
            message={
              cooldownSeconds > 0
                ? `${apiError} (Coba lagi dalam ${cooldownSeconds} detik)`
                : apiError
            }
            action={
              unverifiedEmail ? (
                <Link
                  to={ROUTES.AUTH.VERIFY_EMAIL}
                  state={{ email: unverifiedEmail }}
                  className="inline-flex text-[11px] font-semibold text-primary underline underline-offset-2"
                >
                  Verifikasi Email Sekarang &rarr;
                </Link>
              ) : undefined
            }
          />
        )}

        <DemoAccountPicker onSelect={handleFillDemo} disabled={isBusy} />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-foreground"
            >
              Email Google (@gmail.com) <span className="text-destructive">*</span>
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  email: validateLoginEmail(email) || undefined,
                }))
              }
              placeholder="nama@gmail.com"
              disabled={isBusy}
              error={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
            {errors.email && (
              <p
                id="login-email-error"
                className="text-[11px] text-destructive animate-in fade-in-50"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-foreground"
              >
                Kata Sandi <span className="text-destructive">*</span>
              </label>
              <Link
                to={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-[11px] font-medium text-primary hover:underline transition-colors"
              >
                Lupa Kata Sandi?
              </Link>
            </div>
            <PasswordField
              id="login-password"
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  password: validateLoginPassword(password) || undefined,
                }))
              }
              placeholder="Masukkan kata sandi"
              disabled={isBusy}
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword((prev) => !prev)}
              error={Boolean(errors.password)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
            {errors.password && (
              <p
                id="login-password-error"
                className="text-[11px] text-destructive animate-in fade-in-50"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center pt-0.5">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isBusy}
              className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 text-xs text-muted-foreground cursor-pointer select-none"
            >
              Ingat saya di perangkat ini (7 hari)
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitDisabled}
            className="w-full font-semibold shadow-sm transition-all mt-1"
          >
            {isBusy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : cooldownSeconds > 0 ? (
              <span>Tunggu {cooldownSeconds} detik...</span>
            ) : (
              <span>Masuk ke Ruang Riset</span>
            )}
          </Button>
        </form>

        <p className="mt-2 text-center text-xs text-muted-foreground">
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
