import { AutocompleteTriggerType } from "../types/chatGlobalTypes"

export interface AutocompleteDetectionResult {
  isTriggered: boolean
  triggerType: AutocompleteTriggerType | null
  query: string
  triggerIndex: number
}

/**
 * Mendeteksi apakah posisi kursor pengguna saat ini sedang aktif mengetik simbol @ atau /
 * untuk memicu popup autocomplete proyek atau paper.
 */
export function detectAutocompleteTrigger(
  text: string,
  cursorPosition: number
): AutocompleteDetectionResult {
  if (cursorPosition <= 0 || cursorPosition > text.length) {
    return {
      isTriggered: false,
      triggerType: null,
      query: "",
      triggerIndex: -1,
    }
  }

  // Ambil teks dari awal hingga posisi kursor saat ini
  const textBeforeCursor = text.slice(0, cursorPosition)

  // Cari kemunculan terakhir dari @ atau / sebelum kursor
  const lastAtIdx = textBeforeCursor.lastIndexOf("@")
  const lastSlashIdx = textBeforeCursor.lastIndexOf("/")

  // Tentukan mana yang paling dekat dengan kursor
  const maxIdx = Math.max(lastAtIdx, lastSlashIdx)

  if (maxIdx === -1) {
    return {
      isTriggered: false,
      triggerType: null,
      query: "",
      triggerIndex: -1,
    }
  }

  // Karakter sebelum simbol @ atau / harus berupa spasi, awal baris, atau karakter pemisah
  // untuk menghindari salah pemicu pada email (misal: user@mail.com) atau URL (http://)
  if (maxIdx > 0) {
    const charBeforeTrigger = textBeforeCursor[maxIdx - 1]
    if (charBeforeTrigger !== " " && charBeforeTrigger !== "\n" && charBeforeTrigger !== "\t") {
      return {
        isTriggered: false,
        triggerType: null,
        query: "",
        triggerIndex: -1,
      }
    }
  }

  const queryCandidate = textBeforeCursor.slice(maxIdx + 1)

  // Jika query mengandung spasi ganda atau baris baru, jangan aktifkan autocomplete
  if (queryCandidate.includes("\n") || queryCandidate.length > 50) {
    return {
      isTriggered: false,
      triggerType: null,
      query: "",
      triggerIndex: -1,
    }
  }

  const triggerType: AutocompleteTriggerType = maxIdx === lastAtIdx ? "project" : "paper"

  return {
    isTriggered: true,
    triggerType,
    query: queryCandidate.trim(),
    triggerIndex: maxIdx,
  }
}

/**
 * Mengganti token pemicu (@query atau /query) pada teks input dengan teks bersih saat item dipilih.
 */
export function replaceTriggerToken(
  fullText: string,
  triggerIndex: number,
  cursorPosition: number
): { newText: string; newCursorPos: number } {
  const before = fullText.slice(0, triggerIndex)
  const after = fullText.slice(cursorPosition)

  // Bersihkan teks pemicu dan pertahankan sisa teks
  const newText = `${before}${after}`.trimStart()
  const newCursorPos = Math.max(0, before.length)

  return { newText, newCursorPos }
}
