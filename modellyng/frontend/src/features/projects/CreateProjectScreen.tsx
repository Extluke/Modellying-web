import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  X,
  Loader2,
  Check,
} from "lucide-react"
import { useCreateProject } from "./api/projectsApi"
import { ROUTES } from "@/app/routes"

export default function CreateProjectScreen() {
  const navigate = useNavigate()
  const createMutation = useCreateProject()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("Informatika & Kecerdasan Buatan")
  const [citationFormat, setCitationFormat] = useState("APA")
  const [error, setError] = useState<string | null>(null)

  const academicDomains = [
    "Informatika & Kecerdasan Buatan",
    "Kesehatan & Biomedis",
    "Teknik & Rekayasa Sistem",
    "Ekonomi & Manajemen Bisnis",
    "Pendidikan & Sosial Humaniora",
    "Sains & Matematika Terapan",
  ]

  const citationStyles = [
    { id: "APA", label: "APA 7th Edition", desc: "Standar psikologi, ilmu sosial, & komputer" },
    { id: "IEEE", label: "IEEE Citation", desc: "Standar teknik elektro, AI, & komputasi numerik" },
    { id: "Harvard", label: "Harvard Referencing", desc: "Format author-date internasional" },
    { id: "Chicago", label: "Chicago Manual", desc: "Format catatan & bibliografi ilmiah" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nama proyek riset wajib diisi.")
      return
    }

    try {
      setError(null)
      const project = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim()
          ? `${description.trim()}\n\n[Bidang: ${selectedDomain} | Sitasi: ${citationFormat}]`
          : `[Bidang: ${selectedDomain} | Sitasi: ${citationFormat}]`,
      })

      // Redirect immediately to the PDF upload overview page (no distraction)
      navigate(`/projects/${project.id}/overview`)
    } catch (err: any) {
      setError(err?.message || "Gagal membuat proyek. Silakan coba kembali.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-between selection:bg-primary/20">
      {/* ----------------------------------------------------------------------- */}
      {/* Focused Minimalist Header (Tanpa Navbar Utama)                          */}
      {/* ----------------------------------------------------------------------- */}
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to={ROUTES.PROJECTS.ROOT}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-background group-hover:border-primary/50 group-hover:text-primary transition-colors">
              <ArrowLeft className="size-3.5" />
            </div>
            <span>Kembali ke Daftar Proyek</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
              M
            </div>
            <span className="font-semibold text-xs tracking-tight text-foreground">
              Modellyng Focus Workspace
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.PROJECTS.ROOT)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-4 mr-1" />
            <span>Batalkan</span>
          </Button>
        </div>
      </header>

      {/* ----------------------------------------------------------------------- */}
      {/* Focused Center Form Card                                                */}
      {/* ----------------------------------------------------------------------- */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Progress / Step indicator */}
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs">
              1
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Langkah 1 dari 2
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Inisialisasi Ruang Riset Baru
              </h2>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field 1: Project Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Judul atau Topik Utama Riset <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">{name.length}/150 karakter</span>
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
              <p className="text-[11px] text-muted-foreground">
                Berikan judul yang representatif agar mempermudah ekstraksi dan visualisasi knowledge graph.
              </p>
            </div>

            {/* Field 2: Description / Abstract */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Deskripsi / Rumusan Masalah Penelitian
                </label>
                <span className="text-[11px] text-muted-foreground">Opsional</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan latar belakang singkat, celah riset (research gap), atau tujuan spesifik yang ingin Anda selidiki..."
                className="w-full rounded-xl border border-input bg-background p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-2xs leading-relaxed"
              />
            </div>

            {/* Field 3: Domain Selection Pills */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-foreground">
                Bidang Studi Keilmuan
              </label>
              <div className="flex flex-wrap gap-2">
                {academicDomains.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => setSelectedDomain(domain)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedDomain === domain
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Citation Format Preference */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-foreground">
                Format Sitasi & Bibliografi Target
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {citationStyles.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setCitationFormat(style.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      citationFormat === style.id
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border/80 bg-background hover:border-primary/30"
                    }`}
                  >
                    <div
                      className={`flex size-4 shrink-0 items-center justify-center rounded-full mt-0.5 border ${
                        citationFormat === style.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {citationFormat === style.id && <Check className="size-2.5 stroke-[3]" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{style.label}</h4>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        {style.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Helper Notice */}
            <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4 flex items-start gap-3 text-blue-900">
              <Sparkles className="size-4 shrink-0 text-blue-600 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-0.5">
                <span className="font-semibold">Langkah Berikutnya: Unggah PDF Ilmiah</span>
                <p className="text-blue-700/90 text-[11px]">
                  Setelah mengklik tombol di bawah, proyek Anda akan tersimpan di Supabase dan Anda langsung diarahkan ke kanvas unggah dokumen paper PDF.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.PROJECTS.ROOT)}
                className="w-full sm:w-auto h-11 text-xs"
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="w-full sm:w-auto h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm shadow-primary/25 text-xs"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <span>Buat & Lanjut ke Unggah PDF</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="py-4 text-center text-[11px] text-muted-foreground border-t border-border/40 bg-white/40">
        Modellyng Web Academic Suite • Evidence-Centered PDF Analysis
      </footer>
    </div>
  )
}
