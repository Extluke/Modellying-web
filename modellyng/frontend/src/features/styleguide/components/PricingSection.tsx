import { useState } from "react"
import {
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  GraduationCap,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Layers,
  HelpCircle,
  TableProperties,
  GitBranch,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/lib/store/useToastStore"

export interface PricingPlan {
  id: "free" | "student_14" | "student_30"
  name: string
  tierBadge: string
  durationText: string
  priceFormatted: string
  priceNumeric: number
  dailyEquivalent?: string
  targetDescription: string
  isPopular?: boolean
  isBestValue?: boolean
  features: {
    text: string
    isAvailable: boolean
    isLimited?: boolean
    statusBadge?: string
    detailNote?: string
  }[]
  ctaText: string
  ctaVariant: "outline" | "primary" | "default"
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free Plan",
    tierBadge: "Akun Dasar / Uji Coba",
    durationText: "Gratis Selamanya",
    priceFormatted: "Rp0",
    priceNumeric: 0,
    targetDescription: "Cocok untuk pengguna yang ingin mencoba kemampuan dasar Modellyng.",
    features: [
      {
        text: "Maksimal penggunaan 3 file per hari.",
        isAvailable: true,
        statusBadge: "3 File / Hari",
      },
      {
        text: "Reset kuota setiap 24 jam setelah batas harian tercapai.",
        isAvailable: true,
      },
      {
        text: "Akses hasil analisis dan ringkasan dasar paper.",
        isAvailable: true,
      },
      {
        text: "Akses terbatas pada Comparative Paper Matrix (tabel perbandingan dasar dapat dilihat, tetapi penjelasan mendalam dan perbandingan antar-paper dikunci).",
        isAvailable: false,
        isLimited: true,
        statusBadge: "Terbatas",
        detailNote: "Hanya tabel dasar, penjelasan & komparasi mendalam terkunci.",
      },
      {
        text: "Akses terbatas pada Research Gap Map (hanya dapat dilihat melalui preview terbatas, flow map dibuat blur, dan hubungan antar-penelitian tidak dapat dibaca).",
        isAvailable: false,
        isLimited: true,
        statusBadge: "Preview Blur",
        detailNote: "Flow map diburamkan, relasi antar-paper tidak terbaca.",
      },
      {
        text: "Fitur AI Editing dan penjelasan lanjutan terkunci penuh.",
        isAvailable: false,
        statusBadge: "Terkunci",
        detailNote: "Tidak dapat menyunting atau mengembangkan formulasi.",
      },
    ],
    ctaText: "Gunakan Paket Gratis",
    ctaVariant: "outline",
  },
  {
    id: "student_14",
    name: "Student Pro – 14 Hari",
    tierBadge: "Paket Tugas & Kajian Cepat",
    durationText: "Masa Aktif 14 Hari",
    priceFormatted: "Rp29.000",
    priceNumeric: 29000,
    dailyEquivalent: "Setara Rp2.071 per hari",
    targetDescription:
      "Cocok untuk mahasiswa yang membutuhkan akses dalam periode pengerjaan tugas atau kajian pustaka dengan komitmen pembayaran lebih rendah.",
    features: [
      {
        text: "Kuota 15 token setiap hari (diperbarui setiap hari selama masa aktif, total maksimal 210 token).",
        isAvailable: true,
        statusBadge: "15 Token / Hari",
        detailNote: "Total akumulasi hingga 210 token selama 14 hari.",
      },
      {
        text: "Seluruh fitur terbuka dan tidak ada fitur yang terkunci selama masa aktif.",
        isAvailable: true,
        statusBadge: "Akses Penuh",
      },
      {
        text: "Akses penuh Comparative Paper Matrix (tabel perbandingan lengkap, penjelasan mendalam, keterbatasan penelitian, dan hubungan antar-paper dapat dibaca).",
        isAvailable: true,
      },
      {
        text: "Akses penuh Research Gap Map (seluruh visualisasi flow map terlihat jelas dan interaktif, lengkap dengan analisis potensi research gap).",
        isAvailable: true,
      },
      {
        text: "Fitur AI Editing terbuka untuk mengedit, mengembangkan, dan menyempurnakan hasil analisis.",
        isAvailable: true,
      },
      {
        text: "Ekstraksi informasi dan ringkasan paper yang lebih lengkap dan terstruktur.",
        isAvailable: true,
      },
    ],
    ctaText: "Pilih Student Pro 14 Hari",
    ctaVariant: "primary",
  },
  {
    id: "student_30",
    name: "Student Pro – 30 Hari",
    tierBadge: "Paling Populer & Paling Ekonomis",
    durationText: "Masa Aktif 30 Hari Penuh",
    priceFormatted: "Rp49.000",
    priceNumeric: 49000,
    dailyEquivalent: "Setara sekitar Rp1.633 per hari (Hemat 21%)",
    targetDescription:
      "Cocok untuk mahasiswa yang sedang menyusun proposal, skripsi, atau kajian literatur secara berkelanjutan (pilihan paling ekonomis).",
    isPopular: true,
    isBestValue: true,
    features: [
      {
        text: "Kuota 15 token setiap hari (diperbarui setiap hari selama masa aktif, total maksimal 450 token).",
        isAvailable: true,
        statusBadge: "15 Token / Hari",
        detailNote: "Total akumulasi hingga 450 token selama 30 hari.",
      },
      {
        text: "Seluruh fitur terbuka dan tidak ada fitur yang terkunci selama masa aktif.",
        isAvailable: true,
        statusBadge: "Akses Penuh",
      },
      {
        text: "Akses penuh Comparative Paper Matrix (tabel perbandingan lengkap, penjelasan mendalam, keterbatasan penelitian, dan hubungan antar-paper dapat dibaca).",
        isAvailable: true,
      },
      {
        text: "Akses penuh Research Gap Map (seluruh visualisasi flow map terlihat jelas dan interaktif, lengkap dengan analisis potensi research gap).",
        isAvailable: true,
      },
      {
        text: "Fitur AI Editing terbuka untuk mengedit, mengembangkan, dan menyempurnakan hasil analisis.",
        isAvailable: true,
      },
      {
        text: "Ekstraksi informasi dan ringkasan paper yang lebih lengkap dan terstruktur.",
        isAvailable: true,
      },
    ],
    ctaText: "Pilih Student Pro 30 Hari",
    ctaVariant: "primary",
  },
]

export function PricingSection() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("student_30")

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlanId(plan.id)
    toast.success(
      `Simulasi pemilihan paket: ${plan.name} (${plan.priceFormatted}). Prototipe UI berhasil merespon interaksi!`
    )
  }

  return (
    <section className="space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary border border-primary/20 shadow-xs">
          <GraduationCap className="size-4" />
          <span>Skema Akun & Penetapan Harga Ramah Mahasiswa</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Pilihan Paket Berlangganan Modellyng
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Tingkatkan produktivitas analisis dokumen akademik Anda. Dari uji coba dasar tanpa biaya hingga paket lengkap
          untuk menyusun tinjauan pustaka, tugas akhir, dan skripsi dengan harga terjangkau.
        </p>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch pt-4">
        {PRICING_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id
          const isPro30 = plan.id === "student_30"

          return (
            <Card
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative flex flex-col justify-between transition-all duration-300 rounded-2xl cursor-pointer ${
                isPro30
                  ? "border-2 border-primary shadow-xl ring-2 ring-primary/20 md:-translate-y-2 bg-gradient-to-b from-card via-card to-primary/[0.02]"
                  : isSelected
                  ? "border-primary/80 shadow-md ring-1 ring-primary/20 bg-card"
                  : "border-border/80 hover:border-primary/40 hover:shadow-md bg-card"
              }`}
            >
              {/* Highlight Ribbon for 30 Days Pro */}
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-3.5 py-1 text-[11px] font-bold text-white shadow-md shadow-primary/25 border border-white/20">
                    <Sparkles className="size-3" />
                    <span>Paling Populer & Ekonomis</span>
                  </div>
                </div>
              )}

              <div>
                <CardHeader className="space-y-3 pb-4">
                  {/* Tier Badge & Duration */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        plan.id === "free"
                          ? "muted"
                          : plan.id === "student_30"
                          ? "primary"
                          : "ready"
                      }
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                    >
                      {plan.tierBadge}
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {plan.durationText}
                    </span>
                  </div>

                  {/* Plan Title */}
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed min-h-[38px]">
                      {plan.targetDescription}
                    </CardDescription>
                  </div>

                  {/* Price Block */}
                  <div className="pt-2 border-t border-border/60">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                        {plan.priceFormatted}
                      </span>
                      {plan.priceNumeric > 0 && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          / periode
                        </span>
                      )}
                    </div>
                    {plan.dailyEquivalent && (
                      <div className="mt-1 text-[11px] font-medium text-primary flex items-center gap-1">
                        <Zap className="size-3 shrink-0" />
                        <span>{plan.dailyEquivalent}</span>
                      </div>
                    )}
                    {plan.priceNumeric === 0 && (
                      <div className="mt-1 text-[11px] font-medium text-status-green flex items-center gap-1">
                        <CheckCircle2 className="size-3 shrink-0" />
                        <span>Tanpa biaya & tanpa perlu kartu kredit</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                {/* Features List */}
                <CardContent className="pt-2 pb-6 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/40">
                    Daftar Fitur yang Didapat:
                  </div>

                  <ul className="space-y-2.5">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs leading-relaxed">
                        {feature.isAvailable ? (
                          <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
                        ) : feature.isLimited ? (
                          <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                        ) : (
                          <Lock className="size-4 shrink-0 text-muted-foreground/70 mt-0.5" />
                        )}

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={
                                feature.isAvailable
                                  ? "text-foreground font-medium"
                                  : feature.isLimited
                                  ? "text-foreground/90 font-medium"
                                  : "text-muted-foreground line-through"
                              }
                            >
                              {feature.text}
                            </span>
                            {feature.statusBadge && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  feature.isAvailable
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : feature.isLimited
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                    : "bg-muted text-muted-foreground border border-border"
                                }`}
                              >
                                {feature.statusBadge}
                              </span>
                            )}
                          </div>
                          {feature.detailNote && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {feature.detailNote}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              {/* Action Button Footer */}
              <CardFooter className="pt-2 pb-5 border-t border-border/50">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectPlan(plan)
                  }}
                  variant={isPro30 ? "primary" : plan.ctaVariant}
                  className={`w-full rounded-xl text-xs font-semibold gap-2 transition-all ${
                    isPro30
                      ? "shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
                      : ""
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Matriks Perbandingan Fitur Paket Akun</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rincian komparasi hak akses fitur pada setiap jenis akun Modellyng.
            </p>
          </div>
          <Badge variant="primary" className="text-[11px] self-start sm:self-auto">
            Spesifikasi Transparan
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="p-3 font-semibold w-1/3">Fitur / Kemampuan Analisis</th>
                <th className="p-3 font-semibold text-center w-1/5">Free Plan</th>
                <th className="p-3 font-semibold text-center w-1/5">Student Pro (14 Hari)</th>
                <th className="p-3 font-semibold text-center w-1/5 bg-primary/5 text-primary border-x border-primary/20">
                  Student Pro (30 Hari) ⭐
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span>Batas Dokumen / Kuota Harian</span>
                </td>
                <td className="p-3 text-center text-muted-foreground">Maks. 3 file / hari</td>
                <td className="p-3 text-center font-semibold text-foreground">15 token / hari</td>
                <td className="p-3 text-center font-semibold text-primary bg-primary/5 border-x border-primary/20">
                  15 token / hari
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <Zap className="size-3.5 text-muted-foreground" />
                  <span>Total Akumulasi Token Maksimal</span>
                </td>
                <td className="p-3 text-center text-muted-foreground">Reset tiap 24 jam</td>
                <td className="p-3 text-center font-semibold text-foreground">Hingga 210 token</td>
                <td className="p-3 text-center font-semibold text-primary bg-primary/5 border-x border-primary/20">
                  Hingga 450 token
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <TableProperties className="size-3.5 text-muted-foreground" />
                  <span>Comparative Paper Matrix</span>
                </td>
                <td className="p-3 text-center text-amber-600 dark:text-amber-400">
                  Tabel dasar (analisis mendalam dikunci)
                </td>
                <td className="p-3 text-center font-semibold text-status-green">Akses Penuh Tanpa Kunci</td>
                <td className="p-3 text-center font-semibold text-primary bg-primary/5 border-x border-primary/20">
                  Akses Penuh Tanpa Kunci
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <GitBranch className="size-3.5 text-muted-foreground" />
                  <span>Research Gap Map & Flow</span>
                </td>
                <td className="p-3 text-center text-amber-600 dark:text-amber-400">
                  Preview terbatas (flow map blur)
                </td>
                <td className="p-3 text-center font-semibold text-status-green">Visualisasi Interaktif Jelas</td>
                <td className="p-3 text-center font-semibold text-primary bg-primary/5 border-x border-primary/20">
                  Visualisasi Interaktif Jelas
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <Wand2 className="size-3.5 text-muted-foreground" />
                  <span>Fitur AI Editing & Perumusan Solusi</span>
                </td>
                <td className="p-3 text-center text-muted-foreground line-through">Terkunci penuh</td>
                <td className="p-3 text-center font-semibold text-status-green">Terbuka Penuh</td>
                <td className="p-3 text-center font-semibold text-primary bg-primary/5 border-x border-primary/20">
                  Terbuka Penuh
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-muted-foreground" />
                  <span>Status Fitur Terkunci</span>
                </td>
                <td className="p-3 text-center text-muted-foreground">Sebagian Fitur Terkunci</td>
                <td className="p-3 text-center font-semibold text-status-green">0 Fitur Terkunci (100% Terbuka)</td>
                <td className="p-3 text-center font-semibold text-primary bg-primary/5 border-x border-primary/20">
                  0 Fitur Terkunci (100% Terbuka)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Trust & Guarantee Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">
              Jaminan Akurasi & Ketertelusuran Bukti 100%
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Seluruh ringkasan dan analisis pada akun Free maupun Student Pro tetap terikat pada nomor halaman dan kutipan
              asli naskah PDF tanpa halusinasi.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.info("Bantuan konsultasi paket mahasiswa dapat diakses melalui tim dukungan Modellyng.")
            }}
            className="text-xs h-8.5 rounded-lg"
          >
            <HelpCircle className="size-3.5" />
            <span>Ada Pertanyaan?</span>
          </Button>
        </div>
      </div>
    </section>
  )
}

