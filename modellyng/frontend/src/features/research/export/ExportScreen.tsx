import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Download,
  FileSpreadsheet,
  FileText,
  Presentation,
  FolderKanban,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedContent, SpotlightCard } from "@/components/react-bits"
import { ROUTES } from "@/app/routes"
import {
  downloadProjectExport,
  useComparativeMatrix,
  useProjects,
} from "@/features/projects/api/projectsApi"
import { generateProjectSynthesis } from "@/features/research/matrix/utils/synthesisEngine"
import { toast } from "@/lib/store/useToastStore"

type ExportFormatKey = "docx" | "xlsx" | "csv" | "pptx"

interface ExportFormatCard {
  key: ExportFormatKey
  title: string
  description: string
  icon: typeof FileText
  badge: string
  spotlight: string
}

function triggerClientFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function ExportScreen() {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects({ status: "active" })
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [downloadingKey, setDownloadingKey] = useState<ExportFormatKey | null>(null)
  const [completedKey, setCompletedKey] = useState<ExportFormatKey | null>(null)

  useEffect(() => {
    if (projects.length === 0) return
    if (selectedProjectId && projects.some((p) => p.id === selectedProjectId)) return

    const preferred =
      projects.find((p) => (p.ready_count || 0) >= 1) || projects[0]
    if (preferred) {
      setSelectedProjectId(preferred.id)
    }
  }, [projects, selectedProjectId])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )

  const hasReadyPapers = Boolean(selectedProject && (selectedProject.ready_count || 0) >= 1)
  const { data: matrixData } = useComparativeMatrix(
    selectedProject && (selectedProject.ready_count || 0) >= 2 ? selectedProject.id : undefined
  )

  const formats: ExportFormatCard[] = [
    {
      key: "docx",
      title: "Microsoft Word (.doc)",
      description: "Naskah terstruktur lengkap dengan bab pendahuluan, sintesis komparasi, dan daftar pustaka.",
      icon: FileText,
      badge: "Laporan Riset",
      spotlight: "rgba(81, 71, 229, 0.12)",
    },
    {
      key: "xlsx",
      title: "Microsoft Excel (.xlsx)",
      description: "Matriks perbandingan 10 parameter ilmiah dan daftar pustaka lengkap per dokumen.",
      icon: FileSpreadsheet,
      badge: "Tabel Matriks",
      spotlight: "rgba(16, 185, 129, 0.12)",
    },
    {
      key: "csv",
      title: "CSV Dataset (.csv)",
      description: "Data mentah teks komponen ilmiah dan skor keyakinan untuk analisis kuantitatif.",
      icon: FileSpreadsheet,
      badge: "Raw Data",
      spotlight: "rgba(40, 120, 240, 0.12)",
    },
    {
      key: "pptx",
      title: "Ringkasan Presentasi (.pdf / .md)",
      description: "Paket ringkasan komparasi eksekutif dan rekomendasi novelty riset siap dipresentasikan.",
      icon: Presentation,
      badge: "Slide Presentasi",
      spotlight: "rgba(168, 85, 247, 0.12)",
    },
  ]

  const handleDownload = async (formatKey: ExportFormatKey) => {
    if (!selectedProject) {
      toast.error("Pilih atau buat proyek riset terlebih dahulu sebelum mengekspor.", 5000)
      return
    }

    if (!hasReadyPapers) {
      toast.info(
        `Proyek "${selectedProject.name}" belum memiliki paper berstatus Siap untuk diekspor.`,
        5000
      )
      return
    }

    setDownloadingKey(formatKey)
    const safeSlug = selectedProject.name
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase() || "modellyng_project"

    try {
      if (formatKey === "xlsx" || formatKey === "csv") {
        await downloadProjectExport(selectedProject.id, formatKey, selectedProject.name)
        toast.success(
          `Berkas ${formatKey.toUpperCase()} untuk proyek "${selectedProject.name}" berhasil diunduh.`,
          5000
        )
      } else if (formatKey === "docx") {
        const synthesis = matrixData ? generateProjectSynthesis(matrixData) : null
        const htmlDoc = [
          "<!DOCTYPE html><html><head><meta charset='utf-8'><title>",
          selectedProject.name,
          "</title></head><body style='font-family:Inter,Arial,sans-serif;line-height:1.6;'>",
          `<h1>Laporan Kompilasi Riset: ${selectedProject.name}</h1>`,
          `<p>${selectedProject.description || "Ekstraksi komparatif literatur ilmiah Modellyng Web."}</p>`,
          synthesis
            ? `<h2>Sintesis Narasi Akademik</h2><p>${synthesis.academicNarrative}</p>` +
              `<h2>Usulan Judul Penelitian Lanjutan</h2><ol>${synthesis.followUpIdeas
                .map((idea) => `<li><strong>${idea.title}</strong><br/>${idea.rationale}</li>`)
                .join("")}</ol>` +
              `<h2>Daftar Pustaka</h2><ul>${synthesis.bibliography
                .map((b) => `<li>${b}</li>`)
                .join("")}</ul>`
            : `<p>Total dokumen tervalidasi: ${selectedProject.ready_count} dari ${selectedProject.paper_count} paper.</p>`,
          "</body></html>",
        ].join("")

        triggerClientFileDownload(
          htmlDoc,
          `${safeSlug}_laporan_riset.doc`,
          "application/msword;charset=utf-8"
        )
        toast.success(
          `Laporan Word (.doc) untuk proyek "${selectedProject.name}" berhasil dibuat & diunduh.`,
          5000
        )
      } else {
        try {
          await downloadProjectExport(selectedProject.id, "pdf", selectedProject.name)
          toast.success(
            `Ringkasan presentasi PDF untuk proyek "${selectedProject.name}" berhasil diunduh.`,
            5000
          )
        } catch {
          const synthesis = matrixData ? generateProjectSynthesis(matrixData) : null
          const markdownOutline = [
            `# Ringkasan Presentasi Riset: ${selectedProject.name}`,
            "",
            "## 1. Gambaran Proyek",
            selectedProject.description || "Kajian literatur berbasis bukti kutipan PDF.",
            "",
            "## 2. Rekomendasi Judul & Kebaruan",
            ...(synthesis?.followUpIdeas.map((idea, idx) => `${idx + 1}. **${idea.title}** - ${idea.rationale}`) || [
              `Paper siap: ${selectedProject.ready_count}/${selectedProject.paper_count}`,
            ]),
          ].join("\n")

          triggerClientFileDownload(
            markdownOutline,
            `${safeSlug}_slide_ringkasan.md`,
            "text/markdown;charset=utf-8"
          )
          toast.success(
            `Outline ringkasan presentasi (.md) untuk proyek "${selectedProject.name}" berhasil diunduh.`,
            5000
          )
        }
      }

      setCompletedKey(formatKey)
      setTimeout(() => setCompletedKey(null), 2500)
    } catch {
      toast.error(
        "Gagal mengunduh berkas ekspor dari server. Pastikan backend aktif dan paper sudah siap.",
        5000
      )
    } finally {
      setDownloadingKey(null)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Download className="size-5 text-primary" />
          <span>Ekspor Hasil Kompilasi Riset</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Unduh dokumen hasil ekstraksi, matriks perbandingan, dan ringkasan sintesis dalam format siap pakai.
        </p>
      </div>

      {/* Selector Proyek */}
      <AnimatedContent distance={12} duration={400} immediate>
        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <FolderKanban className="size-5" />
            </div>
            <div className="min-w-0">
              <label htmlFor="export-project-select" className="text-xs font-bold text-foreground block">
                Proyek Target Ekspor
              </label>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedProject
                  ? `${selectedProject.ready_count || 0} dari ${selectedProject.paper_count || 0} paper berstatus Siap`
                  : "Pilih ruang riset untuk mengunduh berkas kompilasi"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {isLoadingProjects ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Memuat proyek...</span>
              </span>
            ) : projects.length > 0 ? (
              <select
                id="export-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-9 w-full sm:w-72 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground fx-input-glow cursor-pointer focus:outline-none focus:border-primary"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.ready_count || 0}/{p.paper_count || 0} siap)
                  </option>
                ))}
              </select>
            ) : (
              <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
                <Link to={ROUTES.PROJECTS.NEW}>
                  <span>Buat Proyek Baru</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </AnimatedContent>

      <div className="grid gap-4 md:grid-cols-2">
        {formats.map((fmt, idx) => {
          const Icon = fmt.icon
          const isBusy = downloadingKey === fmt.key
          const isDone = completedKey === fmt.key
          return (
            <AnimatedContent key={fmt.key} delay={idx * 65} distance={14} duration={440} immediate>
              <SpotlightCard
                spotlightColor={fmt.spotlight}
                className="flex flex-col justify-between p-5 shadow-sm space-y-4 h-full"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {fmt.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{fmt.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {fmt.description}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(fmt.key)}
                  disabled={isBusy || !selectedProject}
                  className="w-full gap-1.5 text-xs cursor-pointer"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      <span>Menyiapkan Berkas...</span>
                    </>
                  ) : isDone ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      <span>Berhasil Diunduh</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" />
                      <span>Unduh Berkas</span>
                    </>
                  )}
                </Button>
              </SpotlightCard>
            </AnimatedContent>
          )
        })}
      </div>
    </div>
  )
}
