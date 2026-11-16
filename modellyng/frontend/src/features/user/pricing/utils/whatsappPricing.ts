import { type User } from "@/lib/api/auth"
import { type PricingPlan } from "@/features/styleguide/components/PricingSection"

export const ADMIN_WHATSAPP_PHONE = "6281269274671"
export const ADMIN_WHATSAPP_DISPLAY = "+62 812-6927-4671"
export const ADMIN_WHATSAPP_BASE_URL = "https://wa.me/6281269274671"

/**
 * Format subscription tier into human-readable Indonesian text
 */
export function formatSubscriptionTierName(tier?: string): string {
  switch (tier) {
    case "developer":
      return "Developer (Akses Penuh)"
    case "student_30":
      return "Student Pro 30 Hari"
    case "student_14":
      return "Student Pro 14 Hari"
    case "pro":
      return "Pro Scholar"
    case "free":
    default:
      return "Free Plan (Akun Dasar)"
  }
}

/**
 * Generate formatted WhatsApp message template for purchasing/upgrading subscription
 */
export function generatePricingWhatsAppMessage(
  plan: PricingPlan,
  user: User | null
): string {
  const userName = user?.full_name?.trim() || "Pengguna Riset"
  const userEmail = user?.email?.trim() || "Belum Login"
  const currentTier = formatSubscriptionTierName(user?.subscription_tier)

  const featureHighlights =
    plan.id === "student_30"
      ? "15 Token/Hari (Total s.d. 450 Token), Akses Penuh Comparative Matrix & Research Gap Map"
      : plan.id === "student_14"
      ? "15 Token/Hari (Total s.d. 210 Token), Akses Penuh Comparative Matrix & Research Gap Map"
      : "3 Dokumen/Hari, Reset Harian 24 Jam"

  return `Halo Admin Modellyng,

Saya ingin melakukan pemesanan dan aktivasi paket langganan Modellyng.

📦 Rincian Paket Pilihan:
• Nama Paket: ${plan.name}
• Biaya Langganan: ${plan.priceFormatted} (${plan.durationText})
• Kuota & Akses: ${featureHighlights}

👤 Informasi Akun Peneliti:
• Nama: ${userName}
• Email Akun: ${userEmail}
• Status Paket Saat Ini: ${currentTier}

Mohon panduan instruksi pembayaran selanjutnya (QRIS / Transfer Bank) dan aktivasi akun riset saya. Terima kasih!`
}

/**
 * Build direct WhatsApp redirect URL with pre-filled message parameter
 */
export function buildPricingWhatsAppUrl(
  plan: PricingPlan,
  user: User | null
): string {
  const message = generatePricingWhatsAppMessage(plan, user)
  return `${ADMIN_WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`
}
