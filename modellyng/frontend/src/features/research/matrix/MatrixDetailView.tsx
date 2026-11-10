import { lazy, Suspense, useMemo, useState } from "react"
import { Link, generatePath, useParams } from "react-router-dom"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Link2,
  RotateCw,
  Table2,
  TableProperties,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ROUTES } from "@/app/routes"
import { useComparativeMatrix, type MatrixParameter } from "@/features/projects/api/projectsApi"
import { ContentMatrixTable } from "./components/ContentMatrixTable"
import type { CellDetailRequest, EvidenceRequest } from "./components/ContentMatrixTable"
import { ExpandableCellModal } from "./components/ExpandableCellModal"
import { FilterTabs, type FilterTabOption } from "./components/FilterTabs"
import { IntelligenceReportCard } from "./components/IntelligenceReportCard"
import { MIN_SELECTED_PAPERS, PaperFilterPopover } from "./components/PaperFilterPopover"
import { ProjectSynthesisCard } from "./components/ProjectSynthesisCard"
import { SearchField } from "./components/SearchField"
import { WritingStructureTable } from "./components/WritingStructureTable"
import { useSyncedHorizontalScroll } from "./hooks/useSyncedHorizontalScroll"
import { downloadMatrixCsv } from "./utils/exportMatrixCsv"
import { formatGroupName } from "./utils/matrixFormatters"
import { generateProjectSynthesis } from "./utils/synthesisEngine"

// The PDF viewer pulls in pdfjs-dist, so it is only loaded when an evidence quote is opened.
const EvidencePdfModal = lazy(() => import("./components/EvidencePdfModal"))

type ViewMode = "compact" | "full"

const VIEW_MODE_OPTIONS: FilterTabOption<ViewMode>[] = [
  { id: "compact", label: "Ringkas" },
  { id: "full", label: "Lengkap" },
]

/** Horizontal distance (px) scrolled by the left/right buttons, roughly one paper column. */
const SCROLL_STEP_PX = 320

export default function MatrixDetailView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: matrixData, isLoading, isError, refetch } = useComparativeMatrix(projectId)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("compact")

  // `null` means "all papers"; set once the user narrows the selection
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[] | null>(null)

  const [cellDetail, setCellDetail] = useState<CellDetailRequest | null>(null)
  const [evidenceRequest, setEvidenceRequest] = useState<EvidenceRequest | null>(null)

  const { getScrollProps, scrollBy } = useSyncedHorizontalScroll(2)
  const contentScroll = useMemo(() => getScrollProps(0), [getScrollProps])
  const structureScroll = useMemo(() => getScrollProps(1), [getScrollProps])

  const papers = useMemo(() => matrixData?.papers ?? [], [matrixData])
  const parameters = useMemo(() => matrixData?.parameters ?? [], [matrixData])

  const activePapers = useMemo(
    () => (selectedPaperIds ? papers.filter((paper) => selectedPaperIds.includes(paper.id)) : papers),
    [papers, selectedPaperIds]
  )

  const handleTogglePaper = (paperId: string) => {
    const current = activePapers.map((paper) => paper.id)
    if (current.includes(paperId)) {
      if (current.length <= MIN_SELECTED_PAPERS) return
      setSelectedPaperIds(current.filter((id) => id !== paperId))
    } else {
      setSelectedPaperIds([...current, paperId])
    }
  }

  const groupOptions = useMemo<FilterTabOption<string>[]>(() => {
    const counts = new Map<string, number>()
    parameters.forEach((parameter) => {
      counts.set(parameter.group_name, (counts.get(parameter.group_name) ?? 0) + 1)
    })
    return [
      { id: "all", label: "Semua", count: parameters.length },
      ...Array.from(counts, ([group, count]) => ({
        id: group,
        label: formatGroupName(group),
        count,
      })),
    ]
  }, [parameters])

  const filteredParameters = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    return parameters.filter((parameter: MatrixParameter) => {
      const matchesGroup = selectedGroup === "all" || parameter.group_name === selectedGroup
      if (!matchesGroup) return false
      if (!keyword) return true
      return [
        parameter.label.id,
        parameter.label.en,
        parameter.key,
        formatGroupName(parameter.group_name),
      ].some((value) => (value ?? "").toLowerCase().includes(keyword))
    })
  }, [parameters, searchQuery, selectedGroup])

  const projectSynthesis = useMemo(() => {
    if (!matrixData || matrixData.papers.length < 2) return null
    return generateProjectSynthesis(matrixData)
  }, [matrixData])

  const backLink = (
    <Link
      to={ROUTES.RESEARCH.MATRIX}
      className="group inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      <span>Kembali ke Matriks Komparasi</span>
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-muted-foreground">
            Menyusun matriks komparasi...
          </span>
        </div>
      </div>
    )
  }

  if (isError || !matrixData || !projectId) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6 md:p-8">
        {backLink}
        <Card className="flex flex-col items-center gap-3 border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <h1 className="text-base font-semibold text-foreground">Gagal Memuat Matriks Komparasi</h1>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Proyek tidak ditemukan atau data matriks belum dapat diambil. Periksa koneksi lalu coba lagi.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-1 gap-2">
            <RotateCw />
            <span>Coba Muat Ulang</span>
          </Button>
        </Card>
      </div>
    )
  }

  if (papers.length < MIN_SELECTED_PAPERS) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6 md:p-8">
        {backLink}
        <div className="flex flex-col items-center gap-4 rounded-card border-2 border-dashed border-border/80 bg-card/50 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-card bg-status-orange-soft text-status-orange">
            <AlertTriangle className="size-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h1 className="text-base font-semibold text-foreground">
              Paper Siap Belum Mencukupi
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Matriks membutuhkan minimal {MIN_SELECTED_PAPERS} paper berstatus Siap. Saat ini baru
              terdapat {papers.length} paper siap pada proyek {matrixData.project_name}.
            </p>
          </div>
          <Button asChild className="mt-2 gap-2">
            <Link to={generatePath(ROUTES.PROJECTS.OVERVIEW, { projectId })}>
              <span>Kelola Paper Proyek</span>
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 p-6 md:p-8">
      <div className="flex items-center justify-between">{backLink}</div>

      {/* Hero header */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-card bg-primary-soft text-primary">
                <TableProperties className="size-5" />
              </div>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground">
                {matrixData.project_name}
              </h1>
            </div>
            <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Matriks Komparasi &amp; Sintesis. Bandingkan konten dan susunan bab antar paper dalam
              proyek ini.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="paper">
                {activePapers.length} dari {papers.length} Paper Ditampilkan
              </Badge>
              <Badge variant="primary">{parameters.length} Parameter</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <PaperFilterPopover
              papers={papers}
              selectedPaperIds={activePapers.map((paper) => paper.id)}
              onTogglePaper={handleTogglePaper}
              onSelectAll={() => setSelectedPaperIds(null)}
            />
            <Button
              variant="outline"
              onClick={() => downloadMatrixCsv(matrixData, activePapers)}
              className="h-10 gap-2 px-4 text-xs font-medium"
              title="Unduh matriks yang sedang ditampilkan dalam format CSV"
            >
              <Download className="text-primary" />
              <span>Unduh CSV</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* A. Konten Penelitian */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col pb-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">A. Konten Penelitian</h2>
            <p className="text-xs text-muted-foreground">
              Geser tabel ke samping untuk melihat seluruh paper. Kolom parameter tetap terlihat.
            </p>
          </div>
          <div className="flex items-center gap-1 self-start pb-1 sm:self-auto">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollBy(-SCROLL_STEP_PX)}
              title="Gulir tabel ke kiri"
              aria-label="Gulir tabel ke kiri"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollBy(SCROLL_STEP_PX)}
              title="Gulir tabel ke kanan"
              aria-label="Gulir tabel ke kanan"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          <SearchField
            className="flex-1"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari parameter atau konsep..."
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterTabs
              options={groupOptions}
              value={selectedGroup}
              onChange={setSelectedGroup}
            />
            <FilterTabs options={VIEW_MODE_OPTIONS} value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {filteredParameters.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-border/80 bg-card/50 p-12 text-center">
            <Table2 className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Parameter Tidak Ditemukan</h3>
              <p className="text-xs text-muted-foreground">
                Tidak ada parameter yang cocok dengan pencarian atau kategori yang dipilih.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedGroup("all")
              }}
            >
              Reset Filter &amp; Pencarian
            </Button>
          </div>
        ) : (
          <ContentMatrixTable
            parameters={filteredParameters}
            papers={activePapers}
            matrix={matrixData.matrix}
            compact={viewMode === "compact"}
            scrollProps={contentScroll}
            onOpenCell={setCellDetail}
            onOpenEvidence={setEvidenceRequest}
          />
        )}
      </section>

      {/* Sintesis AI global */}
      {projectSynthesis && (
        <ProjectSynthesisCard
          synthesis={projectSynthesis}
          projectName={matrixData.project_name}
        />
      )}

      {/* B. Struktur Penulisan */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col pb-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">B. Struktur Penulisan</h2>
            <p className="text-xs text-muted-foreground">
              Perbandingan keberadaan bab standar akademik pada setiap paper.
            </p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-status-green" />
              Ada
            </li>
            <li className="inline-flex items-center gap-1.5">
              <XCircle className="size-3.5 text-status-red" />
              Tidak Ada
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Link2 className="size-3.5 text-status-blue" />
              Digabung
            </li>
          </ul>
        </div>

        <WritingStructureTable
          papers={activePapers}
          matrix={matrixData.matrix}
          scrollProps={structureScroll}
        />
      </section>

      {/* Laporan intelijen & bibliografi */}
      <IntelligenceReportCard matrixData={matrixData} />

      {cellDetail && (
        <ExpandableCellModal
          isOpen
          onClose={() => setCellDetail(null)}
          parameterLabel={
            cellDetail.parameter.label.id || cellDetail.parameter.label.en || cellDetail.parameter.key
          }
          parameterGroup={formatGroupName(cellDetail.parameter.group_name)}
          paperTitle={cellDetail.paper.title}
          paperId={cellDetail.paper.id}
          cell={cellDetail.cell}
          onOpenPdfEvidence={(evidence) => setEvidenceRequest({ ...cellDetail, evidence })}
        />
      )}

      {evidenceRequest && (
        <Suspense fallback={null}>
          <EvidencePdfModal
            projectId={projectId}
            paperId={evidenceRequest.paper.id}
            paperTitle={evidenceRequest.paper.title}
            parameterLabel={
              evidenceRequest.parameter.label.id ||
              evidenceRequest.parameter.label.en ||
              evidenceRequest.parameter.key
            }
            evidence={evidenceRequest.evidence}
            onClose={() => setEvidenceRequest(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
