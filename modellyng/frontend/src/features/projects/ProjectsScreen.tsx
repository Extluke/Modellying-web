import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
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
} from "lucide-react"
import {
  useProjects,
  useUpdateProject,
  useDeleteProject,
  Project,
} from "./api/projectsApi"
import { ROUTES } from "@/app/routes"

export default function ProjectsScreen() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all")
  
  // Real data fetching via TanStack Query
  const { data: projects = [], isLoading, isError } = useProjects({
    search,
    status: statusFilter,
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project)
    setEditName(project.name)
    setEditDescription(project.description || "")
    setEditStatus(project.status)
    setActiveDropdownId(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject || !editName.trim()) return

    await updateMutation.mutateAsync({
      id: editingProject.id,
      payload: {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus,
      },
    })
    setEditingProject(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingProject) return
    await deleteMutation.mutateAsync(deletingProject.id)
    setDeletingProject(null)
    setActiveDropdownId(null)
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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Proyek Riset</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {projects.length} Ruang Kerja
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

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan judul proyek atau kata kunci riset..."
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center rounded-lg border border-input bg-card p-1 shadow-sm">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
              statusFilter === "active"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
              statusFilter === "archived"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Diarsipkan
          </button>
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

      {/* Empty State */}
      {!isLoading && !isError && projects.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border/80 bg-card/50 p-12 text-center space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto shadow-inner">
            <FolderKanban className="size-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {search ? "Tidak Ada Proyek yang Cocok" : "Belum Ada Proyek Riset"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {search
                ? `Pencarian kata kunci "${search}" tidak menemukan proyek aktif. Coba kata kunci lain.`
                : "Mulai perjalanan riset akademik berbasis bukti Anda dengan membuat ruang kerja proyek pertama."}
            </p>
          </div>
          {!search && (
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.NEW)}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
            >
              <Plus className="size-4" />
              <span>Buat Proyek Pertama Anda</span>
            </Button>
          )}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !isError && projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                {/* Top card row: Icon, Date, 3-dots Menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold shadow-xs">
                    <FolderKanban className="size-5" />
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
                          className="absolute right-0 top-8 z-30 w-36 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                          >
                            <Edit2 className="size-3.5 text-muted-foreground" />
                            <span>Edit Proyek</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingProject(p)
                              setActiveDropdownId(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Hapus Proyek</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Title & Status */}
                <div className="mt-3.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    {p.status === "archived" && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                        Arsip
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {p.description || "Tidak ada deskripsi riset."}
                  </p>
                </div>
              </div>

              {/* Bottom card footer: Paper count & Navigate to Overview */}
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

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs text-primary font-semibold hover:bg-primary/10 h-8 px-2.5"
                >
                  <Link to={`/projects/${p.id}/overview`}>
                    <span>Buka Workspace</span>
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PROJECT MODAL POPUP                                                  */}
      {/* ========================================================================= */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Edit2 className="size-4" />
                </div>
                <h3 className="font-semibold text-base text-foreground">Edit Proyek Riset</h3>
              </div>
              <button
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
                <div className="flex gap-3">
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
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
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
                variant="outline"
                size="sm"
                onClick={() => setDeletingProject(null)}
                disabled={deleteMutation.isPending}
              >
                Batal
              </Button>
              <Button
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
