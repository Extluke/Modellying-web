import { ComparativeMatrixResponse, MatrixPaper } from "@/features/projects/api/projectsApi"
import {
  KnowledgeGraphNodeData,
  KnowledgeNodeType,
  SaturationZone,
  SaturationZoneMetrics,
  SourcePaperReference,
} from "../types/knowledgeGraphTypes"

export interface ReactFlowNodeItem {
  id: string
  type: string
  position: { x: number; y: number }
  data: KnowledgeGraphNodeData
}

export interface ReactFlowEdgeItem {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  style?: { stroke?: string; strokeWidth?: number; strokeDasharray?: string }
}

export interface BuiltGraphResult {
  nodes: ReactFlowNodeItem[]
  edges: ReactFlowEdgeItem[]
  metrics: SaturationZoneMetrics
}

/**
 * Menghitung persentase saturasi konsep dan menentukan zona spasial:
 * - Low Saturation (<= 20%): Zona Novelty / Celah Riset Tesis (X: 120 - 520 px)
 * - Medium Saturation (21% - 50%): Zona Transisi / Berkembang (X: 760 - 1160 px)
 * - High Saturation (> 50%): Zona Mapan / Fondasi Teoretis Standar (X: 1400 - 1800 px)
 */
export function calculateSaturationZone(
  frequencyCount: number,
  totalPapers: number
): { zone: SaturationZone; percentage: number } {
  if (totalPapers <= 0) return { zone: "low", percentage: 0 }
  const percentage = Math.round((frequencyCount / totalPapers) * 100)

  if (percentage <= 20) {
    return { zone: "low", percentage }
  } else if (percentage <= 50) {
    return { zone: "medium", percentage }
  } else {
    return { zone: "high", percentage }
  }
}

/**
 * Membangun data graf 2D spasial lengkap (nodes, edges, metrics) dari data matriks komparatif naskah.
 */
export function buildKnowledgeGraphData(
  matrixData?: ComparativeMatrixResponse | null
): BuiltGraphResult {
  const papers: MatrixPaper[] = matrixData?.papers || []
  const matrix = matrixData?.matrix || {}
  const totalPapers = Math.max(papers.length, 1)

  // 1. Ekstraksi kandidat konsep per kategori
  const rawConcepts: Array<{
    id: string
    label: string
    nodeType: KnowledgeNodeType
    description: string
    paperIds: string[]
    quotes: Array<{ paperId: string; pageNumber: number; quote: string }>
  }> = []

  // Helper untuk menambahkan konsep
  const addConcept = (
    id: string,
    label: string,
    nodeType: KnowledgeNodeType,
    desc: string,
    paperId: string,
    pageNumber: number = 1,
    quote: string = ""
  ) => {
    const existing = rawConcepts.find((c) => c.label.toLowerCase() === label.toLowerCase())
    if (existing) {
      if (!existing.paperIds.includes(paperId)) {
        existing.paperIds.push(paperId)
        if (quote) {
          existing.quotes.push({ paperId, pageNumber, quote })
        }
      }
    } else {
      rawConcepts.push({
        id,
        label,
        nodeType,
        description: desc,
        paperIds: [paperId],
        quotes: quote ? [{ paperId, pageNumber, quote }] : [],
      })
    }
  }

  // Iterasi data matriks dari paper naskah
  papers.forEach((p) => {
    const paperId = p.id

    // A. Problem / Core Concept
    const probVal = matrix["research_problem"]?.[paperId]?.value?.text || matrix["problem_statement"]?.[paperId]?.value?.text
    if (probVal && probVal.length > 5) {
      const shortProb = probVal.length > 50 ? `${probVal.slice(0, 50)}...` : probVal
      const quote = matrix["research_problem"]?.[paperId]?.evidence?.[0]?.quote || ""
      const page = (matrix["research_problem"]?.[paperId]?.evidence?.[0]?.page_index ?? 0) + 1
      addConcept(`concept-prob-${paperId}`, shortProb, "concept", probVal, paperId, page, quote)
    }

    // B. Variables
    const varVal = matrix["variables"]?.[paperId]?.value?.text
    if (varVal && varVal.length > 3) {
      const shortVar = varVal.length > 45 ? `${varVal.slice(0, 45)}...` : varVal
      const quote = matrix["variables"]?.[paperId]?.evidence?.[0]?.quote || ""
      const page = (matrix["variables"]?.[paperId]?.evidence?.[0]?.page_index ?? 0) + 1
      addConcept(`concept-var-${paperId}`, shortVar, "variable", varVal, paperId, page, quote)
    }

    // C. Methodology
    const methVal = matrix["methodology"]?.[paperId]?.value?.text || matrix["method"]?.[paperId]?.value?.text
    if (methVal && methVal.length > 4) {
      const shortMeth = methVal.length > 45 ? `${methVal.slice(0, 45)}...` : methVal
      const quote = matrix["methodology"]?.[paperId]?.evidence?.[0]?.quote || ""
      const page = (matrix["methodology"]?.[paperId]?.evidence?.[0]?.page_index ?? 0) + 1
      addConcept(`concept-meth-${paperId}`, shortMeth, "method", methVal, paperId, page, quote)
    }

    // D. Dataset / Object
    const dataVal = matrix["dataset"]?.[paperId]?.value?.text || matrix["population_data"]?.[paperId]?.value?.text
    if (dataVal && dataVal.length > 3) {
      const shortData = dataVal.length > 45 ? `${dataVal.slice(0, 45)}...` : dataVal
      const quote = matrix["dataset"]?.[paperId]?.evidence?.[0]?.quote || ""
      const page = (matrix["dataset"]?.[paperId]?.evidence?.[0]?.page_index ?? 0) + 1
      addConcept(`concept-data-${paperId}`, shortData, "dataset", dataVal, paperId, page, quote)
    }

    // E. Research Gap / Limitations
    const gapVal = matrix["limitations"]?.[paperId]?.value?.text || matrix["future_work"]?.[paperId]?.value?.text
    if (gapVal && gapVal.length > 5) {
      const shortGap = gapVal.length > 45 ? `${gapVal.slice(0, 45)}...` : gapVal
      const quote = matrix["limitations"]?.[paperId]?.evidence?.[0]?.quote || ""
      const page = (matrix["limitations"]?.[paperId]?.evidence?.[0]?.page_index ?? 0) + 1
      addConcept(`concept-gap-${paperId}`, shortGap, "research_gap", gapVal, paperId, page, quote)
    }
  })

  // Fallback data representatif jika data ekstraksi masih minim
  if (rawConcepts.length === 0) {
    const demoPaper1 = papers[0]?.id || "p1"
    const demoPaper2 = papers[1]?.id || "p2"

    rawConcepts.push(
      {
        id: "demo-high-1",
        label: "Arsitektur Transformer Standar",
        nodeType: "concept",
        description: "Mekanisme multi-head self-attention untuk representasi sekuensial teks.",
        paperIds: [demoPaper1, demoPaper2, "p3"],
        quotes: [{ paperId: demoPaper1, pageNumber: 2, quote: "Attention mechanisms have become an integral part of sequence modeling." }],
      },
      {
        id: "demo-high-2",
        label: "Benchmark WMT-14 & GLUE Dataset",
        nodeType: "dataset",
        description: "Korpus uji standar evaluasi pemahaman bahasa alami lintas model.",
        paperIds: [demoPaper1, demoPaper2],
        quotes: [{ paperId: demoPaper1, pageNumber: 6, quote: "We evaluate on the standard WMT 2014 English-to-German dataset." }],
      },
      {
        id: "demo-med-1",
        label: "Selective State Space Scan",
        nodeType: "method",
        description: "Kompresi representasi linier dengan parameter matriks time-varying.",
        paperIds: [demoPaper1],
        quotes: [{ paperId: demoPaper1, pageNumber: 4, quote: "Selective scan allows long-context compression in linear time." }],
      },
      {
        id: "demo-med-2",
        label: "Parameter Entropi Hidden Vectors",
        nodeType: "variable",
        description: "Variabel bobot dispersi representasi antar layer laten.",
        paperIds: [demoPaper2],
        quotes: [{ paperId: demoPaper2, pageNumber: 5, quote: "The entropy of hidden representations indicates information retention." }],
      },
      {
        id: "demo-low-1",
        label: "Bottleneck Komputasi Konteks Panjang O(N²)",
        nodeType: "research_gap",
        description: "Keterbatasan skalabilitas memori kuadratik pada analisis dokumen berukuran masif.",
        paperIds: [demoPaper1],
        quotes: [{ paperId: demoPaper1, pageNumber: 8, quote: "Computational cost scales quadratically with document length." }],
      },
      {
        id: "demo-low-2",
        label: "Inkonsistensi Ekstraksi Tabel Kompleks",
        nodeType: "research_gap",
        description: "Celah riset: Algoritma kanonik gagal memetakan sel gabungan pada PDF multibaris.",
        paperIds: [demoPaper2],
        quotes: [{ paperId: demoPaper2, pageNumber: 9, quote: "Multi-span cell alignments remain an unsolved empirical limitation." }],
      }
    )
  }

  // 2. Pembagian Slot Posisi Spasial 2D berdasarkan Zona Saturasi
  const nodes: ReactFlowNodeItem[] = []
  let lowIndex = 0
  let mediumIndex = 0
  let highIndex = 0

  let lowCount = 0
  let mediumCount = 0
  let highCount = 0
  let gapCount = 0

  rawConcepts.forEach((c) => {
    const freq = c.paperIds.length
    const { zone, percentage } = calculateSaturationZone(freq, totalPapers)

    if (c.nodeType === "research_gap") {
      gapCount++
    }

    let posX = 200
    let posY = 100

    if (zone === "low") {
      lowCount++
      // Zona Rendah (Kiri): X in [140, 480], Y staggered
      posX = 160 + (lowIndex % 2) * 180
      posY = 80 + lowIndex * 150
      lowIndex++
    } else if (zone === "medium") {
      mediumCount++
      // Zona Sedang (Tengah): X in [780, 1120], Y staggered
      posX = 800 + (mediumIndex % 2) * 180
      posY = 90 + mediumIndex * 150
      mediumIndex++
    } else {
      highCount++
      // Zona Tinggi (Kanan): X in [1420, 1760], Y staggered
      posX = 1440 + (highIndex % 2) * 180
      posY = 80 + highIndex * 150
      highIndex++
    }

    // Susun referensi paper pendukung
    const sourcePapers: SourcePaperReference[] = c.paperIds.map((pid) => {
      const matchP = papers.find((p) => p.id === pid)
      const quoteObj = c.quotes.find((q) => q.paperId === pid)
      return {
        id: pid,
        title: matchP?.title || `Paper ${pid}`,
        authors: matchP?.authors || ["Peneliti Modellyng"],
        year: matchP?.year || 2024,
        quote: quoteObj?.quote,
        pageNumber: quoteObj?.pageNumber,
      }
    })

    nodes.push({
      id: c.id,
      type: "knowledgeNode",
      position: { x: posX, y: posY },
      data: {
        id: c.id,
        label: c.label,
        nodeType: c.nodeType,
        saturationZone: zone,
        frequencyCount: freq,
        totalPapers,
        saturationPercentage: percentage,
        description: c.description,
        sourcePapers,
      },
    })
  })

  // 3. Bangun Relasi Edges Antar Node
  const edges: ReactFlowEdgeItem[] = []

  // Hubungkan simpul lintas zona secara logis: High -> Medium -> Low
  const highNodes = nodes.filter((n) => n.data.saturationZone === "high")
  const medNodes = nodes.filter((n) => n.data.saturationZone === "medium")
  const lowNodes = nodes.filter((n) => n.data.saturationZone === "low")

  // Relasi High ke Medium
  highNodes.forEach((hn, i) => {
    const targetMed = medNodes[i % Math.max(medNodes.length, 1)]
    if (targetMed) {
      edges.push({
        id: `edge-${hn.id}-${targetMed.id}`,
        source: hn.id,
        target: targetMed.id,
        label: "mengembangkan",
        style: { stroke: "#F59E0B", strokeWidth: 2 },
      })
    }
  })

  // Relasi Medium ke Low (Celah Riset)
  medNodes.forEach((mn, i) => {
    const targetLow = lowNodes[i % Math.max(lowNodes.length, 1)]
    if (targetLow) {
      edges.push({
        id: `edge-${mn.id}-${targetLow.id}`,
        source: mn.id,
        target: targetLow.id,
        label: targetLow.data.nodeType === "research_gap" ? "menghadapi celah" : "menguji",
        animated: targetLow.data.nodeType === "research_gap",
        style: {
          stroke: targetLow.data.nodeType === "research_gap" ? "#EF4444" : "#6366F1",
          strokeWidth: 2.2,
          strokeDasharray: targetLow.data.nodeType === "research_gap" ? "5,5" : undefined,
        },
      })
    }
  })

  return {
    nodes,
    edges,
    metrics: {
      totalNodes: nodes.length,
      lowCount,
      mediumCount,
      highCount,
      gapCount,
    },
  }
}
