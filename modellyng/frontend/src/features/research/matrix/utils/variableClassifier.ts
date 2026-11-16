import type { MatrixCell, MatrixPaper } from "@/features/projects/api/projectsApi"
import { formatInTextCitation } from "./citationFormatter"

export type VariableCategory =
  | "independent"
  | "dependent"
  | "moderator"
  | "control"
  | "general"

export interface VariableCategoryMeta {
  key: VariableCategory
  label: string
  shortLabel: string
  description: string
  badgeVariant: "paper" | "ready" | "review" | "primary" | "muted"
  badgeColorClass: string
  pillActiveClass: string
  borderClass: string
}

export interface ClassifiedVariable {
  id: string
  name: string
  category: VariableCategory
  categoryLabel: string
  categoryShortLabel: string
  badgeVariant: "paper" | "ready" | "review" | "primary" | "muted"
  badgeColorClass: string
  description?: string
}

export interface MethodologicalApproachItem {
  paperId: string
  paperTitle: string
  citation: string
  authors: string[]
  year?: number | null
  methodologyFullText: string
  rawVariablesText?: string
  variables: ClassifiedVariable[]
  hasVariables: boolean
}

export const VARIABLE_CATEGORIES: Record<VariableCategory, VariableCategoryMeta> = {
  independent: {
    key: "independent",
    label: "Variabel Bebas (Independen)",
    shortLabel: "Bebas / Independen",
    description: "Variabel stimulus, fitur input, atau faktor pengaruh yang dimanipulasi/diamati.",
    badgeVariant: "paper",
    badgeColorClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    pillActiveClass: "bg-status-blue text-white border-status-blue shadow-sm",
    borderClass: "border-blue-200 dark:border-blue-800",
  },
  dependent: {
    key: "dependent",
    label: "Variabel Terikat (Dependen)",
    shortLabel: "Terikat / Dependen",
    description: "Variabel respon, target luaran, metrik keberhasilan, atau luaran yang diukur/diprediksi.",
    badgeVariant: "ready",
    badgeColorClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    pillActiveClass: "bg-status-green text-white border-status-green shadow-sm",
    borderClass: "border-emerald-200 dark:border-emerald-800",
  },
  moderator: {
    key: "moderator",
    label: "Variabel Moderator / Mediasi",
    shortLabel: "Moderator / Mediasi",
    description: "Variabel perantara (intervening) atau variabel yang memperkuat/memperlemah hubungan.",
    badgeVariant: "review",
    badgeColorClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    pillActiveClass: "bg-status-orange text-white border-status-orange shadow-sm",
    borderClass: "border-amber-200 dark:border-amber-800",
  },
  control: {
    key: "control",
    label: "Variabel Kontrol",
    shortLabel: "Kontrol",
    description: "Faktor atau kondisi dasar yang dinetralkan/dikendalikan agar tidak membiaskan pengujian.",
    badgeVariant: "primary",
    badgeColorClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    pillActiveClass: "bg-purple-600 text-white border-purple-600 shadow-sm",
    borderClass: "border-purple-200 dark:border-purple-800",
  },
  general: {
    key: "general",
    label: "Konsep / Parameter Operasional",
    shortLabel: "Konsep Operasional",
    description: "Konsep sentral, parameter arsitektural, atau variabel operasional dalam penelitian.",
    badgeVariant: "muted",
    badgeColorClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700",
    pillActiveClass: "bg-slate-700 text-white border-slate-700 shadow-sm",
    borderClass: "border-slate-200 dark:border-slate-700",
  },
}

function cleanVariableName(str: string): string {
  if (!str) return ""
  return str
    .replace(/^[\s\d.)(•\-*–]+/, "")
    .replace(
      /^(?:variabel\s*(?:bebas|independen|terikat|dependen|moderator|kontrol|mediasi|operasional)?(?:\s*\([^)]*\))?\s*[:=–-]?\s*)/i,
      ""
    )
    .replace(/^\([^)]*\)\s*/, "")
    .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "")
    .replace(/[.;,]+$/, "")
    .trim()
}

function capitalizeFirst(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function splitCommaDan(str: string): string[] {
  const parts: string[] = []
  let current = ""
  let inParen = 0

  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (c === "(" || c === "[" || c === "{") inParen++
    else if (c === ")" || c === "]" || c === "}") inParen = Math.max(0, inParen - 1)

    if (inParen === 0) {
      if (c === "," || c === "/") {
        if (current.trim()) parts.push(current.trim())
        current = ""
        continue
      }
      if (str.slice(i, i + 5).toLowerCase() === " dan ") {
        if (current.trim()) parts.push(current.trim())
        current = ""
        i += 4
        continue
      }
      if (str.slice(i, i + 7).toLowerCase() === " serta ") {
        if (current.trim()) parts.push(current.trim())
        current = ""
        i += 6
        continue
      }
    }
    current += c
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function splitItems(text: string): string[] {
  const segments: string[] = []
  const majorParts = text.split(/(?:\r?\n|;|\s*•\s*|\s*-\s+|\s*\(\d+\)\s*|\s*\d+\.\s*)/)
  for (const part of majorParts) {
    if (!part || !part.trim()) continue
    const commaParts = splitCommaDan(part)
    segments.push(...commaParts)
  }
  return segments.map((s) => s.trim()).filter(Boolean)
}

function inferCategory(item: string): VariableCategory {
  const lower = item.toLowerCase()
  if (
    /bebas|independen|masukan|input|fitur|sensor|stimulus|prediktor|pengetahuan|pendidikan|faktor\s*penentu/.test(
      lower
    )
  ) {
    return "independent"
  }
  if (
    /terikat|dependen|luaran|output|target|presisi|recall|akurasi|f1|keberhasilan|perilaku|tindakan|efektivitas|kinerja|skor/.test(
      lower
    )
  ) {
    return "dependent"
  }
  if (/moderator|mediasi|mediator|intervening|moderasi|anteseden/.test(lower)) {
    return "moderator"
  }
  if (/kontrol|kendali|control|kovariat|baseline/.test(lower)) {
    return "control"
  }
  return "general"
}

function extractFromMethodology(methodText: string): Array<{ name: string; category: VariableCategory }> {
  const terms: Array<{ name: string; category: VariableCategory }> = []
  const patterns: Array<{ regex: RegExp; category: VariableCategory; maxLen?: number }> = [
    { regex: /fitur\s+visual\s+[a-z0-9_-]+/gi, category: "independent" },
    { regex: /indeks\s+[a-z0-9_-]+/gi, category: "independent" },
    { regex: /fungsi\s+bernilai\s+tabel(?:\s+SQL)?/gi, category: "independent" },
    { regex: /struktur\s+indeks\s+[a-z0-9_-]+/gi, category: "control" },
    { regex: /kurva\s+pengisi\s+ruang(?:\s+[a-z0-9_-]+)?/gi, category: "independent" },
    { regex: /prototipe\s+sistem\s+[a-z0-9_\s()-]+/gi, category: "independent", maxLen: 35 },
    { regex: /tata\s+bahasa\s+kueri\s+[a-z0-9_-]+/gi, category: "independent" },
    { regex: /arsitektur\s+(?:perangkat\s+lunak\s+)?multi-tier/gi, category: "general" },
    { regex: /basis\s+data\s+relasional(?:\s+microsoft\s+sql\s+server)?/gi, category: "general" },
    { regex: /presisi/gi, category: "dependent" },
    { regex: /recall/gi, category: "dependent" },
    { regex: /akurasi/gi, category: "dependent" },
    { regex: /kecepatan\s+kueri(?:\s+spasial)?/gi, category: "dependent" },
    { regex: /desain\s+survei\s+kuantitatif/gi, category: "general" },
    { regex: /pendekatan\s+potong\s+lintang/gi, category: "general" },
    { regex: /pengambilan\s+gambar\s+berbasis\s+konten/gi, category: "general" },
  ]

  for (const { regex, category, maxLen } of patterns) {
    const matches = methodText.match(regex)
    if (matches) {
      for (const m of matches) {
        let val = m.trim()
        if (maxLen && val.length > maxLen) {
          val = val.slice(0, maxLen).trim()
        }
        terms.push({ name: val, category })
      }
    }
  }

  return terms
}

/**
 * Parses, cleans, and classifies research variables into standard academic taxonomy:
 * - Independent (Bebas)
 * - Dependent (Terikat)
 * - Moderator / Mediating
 * - Control
 * - General / Operational Concepts
 */
export function extractAndClassifyVariables(
  rawVariablesText?: string,
  methodologyText?: string
): ClassifiedVariable[] {
  const text = (rawVariablesText && rawVariablesText.trim()) || ""
  const fallback = (methodologyText && methodologyText.trim()) || ""

  const results: ClassifiedVariable[] = []
  const seen = new Set<string>()

  function addVariable(name: string, category: VariableCategory, description?: string) {
    const cleanName = cleanVariableName(name)
    if (!cleanName || cleanName.length < 2) return
    if (/^(?:dalam|untuk|dengan|sebagai|pada|dan|atau|serta)$/i.test(cleanName)) return
    const key = cleanName.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)

    const meta = VARIABLE_CATEGORIES[category]
    results.push({
      id: `var-${results.length + 1}-${category}`,
      name: capitalizeFirst(cleanName),
      category,
      categoryLabel: meta.label,
      categoryShortLabel: meta.shortLabel,
      badgeVariant: meta.badgeVariant,
      badgeColorClass: meta.badgeColorClass,
      description: description || meta.description,
    })
  }

  // 1. Process explicit variable text
  if (text) {
    const labeledSectionPattern =
      /(?:(?:^|[.;\n])\s*(?:\(?\d+\)?\s*[-.]?\s*)?(?:[-•*]\s*)?((?:variabel\s*)?(?:bebas|independen(?:t)?|terikat|dependen(?:t)?|moderator|mediasi|mediator|intervening|kontrol|kendali|control|operasional|konsep)(?:\s*\([^)]*\))?)\s*[:=–-]\s*)([^.;\n]+(?:[;,][^.;\n]+)*)/gi

    let match: RegExpExecArray | null
    let matchedAny = false

    while ((match = labeledSectionPattern.exec(text)) !== null) {
      matchedAny = true
      const label = match[1].toLowerCase()
      const content = match[2]

      let category: VariableCategory = "general"
      if (/bebas|independen/.test(label)) category = "independent"
      else if (/terikat|dependen/.test(label)) category = "dependent"
      else if (/moderator|mediasi|mediator|intervening/.test(label)) category = "moderator"
      else if (/kontrol|kendali|control/.test(label)) category = "control"

      const items = splitItems(content)
      for (const item of items) {
        addVariable(item, category)
      }
    }

    if (!matchedAny || results.length === 0) {
      const items = splitItems(text)
      for (const item of items) {
        addVariable(item, inferCategory(item))
      }
    }
  }

  // 2. If variables are still sparse and methodology text is available, enrich with salient terms
  if (results.length === 0 && fallback) {
    const extractedTerms = extractFromMethodology(fallback)
    for (const term of extractedTerms) {
      addVariable(term.name, term.category)
    }
  }

  return results
}

/**
 * Constructs a comprehensive list of methodological approaches and variables for each paper
 * in the comparative matrix without text truncation.
 */
export function buildMethodologicalApproaches(
  papers: MatrixPaper[],
  matrix: Record<string, Record<string, MatrixCell>>
): MethodologicalApproachItem[] {
  return papers.map((paper) => {
    const citation = formatInTextCitation(paper)

    const methodologyFullText =
      matrix["methodology"]?.[paper.id]?.value?.text ||
      matrix["metodologi"]?.[paper.id]?.value?.text ||
      matrix["analysis_technique"]?.[paper.id]?.value?.text ||
      "Pendekatan metodologi belum tercatat pada dokumen ini."

    const rawVariablesText =
      matrix["variables_concepts"]?.[paper.id]?.value?.text ||
      matrix["variables"]?.[paper.id]?.value?.text ||
      matrix["variabel_penelitian"]?.[paper.id]?.value?.text ||
      matrix["key_variables"]?.[paper.id]?.value?.text ||
      ""

    const variables = extractAndClassifyVariables(rawVariablesText, methodologyFullText)

    return {
      paperId: paper.id,
      paperTitle: paper.title,
      citation,
      authors: paper.authors || [],
      year: paper.year,
      methodologyFullText,
      rawVariablesText,
      variables,
      hasVariables: variables.length > 0,
    }
  })
}
