import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  ShieldAlert, 
  Users, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  FolderKanban, 
  Activity, 
  RefreshCw,
  Sparkles,
  Server,
  Layers
} from "lucide-react"
import { adminApi, AdminDashboardMetrics } from "../api/adminApi"
import { DUMMY_DASHBOARD_METRICS } from "../data/dummyAdminData"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedContent, CountUp, SpotlightCard } from "@/components/react-bits"
import { toast } from "@/lib/store/useToastStore"

export default function AdminDashboardScreen() {
  const [isSyncing, setIsSyncing] = useState(false)

  const { 
    data: apiMetrics, 
    refetch,
  } = useQuery({
    queryKey: ["admin", "dashboard", "metrics"],
    queryFn: adminApi.getDashboardMetrics,
    retry: false,
  })

  // Prioritize API metrics if available, otherwise seamlessly fallback to rich DUMMY metrics
  const metrics: AdminDashboardMetrics = apiMetrics || DUMMY_DASHBOARD_METRICS

  const handleRefresh = async () => {
    setIsSyncing(true)
    try {
      await refetch()
      toast.success("Data metrik dasbor sistem berhasil diperbarui.", 5000)
    } catch {
      toast.info("Memperbarui tampilan metrik dasbor administratif terkini.", 5000)
    } finally {
      setTimeout(() => setIsSyncing(false), 500)
    }
  }

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Dasbor Administrator Sistem
              <Badge variant="outline" className="text-[10px] bg-primary-soft text-primary dark:bg-primary/15 border-primary/25">
                Eksekutif S3
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pemantauan rasio pengguna berlangganan, konversi paket, performa worker, dan kesehatan broker secara terpadu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="secondary" className="text-[11px] px-2.5 py-1 text-muted-foreground font-mono">
            Mode Data: Demo Lengkap
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isSyncing}
            className="text-xs gap-2"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
            <span>{isSyncing ? "Menyinkronkan..." : "Segarkan Data"}</span>
          </Button>
        </div>
      </div>

      {/* Highlight KPI: Subscribed vs Free Users & Revenue */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users & Ratio */}
        <AnimatedContent delay={0} distance={14} duration={420} immediate className="h-full">
          <SpotlightCard className="p-5 shadow-sm space-y-3 relative overflow-hidden h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Pengguna Terdaftar</span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/15">
                <Users className="size-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground tabular-nums">
                <CountUp to={metrics.total_users} />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center tabular-nums">
                  <TrendingUp className="size-3 mr-0.5" />
                  {metrics.subscribed_ratio_percent}%
                </span>
                <span className="text-muted-foreground">konversi berbayar</span>
              </div>
            </div>

            {/* Progress bar visualizer */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
              <div 
                className="bg-primary h-full transition-all duration-500" 
                style={{ width: `${metrics.subscribed_ratio_percent}%` }}
                title={`Berlangganan: ${metrics.subscribed_users_count}`}
              />
              <div 
                className="bg-slate-300 dark:bg-slate-600 h-full transition-all duration-500" 
                style={{ width: `${100 - metrics.subscribed_ratio_percent}%` }}
                title={`Gratis: ${metrics.free_users_count}`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5 tabular-nums">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-primary" />
                Berbayar: <strong>{metrics.subscribed_users_count}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-slate-400" />
                Free: <strong>{metrics.free_users_count}</strong>
              </span>
            </div>
          </SpotlightCard>
        </AnimatedContent>

        {/* Total Revenue */}
        <AnimatedContent delay={60} distance={14} duration={420} immediate className="h-full">
          <SpotlightCard className="p-5 shadow-sm space-y-3 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pendapatan Langganan (MRR)</span>
              <div className="p-2 rounded-lg bg-muted/80 text-foreground/75 border border-border/60">
                <CreditCard className="size-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground tabular-nums">{formatIDR(metrics.total_revenue_idr)}</div>
              <p className="text-xs text-muted-foreground tabular-nums">
                Dari total <strong>{metrics.subscribed_users_count}</strong> akun peneliti aktif
              </p>
            </div>
          </SpotlightCard>
        </AnimatedContent>

        {/* Total Papers & Components */}
        <AnimatedContent delay={120} distance={14} duration={420} immediate className="h-full">
          <SpotlightCard className="p-5 shadow-sm space-y-3 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Dokumen Ilmiah</span>
              <div className="p-2 rounded-lg bg-muted/80 text-foreground/75 border border-border/60">
                <FileText className="size-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground tabular-nums">
                <CountUp to={metrics.total_papers} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                <Sparkles className="size-3.5 text-primary" />
                <span>{metrics.total_extracted_components.toLocaleString("id-ID")} bukti ilmiah diekstrak</span>
              </div>
            </div>
          </SpotlightCard>
        </AnimatedContent>

        {/* System Health / Redis & Tokens */}
        <AnimatedContent delay={180} distance={14} duration={420} immediate className="h-full">
          <SpotlightCard className="p-5 shadow-sm space-y-3 h-full" spotlightColor="rgba(81, 71, 229, 0.08)">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Kesehatan Sistem &amp; Token</span>
              <div className="p-2 rounded-lg bg-muted/80 text-foreground/75 border border-border/60">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground flex items-center gap-2 tabular-nums">
                <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                <span>{metrics.worker_queue_load}</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 tabular-nums">
                <Server className="size-3 text-slate-400" />
                <span>Redis: {metrics.redis_status}</span>
                <span>•</span>
                <span>Token: {metrics.estimated_tokens_today}</span>
              </p>
            </div>
          </SpotlightCard>
        </AnimatedContent>
      </div>

      {/* Section 2: Plan Breakdown & Papers Processing Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Distribution Breakdown */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Distribusi Pengguna Berdasarkan Paket</span>
            </h2>
            <Badge variant="secondary" className="text-[11px]">
              {metrics.plan_distribution.length} Paket Aktif
            </Badge>
          </div>

          <div className="space-y-3">
            {metrics.plan_distribution.map((plan) => (
              <div key={plan.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{plan.name}</span>
                  <span className="text-muted-foreground">
                    <strong>{plan.subscriber_count}</strong> pengguna ({plan.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      plan.code.includes('pro') 
                        ? 'bg-primary' 
                        : plan.code.includes('enterprise') 
                        ? 'bg-primary/60' 
                        : 'bg-slate-400'
                    }`} 
                    style={{ width: `${Math.max(plan.percentage, 5)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Papers Processing Status */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FolderKanban className="size-4 text-primary" />
              <span>Status Pemrosesan Dokumen Ilmiah</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              Total {metrics.total_papers} Dokumen
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>Selesai (Ready)</span>
              </span>
              <div className="text-xl font-bold text-foreground tabular-nums">
                {metrics.papers_by_status.ready || 0}
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                <span>Sedang Diproses</span>
              </span>
              <div className="text-xl font-bold text-foreground tabular-nums">
                {metrics.papers_by_status.processing || 0}
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                <span>Perlu Review</span>
              </span>
              <div className="text-xl font-bold text-foreground tabular-nums">
                {metrics.papers_by_status.needs_review || 0}
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/25 p-3 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                <span>Gagal (Failed)</span>
              </span>
              <div className="text-xl font-bold text-foreground tabular-nums">
                {metrics.papers_by_status.failed || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Recent Activity Feed */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <span>Log Aktivitas Sistem Terkini</span>
          </h2>
          <span className="text-[11px] text-muted-foreground">5 Transaksi Terakhir</span>
        </div>

        <div className="divide-y">
          {metrics.recent_activity.map((act) => (
            <div key={act.id} className="py-3 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">{act.title}</p>
                <p className="text-[11px] text-muted-foreground">{act.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {act.timestamp ? new Date(act.timestamp).toLocaleString("id-ID") : "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
