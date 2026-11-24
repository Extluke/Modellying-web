import React, { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ShieldCheck, Loader2 } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { AuthFormAlert } from "./components/AuthFormAlert"
import { PasswordField } from "./components/PasswordField"
import { PasswordStrengthMeter } from "./components/PasswordStrengthMeter"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { isApiError } from "@/lib/api/client"
import { toast } from "@/lib/store/useToastStore"
import { useResetPasswordMutation } from "./api/authQueries"
import { validatePassword, validatePasswordMatch } from "./utils/validation"

export default function ResetPasswordScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""

  const resetMutation = useResetPasswordMutation()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setApiError(null)

    if (!token) {
      setApiError(
        "Token reset tidak ditemukan di URL. Silakan minta tautan pemulihan baru."
      )
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

    try {
      const res = await resetMutation.mutateAsync({
        token,
        new_password: password,
        confirm_password: confirmPassword,
      })

      const successMessage =
        res.message || "Kata sandi berhasil diperbarui. Silakan masuk."
      toast.success(successMessage, 5000)

      navigate(ROUTES.AUTH.LOGIN, {
        state: { message: successMessage },
        replace: true,
      })
    } catch (err: unknown) {
      if (isApiError(err)) {
        setApiError(err.message)
      } else if (err instanceof Error && err.message.trim()) {
        setApiError(err.message)
      } else {
        setApiError("Gagal memperbarui kata sandi. Token mungkin sudah kedaluwarsa.")
      }
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-5">
        <div className="text-center sm:text-left">
          <div className="mb-3 inline-flex size-11 items-center justify-center rounded-full bg-status-green-soft text-status-green">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Buat Kata Sandi Baru
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Kata sandi baru Anda harus berbeda dari kata sandi yang digunakan sebelumnya.
          </p>
        </div>

        {apiError && <AuthFormAlert variant="error" message={apiError} />}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reset-password"
              className="block text-xs font-medium text-foreground"
            >
              Kata Sandi Baru <span className="text-destructive">*</span>
            </label>
            <PasswordField
              id="reset-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                const val = e.target.value
                setPassword(val)
                if (errors.password) {
                  setErrors((prev) => ({
                    ...prev,
                    password: validatePassword(val) || undefined,
                  }))
                }
                if (confirmPassword && errors.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword:
                      validatePasswordMatch(val, confirmPassword) || undefined,
                  }))
                }
              }}
              placeholder="Minimal 8 karakter (huruf & angka)"
              disabled={resetMutation.isPending}
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword((prev) => !prev)}
              error={Boolean(errors.password)}
              aria-invalid={Boolean(errors.password)}
              className="h-10 rounded-lg text-xs sm:text-sm"
            />

            <PasswordStrengthMeter password={password} />

            {errors.password && (
              <p className="text-[11px] text-destructive animate-in fade-in-50">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reset-confirm"
              className="block text-xs font-medium text-foreground"
            >
              Konfirmasi Kata Sandi Baru{" "}
              <span className="text-destructive">*</span>
            </label>
            <PasswordField
              id="reset-confirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                const val = e.target.value
                setConfirmPassword(val)
                if (errors.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword:
                      validatePasswordMatch(password, val) || undefined,
                  }))
                }
              }}
              placeholder="Ulangi kata sandi baru"
              disabled={resetMutation.isPending}
              showPassword={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
              error={Boolean(errors.confirmPassword)}
              aria-invalid={Boolean(errors.confirmPassword)}
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
            {errors.confirmPassword && (
              <p className="text-[11px] text-destructive animate-in fade-in-50">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={resetMutation.isPending}
            className="w-full font-semibold shadow-sm transition-all mt-1"
          >
            {resetMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Menyimpan Kata Sandi...</span>
              </>
            ) : (
              <span>Simpan Kata Sandi Baru</span>
            )}
          </Button>
        </form>

        <p className="mt-2 text-center text-xs text-muted-foreground">
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
