import { useState } from "react"
import { Link } from "react-router-dom"
import {
  GraduationCap,
  LogIn,
  ArrowRight,
  FileText,
  Quote,
  GitBranch,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { ROUTES } from "@/app/routes"
import modellyngLogo from "@/assets/modellyng-logo.jpg"
import {
  AnimatedContent,
  RotatingText,
  SplitText,
} from "@/components/react-bits"

type ShowcaseMode = 0 | 1 | 2

interface FeatureHighlight {
  id: ShowcaseMode
  step: string
  title: string
  description: string
  icon: typeof FileText
}

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    id: 0,
    step: "01",
    title: "Ekstraksi Otomatis",
    description: "11 komponen metodologi ilmiah dengan informasi yang terstruktur.",
    icon: FileText,
  },
  {
    id: 1,
    step: "02",
    title: "Kutipan Langsung",
    description: "Penelusuran bukti langsung ke bagian teks PDF untuk referensi yang tepat.",
    icon: Quote,
  },
  {
    id: 2,
    step: "03",
    title: "Peta Alur Riset",
    description: "Visualisasi terintegrasi untuk membantu memahami struktur penelitian.",
    icon: GitBranch,
  },
]

const HEADLINE_ROTATION_PHRASES = [
  "Lebih Mudah!",
  "Bebas Halusinasi!",
  "Terbukti Akurat!",
  "Siap Publikasi!",
]

export default function WelcomeScreen() {
  const [activeMode, setActiveMode] = useState<ShowcaseMode>(0)

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#0A0F1D] via-[#0F1629] to-[#141238] text-slate-100 font-sans selection:bg-[#5147E5] selection:text-white flex flex-col justify-between overflow-x-hidden relative">
      {/* Ambient Radial Glows (Modellyng brand #5147E5 hue, GPU-free radial gradients) */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[640px] pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(81, 71, 229, 0.22), transparent 72%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 -right-24 w-[640px] h-[640px] pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(81, 71, 229, 0.16), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* =========================================================================
          TOP BRANDING LOGO (CLEAN & MINIMALIST WITHOUT NAV LINKS & WITHOUT NAV BUTTON)
          ========================================================================= */}
      <header className="w-full pt-7 pb-4 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link
            to={ROUTES.WELCOME}
            className="flex items-center gap-3 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E87FF]"
          >
            <div className="size-10 rounded-xl overflow-hidden shadow-lg shadow-[#5147E5]/25 border border-white/10 shrink-0">
              <img
                src={modellyngLogo}
                alt="Logo Modellyng"
                width={40}
                height={40}
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#C5C0FF] transition-colors">
                  Modellyng
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-[#5147E5]/20 text-[#C5C0FF] border border-[#5147E5]/35">
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
          MAIN HERO SECTION (2 COLUMNS: TEXT CONTENT & INTERACTIVE WORKSPACE SHOWCASE)
          ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative z-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* ----------------- LEFT COLUMN: KINETIC EDITORIAL HEADLINE & CTA ----------------- */}
          <div className="lg:col-span-6 flex flex-col items-start text-left gap-5">

            {/* Eyebrow Pill with Use-case Context */}
            <AnimatedContent immediate distance={12} duration={400} delay={20}>
              <div className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/15 shadow-inner text-xs sm:text-sm font-medium text-[#D6D2FF]">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#5147E5] text-white shrink-0">
                  <GraduationCap className="size-3.5" aria-hidden="true" />
                </span>
                <span>Fondasi Riset Akademik Berbasis Bukti Nyata</span>
              </div>
            </AnimatedContent>

            {/* Main Headline: White Editorial Copy + Solid Modellyng Brand (#5147E5) RotatingText Pill */}
            <h1 className="text-3xl sm:text-5xl lg:text-[48px] font-extrabold tracking-tight text-white leading-[1.22]">
              <SplitText text="Upload Paper-mu di Modellyng," delay={42} />
              <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-white">Susun Karya Ilmiah</span>
                <RotatingText
                  texts={HEADLINE_ROTATION_PHRASES}
                  mainClassName="px-3.5 py-1 bg-[#5147E5] text-white rounded-xl shadow-lg shadow-[#5147E5]/30 border border-[#8E87FF]/30"
                  splitLevelClassName="overflow-hidden pb-0.5"
                  staggerFrom="last"
                  staggerDuration={0.025}
                  rotationInterval={2800}
                />
              </span>
            </h1>

            {/* Description */}
            <AnimatedContent immediate distance={14} duration={440} delay={130}>
              <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-xl font-normal">
                Ekstraksi otomatis 11 komponen metodologi ilmiah, penelusuran kalimat
                kutipan langsung ke blok teks PDF, serta kanvas peta alur riset terintegrasi.
              </p>
            </AnimatedContent>

            {/* Single Main CTA Cluster */}
            <AnimatedContent immediate distance={14} duration={440} delay={200} className="pt-2 flex flex-col items-start gap-3 w-full sm:w-auto">
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="fx-cta-sheen group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#5147E5] hover:bg-[#5E54F2] shadow-lg shadow-[#5147E5]/35 border border-[#8E87FF]/25 active:scale-[0.98] transition-[transform,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E87FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
              >
                <LogIn className="size-5 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
                <span>Masuk ke Akun Anda</span>
                <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>

              {/* Companion Link */}
              <p className="text-sm text-slate-400 pl-1">
                Belum punya akun?{" "}
                <Link
                  to={ROUTES.AUTH.REGISTER}
                  className="font-semibold text-[#B8B3FF] hover:text-white underline underline-offset-4 transition-colors"
                >
                  Daftar sekarang
                </Link>{" "}
                untuk melanjutkan.
              </p>
            </AnimatedContent>
          </div>

          {/* ----------------- RIGHT COLUMN: INTERACTIVE WORKSPACE SHOWCASE ----------------- */}
          <AnimatedContent immediate distance={18} duration={480} delay={120} className="lg:col-span-6 relative flex justify-center items-center mt-6 lg:mt-0 sm:px-5">
            {/* Backlight Radial Glow Behind Laptop (no heavy blur filter) */}
            <div
              className="absolute -inset-6 pointer-events-none"
              style={{ background: "radial-gradient(closest-side, rgba(81, 71, 229, 0.24), transparent 72%)" }}
              aria-hidden="true"
            />

            {/* LAPTOP COMPOSITION — SAFE FLOATING BADGE POSITIONS (NO TEXT CLIPPING!) */}
            <div className="relative w-full max-w-[560px]">

              {/* FLOATING PILL 1 (Top-Left above bezel corner, zero content overlap) */}
              <div className="hidden sm:inline-flex items-center gap-1.5 absolute -top-4 left-3 z-20 bg-white px-2.5 py-1 rounded-full shadow-lg border border-slate-200/80">
                <span className="size-5 rounded-full bg-primary-soft flex items-center justify-center text-primary">
                  <FileText className="size-3" aria-hidden="true" />
                </span>
                <span className="text-[10px] font-bold text-slate-800">
                  PDF &bull; 18 Hal
                </span>
              </div>

              {/* FLOATING PILL 2 (Top-Right above bezel corner) */}
              <div className="hidden sm:flex absolute -top-4 right-3 z-20 bg-white px-2.5 py-1 rounded-full shadow-lg border border-slate-200/80 items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-bold text-slate-800">
                  Hal. 4 &bull; <span className="text-primary tabular-nums">98% Cocok</span>
                </span>
              </div>

              {/* FLOATING PILL 3 (Bottom-Right below bezel corner, monochrome slate + focal Modellyng primary) */}
              <div className="hidden sm:flex absolute -bottom-4 right-4 z-20 bg-white px-3 py-1.5 rounded-full shadow-lg border border-slate-200/80 items-center gap-1.5 text-[9px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Topik</span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-primary text-white">Gap</span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-primary-soft text-[#3730A3]">Novelty</span>
              </div>

              {/* THE LAPTOP BODY */}
              <div className="relative z-10 w-full rounded-2xl bg-[#0F172A] p-2.5 sm:p-3 shadow-[0_24px_50px_-14px_rgba(0,0,0,0.65)] border border-slate-700/60 ring-1 ring-white/10">

                {/* Laptop Screen Bezel */}
                <div className="w-full rounded-xl bg-white text-slate-800 overflow-hidden shadow-inner flex flex-col h-[290px] sm:h-[340px]">

                  {/* App Window Top Bar + Mode Indicator */}
                  <div className="h-9 bg-slate-50 border-b border-slate-200/80 px-3 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-4 rounded overflow-hidden shrink-0">
                        <img
                          src={modellyngLogo}
                          alt="Modellyng preview"
                          width={16}
                          height={16}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 tracking-tight truncate">
                        Modellyng Workspace
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/20">
                        {FEATURE_HIGHLIGHTS[activeMode].title}
                      </span>
                      <div className="hidden sm:flex items-center gap-1 ml-1" aria-hidden="true">
                        <div className="size-2 rounded-full bg-slate-300" />
                        <div className="size-2 rounded-full bg-slate-300" />
                        <div className="size-2 rounded-full bg-slate-300" />
                      </div>
                    </div>
                  </div>

                  {/* MODE 0: EKSTRAKSI OTOMATIS */}
                  {activeMode === 0 && (
                    <div
                      key="mode-0"
                      className="flex-1 grid grid-cols-12 gap-0 overflow-hidden text-[11px] animate-in fade-in duration-200"
                    >
                      {/* Left: PDF Document Viewer Preview */}
                      <div className="col-span-6 border-r border-slate-100 p-3 sm:p-4 bg-slate-50/60 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div>
                            <div className="text-[10px] font-extrabold text-slate-900 leading-snug line-clamp-1">
                              Hybrid Attention for Academic Corpus
                            </div>
                            <div className="text-[9px] font-medium text-slate-500">
                              Zhang et al. (2025) &bull; IEEE Access
                            </div>
                          </div>

                          <p className="text-[9px] leading-relaxed text-slate-600 line-clamp-2">
                            Evaluasi komparatif terhadap 18 naskah jurnal menunjukkan kendala konteks panjang...
                          </p>

                          {/* Highlighted Evidence Quote Box */}
                          <div className="p-2 rounded-lg bg-primary-soft/75 border border-primary/20 shadow-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-primary">
                                Bukti Teks [Halaman 4]
                              </span>
                              <span className="text-[8px] bg-primary/15 text-[#3730A3] font-bold px-1 rounded tabular-nums">
                                98%
                              </span>
                            </div>
                            <p className="text-[9px] leading-snug text-slate-800 font-medium line-clamp-2">
                              &quot;Skor F1 ekstraksi metodologi meningkat 14.2% setelah grounding sitasi.&quot;
                            </p>
                          </div>

                          <p className="text-[9px] leading-relaxed text-slate-500 line-clamp-2">
                            Keterbatasan ukuran sampel menjadi dasar eksplorasi penelitian selanjutnya.
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[9px] text-slate-500 tabular-nums">
                          <span className="truncate">paper_2025.pdf</span>
                          <span className="shrink-0 font-semibold">Hal 4 / 18</span>
                        </div>
                      </div>

                      {/* Right: 11 Extraction Components Checklist */}
                      <div className="col-span-6 p-3 sm:p-4 bg-white flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-900">
                              11 Komponen Metodologi
                            </span>
                            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                          </div>

                          <div className="mt-2.5 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <CheckCircle2 className="size-3 text-primary shrink-0" aria-hidden="true" />
                              <span className="font-semibold text-[10px]">Latar Belakang</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <CheckCircle2 className="size-3 text-primary shrink-0" aria-hidden="true" />
                              <span className="font-semibold text-[10px]">Rumusan Masalah</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <CheckCircle2 className="size-3 text-primary shrink-0" aria-hidden="true" />
                              <span className="font-semibold text-[10px]">Tujuan Penelitian</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <CheckCircle2 className="size-3 text-primary shrink-0" aria-hidden="true" />
                              <span className="font-semibold text-[10px]">Metode Penelitian</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <CheckCircle2 className="size-3 text-primary shrink-0" aria-hidden="true" />
                              <span className="font-semibold text-[10px]">Hasil &amp; Pembahasan</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[9px] font-semibold text-primary bg-primary-soft border border-primary/20 p-1.5 rounded text-center">
                          &#10003; 11 Komponen Siap Disintesis
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODE 1: KUTIPAN LANGSUNG */}
                  {activeMode === 1 && (
                    <div
                      key="mode-1"
                      className="flex-1 p-3.5 sm:p-4 bg-slate-50/50 flex flex-col justify-between gap-2.5 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="size-6 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                            <Quote className="size-3.5" aria-hidden="true" />
                          </span>
                          <div>
                            <div className="text-[11px] font-bold text-slate-900">
                              Penelusuran Bukti Verbatim ke Blok PDF
                            </div>
                            <div className="text-[9px] text-slate-500">
                              DOI: 10.1109/ACCESS.2025.0192 &bull; Terverifikasi Crossref
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary-soft text-primary shrink-0">
                          Terlacak 100%
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500">
                          <span>Klaim Hasil Ekstraksi #08 (Temuan Utama)</span>
                          <span className="text-primary font-mono">Blok B-12 &bull; Hal. 4</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-700">
                          Eksperimen menunjukkan bahwa pemanfaatan arsitektur hybrid menghasilkan peningkatan efisiensi memori sekaligus{" "}
                          <mark className="bg-primary-soft text-[#172033] font-semibold px-1 py-0.5 rounded">
                            skor F1 ekstraksi metodologi naik 14.2% dibandingkan baseline BERT standar
                          </mark>{" "}
                          pada korpus artikel jurnal berbahasa Inggris.
                        </p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-primary-soft/75 border border-primary/20 px-3 py-2 text-[10px]">
                        <span className="font-semibold text-slate-700">
                          Klik kutipan membuka koordinat halaman PDF secara langsung
                        </span>
                        <span className="font-mono font-bold text-primary">BBox Ready</span>
                      </div>
                    </div>
                  )}

                  {/* MODE 2: PETA ALUR RISET (Netral + 1 Aksen Ungu) */}
                  {activeMode === 2 && (
                    <div
                      key="mode-2"
                      className="flex-1 p-3.5 sm:p-4 bg-white flex flex-col justify-between gap-2.5 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-slate-900">
                            Research Gap &amp; Peta Alur Lintas Paper
                          </div>
                          <div className="text-[9px] text-slate-500">
                            Perbandingan 6 pasangan paper tervalidasi (Pairwise Engine)
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/25">
                          <Sparkles className="size-2.5" aria-hidden="true" />
                          <span>3 Celah Riset</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 flex-1 items-stretch">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 flex flex-col justify-between">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600">
                            1. Kesamaan Metode
                          </span>
                          <p className="text-[9.5px] font-semibold text-slate-800 leading-snug">
                            Transformer Encoder + Fine-Tuning Abstrak
                          </p>
                          <span className="text-[8px] text-slate-500 font-medium">4 / 4 Paper</span>
                        </div>

                        <div className="rounded-xl border border-primary/40 bg-primary-soft/85 p-2.5 flex flex-col justify-between shadow-2xs">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-primary">
                            2. Research Gap
                          </span>
                          <p className="text-[9.5px] font-semibold text-slate-900 leading-snug">
                            Belum mengevaluasi dokumen panjang &gt; 8.000 token
                          </p>
                          <span className="text-[8px] font-bold text-primary">Layak Diteliti</span>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 flex flex-col justify-between">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600">
                            3. Usulan Novelty
                          </span>
                          <p className="text-[9.5px] font-semibold text-slate-800 leading-snug">
                            Sparse Grounding Attention untuk Full-Paper PDF
                          </p>
                          <span className="text-[8px] text-slate-500 font-medium">Siap Proposal</span>
                        </div>
                      </div>

                      <div className="text-[9px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                        <span>Terhubung ke Matriks 10 Parameter &amp; Kanvas Graf</span>
                        <span className="text-primary font-bold">Siap Ekspor</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Laptop Base & Notch */}
                <div className="relative mt-1.5 w-full h-3.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-b-lg flex justify-center items-center shadow-md" aria-hidden="true">
                  <div className="w-16 h-1 bg-slate-900/80 rounded-full" />
                </div>
              </div>

            </div>
          </AnimatedContent>

        </div>
      </main>

      {/* =========================================================================
          THREE INTERACTIVE FEATURE HIGHLIGHTS (BOTTOM SECTION OF THE PAGE)
          ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-4 relative z-10">
        <div
          role="tablist"
          aria-label="Fitur utama platform Modellyng"
          className="pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6"
        >
          {FEATURE_HIGHLIGHTS.map((item, idx) => {
            const Icon = item.icon
            const isActive = activeMode === item.id

            return (
              <AnimatedContent key={item.id} immediate distance={16} duration={420} delay={220 + idx * 65}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveMode(item.id)}
                  className={`relative w-full h-full text-left rounded-2xl border p-4 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E87FF] ${
                    isActive
                      ? "border-[#7B73FF]/65 bg-[#5147E5]/[0.16] shadow-lg shadow-black/25"
                      : "bg-white/[0.04] border-white/10 hover:border-[#7B73FF]/40 hover:bg-[#5147E5]/[0.08]"
                  }`}
                >
                  {/* Active top indicator line */}
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 left-5 right-5 h-[2px] rounded-full bg-[#6B63F6] transition-opacity duration-200 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-xl border border-[#7B73FF]/35 bg-[#5147E5]/25 text-[#C5C0FF] flex items-center justify-center shrink-0 shadow-inner">
                      <Icon className="size-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-bold text-white tracking-tight">
                          {item.title}
                        </h2>
                        <span
                          className={`text-[10px] font-mono font-bold tabular-nums ${
                            isActive ? "text-[#B8B3FF]" : "text-slate-500"
                          }`}
                        >
                          {item.step}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              </AnimatedContent>
            )
          })}
        </div>
      </section>
    </div>
  )
}
