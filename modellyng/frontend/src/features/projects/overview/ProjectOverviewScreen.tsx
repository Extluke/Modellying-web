import { useState, useMemo } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Upload,
  FileText,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  Trash2,
  AlertCircle,
  FolderKanban,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Search,
  CheckCheck,
  ArrowUp,
  ArrowDown,
  Layers,
} from "lucide-react"
import {
  useProjectDetail,
  useDeletePaper,
  useProcessPaper,
  useConfirmPaper,
  useBulkAcceptReviews,
  Paper,
} from "../api/projectsApi"
import { UploadPdfModal } from "./UploadPdfModal"
import { ExportDropdownButton } from "./ExportDropdownButton"
import { ROUTES } from "@/app/routes"
import { toast } from "@/lib/store/useToastStore"

// Stage label mapping with professional Indonesian academic terminology
const STAGE_LABELS: Record<string, string> = {
  queued: "Menunggu antrean pemrosesan...",
  downloading: "Membaca file dokumen fisik...",
  extracting_text: "Mengekstrak teks dokumen kanonik...",
  quality_check: "Memeriksa kejernihan teks...",
  saving_blocks: "Menyimpan koordinat blok teks...",
  doc_type_check: "Memverifikasi struktur dokumen...",
  ai_extraction: "Menganalisis konten dokumen...",
  retrying_ai: "Mengulang analisis konten dokumen...",
  waiting_quota: "Menunggu alokasi antrean analisis...",
  verifying_evidence: "Memverifikasi bukti kutipan teks...",
  saving_ai_results: "Menyimpan hasil sintesis dokumen...",
  ai_extraction_complete: "Selesai, siap ditinjau",
}

type SortField = "time" | "title" | "pages"
type SortOrder = "asc" | "desc"

export default function ProjectOverviewScreen() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // Real data fetching with automatic TanStack Query smart polling
  const { data: project, isLoading, isError } = useProjectDetail(projectId)
  const deletePaperMutation = useDeletePaper(projectId || "")
  const processPaperMutation = useProcessPaper(projectId || "")
  const confirmPaperMutation = useConfirmPaper(projectId || "")
  const bulkAcceptMutation = useBulkAcceptReviews(projectId || "")

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [deletingPaper, setDeletingPaper] = useState<Paper | null>(null)

  // Search and Sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("time")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const handleDeletePaper = async () => {
    if (!deletingPaper) return
    const name = deletingPaper.title
    try {
      await deletePaperMutation.mutateAsync(deletingPaper.id)
      setDeletingPaper(null)
      toast.success(`Dokumen paper "${name}" berhasil dihapus.`)
    } catch {
      toast.error("Gagal menghapus dokumen paper.")
    }
  }

  const handleRetryProcessing = async (paperId: string) => {
    try {
      await processPaperMutation.mutateAsync({ paperId, force: true })
      toast.success("Proses analisis paper diulang kembali.")
    } catch {
      toast.error("Gagal memicu ulang proses analisis.")
    }
  }

  const handleConfirmAction = async (paperId: string, action: "proceed" | "discard") => {
    try {
      await confirmPaperMutation.mutateAsync({ paperId, action })
      if (action === "proceed") {
        toast.success("Dokumen dikonfirmasi. Melanjutkan analisis...")
      } else {
        toast.success("Dokumen non-akademik berhasil dibuang.")
      }
    } catch {
      toast.error("Gagal memproses konfirmasi dokumen.")
    }
  }

  const handleBulkAcceptAll = async () => {
    try {
      const res = await bulkAcceptMutation.mutateAsync()
      toast.success(res.message || "Seluruh tinjauan dokumen berhasil diterima.")
    } catch {
      toast.error("Gagal menerima seluruh tinjauan dokumen.")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoString))
    } catch {
      return "Baru saja"
    }
  }

  // Filter & Sort papers
  const papers = project?.papers || []
  const hasProcessingPapers = papers.some((p) =>
    ["validating", "processing"].includes(p.status)
  )

  const filteredAndSortedPapers = useMemo(() => {
    let result = [...papers]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.file_name.toLowerCase().includes(q)
      )
    }

    // Sorting
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === "time") {
        const timeA = new Date(a.uploaded_at).getTime()
        const timeB = new Date(b.uploaded_at).getTime()
        cmp = timeA - timeB
      } else if (sortField === "title") {
        cmp = a.title.localeCompare(b.title, "id-ID")
      } else if (sortField === "pages") {
        cmp = (a.total_pages || 0) - (b.total_pages || 0)
      }
      return sortOrder === "asc" ? cmp : -cmp
    })

    return result
  }, [papers, searchQuery, sortField, sortOrder])

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground font-medium">
            Menghubungkan ke Ruang Riset...
          </span>
        </div>
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link
          to={ROUTES.PROJECTS.ROOT}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali ke Daftar Proyek</span>
        </Link>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
          <AlertCircle className="size-10 text-destructive mx-auto" />
          <h2 className="text-base font-semibold text-foreground">Proyek Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Ruang riset ini mungkin telah dihapus atau Anda tidak memiliki izin akses.
          </p>
          <Button onClick={() => navigate(ROUTES.PROJECTS.ROOT)} size="sm">
            Kembali ke Hub Proyek
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation & Live Status */}
      <div className="flex items-center justify-between">
        <Link
          to={ROUTES.PROJECTS.ROOT}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Semua Proyek</span>
        </Link>

        {/* Polling Indicator */}
        {hasProcessingPapers && (
          <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full animate-pulse shadow-xs">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Sedang memproses analisis dokumen secara otomatis...</span>
          </div>
        )}
      </div>

      {/* Hero Workspace Header */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold shadow-xs">
                <FolderKanban className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
              {project.description ||
                "Ruang kerja riset akademik berbasis bukti kutipan kanonik dokumen PDF."}
            </p>
          </div>

          {/* Action Button Cluster */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Tombol Unduh Matriks Sintesis (PDF, CSV, XLSX) */}
            <ExportDropdownButton
              projectId={project.id}
              projectName={project.name}
              paperCount={project.papers?.length || 0}
            />

            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25 h-10 px-4 text-xs font-medium cursor-pointer"
            >
              <Upload className="size-4" />
              <span>Unggah Paper PDF</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${project.id}/chat`)}
              className="gap-2 text-xs h-10 px-4 border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer font-medium"
              title="Buka asisten Tanya AI berbasis dokumen proyek ini"
            >
              <MessageSquare className="size-4 text-primary" />
              <span>Tanya AI</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Papers Section */}
      <div className="space-y-4">
        {/* Section Header: strictly "Dokumen Paper Ilmiah" with "Terima Semua Tinjauan" at far right */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-border/60">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Dokumen Paper Ilmiah
          </h2>

          {papers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkAcceptAll}
              disabled={bulkAcceptMutation.isPending}
              className="gap-2 text-xs h-9 px-3.5 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium transition-colors cursor-pointer self-start sm:self-auto"
              title="Selesaikan dan setujui seluruh tinjauan dokumen secara serentak"
            >
              {bulkAcceptMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>Terima Semua Tinjauan</span>
            </Button>
          )}
        </div>

        {/* Search & Sorting Controls (When papers exist) */}
        {papers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dokumen paper..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/80 bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Sorting Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-muted-foreground font-medium">
                Urutkan:
              </span>

              <div className="inline-flex rounded-xl border border-border/80 bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setSortField("time")}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    sortField === "time"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Waktu
                </button>
                <button
                  type="button"
                  onClick={() => setSortField("title")}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    sortField === "title"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Abjad
                </button>
                <button
                  type="button"
                  onClick={() => setSortField("pages")}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    sortField === "pages"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Halaman
                </button>
              </div>

              {/* Order Toggle (Asc/Desc) */}
              <button
                type="button"
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className="flex items-center gap-1 h-9 px-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={sortOrder === "asc" ? "Urutan Menaik (A-Z / Lama ke Baru)" : "Urutan Menurun (Z-A / Baru ke Lama)"}
              >
                {sortOrder === "asc" ? (
                  <>
                    <ArrowUp className="size-3.5 text-primary" />
                    <span>Menaik</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="size-3.5 text-primary" />
                    <span>Menurun</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {papers.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border/80 bg-card/50 p-12 text-center space-y-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto shadow-inner">
              <FileText className="size-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Belum Ada Dokumen Paper
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mulai riset Anda dengan mengunggah file PDF artikel ilmiah. Dokumen akan dianalisis secara mendalam untuk ekstraksi 13 parameter ilmiah dan ketertelusuran bukti kutipan.
              </p>
            </div>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mt-2 cursor-pointer"
            >
              <Upload className="size-4" />
              <span>Unggah Paper Pertama Anda</span>
            </Button>
          </div>
        )}

        {/* Empty Search Filter State */}
        {papers.length > 0 && filteredAndSortedPapers.length === 0 && (
          <div className="rounded-2xl border border-border/70 bg-card/40 p-8 text-center space-y-2">
            <Search className="size-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-medium text-foreground">
              Tidak ada paper yang cocok dengan pencarian "{searchQuery}"
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-primary underline underline-offset-2 cursor-pointer"
            >
              Reset kata kunci pencarian
            </button>
          </div>
        )}

        {/* Redesigned Papers List */}
        {filteredAndSortedPapers.length > 0 && (
          <div className="space-y-3.5">
            {filteredAndSortedPapers.map((p) => {
              const isProcessing = ["validating", "processing"].includes(p.status)
              const isNeedsConfirmation = p.status === "needs_confirmation"
              const isFailed = p.status === "failed"
              const isReady = ["ready", "needs_review"].includes(p.status)

              let stageText = p.stage
                ? STAGE_LABELS[p.stage] || "Memproses analisis dokumen..."
                : "Menunggu giliran pemrosesan..."

              if (p.stage === "ai_extraction" && p.stage_detail?.current_batch) {
                stageText = `Menganalisis Batch ${p.stage_detail.current_batch}/${p.stage_detail.total_batches || 4}: ${p.stage_detail.batch_name || "Parameter Ilmiah"}...`
              }

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-5 shadow-xs transition-all space-y-4 bg-card hover:border-primary/30 ${
                    isNeedsConfirmation
                      ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/10"
                      : isFailed
                      ? "border-destructive/30 bg-destructive/5"
                      : isProcessing
                      ? "border-primary/40"
                      : "border-border/80"
                  }`}
                >
                  {/* Top Row: File icon, Genuine Title, Status Badge & Action */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs ${
                          isNeedsConfirmation
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : isFailed
                            ? "bg-destructive/10 text-destructive"
                            : isReady
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isProcessing ? (
                          <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        ) : isNeedsConfirmation ? (
                          <HelpCircle className="size-5" />
                        ) : isFailed ? (
                          <AlertCircle className="size-5" />
                        ) : (
                          <FileText className="size-5" />
                        )}
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground truncate max-w-xl leading-snug">
                            {p.title}
                          </h3>

                          {/* Status Badge */}
                          {isProcessing && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                              <span>Sedang Diproses</span>
                            </span>
                          )}

                          {isNeedsConfirmation && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="size-3" />
                              <span>Perlu Konfirmasi</span>
                            </span>
                          )}

                          {p.status === "needs_review" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                              <Sparkles className="size-3" />
                              <span>Perlu Ditinjau</span>
                            </span>
                          )}

                          {p.status === "ready" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              <span>Siap Analisis</span>
                            </span>
                          )}

                          {isFailed && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 text-[10px] font-semibold text-destructive">
                              <AlertCircle className="size-3" />
                              <span>Gagal</span>
                            </span>
                          )}
                        </div>

                        {/* File metadata row */}
                        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap">
                          <span className="font-mono">{p.file_name}</span>
                          <span>•</span>
                          <span>{formatFileSize(p.file_size_bytes)}</span>
                          <span>•</span>
                          <span>{p.total_pages || "-"} Halaman</span>
                          <span>•</span>
                          <span>{formatDate(p.uploaded_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      {isReady && (
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/projects/${project.id}/papers/${p.id}`)
                          }
                          className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8.5 px-3.5 rounded-xl cursor-pointer shadow-xs"
                        >
                          <span>Buka Analisis</span>
                          <ArrowRight className="size-3.5" />
                        </Button>
                      )}

                      {isFailed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryProcessing(p.id)}
                          className="gap-1.5 text-xs h-8.5 px-3 rounded-xl cursor-pointer"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Coba Lagi</span>
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingPaper(p)}
                        className="flex size-8.5 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        title="Hapus Paper"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Smooth Animated Glowing Progress Bar for Upload/Processing */}
                  {isProcessing && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-primary font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full size-2 bg-primary" />
                          </span>
                          <span>{stageText}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Sinkronisasi otomatis
                        </span>
                      </div>

                      {/* Glowing shimmer linear bar */}
                      <div className="h-1.5 w-full bg-primary/15 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer_1.8s_infinite] w-full" />
                      </div>
                    </div>
                  )}

                  {/* Confirmation Card (Needs Confirmation) */}
                  {isNeedsConfirmation && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs text-foreground">
                          <p className="font-semibold text-amber-800 dark:text-amber-300">
                            Pemberitahuan: Karakteristik Dokumen Perlu Konfirmasi
                          </p>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {p.doc_type?.reason ||
                              "Format dokumen ini terdeteksi memiliki struktur non-standar. Silakan konfirmasi apakah Anda ingin tetap melanjutkannya."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-500/20">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfirmAction(p.id, "discard")}
                          className="h-7 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-900 dark:text-amber-200 cursor-pointer"
                        >
                          Hapus Dokumen
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmAction(p.id, "proceed")}
                          className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                        >
                          Tetap Proses Dokumen
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {isFailed && p.error && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 space-y-1 text-xs text-destructive">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="size-4" />
                        <span>Kendala Analisis: {p.error.code}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pl-6">
                        {p.error.user_message}
                      </p>
                    </div>
                  )}

                  {/* Bottom Minimal Coverage Badge (If ready, without any AI model mentions) */}
                  {p.coverage && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/50 text-[10px]">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-muted-foreground font-medium">
                        <Layers className="size-3" />
                        <span>
                          {p.coverage.pages_readable}/{p.coverage.pages_total} Halaman Terbaca ({p.coverage.language.toUpperCase()})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload PDF Modal */}
      <UploadPdfModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        projectId={project.id}
        existingFilenames={papers.filter((p) => p.status !== "failed").map((p) => p.file_name)}
      />

      {/* Delete Paper Confirmation Modal */}
      {deletingPaper && (
        <div
          onClick={() => setDeletingPaper(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground">
                  Hapus Dokumen Paper?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <p className="text-xs text-foreground bg-muted/50 p-3 rounded-xl leading-relaxed">
              Anda akan menghapus dokumen paper <span className="font-semibold">"{deletingPaper.title}"</span>. Seluruh data ekstraksi komponen, bukti kutipan, dan embedding terkait dokumen ini akan dibersihkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingPaper(null)}
                disabled={deletePaperMutation.isPending}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeletePaper}
                disabled={deletePaperMutation.isPending}
                className="gap-1.5 cursor-pointer"
              >
                {deletePaperMutation.isPending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                <span>Ya, Hapus Dokumen</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
