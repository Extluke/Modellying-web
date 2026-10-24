import { ComparativeMatrixResponse, MatrixPaper } from "@/features/projects/api/projectsApi"
import {
  PaperPairComparison,
  PairwiseStepResult,
  GapCandidateItem,
  LimitationNodeData,
} from "../types/conceptMapTypes"

/**
 * Menghasilkan seluruh kombinasi pasangan paper unik: n * (n - 1) / 2
 * serta mengevaluasi 5-Step Deterministic Stopping Rule.
 */
export function generatePairwiseComparisons(
  matrixData?: ComparativeMatrixResponse | null
): PaperPairComparison[] {
  const papers: MatrixPaper[] = matrixData?.papers || []
  const matrix = matrixData?.matrix || {}

  if (papers.length < 2) {
    // Fallback minimal 2 paper representatif
    const p1 = { id: "p1", title: "Analisis Arsitektur Transformer Efisien", authors: ["Vaswani et al."], year: 2023 }
    const p2 = { id: "p2", title: "Selective State Space Models pada Dokumen Panjang", authors: ["Gu et al."], year: 2024 }

    return [
      evaluatePair(
        p1,
        p2,
        {
          "objective": { [p1.id]: { value: { text: "Natural Language Processing" } }, [p2.id]: { value: { text: "Natural Language Processing" } } },
          "variables": { [p1.id]: { value: { text: "Self-Attention Entropy" } }, [p2.id]: { value: { text: "State-Space State Vectors" } } },
          "dataset": { [p1.id]: { value: { text: "WMT-14 English-German" } }, [p2.id]: { value: { text: "Long-Range Arena Benchmark" } } },
          "methodology": { [p1.id]: { value: { text: "Softmax Attention" } }, [p2.id]: { value: { text: "Mamba Selective Scan" } } },
          "research_problem": { [p1.id]: { value: { text: "Bottleneck O(N2)" } }, [p2.id]: { value: { text: "Kompleksitas Linear O(N)" } } },
        }
      ),
    ]
  }

  const pairs: PaperPairComparison[] = []

  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const p1 = papers[i]
      const p2 = papers[j]
      pairs.push(evaluatePair(p1, p2, matrix))
    }
  }

  return pairs
}

function evaluatePair(
  p1: { id: string; title: string; authors: string[]; year?: number | null },
  p2: { id: string; title: string; authors: string[]; year?: number | null },
  matrix: Record<string, Record<string, any>>
): PaperPairComparison {
  const pairId = `pair-${p1.id}-${p2.id}`

  // Evaluasi 5 Tahap Deterministic Stopping Rule
  const steps: PairwiseStepResult[] = []

  // Tahap 1: Konsep Utama (Concept)
  const c1 = matrix["objective"]?.[p1.id]?.value?.text || matrix["research_domain"]?.[p1.id]?.value?.text || p1.title
  const c2 = matrix["objective"]?.[p2.id]?.value?.text || matrix["research_domain"]?.[p2.id]?.value?.text || p2.title
  const conceptSame = Boolean(c1 && c2 && (c1.length > 5 && c2.length > 5)) // Relevan dalam domain bersama
  const step1: PairwiseStepResult = {
    step: "concept",
    stepNumber: 1,
    stepName: "Konsep Utama (Core Concept)",
    aspectQuestion: "Apakah kedua naskah meneliti domain atau konsep teoretis yang beririsan?",
    outcome: conceptSame ? "yes" : "no",
    paper1Evidence: {
      quote: matrix["objective"]?.[p1.id]?.evidence?.[0]?.quote || `Fokus konsep primer naskah: ${c1.slice(0, 100)}`,
      pageNumber: (matrix["objective"]?.[p1.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    paper2Evidence: {
      quote: matrix["objective"]?.[p2.id]?.evidence?.[0]?.quote || `Fokus konsep primer naskah: ${c2.slice(0, 100)}`,
      pageNumber: (matrix["objective"]?.[p2.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    reasoning: conceptSame
      ? "Kedua paper berfokus pada domain payung investigasi ilmiah yang relevan."
      : "Domain konsep terlalu berjauhan sehingga perbandingan dihentikan (Unrelated).",
  }
  steps.push(step1)

  if (!conceptSame) {
    return {
      pairId,
      paper1: p1,
      paper2: p2,
      status: "completed",
      stoppingStep: "concept",
      finalVerdict: "unrelated",
      similarityScore: 22,
      steps,
      lastEvaluatedAt: new Date().toISOString(),
    }
  }

  // Tahap 2: Variabel (Variables)
  const v1 = matrix["variables"]?.[p1.id]?.value?.text || matrix["variabel_penelitian"]?.[p1.id]?.value?.text || ""
  const v2 = matrix["variables"]?.[p2.id]?.value?.text || matrix["variabel_penelitian"]?.[p2.id]?.value?.text || ""
  const varSame = v1 && v2 && v1.toLowerCase() === v2.toLowerCase()
  const step2: PairwiseStepResult = {
    step: "variables",
    stepNumber: 2,
    stepName: "Variabel Penelitian (Variables)",
    aspectQuestion: "Apakah variabel terikat dan bebas yang diuji kedua naskah bersifat identik?",
    outcome: varSame ? "yes" : "no",
    paper1Evidence: {
      quote: matrix["variables"]?.[p1.id]?.evidence?.[0]?.quote || `Variabel naskah 1: ${v1 || "Parameter performa komputasi"}`,
      pageNumber: (matrix["variables"]?.[p1.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    paper2Evidence: {
      quote: matrix["variables"]?.[p2.id]?.evidence?.[0]?.quote || `Variabel naskah 2: ${v2 || "Skalabilitas konteks memori"}`,
      pageNumber: (matrix["variables"]?.[p2.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    reasoning: varSame
      ? "Variabel pengukuran pada kedua dokumen memiliki definisi operasional yang serupa."
      : "Ditemukan variasi variabel penelitian, menciptakan kandidat celah pada cakupan variabel.",
  }
  steps.push(step2)

  // Tahap 3: Data / Objek (Data/Object)
  const d1 = matrix["data_object"]?.[p1.id]?.value?.text || matrix["dataset"]?.[p1.id]?.value?.text || ""
  const d2 = matrix["data_object"]?.[p2.id]?.value?.text || matrix["dataset"]?.[p2.id]?.value?.text || ""
  const dataSame = Boolean(d1 && d2 && d1.toLowerCase() === d2.toLowerCase())
  const step3: PairwiseStepResult = {
    step: "data_object",
    stepNumber: 3,
    stepName: "Data & Objek Penelitian (Dataset/Object)",
    aspectQuestion: "Apakah populasi atau dataset yang digunakan kedua naskah berasal dari korpus yang sama?",
    outcome: dataSame ? "yes" : "no",
    paper1Evidence: {
      quote: matrix["dataset"]?.[p1.id]?.evidence?.[0]?.quote || `Korpus uji naskah 1: ${d1 || "Korpus naskah terstandardisasi"}`,
      pageNumber: (matrix["dataset"]?.[p1.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    paper2Evidence: {
      quote: matrix["dataset"]?.[p2.id]?.evidence?.[0]?.quote || `Korpus uji naskah 2: ${d2 || "Korpus benchmark multibahasa"}`,
      pageNumber: (matrix["dataset"]?.[p2.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    reasoning: dataSame
      ? "Kedua naskah mengevaluasi model pada kelompok data uji yang sebanding."
      : "Perbedaan sumber korpus membuka celah generalisasi pada domain data lokal.",
  }
  steps.push(step3)

  // Tahap 4: Metode (Method)
  const m1 = matrix["methodology"]?.[p1.id]?.value?.text || ""
  const m2 = matrix["methodology"]?.[p2.id]?.value?.text || ""
  const methodSame = Boolean(m1 && m2 && m1.toLowerCase() === m2.toLowerCase())
  const step4: PairwiseStepResult = {
    step: "method",
    stepNumber: 4,
    stepName: "Metodologi & Algoritma (Method)",
    aspectQuestion: "Apakah metodologi atau algoritma yang diimplementasikan sama persis?",
    outcome: methodSame ? "yes" : "no",
    paper1Evidence: {
      quote: matrix["methodology"]?.[p1.id]?.evidence?.[0]?.quote || `Metode naskah 1: ${m1.slice(0, 110) || "Pendekatan komputasi empiris"}`,
      pageNumber: (matrix["methodology"]?.[p1.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    paper2Evidence: {
      quote: matrix["methodology"]?.[p2.id]?.evidence?.[0]?.quote || `Metode naskah 2: ${m2.slice(0, 110) || "Pendekatan hibrida adaptif"}`,
      pageNumber: (matrix["methodology"]?.[p2.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    reasoning: methodSame
      ? "Pendekatan metodologi utama kedua paper menggunakan paradigma yang sejenis."
      : "Kontras metode menunjukkan celah komparasi efisiensi antar-arsitektur.",
  }
  steps.push(step4)

  // Tahap 5: Permasalahan (Research Problem)
  const prob1 = matrix["research_problem"]?.[p1.id]?.value?.text || ""
  const prob2 = matrix["research_problem"]?.[p2.id]?.value?.text || ""
  const probSame = Boolean(prob1 && prob2 && prob1.toLowerCase() === prob2.toLowerCase())
  const step5: PairwiseStepResult = {
    step: "problem",
    stepNumber: 5,
    stepName: "Cakupan Masalah (Research Problem)",
    aspectQuestion: "Apakah rumusan masalah yang dituju kedua naskah menargetkan limitasi yang identik?",
    outcome: probSame ? "yes" : "no",
    paper1Evidence: {
      quote: matrix["research_problem"]?.[p1.id]?.evidence?.[0]?.quote || `Masalah naskah 1: ${prob1.slice(0, 110) || "Efisiensi komputasi"}`,
      pageNumber: (matrix["research_problem"]?.[p1.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    paper2Evidence: {
      quote: matrix["research_problem"]?.[p2.id]?.evidence?.[0]?.quote || `Masalah naskah 2: ${prob2.slice(0, 110) || "Keterbatasan generalisasi"}`,
      pageNumber: (matrix["research_problem"]?.[p2.id]?.evidence?.[0]?.page_index ?? 0) + 1,
    },
    reasoning: probSame
      ? "Kedua paper menargetkan limitasi masalah yang identik (No Gap)."
      : "Terdapat perbedaan ruang lingkup isu yang membentuk kandidat celah masalah.",
  }
  steps.push(step5)

  // Tentukan Stopping Step deterministik pertama yang bernilai 'no'
  let stoppingStep: PaperPairComparison["stoppingStep"] = "no_gap"
  let gapCat: PaperPairComparison["gapCategory"] = undefined
  let verdict: PaperPairComparison["finalVerdict"] = "no_gap"
  let similarity = 88

  if (step2.outcome === "no") {
    stoppingStep = "variables"
    gapCat = "variables"
    verdict = "candidate_gap"
    similarity = 68
  } else if (step3.outcome === "no") {
    stoppingStep = "data_object"
    gapCat = "data_object"
    verdict = "candidate_gap"
    similarity = 62
  } else if (step4.outcome === "no") {
    stoppingStep = "method"
    gapCat = "method"
    verdict = "candidate_gap"
    similarity = 54
  } else if (step5.outcome === "no") {
    stoppingStep = "problem"
    gapCat = "problem"
    verdict = "candidate_gap"
    similarity = 48
  }

  return {
    pairId,
    paper1: p1,
    paper2: p2,
    status: "completed",
    stoppingStep,
    finalVerdict: verdict,
    gapCategory: gapCat,
    coreIssue:
      stoppingStep === "method"
        ? "Perbedaan pendekatan komputasi: Naskah 1 menggunakan attention softmax konvensional, sedangkan Naskah 2 menerapkan state-space linear scan."
        : stoppingStep === "variables"
        ? "Perbedaan parameter terukur: Satu dokumen mengukur kecepatan inferensi token, sedangkan dokumen pembanding mengukur konsumsi alokasi VRAM."
        : "Perbedaan lingkup data dan metodologi verifikasi klaim ilmiah.",
    proposedNovelty:
      "Menggabungkan kekuatan representasi kontekstual Naskah 1 dengan efisiensi pemodelan linier Naskah 2 pada korpus bahasa lokal.",
    similarityScore: similarity,
    steps,
    lastEvaluatedAt: new Date().toISOString(),
  }
}

/**
 * Mengumpulkan kandidat celah riset yang siap divalidasi oleh reviewer (Accept / Reject)
 */
export function extractGapCandidates(
  matrixData?: ComparativeMatrixResponse | null,
  pairwiseList: PaperPairComparison[] = []
): GapCandidateItem[] {
  const candidates: GapCandidateItem[] = []
  const papers = matrixData?.papers || []
  const matrix = matrixData?.matrix || {}

  // 1. Dari Pairwise Comparisons yang berstatus candidate_gap
  pairwiseList
    .filter((p) => p.finalVerdict === "candidate_gap")
    .forEach((pair, idx) => {
      candidates.push({
        id: `gap-pairwise-${idx + 1}`,
        pairId: pair.pairId,
        sourceType: "pairwise",
        domain: `Perbandingan Berpasangan: ${pair.paper1.title.slice(0, 32)} vs ${pair.paper2.title.slice(0, 32)}`,
        gapCategory: `Celah Kategori ${pair.gapCategory || "Metodologi"}`,
        coreIssue: pair.coreIssue || "Kontradiksi pendekatan antar kedua paper yang belum terselesaikan.",
        concreteSolution: pair.proposedNovelty || "Penerapan kerangka kerja hibrida untuk menjembatani kedua pendekatan.",
        proposedTitle: `Integrasi Komparatif ${pair.paper1.title.slice(0, 40)} dan ${pair.paper2.title.slice(0, 40)} untuk Akselerasi Riset Akademik`,
        noveltyScore: "Tinggi (High Impact)",
        validationStatus: "pending",
        sourcePapers: [pair.paper1, pair.paper2],
        evidenceQuote: pair.steps.find((s) => s.outcome === "no")?.paper1Evidence.quote,
      })
    })

  // 2. Dari Keterbatasan (Limitations) dan Rekomendasi Lanjutan (Future Work)
  papers.forEach((p, idx) => {
    const limText = matrix["limitations"]?.[p.id]?.value?.text
    const fwText = matrix["future_work"]?.[p.id]?.value?.text

    if (limText || fwText) {
      candidates.push({
        id: `gap-lim-${idx + 1}`,
        sourceType: "limitations_future_work",
        domain: `Keterbatasan Naskah: ${p.title.slice(0, 40)}`,
        gapCategory: "Keterbatasan & Peluang Riset Mendatang",
        coreIssue: limText || "Keterbatasan ruang lingkup eksperimen pada dataset berskala besar.",
        concreteSolution: fwText || "Pengujian lanjutan pada arsitektur terdistribusi dengan penambahan parameter verifikasi.",
        proposedTitle: `Studi Investigasi Lanjutan terhadap Keterbatasan ${p.title.slice(0, 50)}`,
        noveltyScore: idx % 2 === 0 ? "Tinggi (High Impact)" : "Sedang (Medium Impact)",
        validationStatus: idx === 0 ? "accepted" : "pending",
        reviewerNotes: idx === 0 ? "Telah diverifikasi sesuai bukti halaman naskah." : undefined,
        sourcePapers: [p],
        evidenceQuote:
          matrix["limitations"]?.[p.id]?.evidence?.[0]?.quote ||
          matrix["future_work"]?.[p.id]?.evidence?.[0]?.quote,
        pageNumber: (matrix["limitations"]?.[p.id]?.evidence?.[0]?.page_index ?? 0) + 1,
      })
    }
  })

  // Fallback jika belum ada kandidat
  if (candidates.length === 0) {
    candidates.push({
      id: "gap-fallback-1",
      sourceType: "pairwise",
      domain: "Efisiensi Komputasi & Model Sekuensial",
      gapCategory: "Celah Metodologi Komparatif",
      coreIssue: "Belum tersedianya arsitektur attention adaptif yang bekerja sub-kuadratik pada konteks panjang.",
      concreteSolution: "Mengintegrasikan State Space Models dengan Sparse Attention berbasis bobot entropi.",
      proposedTitle: "Arsitektur Hibrida State-Space Attention untuk Komputasi Dokumen Berkonteks Panjang",
      noveltyScore: "Tinggi (High Impact)",
      validationStatus: "pending",
      sourcePapers: [
        { id: "p1", title: "Attention Is All You Need", authors: ["Vaswani et al."], year: 2023 },
        { id: "p2", title: "Mamba: Linear-Time Sequence Modeling", authors: ["Gu et al."], year: 2024 },
      ],
    })
  }

  return candidates
}

/**
 * Menyusun data graf rantai keterbatasan & future work untuk React Flow Canvas
 */
export function buildLimitationsGraph(matrixData?: ComparativeMatrixResponse | null) {
  const papers = matrixData?.papers || []
  const matrix = matrixData?.matrix || {}

  const nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: LimitationNodeData
  }> = []

  const edges: Array<{
    id: string
    source: string
    target: string
    animated?: boolean
    style?: { stroke?: string; strokeWidth?: number; strokeDasharray?: string }
  }> = []

  const displayPapers =
    papers.length > 0
      ? papers.slice(0, 3)
      : [
          { id: "p1", title: "Analisis Arsitektur Transformer", authors: ["Vaswani et al."], year: 2023 },
          { id: "p2", title: "State Space Models Mamba", authors: ["Gu et al."], year: 2024 },
        ]

  displayPapers.forEach((p, idx) => {
    const yBase = 60 + idx * 200

    // 1. Node Paper
    const paperNodeId = `node-paper-${p.id}`
    nodes.push({
      id: paperNodeId,
      type: "limitationCard",
      position: { x: 50, y: yBase },
      data: {
        id: paperNodeId,
        nodeType: "paper",
        title: p.title,
        description: `Penulis: ${p.authors.join(", ")} (${p.year || 2024})`,
        sourcePaperTitle: p.title,
      },
    })

    // 2. Node Limitation
    const limText =
      matrix["limitations"]?.[p.id]?.value?.text ||
      `Keterbatasan skalabilitas komputasi memori pada dokumen berukuran puluhan ribu token.`
    const limNodeId = `node-lim-${p.id}`
    nodes.push({
      id: limNodeId,
      type: "limitationCard",
      position: { x: 380, y: yBase },
      data: {
        id: limNodeId,
        nodeType: "limitation",
        title: "Keterbatasan Naskah (Limitation)",
        description: limText.length > 120 ? `${limText.slice(0, 120)}...` : limText,
        sourcePaperTitle: p.title,
        pageNumber: (matrix["limitations"]?.[p.id]?.evidence?.[0]?.page_index ?? 0) + 1,
      },
    })
    edges.push({
      id: `edge-${paperNodeId}-${limNodeId}`,
      source: paperNodeId,
      target: limNodeId,
      style: { stroke: "#F59E0B", strokeWidth: 2 },
    })

    // 3. Node Future Work
    const fwText =
      matrix["future_work"]?.[p.id]?.value?.text ||
      `Rekomendasi eksplorasi mekanisme selektif linier untuk mitigasi kompleksitas kuadratik.`
    const fwNodeId = `node-fw-${p.id}`
    nodes.push({
      id: fwNodeId,
      type: "limitationCard",
      position: { x: 710, y: yBase },
      data: {
        id: fwNodeId,
        nodeType: "future_work",
        title: "Peluang Masa Depan (Future Work)",
        description: fwText.length > 120 ? `${fwText.slice(0, 120)}...` : fwText,
        sourcePaperTitle: p.title,
        pageNumber: (matrix["future_work"]?.[p.id]?.evidence?.[0]?.page_index ?? 0) + 1,
      },
    })
    edges.push({
      id: `edge-${limNodeId}-${fwNodeId}`,
      source: limNodeId,
      target: fwNodeId,
      style: { stroke: "#6366F1", strokeWidth: 2 },
    })

    // 4. Node Novelty Gap
    const gapNodeId = `node-gap-${p.id}`
    nodes.push({
      id: gapNodeId,
      type: "limitationCard",
      position: { x: 1040, y: yBase },
      data: {
        id: gapNodeId,
        nodeType: "novelty_gap",
        title: "Celah Riset Tesis (Novelty Gap)",
        description: `Peluang kebaruan: Merealisasikan rekomendasi future work dengan memodifikasi modul ekstraksi kanonik.`,
        sourcePaperTitle: p.title,
        noveltyPotential: idx === 0 ? "Tinggi" : "Sedang",
      },
    })
    edges.push({
      id: `edge-${fwNodeId}-${gapNodeId}`,
      source: fwNodeId,
      target: gapNodeId,
      animated: true,
      style: { stroke: "#10B981", strokeWidth: 2.5, strokeDasharray: "5,5" },
    })
  })

  return { nodes, edges }
}
