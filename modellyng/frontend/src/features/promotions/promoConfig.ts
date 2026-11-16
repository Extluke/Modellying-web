export type PromoFeatureType = "matrix" | "gap_map" | "upload"

/**
 * ============================================================================
 * KONFIGURASI TIMER FREKUENSI PROMOSI (COOLDOWN CMS & TESTING)
 * ============================================================================
 * Sesuai kebutuhan pengujian tim, cooldown standar saat ini diatur ke 5 MENIT
 * (300.000 ms) agar mudah diuji tanpa perlu menunggu 24 jam.
 * 
 * Nilai ini dapat dikustomisasi secara dinamis melalui CMS Admin atau nilai
 * override di localStorage: `modellyng_cms_promo_cooldown_minutes`.
 */
export const PROMO_COOLDOWN_CONFIG = {
  // Cooldown mode testing saat ini: 5 Menit (5 * 60 * 1000 ms)
  TESTING_COOLDOWN_MS: 5 * 60 * 1000,
  // Cooldown mode produksi: 24 Jam (24 * 60 * 60 * 1000 ms)
  PRODUCTION_COOLDOWN_MS: 24 * 60 * 60 * 1000,
  // Flag apakah saat ini berjalan dalam mode testing 5 menit
  IS_TESTING_MODE: true,
  // Prefix kunci penyimpanan timestamp per fitur di localStorage
  STORAGE_KEY_PREFIX: "modellyng_promo_last_shown_",
  // Kunci override kustom CMS admin untuk durasi menit
  CMS_CUSTOM_MINUTES_KEY: "modellyng_cms_promo_cooldown_minutes",
}

/**
 * Mendapatkan durasi cooldown aktif dalam milidetik (ms).
 * Mengecek apakah terdapat nilai kustom dari CMS Admin terlebih dahulu.
 */
export function getPromoCooldownMs(): number {
  try {
    const customMinutesStr = localStorage.getItem(PROMO_COOLDOWN_CONFIG.CMS_CUSTOM_MINUTES_KEY)
    if (customMinutesStr) {
      const minutes = parseInt(customMinutesStr, 10)
      if (!isNaN(minutes) && minutes > 0) {
        return minutes * 60 * 1000
      }
    }
  } catch {
    // Fallback if localStorage unavailable
  }

  return PROMO_COOLDOWN_CONFIG.IS_TESTING_MODE
    ? PROMO_COOLDOWN_CONFIG.TESTING_COOLDOWN_MS
    : PROMO_COOLDOWN_CONFIG.PRODUCTION_COOLDOWN_MS
}

/**
 * Format teks waktu cooldown aktif untuk ditampilkan di UI / tooltip
 */
export function getPromoCooldownDisplay(): string {
  const ms = getPromoCooldownMs()
  const minutes = Math.round(ms / (60 * 1000))
  if (minutes < 60) {
    return `${minutes} Menit (Mode Testing)`
  }
  const hours = Math.round(minutes / 60)
  return `${hours} Jam (Mode Produksi)`
}

/**
 * Memeriksa apakah thumbnail promosi untuk fitur tertentu layak ditampilkan.
 */
export function canShowFeaturePromo(feature: PromoFeatureType): boolean {
  try {
    const storageKey = `${PROMO_COOLDOWN_CONFIG.STORAGE_KEY_PREFIX}${feature}`
    const lastShownStr = localStorage.getItem(storageKey)
    if (!lastShownStr) {
      return true
    }

    const lastShown = parseInt(lastShownStr, 10)
    if (isNaN(lastShown)) {
      return true
    }

    const cooldownMs = getPromoCooldownMs()
    const now = Date.now()
    return now - lastShown >= cooldownMs
  } catch {
    return true
  }
}

/**
 * Mencatat waktu kemunculan promosi fitur ke localStorage untuk memulai cooldown.
 */
export function recordFeaturePromoShown(feature: PromoFeatureType): void {
  try {
    const storageKey = `${PROMO_COOLDOWN_CONFIG.STORAGE_KEY_PREFIX}${feature}`
    localStorage.setItem(storageKey, Date.now().toString())
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Mereset timer cooldown suatu fitur (atau semua fitur) untuk keperluan testing instan.
 */
export function resetFeaturePromoCooldown(feature?: PromoFeatureType): void {
  try {
    if (feature) {
      localStorage.removeItem(`${PROMO_COOLDOWN_CONFIG.STORAGE_KEY_PREFIX}${feature}`)
    } else {
      localStorage.removeItem(`${PROMO_COOLDOWN_CONFIG.STORAGE_KEY_PREFIX}upload`)
      localStorage.removeItem(`${PROMO_COOLDOWN_CONFIG.STORAGE_KEY_PREFIX}matrix`)
      localStorage.removeItem(`${PROMO_COOLDOWN_CONFIG.STORAGE_KEY_PREFIX}gap_map`)
    }
  } catch {
    // Ignore
  }
}
