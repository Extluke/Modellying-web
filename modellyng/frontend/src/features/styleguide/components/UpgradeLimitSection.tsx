import { useState, useEffect } from "react"
import {
  Lock,
  Crown,
  Sparkles,
  Check,
  X,
  Clock,
  Table,
  PenTool,
  GitBranch,
  UploadCloud,
  Layers,
  ArrowRight,
  Eye,
  RefreshCw,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/lib/store/useToastStore"

/**
 * ============================================================================
 * KONFIGURASI CMS ADMIN UNTUK TIMER FREKUENSI PROMOSI (1x 24 JAM)
 * ============================================================================
 * Parameter ini disiapkan untuk dihubungkan langsung ke modul CMS Admin (/admin/cms).
 * Anda dapat mengubah durasi `COOLDOWN_HOURS` atau tanggal mulai/selesai promo.
 */
export const PROMO_CMS_CONFIG = {
  // Durasi jeda kemunculan thumbnail promo otomatis (standar: 24 jam)
  COOLDOWN_HOURS: 24,
  // Key penyimpanan timestamp di localStorage browser pengguna
  STORAGE_KEY_PREFIX: "modellyng_promo_last_shown_",
  // Apakah promosi saat ini berstatus aktif di platform
  IS_CAMPAIGN_ACTIVE: true,
  // Target fitur yang dipromosikan (matrix | gap_map | upload)
  DEFAULT_FEATURE: "matrix" as const,
}

export type PromoFeatureType = "matrix" | "gap_map" | "upload"

interface PromoFeatureDetails {
  id: PromoFeatureType
  titleLead: string
  titleHighlight: string
  titleTrail: string
  subtitle: string
  badgeLabel: string
  previewTitle: string
  benefits: {
    icon: typeof Table
    text: string
  }[]
}

const PROMO_FEATURE_CONTENT: Record<PromoFeatureType, PromoFeatureDetails> = {
  matrix: {
    id: "matrix",
    titleLead: "Akses Analisis ",
    titleHighlight: "Lengkap",
    titleTrail: " di Comparative Paper Matrix",
    subtitle:
      "Dapatkan penjelasan mendalam, perbandingan metode, serta AI Editing untuk mengembangkan hasil analisis Anda.",
    badgeLabel: "Comparative Paper Matrix",
    previewTitle: "Comparative Paper Matrix",
    benefits: [
      {
        icon: Table,
        text: "Tabel perbandingan lengkap (metode, temuan, keterbatasan)",
      },
      {
        icon: Sparkles,
        text: "Penjelasan analisis lebih mendalam",
      },
      {
        icon: PenTool,
        text: "AI Editing untuk mengolah hasil",
      },
      {
        icon: Check,
        text: "Semua fitur terbuka, tanpa batasan",
      },
    ],
  },
  gap_map: {
    id: "gap_map",
    titleLead: "Temukan ",
    titleHighlight: "Hubungan Antarpenelitian",
    titleTrail: " & Potensi Novelty",
    subtitle:
      "Buka visualisasi lengkap untuk memahami perbedaan penelitian, relasi klaster, dan menemukan celah riset yang siap Anda teliti.",
    badgeLabel: "Research Gap Map",
    previewTitle: "Research Gap Map & Flow",
    benefits: [
      {
        icon: GitBranch,
        text: "Visualisasi flow map interaktif tanpa sensor/blur",
      },
      {
        icon: Sparkles,
        text: "Deteksi otomatis keterbatasan dan future work",
      },
      {
        icon: PenTool,
        text: "Perumusan judul dan novelty proposal dengan AI",
      },
      {
        icon: Check,
        text: "Semua fitur terbuka, tanpa batasan",
      },
    ],
  },
  upload: {
    id: "upload",
    titleLead: "Tingkatkan Kuota ke ",
    titleHighlight: "15 Token Harian",
    titleTrail: " Tanpa Batas 3 File",
    subtitle:
      "Analisis lebih banyak naskah PDF secara simultan. Kuota harian terbarukan setiap hari selama masa aktif.",
    badgeLabel: "Batas Upload Dokumen",
    previewTitle: "PDF Upload & Pipeline Ingest",
    benefits: [
      {
        icon: UploadCloud,
        text: "Kuota 15 token harian (akumulasi hingga 450 token)",
      },
      {
        icon: Table,
        text: "Akses penuh matriks sintesis & gap map",
      },
      {
        icon: PenTool,
        text: "Ekstraksi 13 parameter metodologi mendalam",
      },
      {
        icon: Check,
        text: "Semua fitur terbuka, tanpa batasan",
      },
    ],
  },
}

export function UpgradeLimitSection() {
  // State untuk modal pop-up promosi
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPromoFeature, setSelectedPromoFeature] = useState<PromoFeatureType>("matrix")
  const [selectedPlanOption, setSelectedPlanOption] = useState<"14_days" | "30_days">("30_days")

  // State simulasi jam CMS 24 Jam
  const [lastShownTime, setLastShownTime] = useState<string | null>(null)
  const storageKey = `${PROMO_CMS_CONFIG.STORAGE_KEY_PREFIX}${selectedPromoFeature}`

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const date = new Date(parseInt(stored, 10))
      setLastShownTime(date.toLocaleTimeString("id-ID") + " (" + date.toLocaleDateString("id-ID") + ")")
    } else {
      setLastShownTime(null)
    }
  }, [selectedPromoFeature, storageKey])

  // Handler membuka modal & mencatat timestamp 24 jam
  const handleOpenPromoModal = (feature: PromoFeatureType) => {
    setSelectedPromoFeature(feature)
    setIsModalOpen(true)
  }

  // Handler menutup modal & menyimpan waktu tampil (1x 24 jam)
  const handleClosePromoModal = () => {
    setIsModalOpen(false)
    const now = Date.now()
    localStorage.setItem(storageKey, now.toString())
    setLastShownTime(new Date(now).toLocaleTimeString("id-ID") + " (Hari Ini)")
    toast.info("Thumbnail promosi ditutup. Sistem mencatat timer 24 jam untuk pengguna ini.")
  }

  // Handler reset jam simulasi
  const handleResetTimer = () => {
    localStorage.removeItem(storageKey)
    setLastShownTime(null)
    toast.success("Timer simulasi 24 jam berhasil direset! Pop-up siap ditampilkan kembali.")
  }

  const promoContent = PROMO_FEATURE_CONTENT[selectedPromoFeature]

  return (
    <section className="space-y-12 pt-8 border-t border-border/80">
      {/* Section Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Lock className="size-3.5" />
          <span>Komponen UI State Limit & Pesan Upgrade Persuasif</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Template Pesan Upgrade & Thumbnail Promosi (1x 24 Jam)
        </h2>
        <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
          Dirancang untuk menjelaskan manfaat yang akan diperoleh pengguna tanpa membuat mereka merasa dipaksa membeli.
          Terdiri dari 3 kartu in-line untuk batas sistem, serta 1 komponen modal thumbnail promosi interaktif 24-jam.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* BAGIAN 1: REKOMENDASI TAMPILAN PESAN UPGRADE IN-LINE (A, B, C)       */}
      {/* Sesuai Referensi Gambar 1                                            */}
      {/* ==================================================================== */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <Layers className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            1. Tampilan Pesan Upgrade In-Line pada Halaman Terkait
          </h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* A. KETIKA KUOTA UPLOAD HABIS */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <span className="size-4 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center text-foreground">
                A
              </span>
              <span>Ketika Kuota Upload Habis</span>
            </span>

            <Card className="rounded-2xl border border-border/90 bg-card p-6 shadow-xs flex flex-col justify-between text-center space-y-4">
              <div className="space-y-3">
                {/* Lock Icon */}
                <div className="flex justify-center">
                  <div className="size-10 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center">
                    <Lock className="size-4.5" />
                  </div>
                </div>

                {/* Title & Body */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-foreground">
                    Batas Upload Harian Tercapai
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Anda telah menggunakan <span className="font-semibold text-foreground">3 dari 3</span> kesempatan
                    upload gratis hari ini.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Upgrade ke <span className="font-semibold text-primary">Student Pro</span> untuk mendapatkan 15 token
                    setiap hari dan akses seluruh fitur Modellyng.
                  </p>
                </div>
              </div>

              {/* Action Button & Footnote */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenPromoModal("upload")}
                  className="w-full h-10 rounded-full bg-slate-950 dark:bg-primary text-white font-semibold text-xs hover:bg-slate-900 dark:hover:bg-primary-hover shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Crown className="size-3.5 text-amber-400" />
                  <span>Upgrade ke Pro</span>
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Atau tunggu hingga kuota diperbarui dalam 24 jam.
                </p>
              </div>
            </Card>
          </div>

          {/* B. KETIKA MEMBUKA COMPARATIVE PAPER MATRIX TERKUNCI */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <span className="size-4 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center text-foreground">
                B
              </span>
              <span>Ketika Membuka Comparative Paper Matrix Terkunci</span>
            </span>

            <Card className="rounded-2xl border border-border/90 bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Header with Title & PRO Badge */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Analisis Lengkap</h4>
                  <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-2 py-0.5 border border-amber-500/20 tracking-wider">
                    PRO
                  </span>
                </div>

                {/* Lock Icon */}
                <div className="pt-1">
                  <div className="size-8 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center">
                    <Lock className="size-4" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Penjelasan mendalam, keterbatasan penelitian, serta AI Editing tersedia khusus untuk pengguna{" "}
                  <span className="font-semibold text-foreground">Student Pro</span>.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenPromoModal("matrix")}
                  className="w-full h-10 rounded-full bg-slate-950 dark:bg-primary text-white font-semibold text-xs hover:bg-slate-900 dark:hover:bg-primary-hover shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="size-3.5 text-primary-soft-foreground" />
                  <span>Buka Semua Fitur</span>
                </button>
              </div>
            </Card>
          </div>

          {/* C. KETIKA MEMBUKA RESEARCH GAP MAP TERKUNCI */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <span className="size-4 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center text-foreground">
                C
              </span>
              <span>Ketika Membuka Research Gap Map</span>
            </span>

            <Card className="rounded-2xl border border-border/90 bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Header with Title & PRO Badge */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Research Gap Map</h4>
                  <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] px-2 py-0.5 border border-amber-500/20 tracking-wider">
                    PRO
                  </span>
                </div>

                {/* Lock Icon & Subheading */}
                <div className="space-y-2 pt-1">
                  <div className="size-8 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center">
                    <Lock className="size-4" />
                  </div>
                  <h5 className="text-xs font-bold text-foreground">
                    Temukan Hubungan Antarpenelitian
                  </h5>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Buka visualisasi lengkap untuk memahami perbedaan penelitian dan menemukan potensi research gap.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenPromoModal("gap_map")}
                  className="w-full h-10 rounded-full bg-slate-950 dark:bg-primary text-white font-semibold text-xs hover:bg-slate-900 dark:hover:bg-primary-hover shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Crown className="size-3.5 text-amber-400" />
                  <span>Upgrade Student Pro</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BAGIAN 2: THUMBNAIL / MODAL PROMOSI SAAT BARU BUKA APLIKASI (24 JAM) */}
      {/* Sesuai Referensi Gambar 2                                            */}
      {/* ==================================================================== */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                2. Thumbnail / Dialog Promosi Saat User Membuka Aplikasi (1x 24 Jam)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tampil 1x setiap 24 jam saat pengguna pertama kali mengakses halaman fitur terkait. Dilengkapi ilustrasi
              visual naskah terkunci dan tombol pemilihan paket langsung.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs gap-1.5 h-8.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            >
              <Eye className="size-3.5" />
              <span>Buka Tampilan Pop-up Modal</span>
            </Button>
          </div>
        </div>

        {/* Tab Switcher untuk melihat preview 3 jenis fitur */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Pilih Pratinjau Fitur:</span>
          {(["matrix", "gap_map", "upload"] as PromoFeatureType[]).map((ft) => (
            <Button
              key={ft}
              type="button"
              variant={selectedPromoFeature === ft ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedPromoFeature(ft)}
              className="text-xs h-7.5 px-3 rounded-lg"
            >
              {ft === "matrix" && "Comparative Matrix"}
              {ft === "gap_map" && "Research Gap Map"}
              {ft === "upload" && "Kuota Upload & Token"}
            </Button>
          ))}
        </div>

        {/* EMBEDDED SHOWCASE (Tampilan Utuh Sesuai Screenshot 2) */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl max-w-4xl mx-auto">
          <div className="grid md:grid-cols-12 min-h-[460px]">
            {/* SISI KIRI: Ilustrasi Visual Fitur Terkunci (Mock Canvas Preview) */}
            <div className="md:col-span-5 bg-gradient-to-br from-[#F1EFFF] via-[#ECE8FF] to-[#E5E0FF] dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-background p-6 flex flex-col justify-center items-center relative overflow-hidden border-b md:border-b-0 md:border-r border-primary/10">
              {/* Floating decorative elements */}
              <div className="absolute -top-12 -left-12 size-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 size-40 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

              {/* Mock Preview Card Container */}
              <div className="relative w-full max-w-[280px] rounded-2xl bg-white dark:bg-card border border-primary/20 shadow-lg p-4 space-y-3">
                {/* Mock Card Header */}
                <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                  <div className="size-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Table className="size-3" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground truncate">
                    {promoContent.previewTitle}
                  </span>
                </div>

                {/* Mock Table Skeleton with Shaded Columns */}
                <div className="space-y-1.5 opacity-60">
                  <div className="grid grid-cols-5 gap-1 text-[8px] font-bold text-muted-foreground pb-1 border-b border-border/40 text-center">
                    <span>Paper</span>
                    <span>Metode</span>
                    <span className="text-primary font-bold">Temuan</span>
                    <span>Keterb...</span>
                    <span>Analisis</span>
                  </div>
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} className="grid grid-cols-5 gap-1 items-center">
                      <div className="h-2 rounded bg-muted-foreground/20" />
                      <div className="h-2 rounded bg-muted-foreground/20" />
                      <div className="h-2 rounded bg-primary/30" />
                      <div className="h-2 rounded bg-muted-foreground/20" />
                      <div className="h-2 rounded bg-muted-foreground/20" />
                    </div>
                  ))}
                </div>

                {/* Central Lock Callout Bubble */}
                <div className="pt-2 text-center space-y-2">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
                    <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                      <Lock className="size-5" />
                    </div>
                  </div>
                  <div className="inline-block rounded-full bg-white/95 dark:bg-card px-3 py-1 shadow-sm border border-primary/20">
                    <span className="text-[10px] font-bold text-primary">
                      Fitur ini hanya tersedia untuk pengguna Pro
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Arrow Document Indicator */}
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-primary/80">
                <ArrowRight className="size-3.5 -rotate-45" />
                <span>Dokumen Riset Akademik</span>
              </div>
            </div>

            {/* SISI KANAN: Daftar Manfaat & Opsi Paket */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Header Tag */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary border border-primary/20">
                  <Crown className="size-3.5" />
                  <span>Upgrade ke Student Pro</span>
                </div>

                {/* Main Headline & Subtitle */}
                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight leading-snug">
                    {promoContent.titleLead}
                    <span className="text-primary">{promoContent.titleHighlight}</span>
                    {promoContent.titleTrail}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {promoContent.subtitle}
                  </p>
                </div>

                {/* Benefit Checklist */}
                <ul className="space-y-2 pt-1">
                  {promoContent.benefits.map((b, bIdx) => {
                    const BIcon = b.icon
                    return (
                      <li key={bIdx} className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                        <div className="size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                          <BIcon className="size-3" />
                        </div>
                        <span>{b.text}</span>
                      </li>
                    )
                  })}
                </ul>

                {/* Radio Plan Options (14 Hari vs 30 Hari) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {/* Option 1: 14 Hari */}
                  <label
                    onClick={() => setSelectedPlanOption("14_days")}
                    className={`relative flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedPlanOption === "14_days"
                        ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20 shadow-xs"
                        : "border-border/80 bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="promo-plan-radio"
                        checked={selectedPlanOption === "14_days"}
                        onChange={() => setSelectedPlanOption("14_days")}
                        className="text-primary focus:ring-primary size-3.5"
                      />
                      <span className="text-[11px] font-semibold text-foreground">
                        Student Pro – 14 Hari
                      </span>
                    </div>
                    <div className="mt-1 pl-5.5">
                      <div className="text-sm font-extrabold text-foreground">Rp29.000</div>
                      <div className="text-[10px] text-muted-foreground">Setara Rp2.071 per hari</div>
                    </div>
                  </label>

                  {/* Option 2: 30 Hari (Most Popular) */}
                  <label
                    onClick={() => setSelectedPlanOption("30_days")}
                    className={`relative flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedPlanOption === "30_days"
                        ? "border-primary bg-primary/[0.04] ring-2 ring-primary/25 shadow-xs"
                        : "border-border/80 bg-card hover:border-primary/40"
                    }`}
                  >
                    {/* Ribbon */}
                    <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      Most Popular
                    </span>

                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="promo-plan-radio"
                        checked={selectedPlanOption === "30_days"}
                        onChange={() => setSelectedPlanOption("30_days")}
                        className="text-primary focus:ring-primary size-3.5"
                      />
                      <span className="text-[11px] font-semibold text-foreground">
                        Student Pro – 30 Hari
                      </span>
                    </div>
                    <div className="mt-1 pl-5.5">
                      <div className="text-sm font-extrabold text-primary">Rp49.000</div>
                      <div className="text-[10px] text-muted-foreground">Setara Rp1.633 per hari</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    toast.success(
                      `Simulasi pembelian: ${
                        selectedPlanOption === "14_days" ? "Student Pro 14 Hari (Rp29.000)" : "Student Pro 30 Hari (Rp49.000)"
                      } via thumbnail promosi!`
                    )
                  }}
                  className="w-full h-11 rounded-xl text-xs font-bold gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary-hover text-white transition-all cursor-pointer"
                >
                  <Crown className="size-4 text-amber-300" />
                  <span>Upgrade ke Student Pro</span>
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      toast.info("Aksi 'Nanti Saja' dipilih. Modal akan ditutup.")
                    }}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Nanti Saja
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* CATATAN ARSITEKTUR & TEMPAT INTEGRASI TIMER CMS 24 JAM               */}
        {/* ==================================================================== */}
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="size-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">
                  Arsitektur Timer 1x 24 Jam untuk CMS Admin
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Logika interval kemunculan tersimpan pada konstanta{" "}
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-bold">
                    PROMO_CMS_CONFIG.COOLDOWN_HOURS = 24
                  </code>{" "}
                  di file ini. Nilai ini siap dipetakan ke API database{" "}
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">/api/v1/admin/cms/announcements</code>{" "}
                  sehingga admin dapat mengubah durasi jam promosi sewaktu-waktu.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetTimer}
              className="text-[11px] h-7.5 px-2.5 gap-1 shrink-0 rounded-lg"
            >
              <RefreshCw className="size-3" />
              <span>Reset Jam Simulasi</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              <span>
                Status Timer Fitur{" "}
                <strong className="text-foreground capitalize">{selectedPromoFeature}:</strong>{" "}
                {lastShownTime ? (
                  <span className="text-amber-600 font-semibold">Aktif ({lastShownTime})</span>
                ) : (
                  <span className="text-status-green font-semibold">Belum Pernah Ditampilkan (Siap Pop-up)</span>
                )}
              </span>
            </span>
            <span className="text-xs">•</span>
            <span>
              Interval Cooldown: <strong className="text-foreground">24 Jam</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DIALOG POP-UP MODAL SEBENARNYA (SIMULASI PEMUNCULAN OTOMATIS)         */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close Button Top Right */}
            <button
              type="button"
              onClick={handleClosePromoModal}
              className="absolute top-4 right-4 z-20 size-8 rounded-full bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Tutup Promosi (1x 24 Jam)"
            >
              <X className="size-4" />
            </button>

            <div className="grid md:grid-cols-12 min-h-[440px]">
              {/* SISI KIRI: Ilustrasi Fitur Terkunci */}
              <div className="md:col-span-5 bg-gradient-to-br from-[#F1EFFF] via-[#ECE8FF] to-[#E5E0FF] dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-background p-6 flex flex-col justify-center items-center relative overflow-hidden border-b md:border-b-0 md:border-r border-primary/10">
                <div className="relative w-full max-w-[260px] rounded-2xl bg-white dark:bg-card border border-primary/20 shadow-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <Table className="size-3.5 text-primary" />
                    <span className="text-[11px] font-bold text-foreground truncate">
                      {promoContent.previewTitle}
                    </span>
                  </div>

                  <div className="space-y-1.5 opacity-60">
                    <div className="grid grid-cols-5 gap-1 text-[8px] font-bold text-muted-foreground pb-1 border-b border-border/40 text-center">
                      <span>Paper</span>
                      <span>Metode</span>
                      <span className="text-primary font-bold">Temuan</span>
                      <span>Keterb...</span>
                      <span>Analisis</span>
                    </div>
                    {[1, 2, 3].map((r) => (
                      <div key={r} className="grid grid-cols-5 gap-1 items-center">
                        <div className="h-2 rounded bg-muted-foreground/20" />
                        <div className="h-2 rounded bg-muted-foreground/20" />
                        <div className="h-2 rounded bg-primary/30" />
                        <div className="h-2 rounded bg-muted-foreground/20" />
                        <div className="h-2 rounded bg-muted-foreground/20" />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-center space-y-2">
                    <div className="size-11 mx-auto rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30">
                      <Lock className="size-5" />
                    </div>
                    <div className="inline-block rounded-full bg-white/95 dark:bg-card px-2.5 py-0.5 shadow-2xs border border-primary/20">
                      <span className="text-[9px] font-bold text-primary">
                        Fitur ini hanya tersedia untuk pengguna Pro
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SISI KANAN: Penawaran & Action Button */}
              <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                    <Crown className="size-3" />
                    <span>Upgrade ke Student Pro</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-foreground tracking-tight leading-snug">
                      {promoContent.titleLead}
                      <span className="text-primary">{promoContent.titleHighlight}</span>
                      {promoContent.titleTrail}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {promoContent.subtitle}
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-1">
                    {promoContent.benefits.map((b, bIdx) => {
                      const BIcon = b.icon
                      return (
                        <li key={bIdx} className="flex items-center gap-2 text-xs text-foreground font-medium">
                          <div className="size-4.5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                            <BIcon className="size-2.5" />
                          </div>
                          <span>{b.text}</span>
                        </li>
                      )
                    })}
                  </ul>

                  {/* Radio Plan Options */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <label
                      onClick={() => setSelectedPlanOption("14_days")}
                      className={`flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedPlanOption === "14_days"
                          ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                          : "border-border/80 bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="modal-plan-radio"
                          checked={selectedPlanOption === "14_days"}
                          onChange={() => setSelectedPlanOption("14_days")}
                          className="text-primary focus:ring-primary size-3"
                        />
                        <span className="text-[10px] font-semibold text-foreground">
                          Student Pro – 14 Hari
                        </span>
                      </div>
                      <div className="mt-1 pl-4.5">
                        <div className="text-xs font-extrabold text-foreground">Rp29.000</div>
                        <div className="text-[9px] text-muted-foreground">Setara Rp2.071/hari</div>
                      </div>
                    </label>

                    <label
                      onClick={() => setSelectedPlanOption("30_days")}
                      className={`relative flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedPlanOption === "30_days"
                          ? "border-primary bg-primary/[0.04] ring-1 ring-primary/25"
                          : "border-border/80 bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-0.2 text-[8px] font-bold text-white">
                        Most Popular
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="modal-plan-radio"
                          checked={selectedPlanOption === "30_days"}
                          onChange={() => setSelectedPlanOption("30_days")}
                          className="text-primary focus:ring-primary size-3"
                        />
                        <span className="text-[10px] font-semibold text-foreground">
                          Student Pro – 30 Hari
                        </span>
                      </div>
                      <div className="mt-1 pl-4.5">
                        <div className="text-xs font-extrabold text-primary">Rp49.000</div>
                        <div className="text-[9px] text-muted-foreground">Setara Rp1.633/hari</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      handleClosePromoModal()
                      toast.success(
                        `Simulasi upgrade berhasil! Paket ${
                          selectedPlanOption === "14_days" ? "14 Hari" : "30 Hari"
                        } dipilih.`
                      )
                    }}
                    className="w-full h-10 rounded-xl text-xs font-bold gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary-hover text-white transition-all cursor-pointer"
                  >
                    <Crown className="size-4 text-amber-300" />
                    <span>Upgrade ke Student Pro</span>
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleClosePromoModal}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Nanti Saja
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
