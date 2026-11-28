import React from "react"
import { Link } from "react-router-dom"
import { ShieldCheck, Sparkles, FileSearch } from "lucide-react"
import modellyngLogo from "@/assets/modellyng-logo.jpg"
import { ROUTES } from "@/app/routes"
import { AnimatedContent } from "@/components/react-bits"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background font-sans">
      {/* LEFT PANEL: Branding & Visual Showcase (Desktop only, aligned with WelcomeScreen #5147E5 palette) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0A0F1D] via-[#0F1629] to-[#141238] p-12 text-slate-100 lg:flex">
        {/* Single subtle brand radial glow (zero dot grid, zero heavy blur orbs) */}
        <div
          className="absolute -top-24 -right-24 w-[620px] h-[620px] pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(81, 71, 229, 0.20), transparent 72%)" }}
          aria-hidden="true"
        />

        {/* Top Branding */}
        <AnimatedContent immediate distance={14} delay={30} className="relative z-10 flex items-center">
          <Link to={ROUTES.WELCOME} className="flex items-center gap-3 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E87FF]">
            <div className="size-11 rounded-xl overflow-hidden shadow-lg shadow-[#5147E5]/25 border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={modellyngLogo}
                alt="Logo Modellyng"
                width={44}
                height={44}
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">Modellyng</span>
                <span className="rounded bg-[#5147E5]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C5C0FF] border border-[#5147E5]/35">
                  Web 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Evidence-Centered Academic PDF Analysis</p>
            </div>
          </Link>
        </AnimatedContent>

        {/* Center Headline & Value Proposition */}
        <AnimatedContent immediate distance={18} delay={110} className="relative z-10 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1 text-xs font-medium text-[#D6D2FF] mb-6">
            <Sparkles className="size-3.5 text-[#B8B3FF]" aria-hidden="true" />
            <span>Fondasi Riset Akademik Berbasis Bukti Nyata</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-white">
            Upload Paper-mu di Modellyng,{" "}
            <span className="block mt-1 text-[#C5C0FF]">
              Susun Karya Ilmiah Lebih Mudah!
            </span>
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-slate-300/90">
            Ekstraksi otomatis 13 komponen metodologi ilmiah, penelusuran kalimat kutipan langsung ke blok teks PDF, serta kanvas peta alur riset terintegrasi.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="size-4 text-[#B8B3FF] shrink-0" aria-hidden="true" />
              <span>Ketertelusuran Bukti Mutlak</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileSearch className="size-4 text-[#B8B3FF] shrink-0" aria-hidden="true" />
              <span>Matriks Komparasi 13 Parameter</span>
            </div>
          </div>
        </AnimatedContent>

        {/* Bottom Metadata */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} Modellyng Research Platform</span>
          <span>Versi 1.0.0</span>
        </div>
      </div>

      {/* RIGHT PANEL: Form Container (Mobile & Desktop) */}
      <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo Header */}
          <Link
            to={ROUTES.WELCOME}
            className="mb-8 flex flex-col items-center text-center lg:hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="size-12 rounded-2xl overflow-hidden shadow-lg mb-2">
              <img
                src={modellyngLogo}
                alt="Logo Modellyng"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Modellyng</span>
            <span className="text-xs text-muted-foreground">Evidence-Centered Academic PDF Analysis</span>
          </Link>

          {/* Form Content */}
          <AnimatedContent immediate distance={12} delay={60}>
            {children}
          </AnimatedContent>
        </div>
      </div>
    </div>
  )
}
