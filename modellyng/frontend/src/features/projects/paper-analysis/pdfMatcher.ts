/**
 * pdfMatcher.ts - Mesin Pencocok Kutipan Bukti Fleksibel (Modellyng Web)
 * 
 * Mengimplementasikan strategi pencocokan multi-tier untuk menghubungkan
 * kutipan teks AI (evidence quote) dengan koordinat fisik blok PDF (PyMuPDF blocks).
 * Tahan terhadap pemenggalan kata bersambung (hyphenation), spasi ganda, tanda baca,
 * dan perbedaan tanda petik typografis.
 */

import { EvidenceItem, TextBlock } from "../api/projectsApi"

export interface MatchedEvidenceBlock {
  block_id: string
  page_number: number
  bbox: [number, number, number, number]
  matchType: "exact_bbox" | "block_id" | "normalized_inclusion" | "span_sequence" | "fuzzy_overlap"
  confidence: number
}

export interface SpanHighlightRect {
  left: number // unscaled viewport coordinate (scale = 1.0)
  top: number
  width: number
  height: number
  textSnippet?: string
}

/**
 * Normalisasi teks PDF untuk penanganan ligatur, tanda hubung, dan spasi.
 */
export function cleanPdfString(str: string): string {
  if (!str) return ""
  return str
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/\uFB03/g, "ffi")
    .replace(/\uFB04/g, "ffl")
    .replace(/[\u2018\u2019\u201a\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f\u2033]/g, '"')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/[\u00a0\r\t\n]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim()
}

/**
 * Normalisasi teks untuk meminimalkan anomali OCR, pemenggalan kata, dan variasi whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return ""

  return (
    text
      // 1. Standarisasi tanda petik dan kutipan
      .replace(/[\u2018\u2019\u201a\u201b\u2032]/g, "'")
      .replace(/[\u201c\u201d\u201e\u201f\u2033]/g, '"')
      // 2. Standarisasi dash dan tanda hubung
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
      // 3. Gabungkan kata yang terpenggal tanda hubung antar baris (e.g. "signifi-\n cant" -> "significant")
      .replace(/(\w+)-\s+(\w+)/g, "$1$2")
      // 4. Standarisasi spasi non-breaking dan tab
      .replace(/[\u00a0\r\t\n]+/g, " ")
      // 5. Ubah spasi ganda menjadi spasi tunggal
      .replace(/\s{2,}/g, " ")
      .toLowerCase()
      .trim()
  )
}

/**
 * Menghitung rasio token overlap (Jaccard similarity) antara kutipan dan blok teks.
 */
function calculateTokenOverlap(normQuote: string, normBlock: string): number {
  const quoteTokens = new Set(
    normQuote.split(/\s+/).filter((w) => w.length > 2)
  )
  const blockTokens = new Set(
    normBlock.split(/\s+/).filter((w) => w.length > 2)
  )

  if (quoteTokens.size === 0 || blockTokens.size === 0) return 0

  let intersectionCount = 0
  quoteTokens.forEach((token) => {
    if (blockTokens.has(token)) {
      intersectionCount++
    }
  })

  // Rasio berapa banyak kata dari quote yang ditemukan pada block
  return intersectionCount / quoteTokens.size
}

/**
 * True when the text of a block plausibly holds the quote. A block id taken from the extraction can point
 * at the wrong block (for example one that only contains a single letter), so a block that is referenced
 * by id is verified against the quote before it is trusted.
 */
function blockMatchesQuote(block: TextBlock, quote: string | undefined): boolean {
  const normQuote = normalizeText(quote ?? "")
  if (!normQuote) return true // nothing to compare with, so the id is all there is
  const normBlock = normalizeText(block.text)
  if (!normBlock) return false
  return (
    normBlock.includes(normQuote) ||
    (normBlock.length > 25 && normQuote.includes(normBlock)) ||
    calculateTokenOverlap(normQuote, normBlock) >= 0.55
  )
}

/**
 * Algoritma Multi-Tier Pencocokan Bukti terhadap Blok Teks Dokumen.
 */
export function findMatchingBlocks(
  evidence: EvidenceItem | null | undefined,
  blocks: TextBlock[],
  targetPage?: number
): MatchedEvidenceBlock[] {
  if (!evidence) return []

  const page = targetPage || evidence.page_index
  const pageBlocks = page
    ? blocks.filter((b) => b.page_number === page)
    : blocks

  // TIER 1: Jika evidence secara eksplisit memiliki koordinat bbox kanonik
  if (evidence.bbox && Array.isArray(evidence.bbox) && evidence.bbox.length === 4) {
    return [
      {
        block_id: evidence.block_id || `ev-bbox-${page || 1}`,
        page_number: page || 1,
        bbox: evidence.bbox,
        matchType: "exact_bbox",
        confidence: 1.0,
      },
    ]
  }

  // TIER 1b: Jika block_id cocok secara langsung dan teks blok memang memuat kutipan
  if (evidence.block_id) {
    const directBlock = pageBlocks.find((b) => b.block_id === evidence.block_id)
    if (directBlock && blockMatchesQuote(directBlock, evidence.quote)) {
      return [
        {
          block_id: directBlock.block_id,
          page_number: directBlock.page_number,
          bbox: directBlock.bbox,
          matchType: "block_id",
          confidence: 1.0,
        },
      ]
    }
  }

  if (!evidence.quote || !evidence.quote.trim()) {
    return []
  }

  const normQuote = normalizeText(evidence.quote)
  if (!normQuote) return []

  // TIER 2: Normalized Substring Matching (Kutipan di dalam satu blok atau sebaliknya)
  const inclusionMatches: MatchedEvidenceBlock[] = []
  for (const blk of pageBlocks) {
    const normBlock = normalizeText(blk.text)
    if (!normBlock) continue

    if (normBlock.includes(normQuote)) {
      inclusionMatches.push({
        block_id: blk.block_id,
        page_number: blk.page_number,
        bbox: blk.bbox,
        matchType: "normalized_inclusion",
        confidence: 0.95,
      })
    } else if (normQuote.includes(normBlock) && normBlock.length > 25) {
      // Blok teks merupakan subset dari kutipan panjang
      inclusionMatches.push({
        block_id: blk.block_id,
        page_number: blk.page_number,
        bbox: blk.bbox,
        matchType: "normalized_inclusion",
        confidence: 0.85,
      })
    }
  }

  if (inclusionMatches.length > 0) {
    return inclusionMatches
  }

  // TIER 3: Multi-Block Span Sequence (Kutipan melintasi 2-3 blok berturutan pada halaman yang sama)
  if (pageBlocks.length >= 2) {
    for (let i = 0; i < pageBlocks.length - 1; i++) {
      const b1 = pageBlocks[i]
      const b2 = pageBlocks[i + 1]
      const combinedNorm = normalizeText(`${b1.text} ${b2.text}`)

      if (combinedNorm.includes(normQuote)) {
        return [
          {
            block_id: b1.block_id,
            page_number: b1.page_number,
            bbox: b1.bbox,
            matchType: "span_sequence",
            confidence: 0.9,
          },
          {
            block_id: b2.block_id,
            page_number: b2.page_number,
            bbox: b2.bbox,
            matchType: "span_sequence",
            confidence: 0.9,
          },
        ]
      }
    }
  }

  // TIER 4: Token-Level Jaccard / Fuzzy Overlap (Kutipan dengan variasi parafrasa atau noise OCR)
  const fuzzyCandidates: { block: TextBlock; score: number }[] = []
  for (const blk of pageBlocks) {
    const normBlock = normalizeText(blk.text)
    const score = calculateTokenOverlap(normQuote, normBlock)
    if (score >= 0.55) {
      fuzzyCandidates.push({ block: blk, score })
    }
  }

  if (fuzzyCandidates.length > 0) {
    // Urutkan berdasarkan skor tertinggi
    fuzzyCandidates.sort((a, b) => b.score - a.score)
    return fuzzyCandidates.slice(0, 2).map((item) => ({
      block_id: item.block.block_id,
      page_number: item.block.page_number,
      bbox: item.block.bbox,
      matchType: "fuzzy_overlap",
      confidence: item.score,
    }))
  }

  return []
}

/** Number of characters of a long quote that are searched for when the whole quote cannot be found. */
const OPENING_CHARS = 60
const MIN_OPENING_CHARS = 30

/** First words of the quote as normalized text, or null when the quote is too short to use that way. */
function quoteOpening(quote: string): string | null {
  const normalized = normalizeText(quote)
  if (normalized.length < MIN_OPENING_CHARS) return null
  const cut = normalized.slice(0, OPENING_CHARS)
  const lastSpace = cut.lastIndexOf(" ")
  const opening = lastSpace >= MIN_OPENING_CHARS ? cut.slice(0, lastSpace) : cut
  return opening.length >= MIN_OPENING_CHARS ? opening : null
}

/**
 * The extraction sometimes records the wrong page or block for a quote (for example a block that only holds
 * one word). When the quote cannot be matched where it is recorded, look for it in the whole document,
 * nearest page first, and return the evidence pointing at the block that holds it. Only exact text counts:
 * the whole quote (inside one block or across two), or the opening words of a long quote that continues in
 * the next blocks. Without such a place the evidence is returned unchanged.
 */
export function relocateEvidence(evidence: EvidenceItem, blocks: TextBlock[]): EvidenceItem {
  if (blocks.length === 0 || !evidence.quote?.trim()) return evidence

  // Check if quote is genuinely present on the recorded page
  const currentPageBlocks = blocks.filter((b) => b.page_number === evidence.page_index)
  const isFoundOnCurrentPage = currentPageBlocks.some((b) => blockMatchesQuote(b, evidence.quote))

  if (isFoundOnCurrentPage) {
    return evidence
  }

  const pointTo = (target: { block_id: string; page_number: number; bbox: [number, number, number, number] }) => ({
    ...evidence,
    page_index: target.page_number,
    block_id: target.block_id,
    bbox: target.bbox,
    page_label: undefined,
  })

  const otherPages = Array.from(new Set(blocks.map((b) => b.page_number)))
    .filter((page) => page !== evidence.page_index)
    .sort((a, b) => Math.abs(a - evidence.page_index) - Math.abs(b - evidence.page_index))

  // 1. The whole quote.
  for (const page of otherPages) {
    const pageBlocks = blocks.filter((b) => b.page_number === page)
    const directHit = pageBlocks.find((b) => blockMatchesQuote(b, evidence.quote))
    if (directHit) {
      return pointTo(directHit)
    }

    const hit = findMatchingBlocks({ quote: evidence.quote, page_index: page }, blocks, page).find(
      (match) => match.matchType === "normalized_inclusion" || match.matchType === "span_sequence"
    )
    if (hit) return pointTo(hit)
  }

  // 2. The opening words of a long quote
  const opening = quoteOpening(evidence.quote)
  if (opening) {
    for (const page of [evidence.page_index, ...otherPages]) {
      const block = blocks.find((b) => b.page_number === page && normalizeText(b.text).includes(opening))
      if (block) return pointTo(block)
    }
  }

  return evidence
}

/**
 * Menghitung koordinat piksel berbobot skala untuk rendering layer overlay.
 */
export function getScaledBboxCoordinates(
  bbox: [number, number, number, number],
  scale: number
): { left: number; top: number; width: number; height: number } {
  const [x0, y0, x1, y1] = bbox
  return {
    left: x0 * scale,
    top: y0 * scale,
    width: Math.max((x1 - x0) * scale, 6),
    height: Math.max((y1 - y0) * scale, 6),
  }
}

/**
 * Mengekstrak koordinat bounding box tingkat span/kata (line-by-line)
 * dari engine PDF.js untuk penyorotan kalimat eksak.
 */
export async function extractQuoteSpanRects(
  page: any,
  quote: string
): Promise<SpanHighlightRect[]> {
  if (!page || !quote?.trim()) return []

  try {
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()
    const normQuote = cleanPdfString(quote)
    if (!normQuote) return []

    const quoteWords = normQuote
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0)

    if (quoteWords.length === 0) return []

    interface LineItem {
      itemIndex: number
      rawStr: string
      cleanStr: string
      words: string[]
      left: number
      top: number
      width: number
      height: number
    }

    const items: LineItem[] = []
    for (let i = 0; i < textContent.items.length; i++) {
      const it = textContent.items[i] as any
      if (!it.str || !it.str.trim()) continue

      const tx = it.transform[4]
      const ty = it.transform[5]
      const fontHeight = Math.hypot(it.transform[2], it.transform[3])
      const rect = [tx, ty, tx + it.width, ty + fontHeight]
      const viewRect = viewport.convertToViewportRectangle(rect)
      const left = Math.min(viewRect[0], viewRect[2])
      const top = Math.min(viewRect[1], viewRect[3])
      const width = Math.abs(viewRect[2] - viewRect[0])
      const height = Math.abs(viewRect[3] - viewRect[1])

      const cleanedStr = cleanPdfString(it.str)
      const words = cleanedStr
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 0)

      items.push({
        itemIndex: i,
        rawStr: it.str,
        cleanStr: cleanedStr,
        words,
        left,
        top,
        width,
        height,
      })
    }

    if (items.length === 0) return []

    // Match start anchor (first 2-3 words) and end anchor (last word)
    let startIdx = -1
    let endIdx = -1

    for (let i = 0; i < items.length; i++) {
      const itemWords = items[i].words.join(" ")
      if (startIdx === -1) {
        if (
          itemWords.includes(quoteWords[0]) &&
          (quoteWords.length === 1 ||
            itemWords.includes(quoteWords[1]) ||
            (i + 1 < items.length && items[i + 1].words.includes(quoteWords[1])))
        ) {
          startIdx = i
        }
      }
      if (startIdx !== -1 && endIdx === -1 && i >= startIdx) {
        const lastWord = quoteWords[quoteWords.length - 1]
        if (items[i].words.includes(lastWord)) {
          endIdx = i
          break
        }
      }
    }

    // Fallback: sliding window search if exact sequence was split by hyphenation
    if (startIdx === -1 || endIdx === -1) {
      for (let i = 0; i < items.length; i++) {
        const windowStr = items
          .slice(i, i + 3)
          .map((it) => it.words.join(" "))
          .join(" ")
        if (windowStr.includes(quoteWords[0]) && windowStr.includes(quoteWords[1] || "")) {
          startIdx = i
          break
        }
      }
      if (startIdx !== -1) {
        const lastWord = quoteWords[quoteWords.length - 1]
        for (let j = startIdx; j < Math.min(items.length, startIdx + 20); j++) {
          if (items[j].words.includes(lastWord)) {
            endIdx = j
            break
          }
        }
      }
    }

    if (startIdx === -1 || endIdx === -1) return []

    const matchedItems = items.slice(startIdx, endIdx + 1)
    const matchedSpans: SpanHighlightRect[] = []

    for (let idx = 0; idx < matchedItems.length; idx++) {
      const item = matchedItems[idx]
      let spanLeft = item.left
      let spanWidth = item.width

      // First line: trim start if quote begins after the line start
      if (idx === 0) {
        const firstWord = quoteWords[0]
        const wordPos = item.cleanStr.indexOf(firstWord)
        if (wordPos > 0) {
          const ratio = wordPos / item.cleanStr.length
          spanLeft = item.left + ratio * item.width
          spanWidth = item.width * (1 - ratio)
        }
      }

      // Last line: trim end if quote ends before line end
      if (idx === matchedItems.length - 1) {
        const lastWord = quoteWords[quoteWords.length - 1]
        const lastWordPos = item.cleanStr.indexOf(lastWord)
        if (lastWordPos !== -1) {
          const endPos = lastWordPos + lastWord.length
          const ratio = endPos / item.cleanStr.length
          spanWidth = Math.max(12, item.width * ratio)
        }
      }

      matchedSpans.push({
        left: spanLeft,
        top: item.top,
        width: Math.max(spanWidth, 8),
        height: Math.max(item.height, 8),
        textSnippet: item.rawStr,
      })
    }

    return matchedSpans
  } catch (err) {
    console.warn("Gagal mengekstrak span rects kutipan:", err)
    return []
  }
}
