import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, FolderPlus, Loader2, X } from "lucide-react"
import { useCreateProject } from "./api/projectsApi"
import { ROUTES } from "@/app/routes"
import { toast } from "@/lib/store/useToastStore"

export default function CreateProjectScreen() {
  const navigate = useNavigate()
  const createMutation = useCreateProject()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Nama proyek riset wajib diisi.")
      return
    }

    if (trimmedName.length < 2) {
      toast.error("Nama proyek minimal harus terdiri dari 2 karakter.")
      return
    }

    try {
      const project = await createMutation.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
      })

      toast.success("Ruang riset baru berhasil dibuat.")
      navigate(`/projects/${project.id}/overview`)
    } catch (err: any) {
      const msg = err?.message || "Gagal membuat proyek. Silakan coba kembali."
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] dark:bg-slate-950 flex flex-col justify-between selection:bg-primary/20">
      {/* ----------------------------------------------------------------------- */}
      {/* Focused Minimalist Header                                               */}
      {/* ----------------------------------------------------------------------- */}
      <header className="border-b border-border/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to={ROUTES.PROJECTS.ROOT}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="flex size-8 items-center justify-center rounded-xl border border-border/80 bg-background group-hover:border-primary/50 group-hover:text-primary transition-colors">
              <ArrowLeft className="size-4" />
            </div>
            <span className="hidden sm:inline">Kembali ke Daftar Proyek</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
              M
            </div>
            <span className="font-semibold text-xs tracking-tight text-foreground">
              Modellyng Workspace
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.PROJECTS.ROOT)}
            className="text-xs text-muted-foreground hover:text-foreground h-9"
          >
            <X className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Batalkan</span>
          </Button>
        </div>
      </header>

      {/* ----------------------------------------------------------------------- */}
      {/* Focused Center Form Card                                                */}
      {/* ----------------------------------------------------------------------- */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 sm:py-14 flex items-center">
        <div className="w-full bg-card rounded-3xl border border-border/80 shadow-xs p-6 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Title Section */}
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0 shadow-2xs">
              <FolderPlus className="size-5" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Inisialisasi Ruang Riset Baru
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tentukan identitas dan rumusan masalah riset untuk memulai telaah komprehensif dokumen akademik Anda.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field 1: Project Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Judul Proyek Riset <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {name.length}/150 karakter
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Analisis Komparatif Algoritma Deep Learning Pada Citra Medis"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-2xs font-medium"
              />
              <p className="text-[11px] text-muted-foreground leading-normal">
                Gunakan judul yang representatif untuk mempermudah identifikasi dan telaah bukti ilmiah lintas dokumen.
              </p>
            </div>

            {/* Field 2: Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Deskripsi / Rumusan Masalah Riset
                </label>
                <span className="text-[11px] text-muted-foreground">Opsional</span>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan latar belakang singkat, celah riset (research gap), atau tujuan spesifik yang ingin diselidiki..."
                className="w-full rounded-xl border border-input bg-background p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-2xs leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground leading-normal">
                Deskripsi membantu mengarahkan fokus telaah dan sintesis komparasi parameter.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.PROJECTS.ROOT)}
                className="w-full sm:w-auto h-10 text-xs px-5 rounded-xl"
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="w-full sm:w-auto h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm shadow-primary/25 text-xs rounded-xl"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menyimpan Ruang Riset...</span>
                  </>
                ) : (
                  <>
                    <span>Buat Ruang Riset</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="py-4 text-center text-[11px] text-muted-foreground border-t border-border/40 bg-white/40 dark:bg-slate-900/40">
        Modellyng Web Academic Suite • Evidence-Centered PDF Analysis
      </footer>
    </div>
  )
}
