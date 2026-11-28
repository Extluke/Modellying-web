import { useState, useEffect } from "react"
import {
  Lock,
  Crown,
  Sparkles,
  Check,
  X,
  Clock,
  TableProperties,
  PenTool,
  GitBranch,
  UploadCloud,
  Layers,
  Eye,
  RefreshCw,
  Info,
  FileText,
  CheckCircle2,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/lib/store/useToastStore"
import { useAuthStore } from "@/features/auth/store/authStore"
import { PRICING_PLANS } from "./PricingSection"
import {
  ADMIN_WHATSAPP_DISPLAY,
  buildPricingWhatsAppUrl,
} from "@/features/user/pricing/utils/whatsappPricing"

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
  previewSubtitle: string
  icon: typeof TableProperties
  benefits: {
    icon: typeof TableProperties
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
    previewSubtitle: "Komparasi 13 Parameter Ilmiah Multi-Paper",
    icon: TableProperties,
    benefits: [
      {
        icon: TableProperties,
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
    previewTitle: "Research Gap Map & Flow Canvas",
    previewSubtitle: "Kanvas Alur & Relasi Antar-Penelitian",
    icon: GitBranch,
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
    previewTitle: "PDF Pipeline & Kuota Token",
    previewSubtitle: "Pipeline Ekstraksi Dokumen & Token Kuota",
    icon: UploadCloud,
    benefits: [
      {
        icon: UploadCloud,
        text: "Kuota 15 token harian (akumulasi hingga 450 token)",
      },
      {
        icon: TableProperties,
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

/**
 * ============================================================================
 * KOMPONEN THUMBNAIL VISUAL SPESIFIK UNTUK TIAP FITUR
 * ============================================================================
 * Menghasilkan ilustrasi visual unik yang realistis sesuai progres fitur:
 * 1. Comparative Paper Matrix: Tabel multi-kolom parameter dengan blur analisis terkunci.
 * 2. Research Gap Map: Kanvas flow graph berbasis simpul (paper, limitasi, celah novelty).
 * 3. Kuota Upload PDF: Kartu dokumen PDF, status ekstraksi 13 parameter, & meteran kuota 3/3.
 */
function FeatureThumbnailPreview({
  feature,
}: {
  feature: PromoFeatureType
}) {
  const content = PROMO_FEATURE_CONTENT[feature]
  const IconComponent = content.icon

  if (feature === "matrix") {
    return (
      <div className="w-full flex flex-col items-center">
        {/* Mock Preview Card Container */}
        <div className="relative w-full max-w-[290px] rounded-2xl bg-white dark:bg-card border border-primary/25 shadow-xl p-3.5 space-y-3 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <IconComponent className="size-3.5" />
              </div>
              <span className="text-[11px] font-bold text-foreground truncate">
                {content.previewTitle}
              </span>
            </div>
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
              13 Parameter
            </span>
          </div>

          {/* Matrix Columns & Cell Grid Illustration */}
          <div className="space-y-1.5 text-[8px]">
            {/* Table Header Columns */}
            <div className="grid grid-cols-4 gap-1 font-bold text-muted-foreground pb-1 border-b border-border/40 text-center">
              <span className="text-left font-semibold">Parameter</span>
              <span className="truncate">Paper #1</span>
              <span className="truncate">Paper #2</span>
              <span className="truncate text-primary">Paper #3</span>
            </div>

            {/* Row 1: Rumusan Masalah */}
            <div className="grid grid-cols-4 gap-1 items-center bg-muted/20 p-1 rounded">
              <span className="font-semibold text-foreground truncate">Masalah</span>
              <div className="h-1.5 rounded bg-muted-foreground/30 w-full" />
              <div className="h-1.5 rounded bg-muted-foreground/30 w-full" />
              <div className="h-1.5 rounded bg-primary/40 w-full" />
            </div>

            {/* Row 2: Metodologi */}
            <div className="grid grid-cols-4 gap-1 items-center bg-muted/20 p-1 rounded">
              <span className="font-semibold text-foreground truncate">Metode</span>
              <span className="truncate text-[7.5px] font-mono bg-background px-1 py-0.2 rounded border text-muted-foreground">
                ResNet
              </span>
              <span className="truncate text-[7.5px] font-mono bg-background px-1 py-0.2 rounded border text-muted-foreground">
                ViT-B
              </span>
              <span className="truncate text-[7.5px] font-mono bg-primary/10 text-primary px-1 py-0.2 rounded border border-primary/20 font-semibold">
                Hybrid
              </span>
            </div>

            {/* Row 3: Temuan Utama */}
            <div className="grid grid-cols-4 gap-1 items-center bg-muted/20 p-1 rounded">
              <span className="font-semibold text-foreground truncate">Temuan</span>
              <span className="text-[7.5px] text-muted-foreground text-center">94.2%</span>
              <span className="text-[7.5px] text-muted-foreground text-center">96.8%</span>
              <span className="text-[7.5px] text-primary font-bold text-center">97.4%</span>
            </div>
          </div>

          {/* Lock Callout */}
          <div className="relative pt-1 text-center space-y-2">
            <div className="relative inline-flex items-center justify-center">
              <div className="size-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/25">
                <Lock className="size-5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="inline-block rounded-full bg-primary/10 dark:bg-card px-3 py-0.5 shadow-2xs border border-primary/25">
                <span className="text-[10px] font-bold text-primary">
                  Komparasi 13 Parameter Terkunci
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground">
                Tabel dasar terbuka • Analisis silang mendalam khusus Pro
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Tag */}
        <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-semibold text-primary/90">
          <IconComponent className="size-3.5" />
          <span>{content.previewSubtitle}</span>
        </div>
      </div>
    )
  }

  if (feature === "gap_map") {
    return (
      <div className="w-full flex flex-col items-center">
        {/* Mock Preview Card Container */}
        <div className="relative w-full max-w-[290px] rounded-2xl bg-white dark:bg-card border border-emerald-500/30 shadow-xl p-3.5 space-y-3 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <IconComponent className="size-3.5" />
              </div>
              <span className="text-[11px] font-bold text-foreground truncate">
                {content.previewTitle}
              </span>
            </div>
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
              Flow Canvas
            </span>
          </div>

          {/* Interactive React Flow Canvas Graph Graphic */}
          <div className="relative rounded-xl border border-border/60 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 min-h-[95px] flex flex-col justify-between overflow-hidden">
            {/* Top Nodes */}
            <div className="flex items-center justify-between gap-1 text-[8px]">
              <div className="flex items-center gap-1 rounded-md bg-card border border-primary/20 px-1.5 py-0.5 shadow-2xs font-semibold text-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Paper A (2023)</span>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-card border border-border px-1.5 py-0.5 shadow-2xs font-semibold text-foreground">
                <span className="size-1.5 rounded-full bg-slate-400" />
                <span>Paper B (2024)</span>
              </div>
            </div>

            {/* Flow Connecting Lines */}
            <div className="my-1 flex items-center justify-center gap-1 text-[7.5px] text-muted-foreground font-mono">
              <span className="h-px w-8 bg-border" />
              <span className="rounded bg-primary-soft text-primary dark:bg-primary/15 px-1 font-semibold border border-primary/20">
                Limitasi Terdeteksi
              </span>
              <span className="h-px w-8 bg-border" />
            </div>

            {/* Converging Novelty Center Node */}
            <div className="rounded-lg border border-primary/40 bg-primary-soft/80 dark:bg-primary/15 p-1.5 text-center shadow-xs">
              <div className="text-[8.5px] font-extrabold text-primary flex items-center justify-center gap-1">
                <Sparkles className="size-2.5 text-primary" />
                <span>Celah Riset Baru (Novelty Gap)</span>
              </div>
              <div className="text-[7.5px] text-muted-foreground mt-0.5">
                Efisiensi Model pada Edge Device (Skor 92%)
              </div>
            </div>
          </div>

          {/* Lock Callout */}
          <div className="relative pt-1 text-center space-y-2">
            <div className="relative inline-flex items-center justify-center">
              <div className="size-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/25">
                <Lock className="size-5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="inline-block rounded-full bg-primary/10 dark:bg-card px-3 py-0.5 shadow-2xs border border-primary/25">
                <span className="text-[10px] font-bold text-primary">
                  Visualisasi Relasi & Celah Terkunci
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground">
                Flow map tanpa sensor • Perumusan usulan proposal AI
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Tag */}
        <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          <IconComponent className="size-3.5" />
          <span>{content.previewSubtitle}</span>
        </div>
      </div>
    )
  }

  // Feature: upload (Kuota Upload & PDF Ingestion Pipeline)
  return (
    <div className="w-full flex flex-col items-center">
      {/* Mock Preview Card Container */}
      <div className="relative w-full max-w-[290px] rounded-2xl bg-white dark:bg-card border border-primary/25 shadow-xl p-3.5 space-y-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-primary-soft text-primary dark:bg-primary/15 flex items-center justify-center">
              <IconComponent className="size-3.5" />
            </div>
            <span className="text-[11px] font-bold text-foreground truncate">
              {content.previewTitle}
            </span>
          </div>
          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
            3/3 Limit
          </span>
        </div>

        {/* File Pipeline Stack & Usage Bar */}
        <div className="space-y-2 text-[8px]">
          {/* File 1: Ingested */}
          <div className="flex items-center justify-between p-1.5 rounded-lg border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="size-3 text-primary shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-foreground truncate">DeepLearning_NLP.pdf</p>
                <p className="text-[7.5px] text-muted-foreground">3.8 MB • 13 Parameter Siap</p>
              </div>
            </div>
            <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
          </div>

          {/* File 2: Blocked by quota */}
          <div className="flex items-center justify-between p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="size-3 text-amber-600 shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-foreground truncate">Vision_Transformer.pdf</p>
                <p className="text-[7.5px] text-amber-700 dark:text-amber-400">Tertahan (Batas Tercapai)</p>
              </div>
            </div>
            <span className="text-[7px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1 py-0.2 rounded">
              Menunggu
            </span>
          </div>

          {/* Daily Quota Progress Bar */}
          <div className="pt-0.5 space-y-1">
            <div className="flex items-center justify-between text-[7.5px]">
              <span className="font-medium text-muted-foreground">Kuota Hari Ini: 3 / 3 File</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">100% Penuh</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Lock Callout */}
        <div className="relative pt-1 text-center space-y-2">
          <div className="relative inline-flex items-center justify-center">
            <div className="size-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/25">
              <Lock className="size-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="inline-block rounded-full bg-primary/10 dark:bg-card px-3 py-0.5 shadow-2xs border border-primary/25">
              <span className="text-[10px] font-bold text-primary">
                Batas 3 File/Hari Tercapai
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground">
              Upgrade ke Student Pro untuk 15 token harian tanpa antre
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Tag */}
      <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
        <IconComponent className="size-3.5" />
        <span>{content.previewSubtitle}</span>
      </div>
    </div>
  )
}

export function UpgradeLimitSection() {
  const user = useAuthStore((s) => s.user)

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
  }

  // Handler reset jam simulasi
  const handleResetTimer = () => {
    localStorage.removeItem(storageKey)
    setLastShownTime(null)
    toast.success("Timer simulasi 24 jam berhasil direset! Pop-up siap ditampilkan kembali.")
  }

  // Handler upgrade langsung via WhatsApp Admin
  const handleUpgradeViaWhatsApp = (planOption: "14_days" | "30_days") => {
    const planId = planOption === "14_days" ? "student_14" : "student_30"
    const targetPlan = PRICING_PLANS.find((p) => p.id === planId)
    if (targetPlan) {
      const waUrl = buildPricingWhatsAppUrl(targetPlan, user)
      try {
        window.open(waUrl, "_blank", "noopener,noreferrer")
      } catch {
        // Fallback
      }
      toast.success(
        `Mengarahkan ke WhatsApp Admin (${ADMIN_WHATSAPP_DISPLAY}) untuk ${targetPlan.name}!`
      )
    }
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

            <Card className="rounded-2xl border border-amber-500/20 bg-card p-6 shadow-xs flex flex-col justify-between text-center space-y-4">
              <div className="space-y-3">
                {/* Specific Upload Icon */}
                <div className="flex justify-center">
                  <div className="size-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                    <UploadCloud className="size-5.5" />
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

            <Card className="rounded-2xl border border-primary/20 bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Header with Title & PRO Badge */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Analisis Lengkap</h4>
                  <span className="rounded-full bg-primary/10 text-primary font-extrabold text-[10px] px-2 py-0.5 border border-primary/20 tracking-wider">
                    PRO
                  </span>
                </div>

                {/* Specific Matrix Icon */}
                <div className="pt-1">
                  <div className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
                    <TableProperties className="size-4.5" />
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

            <Card className="rounded-2xl border border-emerald-500/20 bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Header with Title & PRO Badge */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Research Gap Map</h4>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] px-2 py-0.5 border border-emerald-500/20 tracking-wider">
                    PRO
                  </span>
                </div>

                {/* Specific Gap Map Icon & Subheading */}
                <div className="space-y-2 pt-1">
                  <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    <GitBranch className="size-4.5" />
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
              className="text-xs gap-1.5 h-8.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5 cursor-pointer"
            >
              <Eye className="size-3.5" />
              <span>Buka Tampilan Pop-up Modal</span>
            </Button>
          </div>
        </div>

        {/* Tab Switcher untuk melihat preview 3 jenis fitur */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Pilih Pratinjau Fitur:</span>
          {(["matrix", "gap_map", "upload"] as PromoFeatureType[]).map((ft) => {
            const isSelected = selectedPromoFeature === ft
            return (
              <Button
                key={ft}
                type="button"
                variant={isSelected ? "primary" : "outline"}
                size="sm"
                onClick={() => setSelectedPromoFeature(ft)}
                className="text-xs h-8 px-3 rounded-xl gap-1.5 cursor-pointer"
              >
                {ft === "matrix" && (
                  <>
                    <TableProperties className="size-3.5" />
                    <span>Comparative Matrix</span>
                  </>
                )}
                {ft === "gap_map" && (
                  <>
                    <GitBranch className="size-3.5" />
                    <span>Research Gap Map</span>
                  </>
                )}
                {ft === "upload" && (
                  <>
                    <UploadCloud className="size-3.5" />
                    <span>Kuota Upload & Token</span>
                  </>
                )}
              </Button>
            )
          })}
        </div>

        {/* EMBEDDED SHOWCASE (Tampilan Utuh Sesuai Preview Desain) */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl max-w-4xl mx-auto">
          <div className="grid md:grid-cols-12 min-h-[460px]">
            {/* SISI KIRI: Ilustrasi Visual Fitur Terkunci */}
            <div className="md:col-span-5 p-6 flex flex-col justify-center items-center relative overflow-hidden border-b md:border-b-0 md:border-r border-border/60 bg-primary-soft/50 dark:bg-primary/10">
              {/* Dynamic Feature Thumbnail Component */}
              <FeatureThumbnailPreview feature={selectedPromoFeature} />
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
                      Paling Populer
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
                  onClick={() => handleUpgradeViaWhatsApp(selectedPlanOption)}
                  className="w-full h-11 rounded-xl text-xs font-bold gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary-hover text-white transition-all cursor-pointer"
                >
                  <MessageCircle className="size-4" />
                  <span>
                    Upgrade via WhatsApp (
                    {selectedPlanOption === "14_days" ? "14 Hari • Rp29.000" : "30 Hari • Rp49.000"}
                    )
                  </span>
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
              className="text-[11px] h-7.5 px-2.5 gap-1 shrink-0 rounded-lg cursor-pointer"
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
              Interval Cooldown: <strong className="text-foreground">5 Menit (Mode Testing) / 24 Jam (Produksi)</strong>
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
              <div className="md:col-span-5 p-6 flex flex-col justify-center items-center relative overflow-hidden border-b md:border-b-0 md:border-r border-border/60 bg-primary-soft/50 dark:bg-primary/10">
                <FeatureThumbnailPreview feature={selectedPromoFeature} />
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
                        Paling Populer
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
                      handleUpgradeViaWhatsApp(selectedPlanOption)
                      handleClosePromoModal()
                    }}
                    className="w-full h-10 rounded-xl text-xs font-bold gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary-hover text-white transition-all cursor-pointer"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>
                      Upgrade via WhatsApp (
                      {selectedPlanOption === "14_days" ? "14 Hari • Rp29.000" : "30 Hari • Rp49.000"}
                      )
                    </span>
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
