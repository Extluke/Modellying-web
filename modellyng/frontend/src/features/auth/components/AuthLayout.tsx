import React from "react"
import { BookOpenCheck, ShieldCheck, Sparkles, FileSearch } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      {/* LEFT PANEL: Branding & Visual Showcase (Desktop only) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#17193b] via-[#1e1b4b] to-[#0f172a] p-12 text-white lg:flex">
        {/* Glow Effects & Decorative Circles */}
        <div className="absolute -left-20 -bottom-20 size-96 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 size-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
            <BookOpenCheck className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight">Modellyng</span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                Web 2.0
              </span>
            </div>
            <p className="text-xs text-indigo-200/70">Evidence-Centered Academic PDF Analysis</p>
          </div>
        </div>

        {/* Center Headline & Value Proposition */}
        <div className="relative z-10 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 backdrop-blur-sm mb-6">
            <Sparkles className="size-3.5 text-primary" />
            <span>Fondasi Riset Akademik Berbasis Bukti Nyata</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-white">
            Bangun Masa Depan Riset Akademik Anda Lebih Cepat.
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-indigo-100/80">
            Ekstraksi otomatis 11 komponen metodologi ilmiah, penelusuran kalimat kutipan langsung ke blok teks PDF, serta kanvas peta alur riset terintegrasi.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 pt-4 border-t border-indigo-500/20">
            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Ketertelusuran Bukti Mutlak</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <FileSearch className="size-4 text-primary" />
              <span>Matriks Komparasi 10 Parameter</span>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 flex items-center justify-between text-xs text-indigo-300/60">
          <span>&copy; {new Date().getFullYear()} Modellyng Research Platform</span>
          <span>Versi 1.0.0</span>
        </div>
      </div>

      {/* RIGHT PANEL: Form Container (Mobile & Desktop) */}
      <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo Header */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg mb-2">
              <BookOpenCheck className="size-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Modellyng</span>
            <span className="text-xs text-muted-foreground">Evidence-Centered Academic PDF Analysis</span>
          </div>

          {/* Form Content */}
          <div className="animate-in fade-in-50 duration-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
