import { useState, useMemo } from "react"
import type { KeyboardEvent } from "react"
import { Link, Navigate, generatePath, useNavigate, useSearchParams } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  FileText,
  FolderKanban,
  Plus,
  RotateCw,
  Search,
  UploadCloud,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/app/routes"
import { useProjects, Project } from "@/features/projects/api/projectsApi"

type ReadinessFilter = "all" | "ready" | "not_ready"

/** Minimum number of papers with status "ready" required to open a comparative matrix. */
const MIN_READY_PAPERS = 2

function isMatrixReady(project: Project): boolean {
  return project.ready_count >= MIN_READY_PAPERS
}

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(isoString))
  } catch {
    return "Baru saja"
  }
}

/**
 * Matriks Komparasi overview: lets the user pick a project.
 * The matrix itself lives on its own focused route (`ROUTES.PROJECTS.MATRIX`),
 * without the app sidebar and navbar, like the project workspace.
 */
export default function MatrixScreen() {
  const [searchParams] = useSearchParams()

  // Backwards compatibility with the former `/matrix?projectId=...` links
  const legacyProjectId = searchParams.get("projectId")
  if (legacyProjectId) {
    return <Navigate to={generatePath(ROUTES.PROJECTS.MATRIX, { projectId: legacyProjectId })} replace />
  }

  return <MatrixProjectPicker />
}

function MatrixProjectPicker() {
  const navigate = useNavigate()
  const { data: projects = [], isLoading, isError, refetch } = useProjects({ status: "active" })

  const openMatrix = (projectId: string) =>
    navigate(generatePath(ROUTES.PROJECTS.MATRIX, { projectId }))

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterTab, setFilterTab] = useState<ReadinessFilter>("all")

  const readyProjectsCount = useMemo(
    () => projects.filter(isMatrixReady).length,
    [projects]
  )
  const notReadyProjectsCount = projects.length - readyProjectsCount

  const keyword = searchQuery.trim().toLowerCase()
  const hasActiveFilter = keyword.length > 0 || filterTab !== "all"

  // Filter by keyword and readiness, newest update first (same ordering as the mobile app)
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const matchesSearch =
          !keyword ||
          project.name.toLowerCase().includes(keyword) ||
          (project.description?.toLowerCase().includes(keyword) ?? false)

        if (!matchesSearch) return false
        if (filterTab === "ready") return isMatrixReady(project)
        if (filterTab === "not_ready") return !isMatrixReady(project)
        return true
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }, [projects, keyword, filterTab])

  const filterTabs: { id: ReadinessFilter; label: string; count: number; icon?: LucideIcon }[] = [
    { id: "all", label: "Semua", count: projects.length },
    { id: "ready", label: "Siap Matriks", count: readyProjectsCount, icon: CheckCircle2 },
    { id: "not_ready", label: "Belum Siap", count: notReadyProjectsCount, icon: AlertTriangle },
  ]

  const resetFilters = () => {
    setSearchQuery("")
    setFilterTab("all")
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Matriks Komparasi</h1>
          {projects.length > 0 && (
            <Badge variant="primary">
              {readyProjectsCount} dari {projects.length} Siap Matriks
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Pilih proyek riset untuk membandingkan parameter akademis lintas paper. Matriks membutuhkan
          minimal {MIN_READY_PAPERS} paper berstatus Siap (Ready).
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan judul proyek atau kata kunci riset..."
            className="h-10 pl-9 pr-9 text-xs"
          />
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              title="Hapus pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Readiness filter (segmented control, same pattern as the Proyek Riset page) */}
        <div className="flex h-10 items-center overflow-x-auto rounded-button border border-input bg-card p-1 shadow-card">
          {filterTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = filterTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={cn(
                  "flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className="size-3.5" />}
                <span>
                  {tab.label} ({tab.count})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-5 animate-pulse flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="size-10 rounded-button bg-muted" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full" />
              <div className="pt-3 border-t border-border/60 flex justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-destructive/20 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="size-8 text-destructive" />
          <h3 className="font-semibold text-sm text-foreground">Gagal Memuat Proyek</h3>
          <p className="text-xs text-muted-foreground">
            Terjadi kendala saat mengambil daftar proyek riset. Periksa koneksi lalu coba lagi.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 gap-1.5">
            <RotateCw />
            <span>Coba Muat Ulang</span>
          </Button>
        </div>
      )}

      {/* Empty State: no projects at all, or nothing matches the current filter */}
      {!isLoading && !isError && filteredProjects.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-card border-2 border-dashed border-border/80 bg-card/50 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-card bg-primary-soft text-primary">
            {projects.length === 0 ? (
              <FolderKanban className="size-7" />
            ) : (
              <Search className="size-7" />
            )}
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {projects.length === 0 ? "Belum Ada Proyek Riset" : "Tidak Ada Proyek yang Cocok"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {projects.length === 0
                ? `Buat proyek riset pertama Anda dan unggah minimal ${MIN_READY_PAPERS} paper untuk mulai menggunakan matriks komparasi.`
                : keyword
                ? `Pencarian kata kunci "${searchQuery.trim()}" tidak menemukan proyek yang sesuai dengan filter yang dipilih.`
                : "Tidak ada proyek yang sesuai dengan filter yang dipilih."}
            </p>
          </div>
          {projects.length === 0 ? (
            <Button asChild className="mt-2 gap-2">
              <Link to={ROUTES.PROJECTS.NEW}>
                <Plus />
                <span>Buat Proyek Pertama Anda</span>
              </Link>
            </Button>
          ) : (
            hasActiveFilter && (
              <Button variant="outline" onClick={resetFilters} className="mt-2">
                Reset Filter & Pencarian
              </Button>
            )
          )}
        </div>
      )}

      {/* Project Catalog Grid */}
      {!isLoading && !isError && filteredProjects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectMatrixCard
              key={project.id}
              project={project}
              onSelect={() => openMatrix(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ProjectMatrixCardProps {
  project: Project
  onSelect: () => void
}

function ProjectMatrixCard({ project, onSelect }: ProjectMatrixCardProps) {
  const isReady = isMatrixReady(project)
  const isComplete = isReady && project.ready_count === project.paper_count
  const hasEnoughPapers = project.paper_count >= MIN_READY_PAPERS

  const progressPercent =
    project.paper_count > 0 ? Math.round((project.ready_count / project.paper_count) * 100) : 0

  // Explains why the matrix is locked (mobile shows the equivalent as a snackbar on tap)
  const lockedMessage = hasEnoughPapers
    ? `Dibutuhkan minimal ${MIN_READY_PAPERS} paper berstatus Siap. Tinjau paper yang masih menunggu review.`
    : `Dibutuhkan minimal ${MIN_READY_PAPERS} paper berstatus Siap. Saat ini baru ${project.paper_count} paper terunggah.`

  const lockedAction = hasEnoughPapers
    ? {
        to: generatePath(ROUTES.PROJECTS.REVIEW, { projectId: project.id }),
        label: "Tinjau Paper",
        Icon: CheckSquare,
      }
    : {
        to: generatePath(ROUTES.PROJECTS.OVERVIEW, { projectId: project.id }),
        label: "Unggah Paper",
        Icon: UploadCloud,
      }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect()
    }
  }

  // Only projects that meet the requirement behave as a single clickable card
  const interactiveProps = isReady
    ? {
        role: "button",
        tabIndex: 0,
        onClick: onSelect,
        onKeyDown: handleKeyDown,
        "aria-label": `Buka matriks komparasi proyek ${project.name}`,
      }
    : undefined

  return (
    <Card
      hoverable={isReady}
      {...interactiveProps}
      className={cn(
        "group flex flex-col justify-between gap-4 p-5",
        isReady
          ? "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "border-status-orange/30 transition-colors hover:border-status-orange/60"
      )}
    >
      <div className="flex flex-col gap-3.5">
        {/* Top row: icon and readiness badge (fixed position regardless of title length) */}
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-button",
              isReady ? "bg-primary-soft text-primary" : "bg-status-orange-soft text-status-orange"
            )}
          >
            <FolderKanban className="size-5" />
          </div>
          {isReady ? (
            <Badge variant="ready">
              <CheckCircle2 className="size-3" />
              Siap Matriks
            </Badge>
          ) : (
            <Badge variant="review">
              <AlertTriangle className="size-3" />
              Belum Siap
            </Badge>
          )}
        </div>

        {/* Title and description */}
        <div className="flex flex-col gap-1.5">
          <h3
            title={project.name}
            className={cn(
              "line-clamp-1 text-base font-semibold text-foreground transition-colors",
              isReady && "group-hover:text-primary"
            )}
          >
            {project.name}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {project.description || "Tidak ada deskripsi riset."}
          </p>
        </div>

        {/* Paper readiness progress */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Kesiapan paper</span>
            <span className="font-semibold text-foreground">
              {project.ready_count} dari {project.paper_count} siap
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Kesiapan paper"
            className="h-1.5 w-full overflow-hidden rounded-full bg-primary-soft"
          >
            <div
              style={{ width: `${progressPercent}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isComplete ? "bg-status-green" : "bg-primary"
              )}
            />
          </div>
        </div>

        {!isReady && (
          <p className="flex items-start gap-2 rounded-button bg-status-orange-soft p-2.5 text-xs leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-status-orange" />
            <span>{lockedMessage}</span>
          </p>
        )}
      </div>

      {/* Card footer: paper total and primary action */}
      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FileText className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">{project.paper_count} Paper</span>
          <span className="text-[11px]">· {formatDate(project.updated_at)}</span>
        </div>

        {isReady ? (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors group-hover:bg-primary/10">
            <span>Buka Matriks</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        ) : (
          <Link
            to={lockedAction.to}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <lockedAction.Icon className="size-3.5" />
            <span>{lockedAction.label}</span>
          </Link>
        )}
      </div>
    </Card>
  )
}
