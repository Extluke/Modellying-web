import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { AuthFormAlert } from "./components/AuthFormAlert"
import { PasswordField } from "./components/PasswordField"
import { PasswordStrengthMeter } from "./components/PasswordStrengthMeter"
import { TermsPrivacyModal, type LegalTab } from "./components/TermsPrivacyModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/app/routes"
import { isApiError } from "@/lib/api/client"
import { toast } from "@/lib/store/useToastStore"
import { useRegisterMutation } from "./api/authQueries"
import {
  validateFullName,
  validateInstitution,
  validatePassword,
  validatePasswordMatch,
  validateRegisterEmail,
} from "./utils/validation"

interface RegisterErrors {
  fullName?: string
  email?: string
  institution?: string
  password?: string
  confirmPassword?: string
  terms?: string
}

export default function RegisterScreen() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [institution, setInstitution] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null)

  const [errors, setErrors] = useState<RegisterErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isDuplicateEmailError, setIsDuplicateEmailError] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return
    }
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  const isBusy = registerMutation.isPending
  const isSubmitDisabled = isBusy || cooldownSeconds > 0

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (cooldownSeconds > 0) {
      return
    }

    setApiError(null)
    setIsDuplicateEmailError(false)

    const nameErr = validateFullName(fullName)
    const emailErr = validateRegisterEmail(email)
    const instErr = validateInstitution(institution)
    const passErr = validatePassword(password)
    const matchErr = validatePasswordMatch(password, confirmPassword)
    const termsErr = !agreedTerms
      ? "Anda wajib menyetujui Syarat & Ketentuan."
      : null

    if (nameErr || emailErr || instErr || passErr || matchErr || termsErr) {
      setErrors({
        fullName: nameErr || undefined,
        email: emailErr || undefined,
        institution: instErr || undefined,
        password: passErr || undefined,
        confirmPassword: matchErr || undefined,
        terms: termsErr || undefined,
      })
      return
    }

    setErrors({})

    const cleanEmail = email.trim().toLowerCase()
    const cleanInstitution = institution.trim()

    try {
      const registeredUser = await registerMutation.mutateAsync({
        full_name: fullName.trim(),
        email: cleanEmail,
        ...(cleanInstitution ? { institution: cleanInstitution } : {}),
        password,
        confirm_password: confirmPassword,
      })

      toast.success(
        `Akun peneliti berhasil dibuat. Selamat datang, ${registeredUser.full_name}!`,
        5000
      )
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 429 && err.retryAfter) {
          setCooldownSeconds(err.retryAfter)
        }
        if (err.status === 409) {
          setIsDuplicateEmailError(true)
        }
        if (err.fieldErrors) {
          setErrors((prev) => ({
            ...prev,
            fullName: err.fieldErrors?.full_name || prev.fullName,
            email: err.fieldErrors?.email || prev.email,
            institution: err.fieldErrors?.institution || prev.institution,
            password: err.fieldErrors?.password || prev.password,
            confirmPassword:
              err.fieldErrors?.confirm_password || prev.confirmPassword,
          }))
        }
        setApiError(err.message)
      } else if (err instanceof Error && err.message.trim()) {
        setApiError(err.message)
      } else {
        setApiError("Pendaftaran gagal. Silakan coba kembali.")
      }
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-5">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Buat Akun Peneliti
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Mulai ekstraksi paper ilmiah dan temukan celah riset hari ini.
          </p>
        </div>

        {apiError && (
          <AuthFormAlert
            variant="error"
            title="Gagal Mendaftar:"
            message={
              cooldownSeconds > 0
                ? `${apiError} (Coba lagi dalam ${cooldownSeconds} detik)`
                : apiError
            }
            action={
              isDuplicateEmailError ? (
                <Link
                  to={ROUTES.AUTH.LOGIN}
                  state={{ email: email.trim().toLowerCase() }}
                  className="inline-flex text-[11px] font-semibold text-primary underline underline-offset-2"
                >
                  Masuk dengan email ini &rarr;
                </Link>
              ) : undefined
            }
          />
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-name"
              className="block text-xs font-medium text-foreground"
            >
              Nama Lengkap & Gelar <span className="text-destructive">*</span>
            </label>
            <Input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                const val = e.target.value
                setFullName(val)
                if (errors.fullName) {
                  setErrors((prev) => ({
                    ...prev,
                    fullName: validateFullName(val) || undefined,
                  }))
                }
                if (apiError) setApiError(null)
              }}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  fullName: validateFullName(fullName) || undefined,
                }))
              }
              placeholder="Contoh: Dr. Budi Santoso, M.Sc."
              disabled={isBusy}
              error={Boolean(errors.fullName)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "reg-name-error" : undefined}
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
            {errors.fullName && (
              <p
                id="reg-name-error"
                className="text-[11px] text-destructive animate-in fade-in-50"
              >
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Gmail Only Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-email"
              className="block text-xs font-medium text-foreground"
            >
              Alamat Email Google (@gmail.com){" "}
              <span className="text-destructive">*</span>
            </label>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                const val = e.target.value
                setEmail(val)
                if (errors.email) {
                  setErrors((prev) => ({
                    ...prev,
                    email: validateRegisterEmail(val) || undefined,
                  }))
                }
                if (apiError) {
                  setApiError(null)
                  setIsDuplicateEmailError(false)
                }
              }}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  email: validateRegisterEmail(email) || undefined,
                }))
              }
              placeholder="nama@gmail.com"
              disabled={isBusy}
              error={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "reg-email-error" : "reg-email-hint"
              }
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
            {errors.email ? (
              <p
                id="reg-email-error"
                className="text-[11px] text-destructive animate-in fade-in-50"
              >
                {errors.email}
              </p>
            ) : (
              <p id="reg-email-hint" className="text-[11px] text-muted-foreground">
                Pendaftaran publik hanya menerima alamat email Google (@gmail.com).
              </p>
            )}
          </div>

          {/* Optional Institution */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-institution"
              className="block text-xs font-medium text-foreground"
            >
              Institusi / Universitas{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (Opsional)
              </span>
            </label>
            <Input
              id="reg-institution"
              type="text"
              autoComplete="organization"
              maxLength={150}
              value={institution}
              onChange={(e) => {
                const val = e.target.value
                setInstitution(val)
                if (errors.institution) {
                  setErrors((prev) => ({
                    ...prev,
                    institution: validateInstitution(val) || undefined,
                  }))
                }
              }}
              placeholder="Contoh: Telkom University / Universitas Indonesia"
              disabled={isBusy}
              error={Boolean(errors.institution)}
              aria-invalid={Boolean(errors.institution)}
              aria-describedby={
                errors.institution ? "reg-institution-error" : undefined
              }
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
            {errors.institution && (
              <p
                id="reg-institution-error"
                className="text-[11px] text-destructive animate-in fade-in-50"
              >
                {errors.institution}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-password"
              className="block text-xs font-medium text-foreground"
            >
              Kata Sandi <span className="text-destructive">*</span>
            </label>
            <PasswordField
              id="reg-password"
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
                if (apiError) setApiError(null)
              }}
              placeholder="Minimal 8 karakter (huruf & angka)"
              disabled={isBusy}
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword((prev) => !prev)}
              error={Boolean(errors.password)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "reg-password-error" : undefined}
              className="h-10 rounded-lg text-xs sm:text-sm"
            />

            <PasswordStrengthMeter password={password} />

            {errors.password && (
              <p
                id="reg-password-error"
                className="text-[11px] text-destructive animate-in fade-in-50"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-confirm"
              className="block text-xs font-medium text-foreground"
            >
              Konfirmasi Kata Sandi <span className="text-destructive">*</span>
            </label>
            <PasswordField
              id="reg-confirm"
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
                if (apiError) setApiError(null)
              }}
              placeholder="Ulangi kata sandi"
              disabled={isBusy}
              showPassword={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
              error={Boolean(errors.confirmPassword)}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? "reg-confirm-error" : undefined
              }
              className="h-10 rounded-lg text-xs sm:text-sm"
            />
            {errors.confirmPassword && (
              <p
                id="reg-confirm-error"
                className="text-[11px] text-destructive animate-in fade-in-50"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="flex flex-col gap-1 pt-0.5">
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => {
                  setAgreedTerms(e.target.checked)
                  if (errors.terms) {
                    setErrors((prev) => ({ ...prev, terms: undefined }))
                  }
                }}
                disabled={isBusy}
                aria-invalid={Boolean(errors.terms)}
                className="size-4 mt-0.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="ml-2 text-xs text-muted-foreground cursor-pointer select-none leading-relaxed"
              >
                Saya menyetujui{" "}
                <button
                  type="button"
                  onClick={() => setLegalModalTab("terms")}
                  className="font-medium text-primary hover:underline focus:outline-none"
                >
                  Syarat & Ketentuan Riset
                </button>{" "}
                serta{" "}
                <button
                  type="button"
                  onClick={() => setLegalModalTab("privacy")}
                  className="font-medium text-primary hover:underline focus:outline-none"
                >
                  Kebijakan Privasi Data PDF
                </button>
                .
              </label>
            </div>
            {errors.terms && (
              <p className="text-[11px] text-destructive animate-in fade-in-50">
                {errors.terms}
              </p>
            )}
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
                <span>Mendaftarkan Akun...</span>
              </>
            ) : cooldownSeconds > 0 ? (
              <span>Tunggu {cooldownSeconds} detik...</span>
            ) : (
              <span>Daftar Akun Peneliti</span>
            )}
          </Button>
        </form>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Sudah memiliki akun riset?{" "}
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Masuk di sini
          </Link>
        </p>
      </div>

      <TermsPrivacyModal
        isOpen={legalModalTab !== null}
        activeTab={legalModalTab ?? "terms"}
        onTabChange={setLegalModalTab}
        onClose={() => setLegalModalTab(null)}
        onAccept={() => {
          setAgreedTerms(true)
          setErrors((prev) => ({ ...prev, terms: undefined }))
        }}
      />
    </AuthLayout>
  )
}
