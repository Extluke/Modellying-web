/**
 * Utilitas pemformatan sitasi bibliografi multi-format akademik standar:
 * Mendukung 5 format internasional: APA 7, IEEE, Harvard, Vancouver, dan Chicago.
 * Dilengkapi generator sitasi dalam teks (in-text citation) dan penanganan nilai cadangan (graceful fallback).
 */

export type CitationStyle = "apa" | "ieee" | "harvard" | "vancouver" | "chicago"

export interface CitationPaperInput {
  id: string
  title: string
  authors?: string[] | null
  year?: number | null
  journal?: string | null
  doi?: string | null
}

/**
 * Normalisasi nama penulis menjadi format "NamaBelakang, InisialDepan."
 * Contoh: "Budi Santoso" -> "Santoso, B."
 */
function formatAuthorName(name: string): string {
  const clean = name.trim()
  if (!clean) return "Anonim"
  const parts = clean.split(/\s+/)
  if (parts.length === 1) return parts[0]
  const lastName = parts[parts.length - 1]
  const initials = parts
    .slice(0, parts.length - 1)
    .map((p) => (p[0] ? `${p[0].toUpperCase()}.` : ""))
    .join(" ")
  return `${lastName}, ${initials}`
}

/**
 * Format daftar penulis untuk gaya sitasi tertentu
 */
function formatAuthorList(authors: string[] | undefined | null, style: CitationStyle): string {
  if (!authors || authors.length === 0) {
    return "Penulis Tidak Terdata"
  }

  const formatted = authors.map(formatAuthorName)

  if (style === "apa" || style === "harvard" || style === "chicago") {
    if (formatted.length === 1) return formatted[0]
    if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`
    return `${formatted.slice(0, -1).join(", ")}, & ${formatted[formatted.length - 1]}`
  }

  if (style === "ieee") {
    if (formatted.length === 1) return formatted[0]
    if (formatted.length <= 6) return formatted.join(", ")
    return `${formatted[0]} et al.`
  }

  if (style === "vancouver") {
    if (formatted.length <= 6) return formatted.join(", ")
    return `${formatted.slice(0, 6).join(", ")}, et al.`
  }

  return formatted.join(", ")
}

/**
 * Menghasilkan teks sitasi bibliografi resmi sesuai gaya sitasi yang dipilih
 */
export function formatBibliography(
  paper: CitationPaperInput,
  style: CitationStyle,
  index = 1
): string {
  const authorsText = formatAuthorList(paper.authors, style)
  const yearText = paper.year ? `${paper.year}` : "n.d."
  const titleText = paper.title.trim().replace(/\.$/, "")
  const journalText = paper.journal ? paper.journal.trim() : ""
  const doiText = paper.doi ? `https://doi.org/${paper.doi.replace(/^https?:\/\/doi\.org\//, "")}` : ""

  switch (style) {
    case "apa": {
      // Format: Author, A. A. (Year). Title. Journal. DOI
      const journalPart = journalText ? ` ${journalText}.` : ""
      const doiPart = doiText ? ` ${doiText}` : ""
      return `${authorsText} (${yearText}). ${titleText}.${journalPart}${doiPart}`
    }

    case "ieee": {
      // Format: [1] A. A. Author, "Title," Journal, Year.
      const journalPart = journalText ? `, ${journalText}` : ""
      return `[${index}] ${authorsText}, "${titleText}"${journalPart}, ${yearText}.`
    }

    case "harvard": {
      // Format: Author, A.A., Year. Title. Journal.
      const journalPart = journalText ? ` ${journalText}.` : ""
      return `${authorsText}, ${yearText}. ${titleText}.${journalPart}`
    }

    case "vancouver": {
      // Format: 1. Author AA. Title. Journal. Year; DOI
      const journalPart = journalText ? ` ${journalText}.` : ""
      const doiPart = doiText ? ` doi: ${paper.doi}` : ""
      return `${index}. ${authorsText}. ${titleText}.${journalPart} ${yearText}.${doiPart}`
    }

    case "chicago": {
      // Format: Author, First M. Year. "Title." Journal.
      const journalPart = journalText ? ` ${journalText}.` : ""
      return `${authorsText}. ${yearText}. "${titleText}."${journalPart}`
    }

    default:
      return `${authorsText} (${yearText}). ${titleText}.`
  }
}

/**
 * Menghasilkan teks sitasi dalam kurung / sitasi naratif (In-Text Citation)
 * Contoh: "(Smith et al., 2023)" atau "Menurut Smith et al. (2023)..."
 */
export function formatInTextCitation(
  paper: CitationPaperInput,
  narrative = false
): string {
  const authors = paper.authors || []
  const yearText = paper.year ? `${paper.year}` : "n.d."

  let authorLabel = "Penulis"
  if (authors.length === 1) {
    const parts = authors[0].trim().split(/\s+/)
    authorLabel = parts[parts.length - 1]
  } else if (authors.length === 2) {
    const last1 = authors[0].trim().split(/\s+/).pop()
    const last2 = authors[1].trim().split(/\s+/).pop()
    authorLabel = `${last1} & ${last2}`
  } else if (authors.length > 2) {
    const last1 = authors[0].trim().split(/\s+/).pop()
    authorLabel = `${last1} dkk.`
  }

  if (narrative) {
    return `${authorLabel} (${yearText})`
  }
  return `(${authorLabel}, ${yearText})`
}
