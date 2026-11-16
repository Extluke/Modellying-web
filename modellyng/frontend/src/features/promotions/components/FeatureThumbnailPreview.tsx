import {
  Lock,
  TableProperties,
  GitBranch,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react"
import { type PromoFeatureType } from "../promoConfig"

export interface PromoFeatureContent {
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

export const PROMO_FEATURE_CONTENT: Record<PromoFeatureType, PromoFeatureContent> = {
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
        icon: Sparkles,
        text: "AI Editing untuk mengolah hasil formulasi riset",
      },
      {
        icon: CheckCircle2,
        text: "Semua fitur terbuka penuh tanpa sensor",
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
        icon: Sparkles,
        text: "Perumusan judul dan novelty proposal dengan AI",
      },
      {
        icon: CheckCircle2,
        text: "Semua fitur terbuka penuh tanpa sensor",
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
        icon: Sparkles,
        text: "Ekstraksi 13 parameter metodologi mendalam",
      },
      {
        icon: CheckCircle2,
        text: "Semua fitur terbuka penuh tanpa sensor",
      },
    ],
  },
}

interface FeatureThumbnailPreviewProps {
  feature: PromoFeatureType
}

export function FeatureThumbnailPreview({ feature }: FeatureThumbnailPreviewProps) {
  const content = PROMO_FEATURE_CONTENT[feature]
  const IconComponent = content.icon

  // 1. COMPARATIVE PAPER MATRIX
  if (feature === "matrix") {
    return (
      <div className="w-full flex flex-col items-center">
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
            <div className="grid grid-cols-4 gap-1 font-bold text-muted-foreground pb-1 border-b border-border/40 text-center">
              <span className="text-left font-semibold">Parameter</span>
              <span className="truncate">Paper #1</span>
              <span className="truncate">Paper #2</span>
              <span className="truncate text-primary">Paper #3</span>
            </div>

            <div className="grid grid-cols-4 gap-1 items-center bg-muted/20 p-1 rounded">
              <span className="font-semibold text-foreground truncate">Masalah</span>
              <div className="h-1.5 rounded bg-muted-foreground/30 w-full" />
              <div className="h-1.5 rounded bg-muted-foreground/30 w-full" />
              <div className="h-1.5 rounded bg-primary/40 w-full" />
            </div>

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

            <div className="grid grid-cols-4 gap-1 items-center bg-muted/20 p-1 rounded">
              <span className="font-semibold text-foreground truncate">Temuan</span>
              <span className="text-[7.5px] text-muted-foreground text-center">94.2%</span>
              <span className="text-[7.5px] text-muted-foreground text-center">96.8%</span>
              <span className="text-[7.5px] text-primary font-bold text-center">97.4%</span>
            </div>
          </div>

          {/* Frosted Glass Lock Callout */}
          <div className="relative pt-1 text-center space-y-2">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-35" />
              <div className="size-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
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

  // 2. RESEARCH GAP MAP
  if (feature === "gap_map") {
    return (
      <div className="w-full flex flex-col items-center">
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
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
              Flow Canvas
            </span>
          </div>

          {/* Interactive React Flow Canvas Graph Graphic */}
          <div className="relative rounded-xl border border-border/60 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 min-h-[95px] flex flex-col justify-between overflow-hidden bg-[radial-gradient(#94a3b8_0.75px,transparent_0.75px)] dark:bg-[radial-gradient(#475569_0.75px,transparent_0.75px)] [background-size:6px_6px]">
            <div className="flex items-center justify-between gap-1 text-[8px]">
              <div className="flex items-center gap-1 rounded-md bg-card border border-indigo-200 dark:border-indigo-900/60 px-1.5 py-0.5 shadow-2xs font-semibold text-foreground">
                <span className="size-1.5 rounded-full bg-indigo-500" />
                <span>Paper A (2023)</span>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-card border border-sky-200 dark:border-sky-900/60 px-1.5 py-0.5 shadow-2xs font-semibold text-foreground">
                <span className="size-1.5 rounded-full bg-sky-500" />
                <span>Paper B (2024)</span>
              </div>
            </div>

            <div className="my-1 flex items-center justify-center gap-1 text-[7.5px] text-muted-foreground font-mono">
              <span className="h-px w-8 bg-indigo-400/60" />
              <span className="rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1 font-semibold border border-amber-500/20">
                Limitasi Terdeteksi
              </span>
              <span className="h-px w-8 bg-sky-400/60" />
            </div>

            <div className="rounded-lg border-2 border-emerald-500/80 bg-emerald-50/90 dark:bg-emerald-950/50 p-1.5 text-center shadow-xs">
              <div className="text-[8.5px] font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1">
                <Sparkles className="size-2.5 text-amber-500" />
                <span>Celah Riset Baru (Novelty Gap)</span>
              </div>
              <div className="text-[7.5px] text-muted-foreground mt-0.5">
                Efisiensi Model pada Edge Device (Skor 92%)
              </div>
            </div>
          </div>

          {/* Frosted Glass Lock Callout */}
          <div className="relative pt-1 text-center space-y-2">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-35" />
              <div className="size-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <Lock className="size-5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="inline-block rounded-full bg-emerald-500/10 dark:bg-card px-3 py-0.5 shadow-2xs border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
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
        <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <IconComponent className="size-3.5" />
          <span>{content.previewSubtitle}</span>
        </div>
      </div>
    )
  }

  // 3. UPLOAD PDF & PIPELINE INGEST
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-[290px] rounded-2xl bg-white dark:bg-card border border-amber-500/30 shadow-xl p-3.5 space-y-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
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
          <div className="flex items-center justify-between p-1.5 rounded-lg border border-border/60 bg-muted/20">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="size-3 text-rose-500 shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-foreground truncate">DeepLearning_NLP.pdf</p>
                <p className="text-[7.5px] text-muted-foreground">3.8 MB • 13 Parameter Siap</p>
              </div>
            </div>
            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="size-3 text-amber-500 shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-foreground truncate">Vision_Transformer.pdf</p>
                <p className="text-[7.5px] text-amber-600 dark:text-amber-400">Tertahan (Batas Tercapai)</p>
              </div>
            </div>
            <span className="text-[7px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1 py-0.2 rounded">
              Menunggu
            </span>
          </div>

          <div className="pt-0.5 space-y-1">
            <div className="flex items-center justify-between text-[7.5px]">
              <span className="font-medium text-muted-foreground">Kuota Hari Ini: 3 / 3 File</span>
              <span className="font-bold text-amber-600">100% Penuh</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Frosted Glass Lock Callout */}
        <div className="relative pt-1 text-center space-y-2">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-35" />
            <div className="size-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Lock className="size-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="inline-block rounded-full bg-amber-500/10 dark:bg-card px-3 py-0.5 shadow-2xs border border-amber-500/30">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
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
      <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
        <IconComponent className="size-3.5" />
        <span>{content.previewSubtitle}</span>
      </div>
    </div>
  )
}
