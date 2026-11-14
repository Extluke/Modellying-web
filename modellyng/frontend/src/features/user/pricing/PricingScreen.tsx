import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Lock,
  AlertCircle,
  ArrowRight,
  Zap,
  Calendar,
  HelpCircle,
  ChevronDown,
  Layers,
  TableProperties,
  GitBranch,
  Wand2,
  FileText,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ROUTES } from "@/app/routes"
import { toast } from "@/lib/store/useToastStore"
import { PRICING_PLANS, PricingPlan } from "@/features/styleguide/components/PricingSection"

export default function PricingScreen() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("student_30")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlanId(plan.id)
    if (plan.id === "free") {
      toast.info("Anda saat ini sudah berada di Free Plan (Akun Dasar).")
    } else {
      toast.success(
        `Simulasi pemilihan paket: ${plan.name} (${plan.priceFormatted}). Anda akan diarahkan ke konfirmasi pembayaran!`
      )
    }
  }

  const faqs = [
    {
      q: "Bagaimana cara kerja kuota 15 token harian pada Student Pro?",
      a: "Setiap hari selama masa aktif (14 hari atau 30 hari), akun Anda akan mendapatkan 15 token baru yang dapat digunakan untuk menganalisis dokumen paper atau melakukan query AI. Kuota harian ini diperbarui setiap 24 jam.",
    },
    {
      q: "Apakah langganan ini akan diperpanjang secara otomatis?",
      a: "Tidak. Seluruh paket Student Pro berbasis durasi tetap (14 hari atau 30 hari) tanpa auto-renewal dan tanpa perlu kartu kredit. Anda hanya membayar ketika memang sedang membutuhkan akses.",
    },
    {
      q: "Apa yang terjadi dengan data proyek saya setelah masa aktif berakhir?",
      a: "Seluruh proyek, paper yang telah diunggah, dan hasil analisis Anda tetap tersimpan dengan aman di akun Anda. Anda tetap dapat membukanya kembali dalam mode pembacaan dasar.",
    },
    {
      q: "Metode pembayaran apa saja yang didukung?",
      a: "Modellyng mendukung QRIS (GoPay, OVO, Dana, ShopeePay), Transfer Bank Virtual Account (BCA, Mandiri, BNI, BRI), serta dompet digital lokal mahasiswa Indonesia.",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-8 space-y-10 max-w-6xl mx-auto">
      {/* Top Focused Navigation Bar */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <Link
          to={ROUTES.USER.SETTINGS}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer group shadow-2xs"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform text-muted-foreground" />
          <span>Kembali ke Pengaturan Akun</span>
        </Link>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch pt-2">
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
                    <span>Pilihan Paling Populer & Ekonomis</span>
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
                        <span>Paket dasar bawaan akun Anda</span>
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
                  <span>{plan.id === "free" ? "Paket Saat Ini" : plan.ctaText}</span>
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
              <span>Matriks Perbandingan Hak Akses Fitur</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Perbandingan transparan antara akun Free dan Student Pro.
            </p>
          </div>
          <Badge variant="primary" className="text-[11px] self-start sm:self-auto">
            Spesifikasi Lengkap
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="p-3 font-semibold w-1/3">Fitur / Hak Akses</th>
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

      {/* FAQ Accordion Section */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <HelpCircle className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h3>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div key={idx} className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 text-xs text-muted-foreground leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

