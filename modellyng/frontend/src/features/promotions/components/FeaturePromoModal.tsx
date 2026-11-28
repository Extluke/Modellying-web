import { useState, useEffect, useMemo } from "react"
import {
  Crown,
  X,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { toast } from "@/lib/store/useToastStore"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useUserQuota } from "@/features/user/pricing/hooks/useUserQuota"
import { useSubscriptionPlans } from "@/features/user/pricing/hooks/useSubscriptionPlans"
import {
  ADMIN_WHATSAPP_DISPLAY,
  buildPricingWhatsAppUrl,
} from "@/features/user/pricing/utils/whatsappPricing"
import {
  type PromoFeatureType,
  canShowFeaturePromo,
  recordFeaturePromoShown,
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
  const { quota } = useUserQuota()
  const { plans } = useSubscriptionPlans()
  const [isOpen, setIsOpen] = useState(false)

  // Filter paket berbayar aktif dari database (kecuali free)
  const paidPlans = useMemo(() => {
    return plans.filter((p) => p.priceNumeric > 0 && p.id !== "free")
  }, [plans])

  const [selectedPlanId, setSelectedPlanId] = useState<string>("student_30")

  // Sinkronisasi otomatis saat daftar paket database termuat
  useEffect(() => {
    if (paidPlans.length > 0 && !paidPlans.some((p) => p.id === selectedPlanId)) {
      const popular = paidPlans.find((p) => p.isPopular)
      setSelectedPlanId(popular?.id || paidPlans[0].id)
    }
  }, [paidPlans, selectedPlanId])

  const activeSelectedPlan = useMemo(() => {
    return paidPlans.find((p) => p.id === selectedPlanId) || paidPlans[0]
  }, [paidPlans, selectedPlanId])

  // Pengguna Berbayar / Pro / Developer / Admin sama sekali bebas iklan dan promosi
  const isFreeUser = !user?.subscription_tier || user?.subscription_tier === "free"
  const isPaidOrDeveloper =
    !isFreeUser ||
    user?.role === "admin" ||
    quota?.is_developer ||
    quota?.tier_category === "student"

  // Otomatis mengecek apakah cooldown 5 menit (testing) / 24 jam (prod) sudah lewat
  useEffect(() => {
    // Pengguna berbayar atau Developer sama sekali bebas iklan dan promosi
    if (isPaidOrDeveloper) {
      setIsOpen(false)
      return
    }

    if (forceOpen) {
      setIsOpen(true)
      return
    }

    if (canShowFeaturePromo(feature)) {
      setIsOpen(true)
      // Catat waktu kemunculan agar cooldown segera aktif
      recordFeaturePromoShown(feature)
    }
  }, [feature, forceOpen, isPaidOrDeveloper])

  const handleClose = () => {
    setIsOpen(false)
    // Pastikan timestamp tersimpan saat ditutup
    recordFeaturePromoShown(feature)
    if (onClose) {
      onClose()
    }
  }

  useEscapeKey(!isPaidOrDeveloper && isOpen, handleClose)

  const handleUpgradeViaWhatsApp = () => {
    if (activeSelectedPlan) {
      const waUrl = buildPricingWhatsAppUrl(activeSelectedPlan, user)
      try {
        window.open(waUrl, "_blank", "noopener,noreferrer")
      } catch {
        // Fallback
      }
      toast.success(
        `Mengarahkan ke WhatsApp Admin (${ADMIN_WHATSAPP_DISPLAY}) untuk ${activeSelectedPlan.name}!`,
        5000
      )
    }
    handleClose()
  }

  if (isPaidOrDeveloper || !isOpen) return null

  const content = PROMO_FEATURE_CONTENT[feature]

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup Silang di Sudut Kanan Atas */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup Promosi"
          className="absolute top-4 right-4 z-20 size-8 rounded-full bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          title="Tutup Promosi"
        >
          <X className="size-4" />
        </button>

        <div className="grid md:grid-cols-12 min-h-[440px]">
          {/* SISI KIRI: Ilustrasi Fitur Terkunci Khusus per Fitur */}
          <div className="md:col-span-5 p-6 flex flex-col justify-center items-center relative overflow-hidden border-b md:border-b-0 md:border-r border-border/60 bg-primary-soft/50 dark:bg-primary/10">
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

              {/* Opsi Paket Radio Dinamis dari Database */}
              <div
                className={`gap-2 pt-2 ${
                  paidPlans.length === 1
                    ? "grid grid-cols-1"
                    : paidPlans.length === 2
                    ? "grid grid-cols-2"
                    : paidPlans.length === 3
                    ? "grid grid-cols-3"
                    : "grid grid-cols-2 max-h-36 overflow-y-auto pr-1"
                }`}
              >
                {paidPlans.map((plan) => {
                  const isSelected = activeSelectedPlan?.id === plan.id
                  const dailyPrice =
                    plan.durationDays && plan.durationDays > 0
                      ? Math.round(plan.priceNumeric / plan.durationDays)
                      : 0
                  return (
                    <label
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 shadow-xs"
                          : "border-border/80 bg-card hover:border-primary/40"
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-0.2 text-[8px] font-bold text-white shadow-2xs">
                          Paling Populer
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="feature-promo-plan"
                          checked={isSelected}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="text-primary focus:ring-primary size-3 cursor-pointer"
                        />
                        <span className="text-[10px] font-semibold text-foreground truncate">
                          {plan.name}
                        </span>
                      </div>
                      <div className="mt-1 pl-4.5">
                        <div
                          className={`text-xs font-extrabold ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {plan.priceFormatted}
                        </div>
                        {dailyPrice > 0 && (
                          <div className="text-[9px] text-muted-foreground">
                            Setara Rp{dailyPrice.toLocaleString("id-ID")}/hari
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
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
                  Upgrade via WhatsApp
                  {activeSelectedPlan
                    ? ` (${activeSelectedPlan.name} • ${activeSelectedPlan.priceFormatted})`
                    : ""}
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
