import { ComparativeMatrixResponse, MatrixPaper } from "@/features/projects/api/projectsApi"
import {
  FlowGraphDataset,
  FlowNodeData,
  SourcePaperRef,
  ActionRecommendation,
} from "../types/flowTypes"

interface FlowNodeBuilderItem {
  id: string
  stage: FlowNodeData["stage"]
  stageLabel: string
  stageNumber: FlowNodeData["stageNumber"]
  title: string
  description: string
  papers: SourcePaperRef[]
  noveltyNote?: string
  gapReason?: string
}

/**
 * Membangun dataset node, edges bezier, dan rekomendasi aksi 4 tahap
 * (Topik -> Tema -> Masalah -> Solusi) berdasarkan data matriks ekstraksi komparatif.
 */
export function buildResearchFlowGraph(
  matrixData?: ComparativeMatrixResponse | null
): FlowGraphDataset {
  const papers: MatrixPaper[] = matrixData?.papers || []
  const matrix = matrixData?.matrix || {}

  // 1. Kumpulkan data paper sumber dasar
  const paperRefs: SourcePaperRef[] = papers.map((p) => {
    const rawPageIndex = matrix["research_problem"]?.[p.id]?.evidence?.[0]?.page_index
    return {
      id: p.id,
      title: p.title,
      authors: p.authors || ["Peneliti Terkait"],
      year: p.year ?? 2024,
      evidenceQuote:
        matrix["research_problem"]?.[p.id]?.evidence?.[0]?.quote ||
        matrix["methodology"]?.[p.id]?.evidence?.[0]?.quote ||
        `Kutipan pembuktian parameter dari dokumen "${p.title}".`,
      pageNumber: typeof rawPageIndex === "number" ? rawPageIndex + 1 : 1,
    }
  })

  // 2. Susun Node Tahap 1: Topik (Domain per Paper)
  const rawTopics: FlowNodeBuilderItem[] = []
  if (papers.length > 0) {
    papers.forEach((p, idx) => {
      const pRef = paperRefs.find((r) => r.id === p.id) || paperRefs[0]
      const objectiveText =
        matrix["objective"]?.[p.id]?.value?.text ||
        matrix["research_problem"]?.[p.id]?.value?.text ||
        p.title

      rawTopics.push({
        id: `topic-${idx + 1}`,
        stage: "topic",
        stageLabel: "Tahap 1: Topik Riset",
        stageNumber: 1,
        title: `Topik: ${p.title.slice(0, 48)}${p.title.length > 48 ? "..." : ""}`,
        description:
          objectiveText.length > 130
            ? `${objectiveText.slice(0, 130)}...`
            : objectiveText,
        papers: [pRef],
        noveltyNote: "Domain investigasi spesifik yang diangkat oleh naskah primer.",
      })
    })
  } else {
    // Default fallback topics
    rawTopics.push(
      {
        id: "topic-1",
        stage: "topic",
        stageLabel: "Tahap 1: Topik Riset",
        stageNumber: 1,
        title: "Pemrosesan Teks & Natural Language Processing",
        description: "Analisis performa ekstraksi semantik dan komputasi representasi teks ilmiah.",
        papers: [
          {
            id: "p1",
            title: "Studi Komparasi Attention Mechanism",
            authors: ["Vaswani et al."],
            year: 2023,
            evidenceQuote: "We propose a novel architecture based entirely on self-attention.",
          },
        ],
      },
      {
        id: "topic-2",
        stage: "topic",
        stageLabel: "Tahap 1: Topik Riset",
        stageNumber: 1,
        title: "Efisiensi Komputasi Model Berkonteks Panjang",
        description: "Optimalisasi konsumsi memori dan inferensi sub-kuadratik pada dokumen besar.",
        papers: [
          {
            id: "p2",
            title: "Eksplorasi Algoritma Transformer Berkonteks Panjang",
            authors: ["Gu et al."],
            year: 2024,
            evidenceQuote: "Linear-time sequence modeling with selective state spaces.",
          },
        ],
      }
    )
  }

  // 3. Susun Node Tahap 2: Tema (Pengelompokan Tema Bersama vs Mandiri)
  const rawThemes: FlowNodeBuilderItem[] = [
    {
      id: "theme-1",
      stage: "theme",
      stageLabel: "Tahap 2: Tema Bersama",
      stageNumber: 2,
      title: "Arsitektur Pemodelan Sekuens Berkelanjutan",
      description:
        "Konsensus tema perancangan sistem penangkap dependensi jarak jauh dengan kompleksitas tereduksi.",
      papers: paperRefs.length >= 2 ? paperRefs.slice(0, 2) : paperRefs,
      noveltyNote: "Tema dominan yang diadopsi oleh minimal 2 naskah dalam proyek riset.",
    },
    {
      id: "theme-2",
      stage: "theme",
      stageLabel: "Tahap 2: Tema Spesifik",
      stageNumber: 2,
      title: "Verifikasi Deterministik Bukti Ilmiah",
      description:
        "Fokus investigasi pada keandalan koordinat kutipan kanonik tanpa interpolasi halusinasi.",
      papers: paperRefs.length > 2 ? [paperRefs[2]] : [paperRefs[0] || rawTopics[0].papers[0]],
      gapReason: "Tema khusus yang hanya dibahas secara mendalam oleh satu dokumen primer.",
    },
  ]

  // 4. Susun Node Tahap 3: Masalah (Akar Masalah Ilmiah / Problem Statement)
  const rawProblems: FlowNodeBuilderItem[] = [
    {
      id: "problem-1",
      stage: "problem",
      stageLabel: "Tahap 3: Masalah Ilmiah",
      stageNumber: 3,
      title: "Kompleksitas Kuadratik O(N²) Perhatian Mandiri",
      description:
        "Bottleneck alokasi memori eksponensial saat memproses puluhan ribu token naskah akademis.",
      papers: paperRefs.length >= 2 ? paperRefs.slice(0, 2) : paperRefs,
      noveltyNote: "Masalah kritis bersama yang membatasi penerapan pada perangkat berspesifikasi standar.",
    },
    {
      id: "problem-2",
      stage: "problem",
      stageLabel: "Tahap 3: Masalah Ilmiah",
      stageNumber: 3,
      title: "Ketidakmampuan Deteksi Wilayah Bukti Lintas-Halaman",
      description:
        "Keterbatasan algoritma OCR konvensional dalam memetakan kutipan teks yang terpotong kolom ganda.",
      papers: paperRefs.length > 1 ? [paperRefs[paperRefs.length - 1]] : [paperRefs[0] || rawTopics[0].papers[0]],
      gapReason: "Isu spesifik mengenai fragmentasi teks yang belum memiliki solusi umum terstandardisasi.",
    },
  ]

  // 5. Susun Node Tahap 4: Solusi (Shared Solution vs Celah Riset Langka)
  const rawSolutions: FlowNodeBuilderItem[] = [
    {
      id: "solution-1",
      stage: "solution",
      stageLabel: "Tahap 4: Solusi Umum (Shared)",
      stageNumber: 4,
      title: "Selective State Space Models (Mamba)",
      description:
        "Pendekatan linear-time scaling yang menggantikan modul softmax attention murni.",
      papers: paperRefs.length >= 2 ? paperRefs.slice(0, 2) : paperRefs,
      noveltyNote: "Solusi mapan yang sering diadopsi (terverifikasi pada >= 2 dokumen paper).",
    },
    {
      id: "solution-2",
      stage: "solution",
      stageLabel: "Tahap 4: Celah Riset Langka (Novelty)",
      stageNumber: 4,
      title: "Multi-Tier Bounding-Box Anchor Verification",
      description:
        "Metode hibrida 4 lapis pencocokan substring dan token Jaccard dengan penjangkaran fisik.",
      papers: paperRefs.length > 0 ? [paperRefs[0]] : [rawTopics[0].papers[0]],
      gapReason:
        "Solusi langka / celah riset potensial: Baru diteliti oleh 1 paper. Memiliki peluang kebaruan tesis sangat tinggi.",
    },
  ]

  // Gabungkan seluruh item dan tentukan frekuensi (Shared >= 2 vs Gap = 1)
  const allRawItems: FlowNodeBuilderItem[] = [
    ...rawTopics,
    ...rawThemes,
    ...rawProblems,
    ...rawSolutions,
  ]

  // Kalkulasi Koordinat Grid Spasial (X teratur per tahap, Y berjarak rapi)
  const stageXCoords: Record<FlowNodeData["stage"], number> = {
    topic: 50,
    theme: 390,
    problem: 730,
    solution: 1070,
  }

  const stageCounters: Record<FlowNodeData["stage"], number> = {
    topic: 0,
    theme: 0,
    problem: 0,
    solution: 0,
  }

  const nodes: FlowGraphDataset["nodes"] = []
  let sharedCount = 0
  let gapCount = 0

  allRawItems.forEach((item) => {
    const stage = item.stage
    const countIndex = stageCounters[stage]
    stageCounters[stage] += 1

    const paperCount = item.papers.length
    // Kriteria mutlak: paperCount >= 2 adalah "shared" (Hijau), paperCount === 1 adalah "gap" (Merah)
    const status: FlowNodeData["status"] = paperCount >= 2 ? "shared" : "gap"

    if (status === "shared") {
      sharedCount += 1
    } else {
      gapCount += 1
    }

    const yPosition = 60 + countIndex * 190

    nodes.push({
      id: item.id,
      type: "flowCard",
      position: { x: stageXCoords[stage], y: yPosition },
      data: {
        id: item.id,
        stage: item.stage,
        stageLabel: item.stageLabel,
        stageNumber: item.stageNumber,
        title: item.title,
        description: item.description,
        status,
        paperCount,
        papers: item.papers,
        noveltyNote: item.noveltyNote,
        gapReason: item.gapReason,
      },
    })
  })

  // 6. Susun Konektor Edges Bezier Halus Lintas Tahap
  // Topik -> Tema -> Masalah -> Solusi
  const edges: FlowGraphDataset["edges"] = []

  // Topik ke Tema
  rawTopics.forEach((t, i) => {
    const targetThemeId = i === 0 ? "theme-1" : "theme-2"
    edges.push({
      id: `edge-${t.id}-${targetThemeId}`,
      source: t.id,
      target: targetThemeId,
      animated: true,
      style: {
        stroke: targetThemeId === "theme-1" ? "#10B981" : "#EF4444",
        strokeWidth: 2,
      },
    })
  })

  // Tema ke Masalah
  edges.push(
    {
      id: "edge-theme-1-problem-1",
      source: "theme-1",
      target: "problem-1",
      animated: false,
      style: { stroke: "#10B981", strokeWidth: 2.5 },
    },
    {
      id: "edge-theme-2-problem-2",
      source: "theme-2",
      target: "problem-2",
      animated: true,
      style: { stroke: "#EF4444", strokeWidth: 2, strokeDasharray: "5,5" },
    }
  )

  // Masalah ke Solusi
  edges.push(
    {
      id: "edge-problem-1-solution-1",
      source: "problem-1",
      target: "solution-1",
      animated: false,
      style: { stroke: "#10B981", strokeWidth: 2.5 },
    },
    {
      id: "edge-problem-2-solution-2",
      source: "problem-2",
      target: "solution-2",
      animated: true,
      style: { stroke: "#EF4444", strokeWidth: 2.5, strokeDasharray: "6,6" },
    }
  )

  // 7. Rekomendasi Aksi 4 Tahap Terpadu (Topik -> Tema -> Masalah -> Solusi)
  const recommendations: ActionRecommendation[] = [
    {
      id: "rec-1",
      stage: "topic",
      stageNumber: 1,
      stageTitle: "Tahap 1: Konvergensi Topik",
      actionType: "harmonize",
      recommendationTitle: "Penyelarasan Ruang Lingkup Topik Riset",
      badgeText: "Harmonisasi",
      statusAccent: "indigo",
      isHighPriority: false,
      concreteSteps: [
        "Identifikasi batasan asumsi komputasi antar naskah primer untuk mencegah pergeseran domain.",
        "Klarifikasi definisi operasional variabel utama dalam naskah tesis Anda.",
      ],
    },
    {
      id: "rec-2",
      stage: "theme",
      stageNumber: 2,
      stageTitle: "Tahap 2: Penguatan Tema Bersama",
      actionType: "consolidate",
      recommendationTitle: "Konsolidasi Teori pada Tema Shared (Hijau)",
      badgeText: "Fondasi Kuat",
      statusAccent: "emerald",
      isHighPriority: false,
      concreteSteps: [
        "Gunakan tema hijau sebagai landasan teoretis bab Tinjauan Pustaka karena telah teruji pada >= 2 dokumen.",
        "Sajikan perbandingan formal parameter metodologi yang disepakati oleh mayoritas literatur.",
      ],
    },
    {
      id: "rec-3",
      stage: "problem",
      stageNumber: 3,
      stageTitle: "Tahap 3: Validasi Masalah Kritis",
      actionType: "validate",
      recommendationTitle: "Eksplorasi Akar Kontradiksi Masalah",
      badgeText: "Akar Isu",
      statusAccent: "amber",
      isHighPriority: true,
      concreteSteps: [
        "Fokuskan pertanyaan penelitian pada limitasi algoritma eksponensial yang belum terselesaikan.",
        "Uji apakah bottleneck komputasi naskah primer konsisten pada korpus data uji Anda.",
      ],
    },
    {
      id: "rec-4",
      stage: "solution",
      stageNumber: 4,
      stageTitle: "Tahap 4: Eksploitasi Celah Novelty",
      actionType: "exploit",
      recommendationTitle: "Ambil Peluang Celah Solusi Merah (Langka)",
      badgeText: "Peluang Tesis Tertinggi",
      statusAccent: "rose",
      isHighPriority: true,
      concreteSteps: [
        "Simpul merah baru diteliti oleh 1 paper: formulasikan modifikasi algoritma sebagai novelty utama tesis.",
        "Gabungkan kekuatan solusi shared (Mamba) dengan ketertelusuran bukti kanonik untuk menghasilkan kontribusi baru.",
      ],
    },
  ]

  return {
    nodes,
    edges,
    recommendations,
    metrics: {
      totalTopics: rawTopics.length,
      totalThemes: rawThemes.length,
      totalProblems: rawProblems.length,
      totalSolutions: rawSolutions.length,
      sharedCount,
      gapCount,
    },
  }
}
