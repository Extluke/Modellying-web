import React, { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ExternalLink, Loader2, MailCheck, RefreshCw } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { AuthFormAlert } from "./components/AuthFormAlert"
import { OtpCodeInput } from "./components/OtpCodeInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/app/routes"
import { isApiError } from "@/lib/api/client"
import { toast } from "@/lib/store/useToastStore"
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "./api/authQueries"
import { validateRegisterEmail } from "./utils/validation"

interface VerifyEmailLocationState {
  email?: string
  expiresInSeconds?: number
  resendCooldownSeconds?: number
  deliveryChannel?: string | null
  devVerificationCode?: string | null
  devVerificationUrl?: string | null
}

function getLocationState(raw: unknown): VerifyEmailLocationState {
  if (typeof raw !== "object" || raw === null) {
    return {}
  }
  const record = raw as Record<string, unknown>
  return {
    email: typeof record.email === "string" ? record.email : undefined,
    expiresInSeconds:
      typeof record.expiresInSeconds === "number" ? record.expiresInSeconds : undefined,
    resendCooldownSeconds:
      typeof record.resendCooldownSeconds === "number"
        ? record.resendCooldownSeconds
        : undefined,
    deliveryChannel:
      typeof record.deliveryChannel === "string" ? record.deliveryChannel : null,
    devVerificationCode:
      typeof record.devVerificationCode === "string"
        ? record.devVerificationCode
        : null,
    devVerificationUrl:
      typeof record.devVerificationUrl === "string" ? record.devVerificationUrl : null,
  }
}

export default function VerifyEmailScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get("token")?.trim() || ""
  const urlEmail = searchParams.get("email")?.trim() || ""
  const locState = getLocationState(location.state)

  const verifyMutation = useVerifyEmailMutation()
  const resendMutation = useResendVerificationMutation()

  const initialEmail = locState.email || urlEmail || ""
  const [email, setEmail] = useState(initialEmail)
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail)
  const [otpCode, setOtpCode] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isAutoVerifying, setIsAutoVerifying] = useState(Boolean(urlToken))

  const [deliveryChannel, setDeliveryChannel] = useState<string | null>(
    locState.deliveryChannel ?? null
  )
  const [devCode, setDevCode] = useState<string | null>(
    locState.devVerificationCode ?? null
  )
  const [devUrl, setDevUrl] = useState<string | null>(
    locState.devVerificationUrl ?? null
  )
  const [resendCooldown, setResendCooldown] = useState<number>(
    locState.resendCooldownSeconds ?? (initialEmail ? 60 : 0)
  )

  const processedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) {
      return
    }
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (!urlToken || processedTokenRef.current === urlToken) {
      return
    }
    processedTokenRef.current = urlToken
    setIsAutoVerifying(true)
    setApiError(null)

    void verifyMutation
      .mutateAsync({ token: urlToken })
      .then((res) => {
        const msg =
          res.message ||
          "Email berhasil diverifikasi! Silakan masuk menggunakan kata sandi Anda."
        toast.success(msg, 5000)
        navigate(ROUTES.AUTH.LOGIN, {
          state: { message: msg, email: res.email },
          replace: true,
        })
      })
      .catch((err: unknown) => {
        setIsAutoVerifying(false)
        if (isApiError(err)) {
          setApiError(err.message)
        } else if (err instanceof Error && err.message.trim()) {
          setApiError(err.message)
        } else {
          setApiError(
            "Tautan verifikasi tidak valid atau telah kedaluwarsa. Silakan masukkan kode OTP atau kirim ulang kode baru."
          )
        }
      })
  }, [urlToken, navigate, verifyMutation])

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setApiError(null)
    setEmailError(null)
    setOtpError(null)

    const cleanEmail = email.trim().toLowerCase()
    const mailErr = validateRegisterEmail(cleanEmail)
    if (mailErr) {
      setEmailError(mailErr)
      setIsEditingEmail(true)
      return
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError("Masukkan lengkap 6 digit angka kode verifikasi dari email Gmail Anda.")
      return
    }

    try {
      const res = await verifyMutation.mutateAsync({
        email: cleanEmail,
        code: otpCode,
      })
      const msg =
        res.message ||
        "Email berhasil diverifikasi! Silakan masuk menggunakan kata sandi Anda."
      toast.success(msg, 5000)
      navigate(ROUTES.AUTH.LOGIN, {
        state: { message: msg, email: res.email },
        replace: true,
      })
    } catch (err: unknown) {
      if (isApiError(err)) {
        setApiError(err.message)
      } else if (err instanceof Error && err.message.trim()) {
        setApiError(err.message)
      } else {
        setApiError("Kode verifikasi tidak valid atau kedaluwarsa.")
      }
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendMutation.isPending) {
      return
    }
    setApiError(null)
    setEmailError(null)

    const cleanEmail = email.trim().toLowerCase()
    const mailErr = validateRegisterEmail(cleanEmail)
    if (mailErr) {
      setEmailError(mailErr)
      setIsEditingEmail(true)
      return
    }

    try {
      const res = await resendMutation.mutateAsync({ email: cleanEmail })
      setResendCooldown(res.resend_cooldown_seconds ?? 60)
      setOtpCode("")
      setOtpError(null)
      if (res.delivery_channel) {
        setDeliveryChannel(res.delivery_channel)
      }
      setDevCode(res.dev_verification_code ?? null)
      setDevUrl(res.dev_verification_url ?? null)
      toast.info(
        "Kode verifikasi baru telah dikirim ke kotak masuk Gmail Anda.",
        5000
      )
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 429 && err.retryAfter) {
          setResendCooldown(err.retryAfter)
        }
        setApiError(err.message)
      } else if (err instanceof Error && err.message.trim()) {
        setApiError(err.message)
      } else {
        setApiError("Gagal mengirim ulang kode verifikasi.")
      }
    }
  }

  if (isAutoVerifying) {
    return (
      <AuthLayout>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="size-7 animate-spin" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold text-foreground">
              Memverifikasi Email Anda...
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mohon tunggu sebentar selagi kami mengonfirmasi tautan verifikasi akun Anda.
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  const isBusy = verifyMutation.isPending || resendMutation.isPending

  return (
    <AuthLayout>
      <div className="flex flex-col gap-5">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors self-start"
        >
          <ArrowLeft className="size-3.5 mr-1.5" />
          Kembali ke Halaman Masuk
        </Link>

        <div className="flex flex-col gap-2 text-center sm:text-left">
          <div className="mx-auto sm:mx-0 inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Verifikasi Email Anda
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Masukkan kode verifikasi 6 digit yang telah kami kirimkan ke kotak masuk Gmail Anda, atau klik tautan konfirmasi pada email tersebut.
          </p>
        </div>

        {apiError && (
          <AuthFormAlert variant="error" title="Verifikasi Gagal:" message={apiError} />
        )}

        {deliveryChannel === "mailpit" && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs dark:border-indigo-900 dark:bg-indigo-950/40 flex flex-col gap-1.5">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">
              Mode Pengembang (Mailpit Lokal Aktif):
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Email verifikasi asli beserta kode OTP 6 digit dan tombol konfirmasi telah dikirim ke kotak masuk Mailpit lokal.
            </p>
            <a
              href="http://localhost:28024"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline self-start"
            >
              <span>Buka Kotak Masuk Mailpit</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}

        {deliveryChannel === "dev_preview" && devCode && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs dark:border-indigo-900 dark:bg-indigo-950/40 flex flex-col gap-2">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">
              Mode Pengembang (SMTP & Mailpit Belum Aktif):
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Gunakan kode OTP uji lokal berikut atau klik tautan verifikasi untuk melanjutkan:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/90 border border-indigo-200/70 px-3 py-2">
              <span className="font-mono text-base font-bold tracking-[0.25em] text-foreground">
                {devCode}
              </span>
              {devUrl && (
                <Link
                  to={devUrl.replace(/^https?:\/\/[^/]+/, "")}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <span>Klik Magic Link</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} noValidate className="flex flex-col gap-4">
          {/* Target Gmail Address */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="verify-email"
                className="block text-xs font-medium text-foreground"
              >
                Alamat Email Google (@gmail.com)
              </label>
              {!isEditingEmail && email && (
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(true)}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Ubah email
                </button>
              )}
            </div>

            {isEditingEmail ? (
              <Input
                id="verify-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) {
                    setEmailError(validateRegisterEmail(e.target.value))
                  }
                  if (apiError) setApiError(null)
                }}
                placeholder="nama@gmail.com"
                disabled={isBusy}
                error={Boolean(emailError)}
                aria-invalid={Boolean(emailError)}
                className="h-10 rounded-lg text-xs sm:text-sm"
              />
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-foreground">
                {email}
              </div>
            )}

            {emailError && (
              <p className="text-[11px] text-destructive animate-in fade-in-50">
                {emailError}
              </p>
            )}
          </div>

          {/* 6-Digit OTP Input */}
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-medium text-foreground">
              Kode Verifikasi 6 Digit (OTP) <span className="text-destructive">*</span>
            </label>
            <OtpCodeInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val)
                if (otpError) setOtpError(null)
                if (apiError) setApiError(null)
              }}
              disabled={isBusy}
              error={Boolean(otpError)}
            />
            {otpError ? (
              <p className="text-[11px] text-destructive animate-in fade-in-50">
                {otpError}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Kode berlaku selama 15 menit (maksimal 5 kali percobaan salah).
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isBusy || otpCode.length < 6}
            className="w-full font-semibold shadow-sm transition-all mt-1"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Memverifikasi Kode...</span>
              </>
            ) : (
              <span>Verifikasi Email</span>
            )}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-2 pt-2 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Belum menerima kode di kotak masuk atau folder Spam?
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy || resendCooldown > 0}
            onClick={handleResendCode}
            className="gap-1.5 text-xs"
          >
            {resendMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Mengirim Ulang...</span>
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                <span>
                  {resendCooldown > 0
                    ? `Kirim Ulang Kode (${resendCooldown}s)`
                    : "Kirim Ulang Kode Verifikasi"}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}
