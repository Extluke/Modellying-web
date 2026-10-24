import { GlobalChatMessage, CachedChatSession } from "../types/chatGlobalTypes"

/**
 * Batas waktu kedaluwarsa cache riwayat chat: Tepat 24 Jam (dalam milidetik).
 * Sesuai spesifikasi audit fitur Modellyng (Kategori 13).
 */
export const CHAT_TTL_MS = 24 * 60 * 60 * 1000 // 86.400.000 ms

const STORAGE_KEY_PREFIX = "modellyng_global_chat_history_"
const DRAFT_KEY_PREFIX = "modellyng_global_chat_draft_"
const CACHE_VERSION = 1

function getStorageKey(userId: string): string {
  const sanitized = (userId || "anonymous").trim()
  return `${STORAGE_KEY_PREFIX}${sanitized}`
}

function getDraftKey(userId: string): string {
  const sanitized = (userId || "anonymous").trim()
  return `${DRAFT_KEY_PREFIX}${sanitized}`
}

/**
 * Memfilter pesan yang usianya sudah melewati batas kedaluwarsa 24 jam (Auto-Prune).
 */
export function pruneExpiredMessages(messages: GlobalChatMessage[]): GlobalChatMessage[] {
  const now = Date.now()
  return messages.filter((msg) => {
    // Pertahankan pesan jika selisih waktu belum melampaui 24 jam
    return now - msg.timestamp < CHAT_TTL_MS
  })
}

/**
 * Membaca riwayat pesan dari localStorage dengan auto-prune otomatis.
 */
export function loadCachedMessages(userId: string): GlobalChatMessage[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []

    const session: CachedChatSession = JSON.parse(raw)
    if (!session || !Array.isArray(session.messages)) {
      return []
    }

    // Jalankan auto-prune saat load
    const validMessages = pruneExpiredMessages(session.messages)

    // Jika ada pesan yang terbuang karena kedaluwarsa, perbarui cache lokal
    if (validMessages.length !== session.messages.length) {
      saveCachedMessages(userId, validMessages)
    }

    return validMessages
  } catch (error) {
    console.warn("Gagal membaca riwayat chat dari localStorage:", error)
    return []
  }
}

/**
 * Menyimpan riwayat pesan ke localStorage setelah dipangkas dari pesan kedaluwarsa.
 */
export function saveCachedMessages(userId: string, messages: GlobalChatMessage[]): void {
  try {
    const validMessages = pruneExpiredMessages(messages)
    const session: CachedChatSession = {
      version: CACHE_VERSION,
      userId,
      lastPrunedAt: Date.now(),
      messages: validMessages,
    }

    localStorage.setItem(getStorageKey(userId), JSON.stringify(session))
  } catch (error: unknown) {
    // Penanganan darurat jika kuota penyimpanan browser penuh (QuotaExceededError)
    console.error("Gagal menyimpan riwayat chat ke localStorage:", error)
    try {
      // Simpan hanya 10 pesan terbaru bila kuota terbatas
      const reduced = messages.slice(-10)
      const session: CachedChatSession = {
        version: CACHE_VERSION,
        userId,
        lastPrunedAt: Date.now(),
        messages: reduced,
      }
      localStorage.setItem(getStorageKey(userId), JSON.stringify(session))
    } catch {
      // Abaikan bila benar-benar tidak tersedia
    }
  }
}

/**
 * Menghapus seluruh riwayat percakapan lokal untuk pengguna saat ini.
 */
export function clearCachedMessages(userId: string): void {
  try {
    localStorage.removeItem(getStorageKey(userId))
  } catch (error) {
    console.warn("Gagal membersihkan riwayat chat dari localStorage:", error)
  }
}

/**
 * Membaca draf teks pertanyaan yang belum terkirim.
 */
export function loadChatDraft(userId: string): string {
  try {
    return localStorage.getItem(getDraftKey(userId)) || ""
  } catch {
    return ""
  }
}

/**
 * Menyimpan draf teks pertanyaan secara real-time saat pengguna mengetik.
 */
export function saveChatDraft(userId: string, draft: string): void {
  try {
    const trimmed = draft.trim()
    if (trimmed) {
      localStorage.setItem(getDraftKey(userId), draft)
    } else {
      localStorage.removeItem(getDraftKey(userId))
    }
  } catch {
    // Abaikan kegagalan penulisan draf
  }
}

/**
 * Menghapus draf teks pertanyaan setelah pesan berhasil dikirim.
 */
export function clearChatDraft(userId: string): void {
  try {
    localStorage.removeItem(getDraftKey(userId))
  } catch {
    // Abaikan
  }
}
