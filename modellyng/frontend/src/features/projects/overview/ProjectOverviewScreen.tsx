import { useState, useRef } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Upload,
  FileText,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  Clock,
  Trash2,
  FileUp,
  AlertCircle,
  FolderKanban,
  Loader2,
  TableProperties,
} from "lucide-react"
import {
  useProjectDetail,
  useAddPaper,
  useDeletePaper,
} from "../api/projectsApi"
import { ROUTES } from "@/app/routes"

export default function ProjectOverviewScreen() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // Real data fetching from PostgreSQL
  const { data: project, isLoading, isError } = useProjectDetail(projectId)
  const addPaperMutation = useAddPaper(projectId || "")
  const deletePaperMutation = useDeletePaper(projectId || "")

  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Handle file drop / selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !projectId) return
    setUploadError(null)

    // Check maximum paper limit (15 papers per project)
    const currentCount = project?.papers?.length || 0
    if (currentCount + files.length > 15) {
      setUploadError(
        `Batas maksimal adalah 15 paper per proyek. Anda saat ini memiliki ${currentCount} paper dan mencoba menambahkan ${files.length} paper.`
      )
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setUploadError(`File "${file.name}" bukan format PDF yang didukung.`)
        continue
      }

      // Format clean title from file name
      const cleanTitle = file.name
        .replace(/\.pdf$/i, "")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())

      try {
        await addPaperMutation.mutateAsync({
          title: cleanTitle,
          file_name: file.name,
          file_size_bytes: file.size,
          total_pages: Math.max(1, Math.round(file.size / 150000)), // Approximate estimation
          authors: ["Peneliti Akademik"],
          year: new Date().getFullYear(),
        })
      } catch (err: any) {
        setUploadError(err?.message || "Gagal mengunggah paper.")
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground font-medium">
            Memuat Workspace Riset dari Basis Data Supabase...
          </span>
        </div>
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl border border-destructive/20 p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="size-10 text-destructive mx-auto" />
          <h2 className="text-base font-bold text-foreground">Proyek Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground">
            Proyek ini mungkin telah dihapus atau Anda tidak memiliki hak akses kepemilikan.
          </p>
          <Button onClick={() => navigate(ROUTES.PROJECTS.ROOT)} className="text-xs bg-primary text-primary-foreground">
            Kembali ke Daftar Proyek
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col selection:bg-primary/20">
      {/* ----------------------------------------------------------------------- */}
      {/* Focused Workspace Top Bar (Tanpa Navbar Utama)                          */}
      {/* ----------------------------------------------------------------------- */}
      <header className="border-b border-border/70 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={ROUTES.PROJECTS.ROOT}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group shrink-0"
            >
              <div className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-background group-hover:border-primary/50 group-hover:text-primary transition-colors">
                <ArrowLeft className="size-3.5" />
              </div>
              <span className="hidden sm:inline">Daftar Proyek</span>
            </Link>

            <span className="text-muted-foreground/40 hidden sm:inline">|</span>

            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <FolderKanban className="size-4" />
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {project.name}
              </h1>
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                {project.status === "active" ? "Aktif" : "Arsip"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 hidden md:inline-flex"
            >
              <Link to={`/projects/${projectId}/chat`}>
                <MessageSquare className="size-3.5 text-primary" />
                <span>Chat Dokumen</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 hidden lg:inline-flex"
            >
              <Link to="/matrix">
                <TableProperties className="size-3.5 text-primary" />
                <span>Matriks Komparasi</span>
              </Link>
            </Button>

            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 shadow-xs"
            >
              <Upload className="size-3.5" />
              <span>Unggah PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------------- */}
      {/* Workspace Hub & PDF Upload Area                                         */}
      {/* ----------------------------------------------------------------------- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Project Overview Banner Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <span className="text-[11px] font-bold tracking-wider text-primary uppercase">
                Ruang Kerja Riset Akademik
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {project.name}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {project.description || "Belum ada deskripsi rumusan masalah untuk proyek ini."}
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
              <div className="rounded-xl border border-border/80 bg-muted/30 px-3.5 py-2.5 text-center min-w-[90px]">
                <span className="block text-lg font-bold text-foreground">
                  {project.papers?.length || 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Total Paper</span>
              </div>
              <div className="rounded-xl border border-border/80 bg-emerald-50/50 px-3.5 py-2.5 text-center min-w-[90px]">
                <span className="block text-lg font-bold text-emerald-700">
                  {project.ready_count}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Paper Siap</span>
              </div>
              <div className="rounded-xl border border-border/80 bg-primary/5 px-3.5 py-2.5 text-center min-w-[90px]">
                <span className="block text-lg font-bold text-primary">11</span>
                <span className="text-[10px] text-primary/80 font-medium">Komponen Ilmiah</span>
              </div>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 flex items-center justify-between text-xs text-destructive font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)} className="text-destructive hover:opacity-80">
              ✕
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* PDF Drag-and-Drop Zone                                              */}
        {/* ------------------------------------------------------------------- */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.005]"
              : "border-border/80 bg-card/60 hover:border-primary/50 hover:bg-card"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              {addPaperMutation.isPending ? (
                <Loader2 className="size-7 animate-spin" />
              ) : (
                <FileUp className="size-7" />
              )}
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-foreground">
                {addPaperMutation.isPending
                  ? "Menyimpan Paper ke Supabase..."
                  : "Tarik & Lepas Dokumen PDF Ilmiah ke Sini"}
              </h3>
              <p className="text-xs text-muted-foreground">
                atau <span className="font-semibold text-primary underline">klik untuk memilih file</span> dari komputer Anda
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
              <span>Maksimal 15 Paper</span>
              <span>•</span>
              <span>Format .pdf</span>
              <span>•</span>
              <span>Maks 50MB per paper</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* Real Database Paper List                                            */}
        {/* ------------------------------------------------------------------- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Daftar Dokumen Paper di Workspace</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {project.papers?.length || 0}/15
              </span>
            </h3>
          </div>

          {project.papers?.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-card p-8 text-center space-y-2">
              <FileText className="size-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                Belum ada dokumen paper di ruang kerja ini.
              </p>
              <p className="text-[11px] text-muted-foreground">
                Unggah dokumen PDF jurnal atau skripsi untuk memulai analisis berbasis bukti 11 komponen.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 shadow-xs">
              {project.papers?.map((paper) => (
                <div
                  key={paper.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                      <FileText className="size-4.5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-1">
                        {paper.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{paper.file_name}</span>
                        <span>•</span>
                        <span>{formatFileSize(paper.file_size_bytes)}</span>
                        <span>•</span>
                        <span>{paper.total_pages} Halaman</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {paper.status === "ready" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/50">
                        <CheckCircle2 className="size-3" />
                        <span>Siap Dianalisis</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/50">
                        <Clock className="size-3" />
                        <span>Perlu Review</span>
                      </span>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 font-medium hover:border-primary/50 hover:text-primary"
                    >
                      <Link to={`/projects/${projectId}/papers/${paper.id}`}>
                        <span>Buka Ekstraksi</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePaperMutation.mutate(paper.id)}
                      disabled={deletePaperMutation.isPending}
                      className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Hapus Paper"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
