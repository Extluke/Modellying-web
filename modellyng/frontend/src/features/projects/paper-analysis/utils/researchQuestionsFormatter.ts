/**
 * researchQuestionsFormatter.ts
 *
 * Pemroses dan pemformat cerdas untuk Parameter #3: Pertanyaan Penelitian (Research Questions).
 * Mengonversi teks satu baris/paragraf bersambung menjadi daftar pertanyaan bernomor urut
 * yang terstruktur rapi dengan pemisah baris baru/enter dan spasi vertikal proporsional.
 */

export interface ParsedResearchQuestions {
  preamble: string | null
  questions: string[]
  closing: string | null
}

/**
 * Membersihkan butir pertanyaan individual:
 * - Menghilangkan penomoran awal yang tertinggal (misal "(1)", "1)", "1.", "-", dll.)
 * - Mengkapitalkan huruf pertama
 * - Memastikan tanda tanya di akhir jika kalimat berupa pertanyaan
 */
export function cleanQuestion(str: string): string {
  if (!str) return ""
  let s = str.trim()

  // Hapus nomor urut di awal teks (misal "(1)", "1)", "1.", "[1]", "-", "*", "•", "a)", "(a)")
  s = s.replace(/^(\(?\d+[\.\)]|\-|\*|•|\[\d+\]|[a-zA-Z][\.\)]|\([a-zA-Z]\))\s*/, "")

  // Kapitalisasi huruf pertama
  if (s.length > 0) {
    s = s.charAt(0).toUpperCase() + s.slice(1)
  }

  // Pastikan diakhiri tanda tanya jika belum memiliki tanda baca akhir
  if (s.length > 0 && !/[?.!]$/.test(s)) {
    s += "?"
  }

  return s
}

/**
 * Parsing teks pertanyaan penelitian dari berbagai variasi format (inline (1)(2), 1) 2),
 * multi-line, pertanyaan majemuk dengan kata tanya gabungan, atau tanda tanya ganda).
 */
export function parseResearchQuestions(
  rawText: string | null | undefined
): ParsedResearchQuestions {
  if (!rawText || !rawText.trim()) {
    return { preamble: null, questions: [], closing: null }
  }

  const text = rawText.trim()

  // 1. Jika teks sudah memiliki baris baru (\n)
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length > 1) {
    let preamble: string | null = null
    const questions: string[] = []
    let closing: string | null = null
    let inQuestions = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isBulletOrNumbered = /^(\(?\d+[\.\)]|\-|\*|•|\[\d+\]|[a-zA-Z][\.\)]|\([a-zA-Z]\))\s*(.*)/.test(
        line
      )

      if (isBulletOrNumbered) {
        inQuestions = true
        questions.push(cleanQuestion(line))
      } else if (
        !inQuestions &&
        (line.endsWith(":") ||
          (i === 0 &&
            lines.length > 1 &&
            /^(\(?\d+[\.\)]|\-|\*|•|\[\d+\]|[a-zA-Z][\.\)]|\([a-zA-Z]\))/.test(
              lines[1]
            )))
      ) {
        preamble = line
      } else if (inQuestions) {
        // Baris penjelas atau kalimat penutup setelah daftar pertanyaan
        closing = closing ? `${closing} ${line}` : line
      } else {
        questions.push(cleanQuestion(line))
      }
    }

    if (questions.length > 0) {
      return { preamble, questions, closing }
    }
  }

  // 2. Deteksi penomoran sekuensial inline: (1)... (2)... atau 1)... 2)... atau 1.... 2.... atau [1]... [2]...
  const inlinePattern = /(?:^|\s)(?:\((\d+)\)|(\d+)\)|(\d+)\.|\[(\d+)\])\s+/g
  const matches = [...text.matchAll(inlinePattern)]

  if (matches.length >= 2) {
    const indices = matches.map((m) =>
      parseInt(m[1] || m[2] || m[3] || m[4], 10)
    )
    const isSequential =
      indices[0] === 1 &&
      indices.every((val, i) => i === 0 || val === indices[i - 1] + 1)

    if (isSequential) {
      const firstMatchIndex = matches[0].index ?? 0
      let preamble: string | null = text.slice(0, firstMatchIndex).trim()
      if (!preamble) preamble = null

      const questions: string[] = []
      let closing: string | null = null

      for (let i = 0; i < matches.length; i++) {
        const start = (matches[i].index ?? 0) + matches[i][0].length
        const end =
          i < matches.length - 1 ? (matches[i + 1].index ?? text.length) : text.length
        let qText = text.slice(start, end).trim()

        // Pada butir terakhir, cek apakah ada kalimat penutup setelah tanda tanya terakhir
        if (i === matches.length - 1) {
          const lastQMark = qText.lastIndexOf("?")
          if (lastQMark !== -1 && lastQMark < qText.length - 1) {
            const after = qText.slice(lastQMark + 1).trim()
            if (after.length > 5 && /^[A-Z]/.test(after)) {
              closing = after
              qText = qText.slice(0, lastQMark + 1).trim()
            }
          }
        }

        questions.push(cleanQuestion(qText))
      }

      return { preamble, questions, closing }
    }
  }

  // 3. Teks narasi bersambung dengan kalimat pengantar (preamble) dan/atau tanda tanya
  let preamble: string | null = null
  let questionPart = text
  let closing: string | null = null

  const colonIdx = text.indexOf(":")
  if (colonIdx !== -1 && colonIdx < 140 && colonIdx < text.length - 20) {
    const beforeColon = text.slice(0, colonIdx).trim()
    if (
      /pertanyaan|penelitian|tujuan|fokus|rumusan|berikut|studi|dipandu|mengkaji/i.test(
        beforeColon
      )
    ) {
      preamble = `${beforeColon}:`
      questionPart = text.slice(colonIdx + 1).trim()
    }
  }

  // Cek apakah ada kalimat penutup setelah tanda tanya terakhir
  const lastQMark = questionPart.lastIndexOf("?")
  if (lastQMark !== -1 && lastQMark < questionPart.length - 1) {
    const afterQ = questionPart.slice(lastQMark + 1).trim()
    if (afterQ.length > 5 && /^[A-Z]/.test(afterQ)) {
      closing = afterQ
      questionPart = questionPart.slice(0, lastQMark + 1).trim()
    }
  }

  // Pemisahan butir pertanyaan
  const interrogatives =
    "(?:seberapa|bagaimana|apakah|mengapa|apa(?:kah)?|sejauh mana|siapa|kapan|dimana|mana)"
  const compoundRegex = new RegExp(
    `^(.*?)(?:,\\s*(?:dan|serta)\\s+)(${interrogatives}\\b.*)$`,
    "i"
  )

  const qCount = (questionPart.match(/\?/g) || []).length
  let rawQuestions: string[] = []

  if (qCount > 1) {
    // Dipisahkan oleh tanda tanya diikuti spasi dan huruf kapital/angka
    const parts = questionPart.split(/\?\s+(?=[A-Z0-9(])/)
    rawQuestions = parts.map((p) => p.trim())
  } else {
    // 0 atau 1 tanda tanya: cek apakah klausa interogatif gabungan (misal: "..., dan seberapa efektif...?")
    const compoundMatch = questionPart.match(compoundRegex)
    if (compoundMatch) {
      rawQuestions = [compoundMatch[1].trim(), compoundMatch[2].trim()]
    } else {
      rawQuestions = [questionPart]
    }
  }

  return {
    preamble,
    questions: rawQuestions.map(cleanQuestion).filter(Boolean),
    closing,
  }
}

/**
 * Mengonversi ParsedResearchQuestions menjadi teks bertingkat rapi dengan penomoran
 * urut yang dipisahkan baris baru (enter), cocok untuk textarea revisi dan clipboard.
 */
export function formatQuestionsAsNumberedText(
  parsed: ParsedResearchQuestions
): string {
  const parts: string[] = []

  if (parsed.preamble) {
    parts.push(parsed.preamble)
  }

  parsed.questions.forEach((q, idx) => {
    parts.push(`${idx + 1}. ${q}`)
  })

  if (parsed.closing) {
    parts.push(parsed.closing)
  }

  return parts.join("\n")
}
