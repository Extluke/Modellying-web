import { useState, useMemo } from "react"
import { useParams, useSearchParams, Link } from "react-router-dom"
import {
  TableProperties,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  CheckSquare,
  FolderKanban,
  FileText,
  RotateCw,
  Plus,
  Sparkles,
  Layers,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjects, Project } from "@/features/projects/api/projectsApi"
import MatrixDetailView from "./MatrixDetailView"

type ReadinessFilter = "all" | "ready" | "not_ready"

export default function MatrixScreen() {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Project ID resolution: route param > query param
  const activeProjectId = routeProjectId || searchParams.get("projectId")

  // If a project is selected, render the full interactive comparative matrix
  if (activeProjectId) {
    return (
      <MatrixDetailView
        projectId={activeProjectId}
        onBackToProjects={() => setSearchParams({})}
      />
    )
  }

  // Otherwise, render the dedicated Project Selection & Readiness Hub (Matriks Mockup)
  return <MatrixProjectPicker onSelectProject={(id) => setSearchParams({ projectId: id })} />
}

interface MatrixProjectPickerProps {
  onSelectProject: (projectId: string) => void
}

function MatrixProjectPicker({ onSelectProject }: MatrixProjectPickerProps) {
  const { data: projects = [], isLoading, isError, refetch } = useProjects({ status: "active" })

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterTab, setFilterTab] = useState<ReadinessFilter>("all")

  // Calculate high-level summary metrics
  const readyProjectsCount = useMemo(
    () => projects.filter((p) => p.ready_count >= 2).length,
    [projects]
  )
  const notReadyProjectsCount = projects.length - readyProjectsCount
  const totalReadyPapers = useMemo(
    () => projects.reduce((acc, p) => acc + (p.ready_count || 0), 0),
    [projects]
  )

  // Filtered projects by search text and readiness tab
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // 1. Text Search matching
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (project.description &&
          project.description.toLowerCase().includes(searchQuery.toLowerCase().trim()))

      if (!matchesSearch) return false

      // 2. Readiness Filter
      if (filterTab === "ready") {
        return project.ready_count >= 2
      }
      if (filterTab === "not_ready") {
        return project.ready_count < 2
      }
      return true
    })
  }, [projects, searchQuery, filterTab])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
      {/* Page Header Banner */}
      <div className="border-b bg-card/60 backdrop-blur-md px-4 sm:px-8 py-6 shrink-0">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <TableProperties className="size-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                    Riset Sintesis Global
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    11 Parameter Akademis
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Matriks Komparasi Sintesis Ilmiah
                </h1>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="text-xs gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer shrink-0"
            >
              <Link to="/projects/new">
                <Plus className="size-3.5" />
                <span>Buat Proyek Baru</span>
              </Link>
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Pilih proyek riset untuk menyusun tabel komparasi 11 parameter akademis lintas dokumen paper.
            Matriks komparasi secara ilmiah membutuhkan <strong>minimal 2 dokumen paper yang telah berstatus Siap (Ready)</strong> agar perbandingan berpasangan dan sintesis global dapat disajikan secara kredibel.
          </p>

          {/* Metrics Pill Row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border text-muted-foreground shadow-2xs">
              <FolderKanban className="size-3.5 text-primary" />
              <span>Total Proyek:</span>
              <strong className="text-foreground font-mono">{projects.length}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-2xs">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Siap Matriks (≥ 2 Paper):</span>
              <strong className="font-mono font-bold">{readyProjectsCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border text-muted-foreground shadow-2xs">
              <FileText className="size-3.5 text-primary" />
              <span>Total Paper Siap:</span>
              <strong className="text-foreground font-mono">{totalReadyPapers}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6 flex-1">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterTab === "all"
                  ? "bg-card text-foreground font-bold shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua Proyek ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("ready")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === "ready"
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs border border-emerald-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>Siap Komparasi ({readyProjectsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("not_ready")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === "not_ready"
                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold shadow-xs border border-amber-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle className="size-3 text-amber-500" />
              <span>Belum Memenuhi Syarat ({notReadyProjectsCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cari judul atau topik proyek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border bg-card pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                title="Hapus pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border bg-card/60 p-5 space-y-4 animate-pulse shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-xl bg-muted" />
                  <div className="h-5 w-24 rounded-full bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
                <div className="h-10 rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3 max-w-md mx-auto my-12">
            <AlertTriangle className="size-9 text-destructive mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">
              Gagal Memuat Daftar Proyek
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Terjadi gangguan koneksi saat mengambil katalog proyek riset.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <RotateCw className="size-3.5" />
              <span>Coba Muat Ulang</span>
            </Button>
          </div>
        )}

        {/* Empty State: No Projects Created Yet */}
        {!isLoading && !isError && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-2xs">
            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <Layers className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">
                Belum Ada Proyek Riset
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Buat proyek riset pertama Anda dan unggah minimal 2 dokumen paper untuk mulai menggunakan matriks komparasi 11 parameter.
              </p>
            </div>
            <Button asChild size="sm" className="text-xs gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Link to="/projects/new">
                <Plus className="size-3.5" />
                <span>Inisialisasi Proyek Baru</span>
              </Link>
            </Button>
          </div>
        )}

        {/* Empty State: No search/filter match */}
        {!isLoading && !isError && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="rounded-2xl border bg-card/60 p-10 text-center space-y-3 max-w-md mx-auto my-10 shadow-2xs">
            <Search className="size-8 text-muted-foreground/50 mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">
              Tidak Ada Proyek yang Cocok
            </h3>
            <p className="text-xs text-muted-foreground">
              Tidak ada proyek yang sesuai dengan kriteria filter atau kata kunci &ldquo;{searchQuery}&rdquo;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setFilterTab("all")
              }}
              className="text-xs cursor-pointer"
            >
              Reset Filter & Pencarian
            </Button>
          </div>
        )}

        {/* Project Catalog Grid */}
        {!isLoading && !isError && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectMatrixCard
                key={project.id}
                project={project}
                onSelect={() => onSelectProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ProjectMatrixCardProps {
  project: Project
  onSelect: () => void
}

function ProjectMatrixCard({ project, onSelect }: ProjectMatrixCardProps) {
  // Deterministic validation rules:
  // Matrix requires at least 2 papers with status 'ready' / completed AI extraction
  const isReady = (project.ready_count || 0) >= 2
  const isInsufficient = (project.paper_count || 0) < 2
  const isPartiallyReady = (project.paper_count || 0) >= 2 && (project.ready_count || 0) < 2

  const progressPercent = Math.min(100, Math.round(((project.ready_count || 0) / 2) * 100))

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between shadow-2xs ${
        isReady
          ? "bg-card border-border/80 hover:border-primary/50 hover:shadow-md"
          : "bg-card/85 border-amber-500/35 dark:border-amber-500/25 hover:border-amber-500/60"
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Meta: Icon, Name, and Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isReady
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              }`}
            >
              <FolderKanban className="size-4.5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate" title={project.name}>
                {project.name}
              </h3>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span>Dibuat:</span>
                <span className="font-mono">
                  {new Date(project.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          </div>

          {/* Readiness Badge */}
          {isReady ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="size-3" />
              <span>Memenuhi Syarat</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
              <AlertTriangle className="size-3" />
              <span>Belum Siap ({project.ready_count}/2)</span>
            </span>
          )}
        </div>

        {/* Project Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {project.description || "Belum ada deskripsi spesifik untuk proyek riset ini."}
        </p>

        {/* Progress & Paper Counts */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Kesiapan Paper Matriks:</span>
            <span className="font-mono font-bold text-foreground">
              {project.ready_count} / 2 Paper Siap ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full transition-all duration-300 ${
                isReady ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
            <span>Total Paper: {project.paper_count} Terunggah</span>
            <span>Syarat Minimal: 2 Paper Ready</span>
          </div>
        </div>

        {/* PROMINENT WARNING BANNER IF READY COUNT < 2 */}
        {!isReady && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5 text-left animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Peringatan: Butuh Minimal 2 Paper Siap</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-normal">
              Matriks komparasi membutuhkan minimal 2 dokumen paper yang telah berstatus Siap (Ready). Saat ini baru memiliki{" "}
              <strong>{project.ready_count}</strong> dari {project.paper_count} paper yang siap.
            </p>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-4 border-t border-border/60 mt-4">
        {isReady ? (
          <Button
            onClick={onSelect}
            className="w-full text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 rounded-xl shadow-xs cursor-pointer transition-all"
          >
            <Sparkles className="size-3.5" />
            <span>Buka Matriks Komparasi</span>
            <ArrowRight className="size-3.5" />
          </Button>
        ) : (
          <div className="space-y-2 w-full">
            {isInsufficient ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 h-8.5 rounded-xl cursor-pointer font-medium"
                title="Unggah minimal 2 dokumen paper ke proyek ini untuk membuka matriks"
              >
                <Link to={`/projects/${project.id}/overview`}>
                  <UploadCloud className="size-3.5" />
                  <span>Unggah Paper Tambahan ({project.paper_count}/2)</span>
                </Link>
              </Button>
            ) : isPartiallyReady ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/10 h-8.5 rounded-xl cursor-pointer font-medium"
                title="Tinjau komponen ekstraksi di Antrean Review agar paper berstatus Siap"
              >
                <Link to={`/projects/${project.id}/review`}>
                  <CheckSquare className="size-3.5" />
                  <span>Tinjau Komponen Paper ({project.ready_count}/{project.paper_count} Siap)</span>
                </Link>
              </Button>
            ) : null}

            <Button
              disabled
              size="sm"
              variant="ghost"
              className="w-full text-xs text-muted-foreground/60 h-7.5 rounded-xl cursor-not-allowed opacity-50"
              title={`Kurang ${2 - project.ready_count} paper lagi untuk membuka matriks`}
            >
              <span>Matriks Komparasi Terkunci</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
