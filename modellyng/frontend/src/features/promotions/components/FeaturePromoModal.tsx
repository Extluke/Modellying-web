import { useState, useEffect } from "react"
import {
  Crown,
  X,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import { useAuthStore } from "@/features/auth/store/authStore"
import { PRICING_PLANS } from "@/features/styleguide/components/PricingSection"
import {
  ADMIN_WHATSAPP_DISPLAY,
  buildPricingWhatsAppUrl,
} from "@/features/user/pricing/utils/whatsappPricing"
import {
  type PromoFeatureType,
  canShowFeaturePromo,
  recordFeaturePromoShown,
  getPromoCooldownDisplay,
} from "../promoConfig"
import {
  FeatureThumbnailPreview,
  PROMO_FEATURE_CONTENT,
} from "./FeatureThumbnailPreview"

interface FeaturePromoModalProps {
  feature: PromoFeatureType
  forceOpen?: boolean
  onClose?: () => void
}

export function FeaturePromoModal({
  feature,
  forceOpen = false,
  onClose,
}: FeaturePromoModalProps) {
  const user = useAuthStore((s) => s.user)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlanOption, setSelectedPlanOption] = useState<"14_days" | "30_days">("30_days")

  // Otomatis mengecek apakah cooldown 5 menit (testing) / 24 jam (prod) sudah lewat
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true)
      return
    }

    if (canShowFeaturePromo(feature)) {
      setIsOpen(true)
      // Catat waktu kemunculan agar cooldown segera aktif
      recordFeaturePromoShown(feature)
    }
  }, [feature, forceOpen])

  const handleClose = () => {
    setIsOpen(false)
    // Pastikan timestamp tersimpan saat ditutup
    recordFeaturePromoShown(feature)
    if (onClose) {
      onClose()
    }
    toast.info(
      `Thumbnail promosi ditutup. Cooldown ${getPromoCooldownDisplay()} aktif untuk kenyamanan Anda.`,
      5000
    )
  }

  const handleUpgradeViaWhatsApp = () => {
    const planId = selectedPlanOption === "14_days" ? "student_14" : "student_30"
    const targetPlan = PRICING_PLANS.find((p) => p.id === planId)
    if (targetPlan) {
      const waUrl = buildPricingWhatsAppUrl(targetPlan, user)
      try {
        window.open(waUrl, "_blank", "noopener,noreferrer")
      } catch {
        // Fallback
      }
      toast.success(
        `Mengarahkan ke WhatsApp Admin (${ADMIN_WHATSAPP_DISPLAY}) untuk ${targetPlan.name}!`,
        5000
      )
    }
    handleClose()
  }

  if (!isOpen) return null

  const content = PROMO_FEATURE_CONTENT[feature]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup Silang di Sudut Kanan Atas */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 size-8 rounded-full bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          title="Tutup Promosi (Cooldown 5 Menit)"
        >
          <X className="size-4" />
        </button>

        <div className="grid md:grid-cols-12 min-h-[440px]">
          {/* SISI KIRI: Ilustrasi Fitur Terkunci Khusus per Fitur */}
          <div
            className={`md:col-span-5 p-6 flex flex-col justify-center items-center relative overflow-hidden border-b md:border-b-0 md:border-r border-border/60 ${
              feature === "matrix"
                ? "bg-gradient-to-br from-[#F1EFFF] via-[#ECE8FF] to-[#E5E0FF] dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-background"
                : feature === "gap_map"
                ? "bg-gradient-to-br from-[#EBF8F2] via-[#E2F4EB] to-[#D5EFE3] dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-background"
                : "bg-gradient-to-br from-[#FFF7ED] via-[#FFEDD5] to-[#FED7AA] dark:from-amber-950/30 dark:via-orange-950/20 dark:to-background"
            }`}
          >
            <FeatureThumbnailPreview feature={feature} />
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
                  {content.titleLead}
                  <span className="text-primary">{content.titleHighlight}</span>
                  {content.titleTrail}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {content.subtitle}
                </p>
              </div>

              {/* Manfaat Utama */}
              <ul className="space-y-1.5 pt-1">
                {content.benefits.map((b, bIdx) => {
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

              {/* Opsi Paket Radio 14 Hari vs 30 Hari */}
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
                      name="feature-promo-plan"
                      checked={selectedPlanOption === "14_days"}
                      onChange={() => setSelectedPlanOption("14_days")}
                      className="text-primary focus:ring-primary size-3 cursor-pointer"
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
                  <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-0.2 text-[8px] font-bold text-white shadow-2xs">
                    Paling Populer
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="feature-promo-plan"
                      checked={selectedPlanOption === "30_days"}
                      onChange={() => setSelectedPlanOption("30_days")}
                      className="text-primary focus:ring-primary size-3 cursor-pointer"
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

            {/* Tombol Aksi */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={handleUpgradeViaWhatsApp}
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
                  onClick={handleClose}
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
  )
}
