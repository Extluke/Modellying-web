import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  FolderKanban,
  FileText,
  RotateCw,
  Sparkles,
  Layers,
  X,
  Workflow,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjects, Project } from "@/features/projects/api/projectsApi"

type ReadinessFilter = "all" | "ready" | "not_ready"

interface ConceptMapProjectPickerProps {
  onSelectProject: (projectId: string) => void
}

export function ConceptMapProjectPicker({ onSelectProject }: ConceptMapProjectPickerProps) {
  const { data: projects = [], isLoading, isError, refetch } = useProjects({ status: "active" })

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterTab, setFilterTab] = useState<ReadinessFilter>("all")

  // Menghitung metrik kesiapan proyek
  const readyProjectsCount = useMemo(
    () => projects.filter((p) => (p.ready_count || 0) >= 2).length,
    [projects]
  )
  const notReadyProjectsCount = projects.length - readyProjectsCount
  const totalReadyPapers = useMemo(
    () => projects.reduce((acc, p) => acc + (p.ready_count || 0), 0),
    [projects]
  )

  // Filter proyek berdasarkan input pencarian dan tab kesiapan
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (project.description &&
          project.description.toLowerCase().includes(searchQuery.toLowerCase().trim()))

      if (!matchesSearch) return false

      if (filterTab === "ready") {
        return (project.ready_count || 0) >= 2
      }
      if (filterTab === "not_ready") {
        return (project.ready_count || 0) < 2
      }
      return true
    })
  }, [projects, searchQuery, filterTab])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
      {/* Header Banner */}
      <div className="border-b bg-card/60 backdrop-blur-md px-4 sm:px-8 py-6 shrink-0">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <Workflow className="size-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Peta Celah Riset & Relasi Konsep (Research Gap Map)
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="size-3" />
                    <span>Pairwise Engine 5 Tahap</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pilih proyek penelitian untuk menjalankan perbandingan berpasangan terurut, diagram alur Mermaid, dan pemetaan limitasi ke novelty gap.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs h-8 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <RotateCw className="size-3.5" />
              <span>Segarkan Data</span>
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Proyek
              </span>
              <span className="text-lg font-bold text-foreground">
                {projects.length}
              </span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                Siap Evaluasi (&ge; 2 Paper)
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {readyProjectsCount}
              </span>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                Perlu Tambah Paper (&lt; 2)
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {notReadyProjectsCount}
              </span>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                Total Paper Tervalidasi
              </span>
              <span className="text-lg font-bold text-primary">
                {totalReadyPapers}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6 flex-1">
        {/* Controls Bar: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama proyek atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Readiness Segmented Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === "all"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("ready")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === "ready"
                  ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>Siap ({readyProjectsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("not_ready")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === "not_ready"
                  ? "bg-card text-amber-600 dark:text-amber-400 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle className="size-3 text-amber-500" />
              <span>Belum Siap ({notReadyProjectsCount})</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-border bg-card/50 animate-pulse p-5 space-y-3"
              >
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-10 bg-muted/50 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
            <AlertTriangle className="size-8 text-destructive mx-auto" />
            <h3 className="text-sm font-bold text-foreground">
              Gagal Memuat Daftar Proyek
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Terjadi kendala saat menghubungkan ke database proyek. Pastikan sesi login aktif dan coba segarkan halaman.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs"
            >
              <RotateCw className="size-3.5" />
              <span>Coba Lagi</span>
            </Button>
          </div>
        )}

        {/* Empty Search Results */}
        {!isLoading && !isError && filteredProjects.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4 shadow-2xs">
            <FolderKanban className="size-10 text-muted-foreground mx-auto opacity-60" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Tidak Ada Proyek yang Ditemukan
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada hasil pencarian untuk kata kunci "${searchQuery}". Coba gunakan kata kunci lain.`
                  : filterTab === "ready"
                  ? "Belum ada proyek yang memiliki minimal 2 paper siap analisis."
                  : "Belum ada proyek aktif di akun Anda."}
              </p>
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs"
              >
                Hapus Pencarian
              </Button>
            )}
          </div>
        )}

        {/* Project Cards Grid */}
        {!isLoading && !isError && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project: Project) => {
              const isReady = (project.ready_count || 0) >= 2
              const readyPapers = project.ready_count || 0
              const totalPapers = project.paper_count || 0

              return (
                <div
                  key={project.id}
                  className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:shadow-xs group ${
                    isReady
                      ? "bg-card border-border hover:border-primary/40"
                      : "bg-muted/15 border-border/70 hover:border-amber-500/30"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Row: Title & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        {project.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Tanpa deskripsi tambahan
                          </p>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isReady
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {isReady ? (
                          <>
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            <span>Siap Dianalisis</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="size-3 text-amber-500" />
                            <span>Perlu Paper</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/30 text-muted-foreground">
                        <FileText className="size-3 text-primary" />
                        <span className="font-semibold text-foreground">
                          {readyPapers}
                        </span>
                        <span>/ {totalPapers} Siap</span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/30 text-muted-foreground">
                        <Layers className="size-3 text-primary" />
                        <span className="font-semibold text-foreground">
                          {isReady ? (readyPapers * (readyPapers - 1)) / 2 : 0}
                        </span>
                        <span>Pasangan</span>
                      </div>
                    </div>

                    {/* Warning if not ready */}
                    {!isReady && (
                      <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <p className="leading-snug">
                          Dibutuhkan minimal 2 paper siap analisis untuk perbandingan berpasangan (Pairwise Engine).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-border/60 mt-3">
                    {isReady ? (
                      <Button
                        size="sm"
                        onClick={() => onSelectProject(project.id)}
                        className="w-full text-xs h-8.5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-2xs"
                      >
                        <Workflow className="size-3.5" />
                        <span>Buka Research Gap Map</span>
                        <ArrowRight className="size-3 ml-auto opacity-70" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="w-full text-xs h-8.5 gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <Link to={`/projects/${project.id}`}>
                          <UploadCloud className="size-3.5 text-amber-500" />
                          <span>Kelola & Unggah Paper</span>
                          <ArrowRight className="size-3 ml-auto opacity-70" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
