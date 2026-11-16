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
  MessageCircle,
  ExternalLink,
  GraduationCap,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ROUTES } from "@/app/routes"
import { toast } from "@/lib/store/useToastStore"
import { PRICING_PLANS, PricingPlan } from "@/features/styleguide/components/PricingSection"
import { useAuthStore } from "@/features/auth/store/authStore"
import { WhatsAppPaymentModal } from "./components/WhatsAppPaymentModal"
import {
  ADMIN_WHATSAPP_DISPLAY,
  ADMIN_WHATSAPP_BASE_URL,
  buildPricingWhatsAppUrl,
  formatSubscriptionTierName,
} from "./utils/whatsappPricing"

export default function PricingScreen() {
  const user = useAuthStore((s) => s.user)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("student_30")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  // WhatsApp Order Confirmation Modal State
  const [activeModalPlan, setActiveModalPlan] = useState<PricingPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlanId(plan.id)

    if (plan.id === "free") {
      if (user?.subscription_tier === "free" || !user?.subscription_tier) {
        toast.info(
          "Anda saat ini sudah aktif di Free Plan (Akun Dasar). Silakan pilih paket Student Pro untuk kuota 15 token harian.",
          5000
        )
      } else {
        toast.info(
          "Free Plan adalah paket bawaan gratis. Akun Anda saat ini memiliki paket aktif yang lebih tinggi.",
          5000
        )
      }
      return
    }

    // 1. Build WhatsApp direct URL with template message
    const whatsappUrl = buildPricingWhatsAppUrl(plan, user)

    // 2. Open WhatsApp in new tab for direct frictionless redirection
    try {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    } catch {
      // Fallback handled by modal
    }

    // 3. Open helpful modal dialog as confirmation & fallback
    setActiveModalPlan(plan)
    setIsModalOpen(true)

    // 4. Uniform 5-second toast notification
    toast.success(
      `Mengarahkan ke WhatsApp Admin (${ADMIN_WHATSAPP_DISPLAY}) untuk paket ${plan.name}. Silakan kirim pesan yang disiapkan untuk panduan pembayaran QRIS / Transfer Bank.`,
      5000
    )
  }

  const faqs = [
    {
      q: "Bagaimana cara kerja kuota 15 token harian pada Student Pro?",
      a: "Setiap hari selama masa aktif (14 hari atau 30 hari), akun Anda akan mendapatkan 15 token baru yang dapat digunakan untuk menganalisis dokumen paper atau melakukan query AI. Kuota harian ini diperbarui setiap 24 jam.",
    },
    {
      q: "Bagaimana cara pembayaran dan aktivasi paket?",
      a: "Setelah Anda mengklik paket yang diinginkan, Anda akan langsung terhubung ke WhatsApp Admin kami (+62 812-6927-4671) dengan draf pesan otomatis. Admin akan membagikan kode QRIS atau nomor rekening transfer bank (BCA/Mandiri/BNI/BRI/GoPay/OVO/Dana), dan paket Anda langsung diaktifkan segera setelah pembayaran terkonfirmasi.",
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
      q: "Metode pembayaran apa saja yang didukung via WhatsApp Admin?",
      a: "Modellyng mendukung QRIS (GoPay, OVO, Dana, ShopeePay), Transfer Bank Virtual Account / Rekening Bank (BCA, Mandiri, BNI, BRI), serta dompet digital lokal mahasiswa Indonesia.",
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

        {user && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Paket Anda saat ini:</span>
            <Badge variant="primary" className="font-semibold text-[11px]">
              {formatSubscriptionTierName(user.subscription_tier)}
            </Badge>
          </div>
        )}
      </div>

      {/* Header / Hero Section */}
      <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary border border-primary/20 shadow-xs">
          <GraduationCap className="size-4" />
          <span>Skema Akun & Penetapan Harga Ramah Mahasiswa</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Pilihan Paket Berlangganan Modellyng
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Tingkatkan produktivitas analisis riset Anda. Bebas hambatan dengan aktivasi instan melalui WhatsApp Admin kami tanpa perlu kartu kredit.
        </p>
      </div>

      {/* Quick WhatsApp Support Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageCircle className="size-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <span>Aktivasi Pembayaran Mudah & Terpandu via WhatsApp</span>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[9px] px-1.5 py-0">
                Layanan Admin
              </Badge>
            </h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Cukup klik paket yang diinginkan. Anda akan diarahkan ke WhatsApp Admin (<strong>{ADMIN_WHATSAPP_DISPLAY}</strong>) dengan pesan template siap kirim.
            </p>
          </div>
        </div>

        <a
          href={ADMIN_WHATSAPP_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs shadow-emerald-600/20"
        >
          <MessageCircle className="size-3.5" />
          <span>Chat WhatsApp Admin</span>
          <ExternalLink className="size-3" />
        </a>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch pt-2">
        {PRICING_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id
          const isPro30 = plan.id === "student_30"
          const isCurrentActivePlan = user?.subscription_tier === plan.id

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
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                      {isCurrentActivePlan && (
                        <Badge
                          variant="ready"
                          className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1"
                        >
                          <Check className="size-3" />
                          <span>Paket Aktif</span>
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 shrink-0">
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
                {plan.id === "free" ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectPlan(plan)
                    }}
                    variant="outline"
                    className="w-full rounded-xl text-xs font-semibold gap-2 transition-all cursor-pointer"
                  >
                    <span>{isCurrentActivePlan ? "Paket Saat Ini" : "Paket Dasar"}</span>
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectPlan(plan)
                    }}
                    variant={isPro30 ? "primary" : plan.ctaVariant}
                    className={`w-full rounded-xl text-xs font-semibold gap-2 transition-all cursor-pointer ${
                      isPro30
                        ? "shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
                        : ""
                    }`}
                  >
                    <MessageCircle className="size-3.5" />
                    <span>
                      {isCurrentActivePlan
                        ? `Perpanjang ${plan.name}`
                        : `Beli ${plan.name}`}
                    </span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
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

      {/* WhatsApp Payment Confirmation Modal */}
      <WhatsAppPaymentModal
        isOpen={isModalOpen}
        plan={activeModalPlan}
        user={user}
        onClose={() => {
          setIsModalOpen(false)
          setActiveModalPlan(null)
        }}
      />
    </div>
  )
}
