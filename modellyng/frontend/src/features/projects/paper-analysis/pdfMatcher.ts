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
 * Normalisasi teks PDF komprehensif untuk teks PyMuPDF dan PDF.js:
 * 1. Menormalisasi ligatur tipografis (ff, fi, fl, ffi, ffl, ft, st).
 * 2. Menormalisasi tanda petik dan kutipan tipografis.
 * 3. Menormalisasi berbagai karakter dash/hyphen (en-dash, em-dash, minus, hyphen).
 * 4. Menggabungkan kata yang terpenggal tanda hubung antar-baris (hyphenation).
 * 5. Standarisasi spasi non-breaking, tab, newline menjadi satu spasi.
 */
export function normalizeText(text: string): string {
  if (!text) return ""

  return (
    text
      // 1. Standarisasi ligatur tipografis
      .replace(/\uFB00/g, "ff")
      .replace(/\uFB01/g, "fi")
      .replace(/\uFB02/g, "fl")
      .replace(/\uFB03/g, "ffi")
      .replace(/\uFB04/g, "ffl")
      .replace(/\uFB05/g, "ft")
      .replace(/\uFB06/g, "st")
      // 2. Standarisasi tanda petik dan kutipan
      .replace(/[\u2018\u2019\u201a\u201b\u2032]/g, "'")
      .replace(/[\u201c\u201d\u201e\u201f\u2033]/g, '"')
      // 3. Standarisasi dash dan tanda hubung
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
      // 4. Gabungkan kata yang terpenggal tanda hubung antar baris (e.g. "signifi-\n cant" -> "significant")
      .replace(/(\w+)-\s+(\w+)/g, "$1$2")
      // 5. Standarisasi spasi non-breaking dan tab
      .replace(/[\u00a0\r\t\n]+/g, " ")
      // 6. Ubah spasi ganda menjadi spasi tunggal
      .replace(/\s{2,}/g, " ")
      .toLowerCase()
      .trim()
  )
}

export const cleanPdfString = normalizeText

/**
 * Memecah kutipan panjang yang dipisahkan elipsis ("...", "…", "[...]")
 * menjadi segmen-segmen kalimat terpisah untuk pencocokan presisi.
 */
export function splitQuoteSegments(quote: string): string[] {
  if (!quote?.trim()) return []
  return quote
    .split(/\s*(?:\.{3,}|…|\[\.{3,}\]|\.\s*\.\s*\.)\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6)
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 2) return 99
  const la = a.length,
    lb = b.length
  const d: number[][] = []
  for (let i = 0; i <= la; i++) d[i] = [i]
  for (let j = 0; j <= lb; j++) d[0][j] = j
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    }
  }
  return d[la][lb]
}

function wordsFuzzyMatch(w1: string, w2: string): boolean {
  if (w1 === w2) return true
  if (w1.length >= 4 && w2.length >= 4 && editDistance(w1, w2) <= 2) return true
  return false
}

function extractWords(str: string): string[] {
  return normalizeText(str)
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
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

function blockMatchesSegment(block: TextBlock, segment: string): boolean {
  const normBlock = normalizeText(block.text)
  const normSeg = normalizeText(segment)
  if (!normBlock || !normSeg) return false
  if (normBlock.includes(normSeg)) return true
  // If segment is long, check head of segment (at least 30 chars)
  if (normSeg.length > 30) {
    const head = normSeg.slice(0, 30)
    if (normBlock.includes(head)) return true
  }
  return false
}

/**
 * The extraction sometimes records the wrong page or block for a quote (for example a block that only holds
 * one word). When the quote cannot be matched where it is recorded, look for it in the whole document,
 * nearest page first, and return the evidence pointing at the block that holds it.
 * Menggunakan segment-aware matching dan ligature normalization.
 */
export function relocateEvidence(evidence: EvidenceItem, blocks: TextBlock[]): EvidenceItem {
  if (blocks.length === 0 || !evidence.quote?.trim()) return evidence

  const segments = splitQuoteSegments(evidence.quote)
  const primarySeg = segments[0] || evidence.quote

  // 1. Check if the primary quote segment is genuinely present on the recorded page
  const currentPageBlocks = blocks.filter((b) => b.page_number === evidence.page_index)
  const isFoundOnCurrentPage = currentPageBlocks.some((b) => blockMatchesSegment(b, primarySeg))

  if (isFoundOnCurrentPage) {
    return evidence
  }

  // Also check two adjacent blocks on current page
  for (let i = 0; i < currentPageBlocks.length - 1; i++) {
    const combined = `${currentPageBlocks[i].text} ${currentPageBlocks[i + 1].text}`
    if (blockMatchesSegment({ text: combined, page_number: evidence.page_index } as TextBlock, primarySeg)) {
      return evidence
    }
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

  // 2. Search other pages for an exact match of the primary segment
  for (const page of otherPages) {
    const pageBlocks = blocks.filter((b) => b.page_number === page)
    const directHit = pageBlocks.find((b) => blockMatchesSegment(b, primarySeg))
    if (directHit) {
      return pointTo(directHit)
    }

    for (let i = 0; i < pageBlocks.length - 1; i++) {
      const combined = `${pageBlocks[i].text} ${pageBlocks[i + 1].text}`
      if (blockMatchesSegment({ text: combined, page_number: page } as TextBlock, primarySeg)) {
        return pointTo(pageBlocks[i])
      }
    }
  }

  // 3. Fallback: If quote had multiple segments, try the other segments
  if (segments.length > 1) {
    for (const seg of segments.slice(1)) {
      for (const page of [evidence.page_index, ...otherPages]) {
        const pageBlocks = blocks.filter((b) => b.page_number === page)
        const hit = pageBlocks.find((b) => blockMatchesSegment(b, seg))
        if (hit) return pointTo(hit)
      }
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

interface LineItem {
  rawStr: string
  cleanStr: string
  words: { word: string; start: number; end: number }[]
  left: number
  top: number
  width: number
  height: number
}

async function extractSegmentSpans(
  page: any,
  segment: string
): Promise<{ spans: SpanHighlightRect[]; score: number }> {
  const viewport = page.getViewport({ scale: 1.0 })
  const textContent = await page.getTextContent()
  const segWords = extractWords(segment)
  if (segWords.length === 0) return { spans: [], score: 0 }

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

    const cleaned = normalizeText(it.str)
    const words: { word: string; start: number; end: number }[] = []
    const wordRegex = /\w+/g
    let m: RegExpExecArray | null
    while ((m = wordRegex.exec(cleaned)) !== null) {
      words.push({ word: m[0], start: m.index, end: m.index + m[0].length })
    }

    if (words.length > 0) {
      items.push({
        rawStr: it.str,
        cleanStr: cleaned,
        words,
        left,
        top,
        width,
        height,
      })
    }
  }

  if (items.length === 0) return { spans: [], score: 0 }

  const pageWordTokens: { word: string; start: number; end: number; itemIdx: number }[] = []
  for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
    const item = items[itemIdx]
    for (const w of item.words) {
      pageWordTokens.push({
        word: w.word,
        start: w.start,
        end: w.end,
        itemIdx,
      })
    }
  }

  let bestMatch: { ratio: number; matchedTokens: typeof pageWordTokens } | null = null

  for (let pIdx = 0; pIdx < pageWordTokens.length; pIdx++) {
    const pw = pageWordTokens[pIdx].word
    const sw0 = segWords[0]
    const sw1 = segWords[1] || ""

    const matchStartWord = wordsFuzzyMatch(pw, sw0)
    const matchSecondWord = wordsFuzzyMatch(pw, sw1)

    if (!matchStartWord && !matchSecondWord) continue

    let sIdx = matchStartWord ? 0 : 1
    let currP = pIdx
    const matchedTokens: typeof pageWordTokens = []

    while (sIdx < segWords.length && currP < pageWordTokens.length) {
      const sw = segWords[sIdx]
      const curPw = pageWordTokens[currP].word

      if (wordsFuzzyMatch(curPw, sw)) {
        matchedTokens.push(pageWordTokens[currP])
        sIdx++
        currP++
      } else if (
        currP + 1 < pageWordTokens.length &&
        (() => {
          const joined = pageWordTokens[currP].word + pageWordTokens[currP + 1].word
          return wordsFuzzyMatch(joined, sw)
        })()
      ) {
        matchedTokens.push(pageWordTokens[currP])
        matchedTokens.push(pageWordTokens[currP + 1])
        sIdx++
        currP += 2
      } else if (
        sIdx + 1 < segWords.length &&
        (() => {
          const joinedSeg = segWords[sIdx] + segWords[sIdx + 1]
          return wordsFuzzyMatch(curPw, joinedSeg)
        })()
      ) {
        matchedTokens.push(pageWordTokens[currP])
        sIdx += 2
        currP++
      } else {
        break
      }
    }

    const matchRatio = sIdx / segWords.length
    if (matchRatio >= 0.5 && (!bestMatch || matchRatio > bestMatch.ratio)) {
      bestMatch = { ratio: matchRatio, matchedTokens }
      if (matchRatio >= 0.95) break
    }
  }

  if (!bestMatch || bestMatch.matchedTokens.length === 0 || bestMatch.ratio < 0.5) {
    return { spans: [], score: 0 }
  }

  const firstToken = bestMatch.matchedTokens[0]
  const lastToken = bestMatch.matchedTokens[bestMatch.matchedTokens.length - 1]
  const startItemIdx = firstToken.itemIdx
  const endItemIdx = lastToken.itemIdx

  const spans: SpanHighlightRect[] = []
  for (let i = startItemIdx; i <= endItemIdx; i++) {
    const item = items[i]
    let sLeft = item.left
    let sWidth = item.width

    if (i === startItemIdx) {
      const charRatio = firstToken.start / Math.max(1, item.cleanStr.length)
      sLeft = item.left + charRatio * item.width
      sWidth = item.width * (1 - charRatio)
    }

    if (i === endItemIdx) {
      const charRatio = lastToken.end / Math.max(1, item.cleanStr.length)
      const totalWidthFromItemLeft = item.width * charRatio
      sWidth = Math.max(10, totalWidthFromItemLeft - (sLeft - item.left))
    }

    spans.push({
      left: sLeft,
      top: item.top,
      width: Math.max(sWidth, 8),
      height: Math.max(item.height, 8),
      textSnippet: item.rawStr,
    })
  }

  return { spans, score: bestMatch.ratio }
}

/**
 * Mengekstrak koordinat bounding box tingkat span/kata (line-by-line)
 * dari engine PDF.js untuk penyorotan kalimat eksak.
 * Mendukung pemecahan kutipan ber-elipsis (...), toleransi saltik & hyphenation.
 */
export async function extractQuoteSpanRects(
  page: any,
  quote: string
): Promise<SpanHighlightRect[]> {
  if (!page || !quote?.trim()) return []

  try {
    const segments = splitQuoteSegments(quote)
    const allSpans: SpanHighlightRect[] = []

    for (const seg of segments) {
      const res = await extractSegmentSpans(page, seg)
      if (res.spans.length > 0) {
        allSpans.push(...res.spans)
      }
    }

    return allSpans
  } catch (err) {
    console.warn("Gagal mengekstrak span rects kutipan:", err)
    return []
  }
}
