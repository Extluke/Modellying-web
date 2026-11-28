import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import {
  FolderKanban,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Megaphone,
  X,
  Sparkles,
  ArrowRight,
  TableProperties,
  Network,
  ShieldCheck,
  FileSearch,
  AlertTriangle,
  UploadCloud,
  Check,
  ChevronRight,
} from "lucide-react"
import { adminApi } from "@/features/admin/api/adminApi"
import { useProjects } from "@/features/projects/api/projectsApi"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import {
  AnimatedContent,
  CountUp,
  SpotlightCard,
  TiltedCard,
} from "@/components/react-bits"

interface ResearchChallenge {
  key: string
  badge: string
  title: string
  problem: string
  solution: string
  actionLabel: string
  actionLink: string
}

const RESEARCH_CHALLENGES: ResearchChallenge[] = [
  {
    key: "predatory",
    badge: "01 / KREDIBILITAS",
    title: "Jurnal Predatory & Sumber Meragukan",
    problem:
      "Tidak semua publikasi memiliki proses peninjauan sejawat (peer review) yang ketat. Menggunakan paper abal-abal dapat meruntuhkan validitas landasan teori Anda.",
    solution:
      "Modellyng mengintegrasikan verifikasi otomatis ke Crossref dan DataCite untuk memvalidasi DOI resmi, status indeksasi jurnal, serta kalkulasi Trust Score secara objektif.",
    actionLabel: "Periksa Keabsahan Sumber",
    actionLink: ROUTES.PROJECTS.ROOT,
  },
  {
    key: "ai",
    badge: "02 / AKURASI & INTEGRITAS",
    title: "Ringkasan AI Sering Tak Akurat (Halusinasi)",
    problem:
      "Banyak alat AI generatif menghasilkan ringkasan yang terkesan meyakinkan, namun sebenarnya mengarang fakta atau menghilangkan angka-angka penting dari naskah asli.",
    solution:
      "Modellyng menerapkan prinsip Zero-Hallucination Strict Evidence Grounding. Setiap poin ekstraksi wajib menyertakan kutipan teks langsung yang dapat diklik untuk melompat ke blok teks PDF terkait.",
    actionLabel: "Jelajahi Ekstraksi Bukti",
    actionLink: ROUTES.PROJECTS.ROOT,
  },
  {
    key: "gap",
    badge: "03 / SINTESIS LITERATUR",
    title: "Research Gap Sulit Ditemukan Secara Objektif",
    problem:
      "Menentukan celah penelitian sering kali hanya didasarkan pada asumsi subjektif tanpa perbandingan metodologi dan keterbatasan penelitian terdahulu yang menyeluruh.",
    solution:
      "Fitur Comparative Paper Matrix 10 parameter dan Research Gap Map mengelompokkan variabel, metode, dan batas riset secara spasial untuk memetakan ruang kontribusi baru.",
    actionLabel: "Buka Matriks Komparasi",
    actionLink: ROUTES.RESEARCH.MATRIX,
  },
  {
    key: "manual",
    badge: "04 / EFISIENSI KERJA",
    title: "Analisis Manual Memakan Puluhan Jam",
    problem:
      "Membaca puluhan jurnal satu per satu, mencatat ringkasan ke spreadsheet manual, dan membandingkan variabel riset menghabiskan waktu berharga peneliti.",
    solution:
      "Otomatisasi alur kerja Modellyng memangkas waktu telaah dokumen hingga 85%, mengubah tumpukan file PDF menjadi basis pengetahuan yang terhubung dan siap disintesis.",
    actionLabel: "Mulai Proyek Baru",
    actionLink: ROUTES.PROJECTS.ROOT,
  },
]

export default function DashboardScreen() {
  const [dismissedBanner, setDismissedBanner] = useState(false)
  const [activeChallenge, setActiveChallenge] = useState<ResearchChallenge | null>(null)

  useEscapeKey(Boolean(activeChallenge), () => setActiveChallenge(null))

  const user = useAuthStore((state) => state.user)
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects()

  // Dynamic Announcement from CMS
  const { data: activeAnnouncements } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: adminApi.getActiveAnnouncements,
    staleTime: 60000,
  })

  const topAnnouncement =
    activeAnnouncements && activeAnnouncements.length > 0
      ? activeAnnouncements[0]
      : null

  // Real-time calculation from user's actual project repository
  const totalProjects = projects.length
  const totalPapers = projects.reduce((acc, p) => acc + (p.paper_count || 0), 0)
  const totalReady = projects.reduce((acc, p) => acc + (p.ready_count || 0), 0)
  const totalPending = Math.max(0, totalPapers - totalReady)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* =========================================================================
          1. HEADER DASHBOARD UTAMA
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Dasbor Riset Peneliti
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              Workspace Aktif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Selamat datang kembali,{" "}
            <span className="font-semibold text-foreground">
              {user?.full_name || "Peneliti Modellyng"}
            </span>
            . Pantau progres ekstraksi paper ilmiah dan susun peta literatur Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-xs">
            <Link to={ROUTES.USER.CHAT}>
              <Sparkles className="size-3.5 text-primary" />
              <span>Asisten Global AI</span>
            </Link>
          </Button>

          <Button asChild size="sm" className="gap-1.5 shadow-xs">
            <Link to={ROUTES.PROJECTS.ROOT}>
              <Plus className="size-4" />
              <span>Proyek Baru</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          2. PENGUMUMAN DINAMIS DARI CMS ADMIN
          ========================================================================= */}
      {topAnnouncement && !dismissedBanner && (
        <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary-soft/50 dark:bg-primary/10 p-4 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground shrink-0 mt-0.5 shadow-xs">
                <Megaphone className="size-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-primary-foreground">
                    {topAnnouncement.badge_text || topAnnouncement.category.toUpperCase()}
                  </span>
                  <h3 className="text-xs font-bold text-foreground">
                    {topAnnouncement.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {topAnnouncement.summary || topAnnouncement.content}
                </p>
              </div>
            </div>

            <button
              onClick={() => setDismissedBanner(true)}
              className="text-muted-foreground hover:text-foreground p-1 shrink-0 rounded-md hover:bg-muted transition-colors"
              title="Tutup Pengumuman"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. HERO WORKSPACE BANNER (2 KOLOM: HERO INTRO + 3D WORKSPACE PREVIEW)
          ========================================================================= */}
      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8 lg:p-10 shadow-sm">
        {/* Subtle single brand corner tint */}
        <div
          className="absolute -top-24 -right-24 size-96 pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(81, 71, 229, 0.05), transparent 72%)" }}
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          {/* Kolom Kiri: Headline & Value Proposition */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-5">
            <AnimatedContent distance={12} duration={420} immediate>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/80 dark:bg-primary/15 px-3.5 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>ANALISIS LITERATUR BERBASIS BUKTI NYATA</span>
              </div>
            </AnimatedContent>

            <AnimatedContent distance={16} delay={60} duration={480} immediate>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Dari Paper Menjadi{" "}
                <span className="text-primary">Peta Pengetahuan.</span>
              </h2>
            </AnimatedContent>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Bukan cuma merangkum jurnal. Ekstraksi 11 komponen metodologi ilmiah,
              bandingkan penelitian pada matriks sintesis komparatif, dan petakan celah riset
              secara terstruktur di satu ruang kerja terpadu.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 w-full sm:w-auto">
              <Button asChild size="default" className="gap-2 shadow-md">
                <Link to={ROUTES.PROJECTS.ROOT}>
                  <span>Mulai Analisis Paper</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="default" className="gap-2">
                <Link to={ROUTES.RESEARCH.MATRIX}>
                  <TableProperties className="size-4 text-primary" />
                  <span>Matriks Komparasi</span>
                </Link>
              </Button>

              <Button asChild variant="ghost" size="default" className="gap-2">
                <Link to={ROUTES.RESEARCH.GRAPH}>
                  <Network className="size-4 text-primary" />
                  <span>Graf Pengetahuan</span>
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span>
                Ketertelusuran bukti kutipan langsung ke halaman blok teks PDF dengan verifikasi DOI.
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Interactive Workspace Preview */}
          <AnimatedContent distance={18} delay={80} duration={460} immediate className="lg:col-span-6 relative">
            <TiltedCard maxTiltDeg={2.5} scaleOnHover={1.008}>
              <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xl ring-1 ring-border/50">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <div className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <div className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="ml-2 text-[11px] font-mono font-medium text-muted-foreground">
                    MODELlyng / workspace preview
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                  Sumber Terhubung
                </span>
              </div>

              {/* Window Body: 2 Sub-Cards + 1 Full Width Matrix Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Sub-Card 1: Paper Extraction */}
                <div className="rounded-xl border bg-muted/30 p-3 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px]">
                      Paper Extraction
                    </span>
                    <span className="text-[9px] bg-primary-soft text-primary dark:bg-primary/20 font-bold px-1.5 py-0.5 rounded">
                      98% Akurasi
                    </span>
                  </div>

                  <div className="rounded-lg bg-background p-2.5 border border-border/60 space-y-1.5 shadow-2xs">
                    <div className="text-[10px] font-bold text-foreground line-clamp-1">
                      Deep Learning for Literature Analysis
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-snug">
                      Evaluasi komparatif model ekstraksi pada 1.240 abstrak ilmiah terverifikasi.
                    </p>
                    <div className="p-1.5 rounded bg-primary/10 text-[9px] text-primary font-medium border border-primary/20">
                      Bukti Teks [Hal. 4]: &quot;Akurasi F1 meningkat 14,2% pada ekstraksi klaim...&quot;
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-snug">
                      Batasan: cakupan korpus jurnal berbahasa Inggris &amp; Indonesia.
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Ekstraksi 11 Komponen Ilmiah
                  </span>
                </div>

                {/* Sub-Card 2: Research Gap Map Mini Nodes */}
                <div className="rounded-xl border bg-muted/30 p-3 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px]">
                      Research Gap Map
                    </span>
                    <span className="size-2 rounded-full bg-primary ring-2 ring-primary/20" />
                  </div>

                  <div className="rounded-lg bg-background p-2 border border-border/60 flex items-center justify-center relative h-28 shadow-2xs">
                    <svg className="w-full h-full" viewBox="0 0 200 100">
                      <line x1="30" y1="50" x2="80" y2="25" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
                      <line x1="80" y1="25" x2="130" y2="45" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
                      <line x1="130" y1="45" x2="170" y2="20" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
                      <line x1="80" y1="25" x2="90" y2="80" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
                      <line x1="90" y1="80" x2="130" y2="45" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />

                      <circle cx="30" cy="50" r="10" className="fill-muted stroke-border" strokeWidth="1.5" />
                      <circle cx="80" cy="25" r="8" className="fill-primary/15 stroke-primary" strokeWidth="1.5" />
                      <circle cx="170" cy="20" r="8" className="fill-muted stroke-border" strokeWidth="1.5" />
                      <circle cx="90" cy="80" r="8" className="fill-muted stroke-border" strokeWidth="1.5" />

                      {/* Gap Node Highlight */}
                      <circle cx="130" cy="45" r="14" className="fill-primary/20 stroke-primary" strokeWidth="2" />
                      <text x="130" y="48" textAnchor="middle" fontSize="9" className="fill-primary font-bold">
                        GAP
                      </text>
                    </svg>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Celah riset & area belum terjamah
                  </span>
                </div>

                {/* Sub-Card 3: Comparative Paper Matrix (Full Width) */}
                <div className="sm:col-span-2 rounded-xl border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px]">
                      Comparative Paper Matrix Preview
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Multi-Paper Synthesis
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border bg-background shadow-2xs">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                        <tr>
                          <th className="py-1.5 px-2.5">Referensi</th>
                          <th className="py-1.5 px-2.5">Metodologi</th>
                          <th className="py-1.5 px-2.5">Temuan Utama</th>
                          <th className="py-1.5 px-2.5 text-right">Ketertelusuran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-foreground">
                        <tr>
                          <td className="py-1.5 px-2.5 font-medium">Paper A (Zhang et al.)</td>
                          <td className="py-1.5 px-2.5 text-muted-foreground">Survey (N=420)</td>
                          <td className="py-1.5 px-2.5">Keterbatasan dataset teks ilmiah</td>
                          <td className="py-1.5 px-2.5 text-right font-medium text-primary">Lihat sumber ↗</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2.5 font-medium">Paper B (Rahman & Lee)</td>
                          <td className="py-1.5 px-2.5 text-muted-foreground">Eksperimental LLM</td>
                          <td className="py-1.5 px-2.5">Akurasi F1 ekstraksi +14.2%</td>
                          <td className="py-1.5 px-2.5 text-right font-medium text-primary">Lihat sumber ↗</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2.5 font-medium">Paper C (Chen, 2025)</td>
                          <td className="py-1.5 px-2.5 text-muted-foreground">Meta-Analysis</td>
                          <td className="py-1.5 px-2.5">10 parameter perbandingan</td>
                          <td className="py-1.5 px-2.5 text-right font-medium text-primary">Lihat sumber ↗</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Floating Quality Badge */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-[11px] font-semibold text-primary">
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary font-bold" />
                  <span>Analisis dapat ditelusuri langsung ke blok teks PDF</span>
                </div>
                <span className="text-[10px] text-muted-foreground">100% Traceable</span>
              </div>
            </div>
            </TiltedCard>
          </AnimatedContent>
        </div>
      </section>

      {/* =========================================================================
          4. HERO STRIP: CAPABILITIES BAR
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-3 px-4 rounded-xl border bg-muted/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5 text-foreground">
          <FileText className="size-3.5 text-primary" />
          <span>Ekstraksi Paper 11 Komponen</span>
        </span>
        <span className="text-border" aria-hidden="true">•</span>
        <span className="flex items-center gap-1.5 text-foreground">
          <TableProperties className="size-3.5 text-primary" />
          <span>Perbandingan Literatur</span>
        </span>
        <span className="text-border" aria-hidden="true">•</span>
        <span className="flex items-center gap-1.5 text-foreground">
          <Network className="size-3.5 text-primary" />
          <span>Research Gap Map</span>
        </span>
        <span className="text-border" aria-hidden="true">•</span>
        <span className="flex items-center gap-1.5 text-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>Traceable AI Proof</span>
        </span>
      </div>

      {/* =========================================================================
          5. METRIC CARDS (REAL DATA DARI REPOSITORI PENELITI)
          ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Proyek */}
        <AnimatedContent delay={0} distance={16} duration={460}>
          <SpotlightCard className="p-4 shadow-xs h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Proyek Riset</span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/15">
                <FolderKanban className="size-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
              {isLoadingProjects ? "..." : <CountUp to={totalProjects} />}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ruang kerja riset aktif Anda
            </p>
          </SpotlightCard>
        </AnimatedContent>

        {/* Paper Terunggah */}
        <AnimatedContent delay={60} distance={16} duration={460}>
          <SpotlightCard className="p-4 shadow-xs h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Paper Terunggah</span>
              <div className="p-2 rounded-lg bg-muted/80 text-foreground/75 border border-border/60">
                <FileText className="size-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
              {isLoadingProjects ? "..." : <CountUp to={totalPapers} />}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              PDF ilmiah tersimpan di database
            </p>
          </SpotlightCard>
        </AnimatedContent>

        {/* Siap Dianalisis */}
        <AnimatedContent delay={120} distance={16} duration={460}>
          <SpotlightCard className="p-4 shadow-xs h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Siap Dianalisis</span>
              <div className="p-2 rounded-lg bg-muted/80 text-foreground/75 border border-border/60">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
              {isLoadingProjects ? "..." : <CountUp to={totalReady} />}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ekstraksi sukses &amp; siap disintesis
            </p>
          </SpotlightCard>
        </AnimatedContent>

        {/* Perlu Ditinjau */}
        <AnimatedContent delay={180} distance={16} duration={460}>
          <SpotlightCard className="p-4 shadow-xs h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <span>Perlu Ditinjau</span>
                {totalPending > 0 && (
                  <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
                )}
              </span>
              <div className="p-2 rounded-lg bg-muted/80 text-foreground/75 border border-border/60">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
              {isLoadingProjects ? "..." : <CountUp to={totalPending} />}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Dalam proses verifikasi &amp; telaah
            </p>
          </SpotlightCard>
        </AnimatedContent>
      </div>

      {/* =========================================================================
          6. ALUR KERJA RISET 4 LANGKAH (HOW MODELLYNG WORKS)
          ========================================================================= */}
      <section className="rounded-2xl border bg-card p-6 sm:p-8 space-y-6">
        <div className="text-center sm:text-left">
          <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
            HOW MODELLYNG WORKS
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1 tracking-tight">
            Empat Langkah Menuju Pemahaman Literatur yang Mendalam
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Sistem kami memandu Anda dari dokumen mentah hingga matriks sintesis komparatif
            bebas halusinasi dengan keterlacakan bukti mutlak.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <AnimatedContent delay={0} distance={16} duration={460}>
            <SpotlightCard className="relative bg-muted/20 p-5 space-y-3 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
              <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                STEP 01
              </span>
              <div className="p-2.5 size-11 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center">
                <UploadCloud className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Upload Paper</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unggah file PDF artikel ilmiah ke dalam ruang kerja proyek riset Anda.
              </p>
            </SpotlightCard>
          </AnimatedContent>

          {/* Step 2 */}
          <AnimatedContent delay={70} distance={16} duration={460}>
            <SpotlightCard className="relative bg-muted/20 p-5 space-y-3 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
              <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                STEP 02
              </span>
              <div className="p-2.5 size-11 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center">
                <FileSearch className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Ekstraksi 11 Parameter</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                PyMuPDF &amp; AI mengekstraksi latar belakang, tujuan, metode, hasil, dan batasan.
              </p>
            </SpotlightCard>
          </AnimatedContent>

          {/* Step 3 */}
          <AnimatedContent delay={140} distance={16} duration={460}>
            <SpotlightCard className="relative bg-muted/20 p-5 space-y-3 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
              <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                STEP 03
              </span>
              <div className="p-2.5 size-11 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center">
                <TableProperties className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Matriks Komparasi</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bandingkan variabel dan temuan sejumlah paper dalam satu tabel sintesis terstruktur.
              </p>
            </SpotlightCard>
          </AnimatedContent>

          {/* Step 4 */}
          <AnimatedContent delay={210} distance={16} duration={460}>
            <SpotlightCard className="relative bg-muted/20 p-5 space-y-3 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
              <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase">
                STEP 04
              </span>
              <div className="p-2.5 size-11 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center">
                <Network className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Peta Riset &amp; Gap</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visualisasikan peta pengetahuan spasial dan temukan research gap untuk kebaruan skripsi/tesis.
              </p>
            </SpotlightCard>
          </AnimatedContent>
        </div>
      </section>

      {/* =========================================================================
          7. TANTANGAN RISET YANG PERLU DIWASPADAI (INTERACTIVE CARDS)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
              BUKAN SEKADAR TREN
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 tracking-tight">
              Tantangan Riset yang Perlu Anda Waspadai
            </h3>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            Pilih topik untuk melihat mengapa analisis literatur membutuhkan ketertelusuran bukti nyata,
            bukan sekadar ringkasan AI instan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESEARCH_CHALLENGES.map((item, idx) => (
            <AnimatedContent key={item.key} delay={idx * 60} distance={16} duration={460}>
              <SpotlightCard className="h-full p-0 overflow-hidden" spotlightColor="rgba(81, 71, 229, 0.12)">
                <button
                  type="button"
                  onClick={() => setActiveChallenge(item)}
                  className="group w-full h-full p-5 text-left flex flex-col justify-between space-y-4 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold tracking-widest text-primary">
                      {item.badge}
                    </span>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.problem}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Pelajari Solusi</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </button>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </section>

      {/* =========================================================================
          8. FITUR UNGGULAN (BUILT FOR RESEARCH)
          ========================================================================= */}
      <section className="rounded-2xl border bg-card p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
            BUILT FOR RESEARCH
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1 tracking-tight">
            Bukan Hanya Cepat. Lebih Jelas, Lebih Terstruktur.
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Alat bantu sintesis literatur komprehensif yang dirancang untuk mendukung
            peneliti, dosen, dan mahasiswa pascasarjana.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedContent delay={0} distance={14} duration={440}>
            <SpotlightCard className="flex items-start gap-4 p-4 bg-muted/20 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
              <div className="p-3 rounded-xl bg-background border border-border/80 text-primary shadow-2xs shrink-0">
                <FileText className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Ekstraksi Paper Otomatis
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ambil latar belakang, rumusan masalah, tujuan, metode, hasil, dan batasan
                  langsung dari naskah publikasi PDF.
                </p>
              </div>
            </SpotlightCard>
          </AnimatedContent>

          <AnimatedContent delay={60} distance={14} duration={440}>
            <SpotlightCard className="flex items-start gap-4 p-4 bg-muted/20 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
              <div className="p-3 rounded-xl bg-background border border-border/80 text-primary shadow-2xs shrink-0">
                <TableProperties className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Comparative Paper Matrix
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bandingkan metode, dataset, dan temuan lintas paper dalam matriks sintesis
                  yang siap diekspor ke Excel dan PDF.
                </p>
              </div>
            </SpotlightCard>
          </AnimatedContent>

          <AnimatedContent delay={120} distance={14} duration={440}>
            <SpotlightCard className="flex items-start gap-4 p-4 bg-muted/20 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
              <div className="p-3 rounded-xl bg-background border border-border/80 text-primary shadow-2xs shrink-0">
                <Network className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Research Gap &amp; Knowledge Graph
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Petakan klaster hubungan antar paper dan temukan peluang celah riset baru
                  yang belum pernah dieksplorasi sebelumnya.
                </p>
              </div>
            </SpotlightCard>
          </AnimatedContent>

          <AnimatedContent delay={180} distance={14} duration={440}>
            <SpotlightCard className="flex items-start gap-4 p-4 bg-muted/20 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
              <div className="p-3 rounded-xl bg-background border border-border/80 text-primary shadow-2xs shrink-0">
                <ShieldCheck className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Keterlacakan Sumber &amp; Verifikasi DOI
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hubungkan setiap kalimat hasil analisis langsung ke halaman sumber PDF
                  dan verifikasi keaslian DOI melalui Crossref/DataCite.
                </p>
              </div>
            </SpotlightCard>
          </AnimatedContent>
        </div>
      </section>

      {/* =========================================================================
          9. DAFTAR PROYEK RISET AKTIF / EMPTY STATE
          ========================================================================= */}
      <section className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Proyek Riset Anda
            </h3>
            <p className="text-xs text-muted-foreground">
              Akses cepat ke ruang kerja analisis dokumen yang sedang berjalan.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link to={ROUTES.PROJECTS.ROOT}>
              <span>Lihat Semua Proyek</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {projects.slice(0, 3).map((project, idx) => (
              <AnimatedContent key={project.id} delay={idx * 65} distance={14} duration={440}>
                <SpotlightCard className="p-4 bg-muted/20 flex flex-col justify-between space-y-3 h-full">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        {project.status === "active" ? "Aktif" : "Arsip"}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                        {project.paper_count} Paper
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground mt-1 line-clamp-1">
                      {project.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {project.description || "Tidak ada deskripsi proyek."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      Siap: {project.ready_count} / {project.paper_count}
                    </span>
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary px-2 gap-1">
                      <Link to={`${ROUTES.PROJECTS.ROOT}/${project.id}/overview`}>
                        <span>Buka</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center space-y-3 bg-muted/10">
            <div className="p-3 rounded-full bg-primary/10 text-primary size-12 mx-auto flex items-center justify-center">
              <FolderKanban className="size-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                Belum Ada Proyek Riset
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Mulai ruang kerja riset pertama Anda untuk mengunggah dokumen PDF dan mengekstraksi 11 komponen metodologi ilmiah.
              </p>
            </div>
            <Button asChild size="sm" className="gap-1.5">
              <Link to={ROUTES.PROJECTS.ROOT}>
                <Plus className="size-4" />
                <span>Buat Proyek Pertama</span>
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* =========================================================================
          10. MODAL INSIGHT & SOLUSI TANTANGAN RISET
          ========================================================================= */}
      {activeChallenge && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="challenge-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveChallenge(null)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setActiveChallenge(null)}
              aria-label="Tutup Modal"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground size-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
              title="Tutup Modal"
            >
              <X className="size-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                {activeChallenge.badge}
              </span>
              <h3 id="challenge-modal-title" className="text-lg font-bold text-foreground mt-1 pr-8">
                {activeChallenge.title}
              </h3>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground">
                <div className="flex items-center gap-1.5 font-bold text-destructive mb-1">
                  <AlertTriangle className="size-3.5" />
                  <span>Permasalahan:</span>
                </div>
                <p className="text-muted-foreground">{activeChallenge.problem}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-foreground">
                <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
                  <ShieldCheck className="size-3.5" />
                  <span>Solusi Arsitektur Modellyng:</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {activeChallenge.solution}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveChallenge(null)}
              >
                Tutup
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link
                  to={activeChallenge.actionLink}
                  onClick={() => setActiveChallenge(null)}
                >
                  <span>{activeChallenge.actionLabel}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
