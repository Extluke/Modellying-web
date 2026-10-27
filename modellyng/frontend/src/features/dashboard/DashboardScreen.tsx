import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { FolderKanban, FileText, CheckCircle2, Clock, Plus, Megaphone, X } from "lucide-react"
import { adminApi } from "@/features/admin/api/adminApi"

export default function DashboardScreen() {
  const [dismissedBanner, setDismissedBanner] = useState(false)

  // Fetch active promo/announcements from CMS (Job 4)
  const { data: activeAnnouncements } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: adminApi.getActiveAnnouncements,
    staleTime: 60000,
  })

  const topAnnouncement = activeAnnouncements && activeAnnouncements.length > 0 ? activeAnnouncements[0] : null
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

      {/* Dynamic Announcement Banner from CMS (Job 4) */}
      {topAnnouncement && !dismissedBanner && (
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 p-4 shadow-sm animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground shrink-0 mt-0.5">
                <Megaphone className="size-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-primary-foreground">
                    {topAnnouncement.badge_text || topAnnouncement.category.toUpperCase()}
                  </span>
                  <h3 className="text-xs font-bold text-foreground">
                    {topAnnouncement.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {topAnnouncement.summary || topAnnouncement.content}
                </p>
              </div>
            </div>

            <button
              onClick={() => setDismissedBanner(true)}
              className="text-muted-foreground hover:text-foreground p-1 shrink-0"
              title="Tutup Pengumuman"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

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
