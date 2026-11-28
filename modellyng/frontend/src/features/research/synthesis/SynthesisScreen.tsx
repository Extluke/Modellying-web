import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Sparkles,
  Copy,
  Check,
  FolderKanban,
  FileText,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Loader2,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedContent, SpotlightCard } from "@/components/react-bits"
import { ROUTES } from "@/app/routes"
import { useComparativeMatrix, useProjects } from "@/features/projects/api/projectsApi"
import { generateProjectSynthesis } from "@/features/research/matrix/utils/synthesisEngine"
import { toast } from "@/lib/store/useToastStore"

export default function SynthesisScreen() {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects({ status: "active" })
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [copiedNarrative, setCopiedNarrative] = useState(false)

  useEffect(() => {
    if (projects.length === 0) return
    if (selectedProjectId && projects.some((p) => p.id === selectedProjectId)) return

    const preferred =
      projects.find((p) => (p.ready_count || 0) >= 2) ||
      projects.find((p) => (p.paper_count || 0) > 0) ||
      projects[0]
    if (preferred) {
      setSelectedProjectId(preferred.id)
    }
  }, [projects, selectedProjectId])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )

  const canSynthesize = Boolean(selectedProject && (selectedProject.ready_count || 0) >= 2)
  const {
    data: matrixData,
    isLoading: isLoadingMatrix,
  } = useComparativeMatrix(canSynthesize ? selectedProjectId : undefined)

  const synthesis = useMemo(() => {
    if (!matrixData || (matrixData.papers?.length || 0) < 2) return null
    return generateProjectSynthesis(matrixData)
  }, [matrixData])

  const recommendations = useMemo(() => {
    if (synthesis && synthesis.followUpIdeas.length > 0) {
      return synthesis.followUpIdeas
    }
    return [
      {
        rank: 1,
        title: "Arsitektur Linear Transformer dengan Dynamic Kernel Decay untuk Efisiensi Dokumen Panjang",
        rationale:
          "Contoh formulasi judul riset yang memetakan kompleksitas pemrosesan teks ilmiah jangka panjang.",
      },
      {
        rank: 2,
        title: "Integrasi State Space Models pada Pra-Pelatihan Representasi Bidireksional Korpus Akademik",
        rationale:
          "Contoh formulasi penggabungan model representasi untuk meningkatkan keterlacakan bukti semantik.",
      },
      {
        rank: 3,
        title: "Mekanisme Sparse Attention Adaptif Berbasis Bobot Entropi Kalimat pada Rekam Medis",
        rationale:
          "Contoh formulasi optimasi pembobotan konteks pada dokumen domain klinis bervolume tinggi.",
      },
    ]
  }, [synthesis])

  const narrativeText = useMemo(() => {
    if (synthesis?.academicNarrative) {
      return synthesis.academicNarrative
    }
    return "Berdasarkan komparasi lintas dokumen ilmiah pada proyek terpilih, analisis komparatif memetakan irisan metodologis utama serta keterbatasan empiris antar studi terdahulu. Unggah dan selesaikan peninjauan minimal 2 paper pada ruang riset Anda untuk menghasilkan paragraf sintesis akademik otomatis yang terikat langsung pada sitasi penulis-tahun dan bukti kutipan PDF."
  }, [synthesis])

  const handleCopyParagraph = async () => {
    const fullText = [
      narrativeText,
      "",
      "Usulan Judul Penelitian Lanjutan:",
      ...recommendations.map((rec, idx) => `${idx + 1}. ${rec.title}`),
      ...(synthesis?.bibliography && synthesis.bibliography.length > 0
        ? ["", "Daftar Pustaka Terkait:", ...synthesis.bibliography]
        : []),
    ].join("\n")

    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedNarrative(true)
      toast.success("Paragraf sintesis akademik & rekomendasi judul berhasil disalin.", 5000)
      setTimeout(() => setCopiedNarrative(false), 2500)
    } catch {
      toast.error("Gagal menyalin teks ke papan klip peramban Anda.", 5000)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <span>Sintesis Riset &amp; Rekomendasi Judul Tesis</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Formulasi rumusan masalah, celah keterbatasan, dan 3 usulan judul penelitian berbasis bukti matriks komparatif.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleCopyParagraph}
          className="gap-1.5 text-xs self-start sm:self-auto shrink-0 cursor-pointer"
        >
          {copiedNarrative ? (
            <>
              <Check className="size-3.5 text-emerald-300" />
              <span>Tersalin ke Papan Klip</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Salin Paragraf Akademik</span>
            </>
          )}
        </Button>
      </div>

      {/* Selector Proyek */}
      <AnimatedContent distance={12} duration={400} immediate>
        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <FolderKanban className="size-5" />
            </div>
            <div className="min-w-0">
              <label htmlFor="synthesis-project-select" className="text-xs font-bold text-foreground block">
                Sumber Ruang Riset
              </label>
              <p className="text-[11px] text-muted-foreground truncate">
                {synthesis
                  ? `${matrixData?.papers.length || 0} paper siap disintesis secara komparatif`
                  : "Pilih proyek dengan minimal 2 paper siap untuk sintesis langsung dari basis data"}
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
                id="synthesis-project-select"
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
                <Link to={ROUTES.PROJECTS.NEW}>Buat Proyek Pertama</Link>
              </Button>
            )}
          </div>
        </div>
      </AnimatedContent>

      {/* Banner Informasi Jika Proyek Belum Punya 2 Paper Siap */}
      {!isLoadingProjects && selectedProject && !canSynthesize && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <FileText className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">
                Proyek &ldquo;{selectedProject.name}&rdquo; baru memiliki {selectedProject.ready_count || 0} paper berstatus Siap.
              </p>
              <p className="text-muted-foreground">
                Menampilkan pratinjau struktur sintesis. Minimal 2 paper berstatus Siap diperlukan untuk sintesis lintas-naskah otomatis.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs shrink-0 self-start sm:self-auto">
            <Link to={`/projects/${selectedProject.id}/overview`}>
              <span>Kelola Paper</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {isLoadingMatrix ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-44 rounded-xl border bg-muted/30 animate-pulse" />
          <div className="h-36 rounded-xl border bg-muted/30 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 3 Rekomendasi Usulan Judul */}
          <AnimatedContent delay={60} distance={14} duration={440} immediate>
            <SpotlightCard className="p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lightbulb className="size-4 text-primary" />
                  <span>3 Rekomendasi Usulan Judul Riset</span>
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {synthesis ? "Terhubung Matriks" : "Pratinjau Format"}
                </span>
              </div>
              <div className="space-y-2.5">
                {recommendations.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border bg-secondary/20 p-3.5 text-xs transition-colors hover:border-primary/30"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5 shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <span className="font-semibold text-foreground leading-relaxed block">
                        {item.title}
                      </span>
                      {item.rationale && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {item.rationale}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </AnimatedContent>

          {/* Sintesis Rumusan Masalah Komprehensif */}
          <AnimatedContent delay={120} distance={14} duration={440} immediate>
            <SpotlightCard className="p-5 shadow-sm space-y-2.5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>Sintesis Rumusan Masalah &amp; Narasi Akademik</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {narrativeText}
              </p>
            </SpotlightCard>
          </AnimatedContent>

          {/* Daftar Pustaka Terkait */}
          {synthesis && synthesis.bibliography.length > 0 && (
            <AnimatedContent delay={180} distance={14} duration={440}>
              <SpotlightCard className="p-5 shadow-sm space-y-2.5">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <span>Referensi Literatur Terkait ({synthesis.bibliography.length})</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
                  {synthesis.bibliography.map((ref, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {ref}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </AnimatedContent>
          )}
        </div>
      )}
    </div>
  )
}
