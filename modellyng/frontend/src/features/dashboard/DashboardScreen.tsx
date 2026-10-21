import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { FolderKanban, FileText, CheckCircle2, Clock, Plus } from "lucide-react"

export default function DashboardScreen() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dasbor Riset</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan progres ekstraksi paper ilmiah dan status peninjauan.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link to={ROUTES.PROJECTS.ROOT}>
            <Plus className="size-4" />
            <span>Proyek Baru</span>
          </Link>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Proyek</span>
            <FolderKanban className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">3</div>
          <span className="text-[11px] text-muted-foreground">Ruang kerja aktif</span>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Paper Terunggah</span>
            <FileText className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">18</div>
          <span className="text-[11px] text-muted-foreground">PDF dianalisis</span>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Siap Dianalisis</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">14</div>
          <span className="text-[11px] text-muted-foreground">Status Ready</span>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Perlu Ditinjau</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-500">4</div>
          <span className="text-[11px] text-muted-foreground">Needs Review</span>
        </div>
      </div>
    </div>
  )
}
