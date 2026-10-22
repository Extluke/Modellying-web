import React, { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { AuthLayout } from "./components/AuthLayout"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { validateEmail } from "./utils/validation"
import { authApi } from "@/lib/api/auth"

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const emailErr = validateEmail(email)
    if (emailErr) {
      setError(emailErr)
      return
    }

    setIsLoading(true)
    try {
      const res = await authApi.forgotPassword({ email })
      setIsSuccess(true)
      if (res.details && res.details.includes("http")) {
        // Extract Dev Preview Link for quick testing
        const urlMatch = res.details.match(/https?:\/\/[^\s]+/)
        if (urlMatch) setDevResetLink(urlMatch[0])
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses permintaan.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div>
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="mb-6 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-3.5 mr-1.5" />
          Kembali ke Halaman Masuk
        </Link>

        {!isSuccess ? (
          <div>
            <div className="mb-6 text-center sm:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Lupa Kata Sandi?
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                Masukkan alamat email yang terdaftar. Kami akan membuatkan tautan pemulihan kata sandi yang aman.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-medium text-foreground mb-1">
                  Email Akun Terdaftar <span className="text-destructive">*</span>
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="nama@institusi.ac.id"
                  disabled={isLoading}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 ${
                    error
                      ? "border-destructive bg-destructive/5 text-destructive focus:ring-destructive"
                      : "border-input bg-background focus:ring-primary hover:border-muted-foreground/40"
                  }`}
                />
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
                    <span>Mengirim Tautan...</span>
                  </>
                ) : (
                  <span>Kirim Tautan Pemulihan</span>
                )}
              </Button>
            </form>
          </div>
        ) : (
          /* Success Feedback View (Translated from reference UI) */
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="size-7" />
            </div>

            <h3 className="text-lg font-bold text-foreground">Periksa Email Anda</h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Kami telah mengirimkan instruksi dan tautan pemulihan kata sandi ke{" "}
              <strong className="text-foreground">{email}</strong>. Tautan berlaku selama 1 jam.
            </p>

            {/* Development mode direct helper link */}
            {devResetLink && (
              <div className="my-5 rounded-lg border border-indigo-200 bg-indigo-50/70 p-3 text-left text-xs dark:border-indigo-900 dark:bg-indigo-950/40">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                  Mode Pengembang (Local Testing Link):
                </span>
                <p className="text-[11px] text-muted-foreground mt-1 mb-2">
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

            <div className="mt-6 space-y-3">
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
