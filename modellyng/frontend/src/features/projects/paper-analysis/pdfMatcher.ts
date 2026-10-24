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

  // TIER 1b: Jika block_id cocok secara langsung
  if (evidence.block_id) {
    const directBlock = pageBlocks.find((b) => b.block_id === evidence.block_id)
    if (directBlock) {
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
