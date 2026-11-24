import React, { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail, Loader2, ExternalLink } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { AuthFormAlert } from "./components/AuthFormAlert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/app/routes"
import { isApiError } from "@/lib/api/client"
import { useForgotPasswordMutation } from "./api/authQueries"
import { validateLoginEmail } from "./utils/validation"

export default function ForgotPasswordScreen() {
  const forgotMutation = useForgotPasswordMutation()

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const emailErr = validateLoginEmail(email)
    if (emailErr) {
      setError(emailErr)
      return
    }

    try {
      const res = await forgotMutation.mutateAsync({
        email: email.trim().toLowerCase(),
      })
      setIsSuccess(true)
      setDevResetLink(null)
      if (res.details && res.details.includes("http")) {
        const urlMatch = res.details.match(/https?:\/\/[^\s]+/)
        if (urlMatch) {
          setDevResetLink(urlMatch[0])
        }
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        setError(err.message)
      } else if (err instanceof Error && err.message.trim()) {
        setError(err.message)
      } else {
        setError("Terjadi kesalahan saat memproses permintaan.")
      }
    }
  }

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

        {!isSuccess ? (
          <div className="flex flex-col gap-5">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Lupa Kata Sandi?
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                Masukkan alamat email terdaftar. Kami akan membuatkan tautan pemulihan kata sandi yang aman.
              </p>
            </div>

            {error && <AuthFormAlert variant="error" message={error} />}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-medium text-foreground"
                >
                  Email Akun Terdaftar <span className="text-destructive">*</span>
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="nama@gmail.com"
                  disabled={forgotMutation.isPending}
                  error={Boolean(error)}
                  aria-invalid={Boolean(error)}
                  className="h-10 rounded-lg text-xs sm:text-sm"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={forgotMutation.isPending}
                className="w-full font-semibold shadow-sm transition-all mt-1"
              >
                {forgotMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Mengirim Tautan...</span>
                  </>
                ) : (
                  <span>Kirim Tautan Pemulihan</span>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm flex flex-col gap-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="size-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">Periksa Email Anda</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Jika email{" "}
                <strong className="text-foreground">{email.trim().toLowerCase()}</strong>{" "}
                terdaftar, instruksi dan tautan pemulihan kata sandi telah disiapkan (berlaku 1 jam).
              </p>
            </div>

            {devResetLink && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-3 text-left text-xs dark:border-indigo-900 dark:bg-indigo-950/40 flex flex-col gap-1.5">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                  Mode Pengembang (Local Testing Link):
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Karena server lokal belum disambungkan ke SMTP email asli, Anda dapat langsung mengklik tautan berikut:
                </p>
                <Link
                  to={devResetLink.replace("http://localhost:3000", "")}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline break-all"
                >
                  <span>Buka Form Reset Password</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button asChild className="w-full">
                <Link to={ROUTES.AUTH.LOGIN}>Kembali ke Halaman Masuk</Link>
              </Button>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Kirim ulang ke email berbeda
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
