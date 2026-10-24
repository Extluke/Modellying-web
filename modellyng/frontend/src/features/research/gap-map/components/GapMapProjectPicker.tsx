import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Compass,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileText,
  RotateCw,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/features/projects/api/projectsApi"
import { GapMapProjectCard } from "./GapMapProjectCard"

type ReadinessFilter = "all" | "ready" | "not_ready"

export interface GapMapProjectPickerProps {
  onSelectProject: (projectId: string) => void
}

export function GapMapProjectPicker({ onSelectProject }: GapMapProjectPickerProps) {
  const { data: projects = [], isLoading, isError, refetch } = useProjects({ status: "active" })

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterTab, setFilterTab] = useState<ReadinessFilter>("all")

  // Calculate high-level summary metrics
  const readyProjectsCount = useMemo(
    () => projects.filter((p) => (p.ready_count || 0) >= 2).length,
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
      {/* Page Header Banner */}
      <div className="border-b bg-card/60 backdrop-blur-md px-4 sm:px-8 py-6 shrink-0">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <Compass className="size-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                    Pemetaan Celah Riset
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Research Gap & Novelty Roadmap
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Peta Celah Riset Ilmiah (Research Gap Map)
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
            Pilih ruang riset untuk mengidentifikasi celah penelitian (*research gap*), peluang kebaruan ilmiah (*novelty*), serta rekomendasi formulasi tesis.
            Pemetaan celah komparatif lintas-dokumen secara ilmiah membutuhkan <strong>minimal 2 dokumen paper yang telah berstatus Siap (Ready)</strong> agar perbandingan berpasangan dan isolasi limitasi tersaji secara kredibel.
          </p>

          {/* Metrics Pill Row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border text-muted-foreground shadow-2xs">
              <FolderKanban className="size-3.5 text-primary" />
              <span>Total Proyek:</span>
              <strong className="text-foreground font-mono">{projects.length}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-2xs">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Siap Celah Riset:</span>
              <strong className="font-mono font-bold">{readyProjectsCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 shadow-2xs">
              <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span>Belum Memenuhi Syarat:</span>
              <strong className="font-mono font-bold">{notReadyProjectsCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border text-muted-foreground shadow-2xs">
              <FileText className="size-3.5 text-primary" />
              <span>Total Paper Siap:</span>
              <strong className="text-foreground font-mono">{totalReadyPapers}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Readiness Tab Pills */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/50 text-xs w-fit">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filterTab === "all"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua Proyek ({projects.length})
            </button>
            <button
              onClick={() => setFilterTab("ready")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === "ready"
                  ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Siap Celah Riset ({readyProjectsCount})</span>
            </button>
            <button
              onClick={() => setFilterTab("not_ready")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === "not_ready"
                  ? "bg-card text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Belum Memenuhi Syarat ({notReadyProjectsCount})</span>
            </button>
          </div>

          {/* Quick Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari ruang riset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border bg-card pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Project States */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl border bg-card/60 p-5 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-5/6 rounded bg-muted" />
                </div>
                <div className="h-2 w-full rounded bg-muted pt-4" />
                <div className="h-9 w-full rounded-xl bg-muted pt-4" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3 max-w-md mx-auto">
            <AlertTriangle className="size-8 text-destructive mx-auto" />
            <h3 className="text-sm font-bold text-foreground">Gagal Memuat Daftar Proyek</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Terjadi kendala saat menghubungkan basis data. Silakan coba muat ulang katalog proyek.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <RotateCw className="size-3.5" />
              <span>Muat Ulang</span>
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-12 text-center space-y-4 max-w-lg mx-auto bg-card/40 my-8">
            <div className="size-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-2xs">
              <Compass className="size-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Belum Ada Proyek Riset</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda belum memiliki proyek riset aktif. Buat proyek riset baru dan unggah dokumen paper ilmiah untuk mulai memetakan celah penelitian dan merumuskan novelty.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="text-xs gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
            >
              <Link to="/projects/new">
                <Plus className="size-3.5" />
                <span>Inisialisasi Proyek Pertama</span>
              </Link>
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center space-y-3 max-w-md mx-auto bg-card/40">
            <Search className="size-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">Tidak Ada Proyek yang Cocok</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tidak ditemukan proyek yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo; atau filter kesiapan saat ini.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setFilterTab("all")
              }}
              className="text-xs cursor-pointer"
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <GapMapProjectCard
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
