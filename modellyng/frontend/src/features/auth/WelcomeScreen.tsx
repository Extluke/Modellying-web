import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { ArrowRight, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react"

export default function WelcomeScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg mb-6">
        <BookOpenCheck className="size-8" />
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-primary shadow-sm mb-4">
        <Sparkles className="size-3.5" />
        <span>Evidence-Centered Academic PDF Analysis</span>
      </div>

      <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        Analisis Paper Ilmiah dengan Ketertelusuran Bukti Mutlak
      </h1>

      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        Ekstraksi 11 komponen metodologi, rumusan masalah, dan temuan langsung
        dari dokumen PDF privat Anda dengan tautan kalimat bukti yang dapat disorot.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="gap-2">
          <Link to={ROUTES.AUTH.LOGIN}>
            <span>Mulai Riset Sekarang</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to={ROUTES.AUTH.REGISTER}>Daftar Akun Baru</Link>
        </Button>
      </div>

      <div className="mt-12 flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-primary" />
          <span>Supabase RLS Multi-Tenant</span>
        </div>
        <span>•</span>
        <span>FastAPI + Gemini Processing</span>
        <span>•</span>
        <span>Mozilla PDF.js Native Text Layer</span>
      </div>
    </div>
  )
}
