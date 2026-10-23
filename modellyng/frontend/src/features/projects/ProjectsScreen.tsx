import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  FolderKanban,
  Plus,
  Search,
  FileText,
  ArrowRight,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  Archive,
  ArchiveRestore,
  ArrowUpDown,
  ArrowUpWideNarrow,
  ArrowDownWideNarrow,
  Clock,
  Calendar,
  ArrowDownAZ,
  CheckCircle2,
  Check,
  ChevronDown,
} from "lucide-react"
import {
  useProjects,
  useUpdateProject,
  useDeleteProject,
  Project,
} from "./api/projectsApi"
import { ROUTES } from "@/app/routes"

type SortField = "updated_at" | "created_at" | "name" | "paper_count" | "ready_count"
type SortOrder = "asc" | "desc"

export default function ProjectsScreen() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  // Filter tabs: strictly 'all' and 'archived'
  const [statusFilter, setStatusFilter] = useState<"all" | "archived">("all")

  // Sorting state
  const [sortBy, setSortBy] = useState<SortField>("updated_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement | null>(null)
  
  // Real data fetching via TanStack Query:
  // When statusFilter is 'all', query for 'active' projects so archived projects strictly appear only in the 'Diarsipkan' tab.
  const { data: projects = [], isLoading, isError } = useProjects({
    search,
    status: statusFilter === "archived" ? "archived" : "active",
  })

  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()

  // Dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Edit Modal state
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState<"active" | "archived">("active")

  // Delete Confirmation state
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Sorting options metadata
  const sortOptions = [
    {
      id: "updated_at" as SortField,
      label: "Waktu Terakhir Diperbarui",
      icon: Clock,
      shortLabel: "Terakhir Diperbarui",
    },
    {
      id: "created_at" as SortField,
      label: "Tanggal Dibuat",
      icon: Calendar,
      shortLabel: "Tanggal Dibuat",
    },
    {
      id: "name" as SortField,
      label: "Abjad Judul (A - Z)",
      icon: ArrowDownAZ,
      shortLabel: "Nama Proyek (A-Z)",
    },
    {
      id: "paper_count" as SortField,
      label: "Jumlah Total Paper",
      icon: FileText,
      shortLabel: "Total Paper",
    },
    {
      id: "ready_count" as SortField,
      label: "Paper Siap Analisis (Ready)",
      icon: CheckCircle2,
      shortLabel: "Paper Siap",
    },
  ]

  // Memoized client-side filtering & sorting:
  // Strictly isolates active projects into 'Semua' and archived projects into 'Diarsipkan'
  const sortedProjects = useMemo(() => {
    const filtered = projects.filter((p) =>
      statusFilter === "archived" ? p.status === "archived" : p.status !== "archived"
    )
    return filtered.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case "name":
          cmp = a.name.localeCompare(b.name, "id", { sensitivity: "base" })
          break
        case "paper_count":
          cmp = a.paper_count - b.paper_count
          break
        case "ready_count":
          cmp = a.ready_count - b.ready_count
          break
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case "updated_at":
        default:
          cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [projects, sortBy, sortOrder, statusFilter])

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  const handleOpenEdit = (project: Project, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingProject(project)
    setEditName(project.name)
    setEditDescription(project.description || "")
    setEditStatus(project.status)
    setActiveDropdownId(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject || !editName.trim()) return

    try {
      await updateMutation.mutateAsync({
        id: editingProject.id,
        payload: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          status: editStatus,
        },
      })
      setEditingProject(null)
      if (editStatus === "archived") {
        setToastMessage(`Proyek "${editName.trim()}" berhasil diperbarui dan dipindahkan ke tab Arsip.`)
      } else {
        setToastMessage(`Proyek "${editName.trim()}" berhasil diperbarui.`)
      }
    } catch {
      setToastMessage("Gagal memperbarui proyek. Silakan coba kembali.")
    }
  }

  // Toggle Archive / Unarchive
  const handleToggleArchive = async (project: Project, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const newStatus = project.status === "active" ? "archived" : "active"
    setActiveDropdownId(null)

    try {
      await updateMutation.mutateAsync({
        id: project.id,
        payload: { status: newStatus },
      })
      if (newStatus === "archived") {
        setToastMessage(`Proyek "${project.name}" berhasil diarsipkan dan dipindahkan ke tab "Diarsipkan".`)
      } else {
        setToastMessage(`Proyek "${project.name}" berhasil diaktifkan kembali ke tab "Semua".`)
      }
    } catch {
      setToastMessage("Gagal mengubah status arsip proyek.")
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingProject) return
    const name = deletingProject.name
    try {
      await deleteMutation.mutateAsync(deletingProject.id)
      setDeletingProject(null)
      setActiveDropdownId(null)
      setToastMessage(`Proyek "${name}" berhasil dihapus.`)
    } catch {
      setToastMessage("Gagal menghapus proyek.")
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date)
    } catch {
      return "Baru saja"
    }
  }

  const currentSortMeta = sortOptions.find((opt) => opt.id === sortBy) || sortOptions[0]

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary text-primary-foreground px-4 py-2.5 shadow-lg text-xs font-medium animate-in slide-in-from-top-2 duration-200">
          <Check className="size-4 shrink-0 text-emerald-300" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 transition-opacity"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Proyek Riset</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {sortedProjects.length} Ruang Kerja
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola ruang kerja penelitian akademik, bukti referensi PDF, dan pemodelan literatur Anda.
          </p>
        </div>

        {/* Action to create new project (Dedicated focused page) */}
        <Button
          onClick={() => navigate(ROUTES.PROJECTS.NEW)}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25 h-10 px-4"
        >
          <Plus className="size-4" />
          <span className="font-medium text-xs">Buat Proyek Baru</span>
        </Button>
      </div>

      {/* Search and Filters & Sorting Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search input - strictly single X button (no browser native cancel button) */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan judul proyek atau kata kunci riset..."
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
          {search.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setSearch("")}
              title="Hapus pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Controls Cluster: Filter Tabs & Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs (Only 'Semua' and 'Diarsipkan') */}
          <div className="flex items-center rounded-lg border border-input bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 text-xs rounded-md font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("archived")}
              className={`px-3.5 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === "archived"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Archive className="size-3.5" />
              <span>Diarsipkan</span>
            </button>
          </div>

          {/* Sorting Dropdown & Direction Toggle */}
          <div className="relative flex items-center gap-1" ref={sortDropdownRef}>
            {/* Sort Field Selector Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center gap-2 h-10 px-3 rounded-lg border border-input bg-card text-xs font-medium text-foreground hover:bg-accent hover:border-primary/40 transition-all shadow-xs"
              title="Pilih Kriteria Pengurutan"
            >
              <ArrowUpDown className="size-3.5 text-primary" />
              <span className="hidden sm:inline text-muted-foreground">Urutkan:</span>
              <span className="font-semibold text-foreground max-w-[130px] truncate">
                {currentSortMeta.shortLabel}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground ml-0.5" />
            </button>

            {/* Ascending / Descending Direction Toggle Button with Tooltip */}
            <button
              type="button"
              onClick={toggleSortOrder}
              title={
                sortOrder === "asc"
                  ? "Urutan: Menaik (Ascending) - Klik untuk beralih ke Menurun"
                  : "Urutan: Menurun (Descending) - Klik untuk beralih ke Menaik"
              }
              className="flex size-10 items-center justify-center rounded-lg border border-input bg-card text-foreground hover:bg-accent hover:border-primary/40 hover:text-primary transition-all shadow-xs"
            >
              {sortOrder === "asc" ? (
                <ArrowUpWideNarrow className="size-4 text-primary" />
              ) : (
                <ArrowDownWideNarrow className="size-4 text-primary" />
              )}
            </button>

            {/* Sort Dropdown Popup */}
            {isSortDropdownOpen && (
              <div className="absolute right-0 top-11 z-30 w-64 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Kriteria Pengurutan
                </div>

                {sortOptions.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = sortBy === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id)
                        setIsSortDropdownOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`size-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                    </button>
                  )
                })}

                <div className="border-t border-border/60 my-1 pt-1">
                  <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Arah Pengurutan
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder("asc")
                      setIsSortDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      sortOrder === "asc"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowUpWideNarrow className="size-3.5" />
                      <span>Menaik (Ascending)</span>
                    </div>
                    {sortOrder === "asc" && <Check className="size-3.5 text-primary" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder("desc")
                      setIsSortDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      sortOrder === "desc"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowDownWideNarrow className="size-3.5" />
                      <span>Menurun (Descending)</span>
                    </div>
                    {sortOrder === "desc" && <Check className="size-3.5 text-primary" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border border-border/60 bg-card p-5 animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="size-10 rounded-lg bg-muted" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
              <div className="pt-3 border-t border-border/40 flex justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-2">
          <AlertTriangle className="size-8 text-destructive mx-auto" />
          <h3 className="font-semibold text-sm text-foreground">Gagal Memuat Proyek</h3>
          <p className="text-xs text-muted-foreground">
            Terjadi kendala saat menyambung ke basis data Supabase. Pastikan backend aktif.
          </p>
        </div>
      )}

      {/* Empty State - Tailored for All vs Archived */}
      {!isLoading && !isError && sortedProjects.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border/80 bg-card/50 p-12 text-center space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto shadow-inner">
            {statusFilter === "archived" ? (
              <Archive className="size-7 text-amber-500" />
            ) : (
              <FolderKanban className="size-7" />
            )}
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {search
                ? "Tidak Ada Proyek yang Cocok"
                : statusFilter === "archived"
                ? "Belum Ada Proyek yang Diarsipkan"
                : "Belum Ada Proyek Riset"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {search
                ? `Pencarian kata kunci "${search}" tidak menemukan proyek yang sesuai.`
                : statusFilter === "archived"
                ? "Semua proyek Anda saat ini berstatus aktif. Anda dapat memindahkan proyek yang telah selesai ke dalam arsip melalui menu opsi (titik tiga) pada setiap kartu proyek."
                : "Mulai perjalanan riset akademik berbasis bukti Anda dengan membuat ruang kerja proyek pertama."}
            </p>
          </div>
          {!search && statusFilter === "all" && (
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.NEW)}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
            >
              <Plus className="size-4" />
              <span>Buat Proyek Pertama Anda</span>
            </Button>
          )}
          {statusFilter === "archived" && (
            <Button
              variant="outline"
              onClick={() => setStatusFilter("all")}
              className="gap-2 mt-2"
            >
              <span>Lihat Semua Proyek</span>
            </Button>
          )}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !isError && sortedProjects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((p) => {
            const isArchived = p.status === "archived"
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}/overview`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    navigate(`/projects/${p.id}/overview`)
                  }
                }}
                className={`group relative rounded-xl border p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  isArchived
                    ? "border-amber-500/30 bg-card/80 hover:border-amber-500/60"
                    : "border-border/70 bg-card hover:border-primary/40"
                }`}
              >
                <div>
                  {/* Top card row: Icon, Date, 3-dots Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl font-bold shadow-xs ${
                        isArchived
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isArchived ? (
                        <Archive className="size-5" />
                      ) : (
                        <FolderKanban className="size-5" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {formatDate(p.updated_at)}
                      </span>

                      {/* 3-dots action button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveDropdownId(activeDropdownId === p.id ? null : p.id)
                          }}
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          aria-label="Opsi Proyek"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {/* Dropdown Popup Menu */}
                        {activeDropdownId === p.id && (
                          <div
                            ref={dropdownRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
                          >
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(p, e)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                            >
                              <Edit2 className="size-3.5 text-muted-foreground" />
                              <span>Edit Proyek</span>
                            </button>

                            {/* Archive / Unarchive Option */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleArchive(p, e)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left ${
                                isArchived
                                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              }`}
                            >
                              {isArchived ? (
                                <>
                                  <ArchiveRestore className="size-3.5" />
                                  <span>Batal Arsipkan</span>
                                </>
                              ) : (
                                <>
                                  <Archive className="size-3.5" />
                                  <span>Arsipkan Proyek</span>
                                </>
                              )}
                            </button>

                            <div className="border-t border-border/50 my-1" />

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingProject(p)
                                setActiveDropdownId(null)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Hapus Proyek</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Title & Status Badges */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      {isArchived && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          <Archive className="size-3" />
                          <span>Diarsipkan</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description || "Tidak ada deskripsi riset."}
                    </p>
                  </div>
                </div>

                {/* Bottom card footer: Paper count & Navigate to Workspace */}
                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="size-3.5 text-primary" />
                    <span className="font-medium text-foreground">
                      {p.ready_count}/{p.paper_count} Paper
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {p.paper_count > 0 ? "Siap Diuji" : "Kosong"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isArchived && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleArchive(p, e)}
                        title="Pulihkan ke status aktif"
                        className="text-[11px] font-medium text-amber-600 hover:text-amber-700 underline underline-offset-2 px-1"
                      >
                        Pulihkan
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/projects/${p.id}/overview`)
                      }}
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:bg-primary/10 rounded-md py-1 px-2 transition-colors"
                    >
                      <span>Buka</span>
                      <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PROJECT MODAL POPUP                                                  */}
      {/* ========================================================================= */}
      {editingProject && (
        <div
          onClick={() => setEditingProject(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Edit2 className="size-4" />
                </div>
                <h3 className="font-semibold text-base text-foreground">Edit Proyek Riset</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Judul Proyek <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Misal: Analisis Model Transformer Medis"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Deskripsi / Abstrak Penelitian
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Jelaskan fokus rumusan masalah, metodologi, atau tujuan utama riset Anda..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Status Ruang Kerja</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={editStatus === "active"}
                      onChange={() => setEditStatus("active")}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Aktif (Sedang Berjalan)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={editStatus === "archived"}
                      onChange={() => setEditStatus("archived")}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Diarsipkan</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProject(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateMutation.isPending || !editName.trim()}
                  className="gap-2 bg-primary text-primary-foreground"
                >
                  {updateMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deletingProject && (
        <div
          onClick={() => setDeletingProject(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
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
                <h3 className="font-semibold text-base text-foreground">Hapus Proyek Riset?</h3>
                <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-foreground bg-muted/50 p-3 rounded-lg leading-relaxed">
              Anda akan menghapus proyek <span className="font-semibold">"{deletingProject.name}"</span>. Seluruh dokumen PDF, data ekstraksi 11 komponen, embedding RAG, dan kanvas alur riset di dalamnya akan dimusnahkan secara permanen dari basis data.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingProject(null)}
                disabled={deleteMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="gap-1.5"
              >
                {deleteMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Ya, Hapus Proyek</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
