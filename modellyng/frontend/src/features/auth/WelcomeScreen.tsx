import { Link } from "react-router-dom"
import {
  GraduationCap,
  LogIn,
  ArrowRight,
  FileText,
  Quote,
  GitBranch,
  CheckCircle2,
} from "lucide-react"
import { ROUTES } from "@/app/routes"
import modellyngLogo from "@/assets/modellyng-logo.jpg"

export default function WelcomeScreen() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0A0F1D] via-[#0F172A] to-[#1E1B4B] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between overflow-x-hidden relative">
      {/* Ambient Glowing Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-600/25 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[350px] h-[350px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* =========================================================================
          TOP BRANDING LOGO (CLEAN & MINIMALIST WITHOUT NAV LINKS & WITHOUT NAV BUTTON)
          ========================================================================= */}
      <header className="w-full pt-8 pb-4 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link to={ROUTES.WELCOME} className="flex items-center gap-3 group">
            <div className="size-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform border border-white/10 shrink-0">
              <img
                src={modellyngLogo}
                alt="Logo Modellyng"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                  Modellyng
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Web 2.0
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Evidence-Centered Academic PDF Analysis
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* =========================================================================
          MAIN HERO SECTION (2 COLUMNS: CONTENT & DASHBOARD MOCKUP)
          ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* ----------------- LEFT COLUMN: TEXT CONTENT & SINGLE CTA ----------------- */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">

            {/* Small Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md shadow-inner text-xs sm:text-sm font-medium text-indigo-200">
              <span className="flex size-5 items-center justify-center rounded-full bg-indigo-500 text-white">
                <GraduationCap className="size-3.5" />
              </span>
              <span>Fondasi Riset Akademik Berbasis Bukti Nyata</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.14]">
              Upload Paper-mu di Modellyng,{" "}
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">
                Susun Karya Ilmiah Lebih Mudah!
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-xl font-normal">
              Ekstraksi otomatis 11 komponen metodologi ilmiah, penelusuran kalimat
              kutipan langsung ke blok teks PDF, serta kanvas peta alur riset terintegrasi.
            </p>

            {/* Single Main CTA Cluster (Only 1 primary button to redirect to login) */}
            <div className="pt-2 flex flex-col items-start gap-3 w-full sm:w-auto">
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <LogIn className="size-5 transition-transform group-hover:-translate-x-0.5" />
                <span>Masuk ke Akun Anda</span>
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Companion Link */}
              <p className="text-sm text-slate-400 pl-1">
                Belum punya akun?{" "}
                <Link
                  to={ROUTES.AUTH.REGISTER}
                  className="font-semibold text-indigo-300 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Daftar sekarang
                </Link>{" "}
                untuk melanjutkan.
              </p>
            </div>
          </div>

          {/* ----------------- RIGHT COLUMN: REALISTIC PRODUCT DASHBOARD ----------------- */}
          <div className="lg:col-span-6 relative flex justify-center items-center mt-6 lg:mt-0">
            {/* Backlight Ambient Effect Behind Laptop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/25 via-purple-500/30 to-blue-500/20 rounded-full blur-3xl transform scale-90" />

            {/* LAPTOP COMPOSITION WRAPPER */}
            <div className="relative w-full max-w-[560px]">

              {/* FLOATING CARD 1: PDF DOCUMENT BADGE (Top-Left) */}
              <div className="absolute -top-6 -left-3 sm:-left-6 z-20 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center gap-1.5 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="size-11 sm:size-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                  <FileText className="size-6 sm:size-7" />
                </div>
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-red-600 uppercase bg-red-100/60 px-2 py-0.5 rounded">
                  PDF
                </span>
              </div>

              {/* FLOATING CARD 2: EVIDENCE QUOTE BADGE (Top-Right) */}
              <div className="absolute -top-8 -right-2 sm:-right-4 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Quote className="size-4" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-20 bg-slate-300 rounded-full" />
                  <div className="h-2 w-14 bg-slate-200 rounded-full" />
                </div>
              </div>

              {/* FLOATING CARD 3: RESEARCH FLOW MINI GRAPH (Bottom-Right) */}
              <div className="absolute -bottom-6 -right-3 sm:-right-6 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-center transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex flex-col items-center gap-1.5">
                  {/* Top Node */}
                  <div className="w-8 h-3.5 rounded bg-indigo-500 shadow-sm" />
                  <div className="w-0.5 h-2 bg-slate-300" />
                  {/* Middle Row Nodes */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-3.5 rounded bg-blue-500" />
                    <div className="w-2 h-0.5 bg-slate-300" />
                    <div className="w-7 h-4 rounded bg-purple-600 shadow-sm" />
                    <div className="w-2 h-0.5 bg-slate-300" />
                    <div className="w-6 h-3.5 rounded bg-emerald-500" />
                  </div>
                  <div className="w-0.5 h-2 bg-slate-300" />
                  {/* Bottom Node */}
                  <div className="w-8 h-3.5 rounded bg-indigo-400" />
                </div>
              </div>

              {/* THE LAPTOP BODY */}
              <div className="relative z-10 w-full rounded-2xl bg-[#0F172A] p-2.5 sm:p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-slate-700/60 ring-1 ring-white/10">

                {/* Laptop Screen Bezel */}
                <div className="w-full rounded-xl bg-white text-slate-800 overflow-hidden shadow-inner flex flex-col h-[280px] sm:h-[340px]">

                  {/* App Window Top Bar */}
                  <div className="h-8 bg-slate-50 border-b border-slate-200/80 px-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-4 rounded overflow-hidden shrink-0">
                        <img
                          src={modellyngLogo}
                          alt="Modellyng"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 tracking-tight">
                        Modellyng
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="size-2 rounded-full bg-slate-300" />
                      <div className="size-2 rounded-full bg-slate-300" />
                      <div className="size-2 rounded-full bg-slate-300" />
                    </div>
                  </div>

                  {/* App Window Content: Dual Split Panel */}
                  <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden text-[11px]">

                    {/* Left: PDF Document Viewer Simulation */}
                    <div className="col-span-6 border-r border-slate-100 p-3 sm:p-4 bg-slate-50/50 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        {/* Paper Title Skeleton */}
                        <div className="h-2.5 w-3/4 bg-slate-400 rounded" />
                        <div className="h-2 w-1/2 bg-slate-300 rounded" />

                        {/* Paragraph 1 */}
                        <div className="space-y-1.5 pt-2">
                          <div className="h-1.5 w-full bg-slate-200 rounded" />
                          <div className="h-1.5 w-11/12 bg-slate-200 rounded" />
                          <div className="h-1.5 w-4/5 bg-slate-200 rounded" />
                        </div>

                        {/* Highlighted Evidence Quote Box */}
                        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200/80 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-indigo-700">
                              Bukti Teks [Halaman 4]
                            </span>
                            <span className="text-[8px] bg-indigo-200/80 text-indigo-800 font-bold px-1 rounded">
                              98%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-indigo-400/80 rounded" />
                          <div className="h-2 w-5/6 bg-indigo-300/80 rounded" />
                        </div>

                        {/* Paragraph 2 */}
                        <div className="space-y-1.5 pt-1">
                          <div className="h-1.5 w-full bg-slate-200 rounded" />
                          <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
                        </div>
                      </div>

                      {/* PDF Page Indicator */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[9px] text-slate-400">
                        <span>Dokumen: paper_2026.pdf</span>
                        <span>Hal 4 / 18</span>
                      </div>
                    </div>

                    {/* Right: 11 Extraction Components Checklist */}
                    <div className="col-span-6 p-3 sm:p-4 bg-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-900">
                            11 Komponen Metodologi
                          </span>
                          <span className="size-2 rounded-full bg-emerald-500" />
                        </div>

                        {/* Component Checklist Items */}
                        <div className="mt-2.5 space-y-2">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                            <span className="font-semibold text-[10px]">Latar Belakang</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <CheckCircle2 className="size-3 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-[10px]">Rumusan Masalah</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <CheckCircle2 className="size-3 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-[10px]">Tujuan Penelitian</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <CheckCircle2 className="size-3 text-purple-600 shrink-0" />
                            <span className="font-semibold text-[10px]">Metode Penelitian</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <CheckCircle2 className="size-3 text-blue-600 shrink-0" />
                            <span className="font-semibold text-[10px]">Hasil & Pembahasan</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Indicator */}
                      <div className="text-[9px] font-medium text-indigo-600 bg-indigo-50/70 p-1.5 rounded text-center">
                        ✓ 11 Komponen Siap Disintesis
                      </div>
                    </div>

                  </div>
                </div>

                {/* Laptop Base & Notch */}
                <div className="relative mt-1.5 w-full h-3.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-b-lg flex justify-center items-center shadow-md">
                  <div className="w-16 h-1 bg-slate-900/80 rounded-full" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* =========================================================================
          THREE FEATURE HIGHLIGHTS (BOTTOM SECTION OF THE PAGE)
          ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4 relative z-10">
        <div className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

          {/* Feature 1: Ekstraksi Otomatis */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
            <div className="size-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
              <FileText className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                Ekstraksi Otomatis
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                11 komponen metodologi ilmiah dengan informasi yang terstruktur.
              </p>
            </div>
          </div>

          {/* Feature 2: Kutipan Langsung */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors md:border-l md:border-white/10 md:pl-8">
            <div className="size-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
              <Quote className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                Kutipan Langsung
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Penelusuran bukti langsung ke bagian teks PDF untuk referensi yang tepat.
              </p>
            </div>
          </div>

          {/* Feature 3: Peta Alur Riset */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors md:border-l md:border-white/10 md:pl-8">
            <div className="size-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
              <GitBranch className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                Peta Alur Riset
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Visualisasi terintegrasi untuk membantu memahami struktur penelitian.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
