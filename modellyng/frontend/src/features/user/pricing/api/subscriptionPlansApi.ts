import { apiClient } from "@/lib/api/client"
import { type PricingPlan } from "@/features/styleguide/components/PricingSection"

export interface BackendPlanFeatureObject {
  text: string
  is_available?: boolean
  isAvailable?: boolean
  is_limited?: boolean
  isLimited?: boolean
  status_badge?: string
  statusBadge?: string
  detail_note?: string
  detailNote?: string
}

export type BackendPlanFeature = string | BackendPlanFeatureObject

export interface BackendSubscriptionPlan {
  id: string
  code: string
  name: string
  description: string | null
  price: number | string
  currency: string
  billing_period: string
  duration_days: number
  daily_file_limit: number | null
  daily_token_limit: number | null
  total_tokens_max: number | null
  tier_category: string
  features: BackendPlanFeature[]
  is_popular: boolean
  sort_order: number
}

/**
 * Format numeric IDR currency string
 */
export function formatIdrPrice(priceNumeric: number): string {
  if (priceNumeric <= 0) return "Rp0"
  return `Rp${priceNumeric.toLocaleString("id-ID")}`
}

/**
 * Map raw backend database subscription plan to UI PricingPlan
 */
export function mapBackendPlanToPricingPlan(bp: BackendSubscriptionPlan): PricingPlan {
  const priceNumeric = typeof bp.price === "number" ? bp.price : parseFloat(bp.price) || 0
  const isFree = bp.code === "free" || priceNumeric === 0

  // 1. Durasi dan teks pendukung
  let durationText = "Masa Aktif Fleksibel"
  if (isFree) {
    durationText = "Gratis Selamanya"
  } else if (bp.duration_days > 0) {
    durationText = `Masa Aktif ${bp.duration_days} Hari`
  } else if (bp.billing_period === "monthly") {
    durationText = "Langganan Bulanan"
  } else if (bp.billing_period === "lifetime") {
    durationText = "Akses Selamanya"
  }

  // 2. Setara biaya harian
  let dailyEquivalent: string | undefined
  if (!isFree && bp.duration_days > 0 && priceNumeric > 0) {
    const daily = Math.round(priceNumeric / bp.duration_days)
    dailyEquivalent = `Setara Rp${daily.toLocaleString("id-ID")} per hari`
  }

  // 3. Lencana Tier
  let tierBadge = "Paket Riset"
  if (isFree) {
    tierBadge = "Akun Dasar / Uji Coba"
  } else if (bp.code === "student_14") {
    tierBadge = "Paket Tugas & Kajian Cepat"
  } else if (bp.code === "student_30") {
    tierBadge = "Paket Rekomendasi Skripsi"
  } else if (bp.duration_days > 0) {
    tierBadge = `Durasi ${bp.duration_days} Hari`
  }

  // 4. Transformasi Fitur
  const rawFeatures = bp.features || []
  const mappedFeatures = rawFeatures.map((feat) => {
    if (typeof feat === "string") {
      return {
        text: feat,
        isAvailable: true,
      }
    }
    return {
      text: feat.text || "",
      isAvailable: feat.is_available ?? feat.isAvailable ?? true,
      isLimited: feat.is_limited ?? feat.isLimited ?? false,
      statusBadge: feat.status_badge ?? feat.statusBadge,
      detailNote: feat.detail_note ?? feat.detailNote,
    }
  })

  // 5. CTA Text & Variant
  let ctaText = `Beli ${bp.name}`
  let ctaVariant: "outline" | "primary" | "default" = "default"

  if (isFree) {
    ctaText = "Gunakan Paket Gratis"
    ctaVariant = "outline"
  } else if (bp.is_popular) {
    ctaText = "Beli Sekarang (Paling Populer)"
    ctaVariant = "primary"
  }

  return {
    id: bp.code || bp.id,
    name: bp.name,
    tierBadge,
    durationText,
    priceFormatted: formatIdrPrice(priceNumeric),
    priceNumeric,
    dailyEquivalent,
    targetDescription:
      bp.description ||
      (isFree
        ? "Cocok untuk peneliti pemula yang ingin mencoba kemampuan dasar Modellyng."
        : "Akses komprehensif ke seluruh kapabilitas ekstraksi dan analisis ilmiah Modellyng."),
    isPopular: !!bp.is_popular,
    features: mappedFeatures,
    ctaText,
    ctaVariant,
  }
}

export const subscriptionPlansApi = {
  getPublicPlans: async (): Promise<BackendSubscriptionPlan[]> => {
    return await apiClient.get<BackendSubscriptionPlan[]>("/subscription/plans")
  },
}
