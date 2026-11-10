import type { BadgeProps } from "@/components/ui/badge"
import type { MatrixCell, MatrixPaper } from "@/features/projects/api/projectsApi"

const GROUP_LABELS: Record<string, string> = {
  konteks_masalah: "Konteks & Masalah",
  metode_data: "Metode & Data",
  hasil_gap: "Hasil & Gap",
}

/** Converts a raw parameter group key (e.g. `konteks_masalah`) into a readable label. */
export function formatGroupName(group: string): string {
  const known = GROUP_LABELS[group]
  if (known) return known
  const words = group.replace(/_/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export const CELL_STATUS_META: Record<
  MatrixCell["status"],
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  accepted: { label: "Diterima", variant: "ready" },
  needs_review: { label: "Perlu Review", variant: "review" },
  edited: { label: "Diedit", variant: "paper" },
  rejected: { label: "Ditolak", variant: "error" },
}

/** Semantic text color for an AI confidence percentage (0-100). */
export function confidenceTextClass(percent: number): string {
  if (percent >= 85) return "text-status-green"
  if (percent >= 70) return "text-status-orange"
  return "text-status-red"
}

/** "Chen, L., Wang, Y. (2024)" or a fallback when authors are unknown. */
export function formatPaperAuthors(paper: Pick<MatrixPaper, "authors" | "year">): string {
  const authors =
    paper.authors && paper.authors.length > 0 ? paper.authors.join(", ") : "Penulis tidak terdata"
  return paper.year ? `${authors} (${paper.year})` : authors
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Some components are stored as a JSON object string (e.g. research recommendations).
 * Mirrors the mobile app: render such values as readable plain text.
 */
export function formatCellText(raw: string): string {
  const trimmed = raw.trim()
  if (!(trimmed.startsWith("{") && trimmed.endsWith("}"))) return raw

  try {
    const data: unknown = JSON.parse(trimmed)
    if (!isRecord(data)) return raw

    const lines: string[] = []

    if (typeof data.pengembangan === "string") {
      lines.push(data.pengembangan, "")
    }

    if (Array.isArray(data.recommendations)) {
      data.recommendations.forEach((rec: unknown, index: number) => {
        if (!isRecord(rec)) return
        lines.push(`${String(rec.rank ?? index + 1)}. ${String(rec.judul ?? "")}`)
        if (rec.alasan != null) lines.push(`   Alasan: ${String(rec.alasan)}`)
        if (rec.metode != null) lines.push(`   Metode: ${String(rec.metode)}`)
        if (rec.dampak != null) lines.push(`   Dampak: ${String(rec.dampak)}`)
        lines.push("")
      })
    }

    if (lines.length === 0) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "string") {
          lines.push(`${key.toUpperCase()}: ${value}`, "")
        } else if (Array.isArray(value)) {
          lines.push(`${key.toUpperCase()}:`)
          value.forEach((item: unknown) => lines.push(` - ${String(item)}`))
          lines.push("")
        }
      })
    }

    const formatted = lines.join("\n").trim()
    return formatted || raw
  } catch {
    return raw
  }
}
