import { useState, useRef, useMemo } from "react"
import { useParams, useSearchParams, Link } from "react-router-dom"
import {
  TableProperties,
  ArrowLeft,
  Download,
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  X,
  ExternalLink,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useComparativeMatrix,
  useProjects,
  MatrixParameter,
  MatrixPaper,
  MatrixCell,
  EvidenceItem,
} from "../api/projectsApi"
import { PdfViewer } from "../paper-analysis/PdfViewer"

interface ActiveEvidenceModal {
  paperTitle: string
  paperId: string
  parameterLabel: string
  cell: MatrixCell
  evidence: EvidenceItem
}

export default function ProjectMatrixDetailScreen() {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Project ID resolution: route param > query param > first available project
  const { data: projectList = [] } = useProjects()
  const activeProjectId =
    routeProjectId ||
    searchParams.get("projectId") ||
    (projectList.length > 0 ? projectList[0].id : "")

  const {
    data: matrixData,
    isLoading,
    isError,
    refetch,
  } = useComparativeMatrix(activeProjectId || undefined)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<ActiveEvidenceModal | null>(null)

  // Scroll Synchronization Ref
  const tableContainerRef = useRef<HTMLDivElement | null>(null)

  const handleScrollLeft = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: -350, behavior: "smooth" })
    }
  }

  const handleScrollRight = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: 350, behavior: "smooth" })
    }
  }

  // Filtered parameters based on search and category group
  const filteredParameters = useMemo(() => {
    if (!matrixData?.parameters) return []
    return matrixData.parameters.filter((p: MatrixParameter) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        (p.label.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.label.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.group_name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchGroup = selectedGroup === "all" || p.group_name === selectedGroup
      return matchSearch && matchGroup
    })
  }, [matrixData?.parameters, searchQuery, selectedGroup])

  // Extract unique parameter groups
  const parameterGroups = useMemo(() => {
    if (!matrixData?.parameters) return []
    const set = new Set<string>()
    matrixData.parameters.forEach((p) => {
      if (p.group_name) set.add(p.group_name)
    })
    return Array.from(set)
  }, [matrixData?.parameters])

  // Export Matrix to CSV
  const handleExportCSV = () => {
    if (!matrixData || !matrixData.papers.length) return

    const papers = matrixData.papers
    const params = matrixData.parameters

    // Header row: Parameter, Paper 1, Paper 2, ...
    const header = [
      "Parameter",
      "Kategori",
      ...papers.map((p) => `"${p.title.replace(/"/g, '""')}"`),
    ].join(",")

    // Data rows
    const rows = params.map((param) => {
      const rowCells = papers.map((paper) => {
        const cell = matrixData.matrix[param.key]?.[paper.id]
        if (!cell) return '""'
        const textVal = cell.value?.text || (cell.state === "not_found" ? "Tidak Ditemukan" : "-")
        return `"${textVal.replace(/"/g, '""')}"`
      })
      const label = param.label.id || param.label.en || param.key
      return [`"${label.replace(/"/g, '""')}"`, `"${param.group_name}"`, ...rowCells].join(",")
    })

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [header, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `Matriks_Komparasi_${matrixData.project_name.replace(/\s+/g, "_")}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:h-14 sm:items-center justify-between border-b bg-card px-4 py-2.5 sm:py-0 shrink-0 gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          {routeProjectId && (
            <Button asChild variant="ghost" size="icon" className="size-8" title="Kembali ke Ruang Kerja Proyek">
              <Link to={`/projects/${routeProjectId}`}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <TableProperties className="size-4 text-primary" />
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                Matriks Komparasi 11 Parameter Ilmiah
              </h1>
              {matrixData && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {matrixData.papers.length} Paper Dianalisis
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Tabel perbandingan berdampingan dengan sinkronisasi gulir horizontal (Synchronized Scrolling).
            </p>
          </div>
        </div>

        {/* Action Controls & Project Switcher */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Project Switcher if multiple projects */}
          {projectList.length > 1 && (
            <select
              value={activeProjectId}
              onChange={(e) => {
                const newId = e.target.value
                setSearchParams({ projectId: newId })
              }}
              className="h-8 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.paper_count} Paper)
                </option>
              ))}
            </select>
          )}

          {/* Synchronized Scroll Buttons */}
          <div className="flex items-center rounded-md border bg-background p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleScrollLeft}
              className="size-7"
              title="Gulir Matriks ke Kiri"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-[10px] font-mono text-muted-foreground px-1">Gulir</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleScrollRight}
              className="size-7"
              title="Gulir Matriks ke Kanan"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={!matrixData?.papers.length}
            className="h-8 gap-1.5 text-xs shadow-xs"
          >
            <Download className="size-3.5" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b bg-card/60 px-4 py-2 gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="size-3.5 text-muted-foreground shrink-0 ml-1 mr-1" />
          <button
            onClick={() => setSelectedGroup("all")}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
              selectedGroup === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua ({matrixData?.parameters.length || 11})
          </button>
          {parameterGroups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                selectedGroup === grp
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari parameter atau konsep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Main Synchronized Table Container */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex h-full items-center justify-center space-y-2 flex-col">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
              <TableProperties className="size-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Menyusun matriks komparasi 11 parameter ilmiah...
            </span>
          </div>
        ) : isError || !matrixData ? (
          <div className="flex h-full items-center justify-center space-y-3 flex-col text-center p-6">
            <AlertTriangle className="size-8 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Gagal Memuat Matriks Komparasi</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Pastikan proyek memiliki paper yang telah diunggah dan dianalisis.
            </p>
            <Button size="sm" onClick={() => refetch()} className="text-xs">
              Muat Ulang
            </Button>
          </div>
        ) : matrixData.papers.length === 0 ? (
          <div className="flex h-full items-center justify-center space-y-3 flex-col text-center p-6">
            <Layers className="size-10 text-muted-foreground/60" />
            <h3 className="text-sm font-semibold text-foreground">Belum Ada Paper yang Dianalisis</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Unggah dan proses dokumen PDF Anda untuk membandingkan 11 parameter ilmiah dalam matriks ini.
            </p>
            {activeProjectId && (
              <Button asChild size="sm" className="text-xs">
                <Link to={`/projects/${activeProjectId}`}>Unggah Paper Sekarang</Link>
              </Button>
            )}
          </div>
        ) : (
          <div
            ref={tableContainerRef}
            className="h-full w-full overflow-x-auto overflow-y-auto scroll-smooth"
          >
            <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
              {/* Sticky Table Header */}
              <thead>
                <tr className="bg-card">
                  {/* Fixed Column 1: Parameter Info */}
                  <th className="sticky left-0 top-0 z-30 w-72 min-w-[280px] border-b border-r bg-card p-4 font-bold text-foreground shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-primary" />
                        <span>Parameter Analisis</span>
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {filteredParameters.length} dari 11
                      </span>
                    </div>
                  </th>

                  {/* Columns 2..N: Papers in Project (Synchronously Scrolled) */}
                  {matrixData.papers.map((paper: MatrixPaper) => (
                    <th
                      key={paper.id}
                      className="sticky top-0 z-20 w-80 min-w-[320px] max-w-sm border-b border-r bg-card p-4 font-semibold text-foreground shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              paper.status === "ready"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : paper.status === "needs_review"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            <span className="capitalize">{paper.status.replace("_", " ")}</span>
                          </span>

                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <FileText className="size-3" />
                            <span>{paper.total_pages} Hal</span>
                          </span>
                        </div>

                        <h4
                          className="font-bold text-xs text-foreground line-clamp-2 leading-tight"
                          title={paper.title}
                        >
                          {paper.title}
                        </h4>

                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {paper.authors && paper.authors.length > 0
                            ? paper.authors.join(", ")
                            : "Penulis tidak terdata"}{" "}
                          {paper.year ? `(${paper.year})` : ""}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body: 11 Parameters x Papers */}
              <tbody className="divide-y text-foreground bg-background">
                {filteredParameters.map((param: MatrixParameter) => {
                  const paramLabel = param.label.id || param.label.en || param.key

                  return (
                    <tr
                      key={param.key}
                      className="hover:bg-muted/15 transition-colors group"
                    >
                      {/* Sticky Left Column Cell: Parameter Identity & Tooltip */}
                      <td className="sticky left-0 z-10 w-72 min-w-[280px] border-b border-r bg-card p-4 font-medium shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                              #{param.sort_order}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary">
                              {param.group_name}
                            </span>
                          </div>

                          <h5 className="font-bold text-xs text-foreground leading-snug">
                            {paramLabel}
                          </h5>

                          {param.label.en && param.label.en !== paramLabel && (
                            <p className="text-[10px] text-muted-foreground italic">
                              {param.label.en}
                            </p>
                          )}

                          {param.instruction && (
                            <p
                              className="text-[10px] text-muted-foreground/80 line-clamp-2 leading-relaxed pt-0.5"
                              title={param.instruction}
                            >
                              {param.instruction}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Paper Data Cells (Synchronously Scrolled across rows) */}
                      {matrixData.papers.map((paper: MatrixPaper) => {
                        const cell: MatrixCell | undefined =
                          matrixData.matrix[param.key]?.[paper.id]

                        if (!cell) {
                          return (
                            <td
                              key={paper.id}
                              className="w-80 min-w-[320px] max-w-sm border-b border-r p-4 text-muted-foreground italic text-[11px] bg-muted/5 align-top"
                            >
                              <div className="flex items-center gap-1.5 text-muted-foreground/60 py-4">
                                <Clock className="size-3.5" />
                                <span>Menunggu ekstraksi...</span>
                              </div>
                            </td>
                          )
                        }

                        const textValue = cell.value?.text || ""
                        const confidencePct = Math.round(cell.confidence_score * 100)
                        const primaryEvidence =
                          cell.evidence && cell.evidence.length > 0 ? cell.evidence[0] : null

                        return (
                          <td
                            key={paper.id}
                            className="w-80 min-w-[320px] max-w-sm border-b border-r p-4 text-xs align-top space-y-2.5 hover:bg-primary/5 transition-colors"
                          >
                            {/* Cell Badges: State & Confidence & Review Status */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  cell.state === "found"
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : cell.state === "not_found"
                                    ? "bg-muted text-muted-foreground border"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                {cell.state === "found" ? (
                                  <>
                                    <CheckCircle2 className="size-3" />
                                    <span>Ditemukan</span>
                                  </>
                                ) : (
                                  <span>{cell.state}</span>
                                )}
                              </span>

                              <div className="flex items-center gap-1">
                                {cell.confidence_score > 0 && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      confidencePct >= 85
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : confidencePct >= 70
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        : "bg-destructive/10 text-destructive"
                                    }`}
                                    title={`Skor Keyakinan Model: ${confidencePct}%`}
                                  >
                                    {confidencePct}%
                                  </span>
                                )}

                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                                    cell.status === "accepted"
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                      : cell.status === "edited"
                                      ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  }`}
                                >
                                  {cell.status.replace("_", " ")}
                                </span>
                              </div>
                            </div>

                            {/* Extracted Text Value */}
                            <div className="text-foreground leading-relaxed font-normal text-xs whitespace-pre-wrap">
                              {textValue ? (
                                <p className="line-clamp-4 hover:line-clamp-none transition-all">
                                  {textValue}
                                </p>
                              ) : (
                                <p className="text-muted-foreground italic text-[11px]">
                                  {cell.state === "not_found"
                                    ? "Informasi tidak ditemukan dalam dokumen paper ini."
                                    : "Nilai belum terisi."}
                                </p>
                              )}
                            </div>

                            {/* Evidence Quote Link Badge */}
                            {primaryEvidence && (
                              <button
                                onClick={() =>
                                  setActiveEvidenceModal({
                                    paperTitle: paper.title,
                                    paperId: paper.id,
                                    parameterLabel: paramLabel,
                                    cell: cell,
                                    evidence: primaryEvidence,
                                  })
                                }
                                className="w-full text-left p-2 rounded-lg bg-muted/40 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all text-[11px] group/ev cursor-pointer flex flex-col gap-1"
                                title="Klik untuk membuka dokumen PDF dan menyorot bukti kanonik"
                              >
                                <div className="flex items-center justify-between text-[10px] font-bold text-primary">
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="size-3" />
                                    <span>Bukti: Hal. {primaryEvidence.page_index}</span>
                                  </span>
                                  <ExternalLink className="size-2.5 text-muted-foreground group-hover/ev:text-primary transition-colors" />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic line-clamp-2">
                                  &ldquo;{primaryEvidence.quote}&rdquo;
                                </p>
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Evidence PDF Modal */}
      {activeEvidenceModal && activeProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex h-13 items-center justify-between border-b px-5 bg-secondary/30 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <Sparkles className="size-4 text-primary shrink-0" />
                <div className="overflow-hidden">
                  <h3 className="text-xs font-bold text-foreground truncate">
                    Bukti Kanonik: {activeEvidenceModal.parameterLabel}
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {activeEvidenceModal.paperTitle} • Halaman{" "}
                    {activeEvidenceModal.evidence.page_index}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveEvidenceModal(null)}
                className="size-8"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Evidence Quote Header Callout */}
            <div className="bg-primary/5 border-b border-primary/20 p-3 px-5 flex items-start gap-3 shrink-0">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-primary">
                  Kutipan Teks yang Disorot di Kanvas PDF:
                </span>
                <p className="text-xs text-foreground italic leading-relaxed">
                  &ldquo;{activeEvidenceModal.evidence.quote}&rdquo;
                </p>
              </div>
            </div>

            {/* Embedded Native PdfViewer Component */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <PdfViewer
                projectId={activeProjectId}
                paperId={activeEvidenceModal.paperId}
                targetPage={activeEvidenceModal.evidence.page_index}
                activeEvidence={activeEvidenceModal.evidence}
                blocks={
                  activeEvidenceModal.evidence.bbox
                    ? [
                        {
                          block_id:
                            activeEvidenceModal.evidence.block_id || "canonical-block",
                          page_number: activeEvidenceModal.evidence.page_index,
                          bbox: activeEvidenceModal.evidence.bbox,
                          text: activeEvidenceModal.evidence.quote,
                        },
                      ]
                    : []
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
