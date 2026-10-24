import { Link } from "react-router-dom"
import {
  Compass,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  CheckSquare,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Project } from "@/features/projects/api/projectsApi"

export interface GapMapProjectCardProps {
  project: Project
  onSelect: () => void
}

export function GapMapProjectCard({ project, onSelect }: GapMapProjectCardProps) {
  // Aturan validasi ilmiah pemetaan celah riset:
  // Sintesis celah riset lintas-dokumen dan perbandingan berpasangan mewajibkan minimal 2 paper 'ready'
  const isReady = (project.ready_count || 0) >= 2
  const isInsufficient = (project.paper_count || 0) < 2
  const isPartiallyReady = (project.paper_count || 0) >= 2 && (project.ready_count || 0) < 2

  const progressPercent = Math.min(100, Math.round(((project.ready_count || 0) / 2) * 100))

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between shadow-2xs ${
        isReady
          ? "bg-card border-border/80 hover:border-primary/50 hover:shadow-md"
          : "bg-card/85 border-amber-500/35 dark:border-amber-500/25 hover:border-amber-500/60"
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Header: Icon, Project Name & Readiness Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isReady
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              }`}
            >
              <Compass className="size-4.5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate" title={project.name}>
                {project.name}
              </h3>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span>Dibuat:</span>
                <span className="font-mono">
                  {new Date(project.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {isReady ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="size-3" />
              <span>Siap Celah Riset</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
              <AlertTriangle className="size-3" />
              <span>Belum Siap ({project.ready_count}/2)</span>
            </span>
          )}
        </div>

        {/* Project Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {project.description || "Belum ada deskripsi spesifik untuk ruang riset ini."}
        </p>

        {/* Progress & Paper Counts */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Kesiapan Paper Celah Riset:</span>
            <span className="font-mono font-bold text-foreground">
              {project.ready_count} / 2 Paper Siap ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full transition-all duration-300 ${
                isReady ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              <FolderKanban className="size-3" />
              <span>Total: {project.paper_count} Paper Terunggah</span>
            </span>
            <span>Syarat: Minimal 2 Paper Ready</span>
          </div>
        </div>

        {/* Prominent Warning Callout if Ready Count < 2 */}
        {!isReady && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5 text-left animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Peringatan: Butuh Minimal 2 Paper Siap</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-normal">
              Pemetaan celah riset komparatif membutuhkan minimal 2 dokumen paper yang telah berstatus Siap (Ready). Saat ini baru memiliki{" "}
              <strong>{project.ready_count}</strong> dari {project.paper_count} paper yang siap.
            </p>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-4 border-t border-border/60 mt-4">
        {isReady ? (
          <Button
            onClick={onSelect}
            className="w-full text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 rounded-xl shadow-xs cursor-pointer transition-all"
          >
            <Compass className="size-3.5" />
            <span>Buka Peta Celah Riset</span>
            <ArrowRight className="size-3.5" />
          </Button>
        ) : (
          <div className="space-y-2 w-full">
            {isInsufficient ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 h-8.5 rounded-xl cursor-pointer font-medium"
                title="Unggah minimal 2 dokumen paper ke proyek ini untuk membuka peta celah riset"
              >
                <Link to={`/projects/${project.id}/overview`}>
                  <UploadCloud className="size-3.5" />
                  <span>Unggah Paper Tambahan ({project.paper_count}/2)</span>
                </Link>
              </Button>
            ) : isPartiallyReady ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/10 h-8.5 rounded-xl cursor-pointer font-medium"
                title="Tinjau komponen ekstraksi di Antrean Review agar paper berstatus Siap"
              >
                <Link to={`/projects/${project.id}/review`}>
                  <CheckSquare className="size-3.5" />
                  <span>Tinjau Komponen Paper ({project.ready_count}/{project.paper_count} Siap)</span>
                </Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
