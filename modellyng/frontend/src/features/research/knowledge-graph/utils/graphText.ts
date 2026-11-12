/**
 * Text helpers used to turn the prose of matrix cells into graph nodes and to detect
 * the same idea across different papers. Pure functions, no framework imports.
 */

import type { GapTypology } from "../types/knowledgeGraphTypes"

/** Common Indonesian and English words (and filler of academic prose) that carry no topic signal. */
const STOPWORDS = new Set([
  // Indonesian
  "yang", "dan", "dengan", "untuk", "pada", "dalam", "adalah", "ini", "itu", "tersebut", "dari",
  "atau", "oleh", "dapat", "akan", "juga", "serta", "sebagai", "karena", "antara", "terhadap",
  "melalui", "berdasarkan", "secara", "lebih", "masih", "belum", "tidak", "bukan", "para", "satu",
  "dua", "tiga", "hanya", "agar", "sehingga", "namun", "tetapi", "saat", "ketika", "setelah",
  "sebelum", "bagi", "kepada", "dilakukan", "digunakan", "menggunakan", "menggunakannya", "terdapat",
  "memiliki", "merupakan", "yaitu", "yakni", "seperti", "antar", "setiap", "banyak", "beberapa",
  "penelitian", "studi", "paper", "makalah", "artikel", "naskah", "penulis", "hasil", "metode",
  "peneliti", "menunjukkan", "menghasilkan", "menjadi", "sudah", "telah", "sangat", "cukup",
  // Wording the extraction model repeats in every cell of a kind ("Variabel masukan utama mencakup ...").
  // It says nothing about the topic, so it must not make two unrelated nodes look alike.
  "pendekatan", "metodologi", "variabel", "independen", "dependen", "masukan", "luaran", "konsep",
  "utama", "mencakup", "meliputi", "berupa", "terdiri", "diidentifikasi", "rumusan", "masalah",
  "tujuan", "keterbatasan", "temuan", "rekomendasi", "riset", "mendatang", "lanjutan", "diarahkan",
  "difokuskan", "eksperimen", "pengujian", "tahap", "tahapan", "dasar", "data", "dataset", "sistem",
  "sampel", "berbasis", "berpusat", "berfokus", "diwakili", "diakui", "signifikan",
  // English
  "the", "and", "for", "with", "that", "this", "these", "those", "from", "into", "are", "was",
  "were", "been", "have", "has", "had", "not", "but", "can", "may", "will", "which", "their",
  "than", "then", "also", "such", "using", "used", "use", "based", "study", "paper", "results",
  "method", "methods", "approach", "show", "shows", "shown", "our", "its", "between", "over",
  "more", "most", "less", "both", "each", "other", "while", "when", "where", "there", "about",
])

/** Lowercase, remove diacritics and punctuation, collapse whitespace. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Distinct topic-bearing tokens of a text (no stopwords, at least 3 characters). */
export function contentTokens(value: string): Set<string> {
  const tokens = new Set<string>()
  for (const token of normalizeText(value).split(" ")) {
    if (token.length >= 3 && !STOPWORDS.has(token)) tokens.add(token)
  }
  return tokens
}

export function sharedTokens(a: Set<string>, b: Set<string>): string[] {
  const shared: string[] = []
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const token of small) {
    if (large.has(token)) shared.push(token)
  }
  return shared
}

/** Jaccard similarity of two token sets (0..1). */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  const intersection = sharedTokens(a, b).length
  return intersection / (a.size + b.size - intersection)
}

const LIST_MARKER = /^\s*(?:[-*\u2022\u2013]|\d{1,2}[.)])\s+/
const MAX_ITEMS_PER_CELL = 4
const MIN_ITEM_LENGTH = 4

/**
 * Splits the prose of a cell into separate items when the text is an explicit list
 * (one item per line, bullet, numbering, or `;`). Plain prose stays one item, so no
 * invented fragments are created from ordinary sentences.
 */
export function splitIntoItems(text: string): string[] {
  const cleaned = text.replace(/\r/g, "").trim()
  if (!cleaned) return []

  const pieces = cleaned
    .split(/\n+|;\s+/)
    .map((piece) => piece.replace(LIST_MARKER, "").replace(/\s+/g, " ").trim())
    .filter((piece) => piece.length >= MIN_ITEM_LENGTH)

  if (pieces.length <= 1) return [cleaned.replace(/\s+/g, " ")]
  return pieces.slice(0, MAX_ITEMS_PER_CELL)
}

/**
 * Subject words of the opening phrase the extraction model puts in front of the real content
 * ("Keterbatasan utama yang diidentifikasi adalah ...", "Penelitian ini menggunakan ...").
 * Deliberately narrow: ordinary nouns such as "sistem" or "data" can be the actual topic.
 */
const OPENER_SUBJECT =
  /\b(?:masalah|keterbatasan|kendala|variabel|konsep|pendekatan|metodologi|eksperimen|pengujian|rekomendasi|riset|penulis|peneliti|rumusan|tujuan|kontribusi|temuan|(?:penelitian|studi|makalah|artikel|paper|naskah) ini)\b/i

/** Verb phrase that ends the opening phrase. Everything after it is the content worth showing. */
const OPENER_VERB =
  /\s(?:adalah|ialah|yaitu|berupa|mencakup|meliputi|terdiri dari|terdiri atas|berbasis|berpusat pada|berfokus pada|difokuskan pada|diarahkan pada|diwakili oleh|diakui pada|menggunakan|menunjukkan bahwa|menyimpulkan bahwa|menyatakan bahwa|merekomendasikan bahwa|mengidentifikasi)\s+/i

/** Opening noun phrases that carry no content on their own (the verb that follows is the content). */
const OPENER_PHRASE =
  /^(?:pendekatan metodologi(?: yang digunakan| dalam penelitian ini| penelitian ini)?|metodologi penelitian(?: ini)?)\s+/i

/** A comma that starts a new clause (not one that separates list items). */
const CLAUSE_BREAK =
  /;\s|,\s+(?:di mana|dimana|yang|dengan|sehingga|karena|namun|tetapi|sedangkan|sementara|untuk|agar|serta|pada|melalui)\b/i

const MAX_OPENER_WORDS = 9
const MIN_CONTENT_CHARS = 12
/** A clause break is only used as the end of a title when the title is already this long. */
const MIN_CLAUSE_CHARS = 45

function upperFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Removes the repeated opening phrase of an extracted sentence. The result is always a plain
 * substring of the original text, so nothing is invented.
 */
function stripOpener(sentence: string): string {
  const verb = OPENER_VERB.exec(sentence)
  if (verb) {
    const opener = sentence.slice(0, verb.index)
    const content = sentence.slice(verb.index + verb[0].length)
    const isShortSingleClause = opener.split(" ").length <= MAX_OPENER_WORDS && !/[,;:]/.test(opener)
    if (isShortSingleClause && OPENER_SUBJECT.test(opener) && content.length >= MIN_CONTENT_CHARS) {
      return upperFirst(content)
    }
  }

  const withoutPhrase = sentence.replace(OPENER_PHRASE, "")
  return withoutPhrase.length >= MIN_CONTENT_CHARS && withoutPhrase !== sentence ? upperFirst(withoutPhrase) : sentence
}

/**
 * Title of a node: the first sentence of the text without its repeated opening phrase,
 * ended at a clause break or a word boundary.
 */
export function shortLabel(text: string, maxLength = 90): string {
  const flat = text.replace(/\s+/g, " ").trim()
  const sentenceEnd = flat.search(/[.!?](\s|$)/)
  const firstSentence = stripOpener(sentenceEnd > 12 ? flat.slice(0, sentenceEnd) : flat)

  const clauseBreak = CLAUSE_BREAK.exec(firstSentence.slice(MIN_CLAUSE_CHARS))
  const clause = clauseBreak ? firstSentence.slice(0, MIN_CLAUSE_CHARS + clauseBreak.index) : firstSentence
  if (clause.length <= maxLength) return clause

  const cut = clause.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}\u2026`
}

const GAP_KEYWORDS: Array<{ typology: GapTypology; pattern: RegExp }> = [
  { typology: "dataset", pattern: /\b(dataset|data set|korpus|corpus|benchmark|data latih|training data)\b/i },
  { typology: "population", pattern: /\b(populasi|sampel|subjek|responden|partisipan|demografi|population|sample|participants?)\b/i },
  { typology: "methodological", pattern: /\b(metode|metodolog\w*|algoritma|arsitektur|model|teknik|method\w*|algorithm|architecture)\b/i },
  { typology: "theoretical", pattern: /\b(teori|teoretis|konseptual|kerangka|theor\w*|conceptual|framework)\b/i },
  { typology: "empirical", pattern: /\b(empiris|eksperimen|pengujian|validasi|evaluasi|empirical|experiment\w*|evaluation|validation)\b/i },
]

/** Rough typology of a research gap based on keywords found in its own text. */
export function inferGapTypology(text: string): GapTypology {
  for (const { typology, pattern } of GAP_KEYWORDS) {
    if (pattern.test(text)) return typology
  }
  return "unexplored_concept"
}
