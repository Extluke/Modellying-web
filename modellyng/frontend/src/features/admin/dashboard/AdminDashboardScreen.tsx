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
import { adminApi } from "../api/adminApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboardScreen() {
  const { 
    data: metrics, 
    isLoading, 
    isFetching, 
    refetch,
    error 
  } = useQuery({
    queryKey: ["admin", "dashboard", "metrics"],
    queryFn: adminApi.getDashboardMetrics,
    refetchInterval: 30000, // Auto refresh every 30s
  })

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
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200">
                Eksekutif
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pantau rasio pengguna berlangganan, konversi paket, performa worker, dan kesehatan broker secara real-time.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          <span>{isFetching ? "Menyinkronkan..." : "Segarkan Data"}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-muted-foreground">Mengambil metrik analitik platform...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          Gagal memuat metrik sistem: {(error as Error).message}
        </div>
      ) : metrics ? (
        <>
          {/* Highlight KPI: Subscribed vs Free Users & Revenue */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Users & Ratio */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Pengguna Terdaftar</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Users className="size-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">{metrics.total_users}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
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
              <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-primary" />
                  Berbayar: <strong>{metrics.subscribed_users_count}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-slate-400" />
                  Free: <strong>{metrics.free_users_count}</strong>
                </span>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Pendapatan Langganan (MRR)</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CreditCard className="size-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">{formatIDR(metrics.total_revenue_idr)}</div>
                <p className="text-xs text-muted-foreground">
                  Dari total {metrics.subscribed_users_count} akun peneliti aktif
                </p>
              </div>
            </div>

            {/* Total Papers & Components */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Dokumen Ilmiah</span>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <FileText className="size-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">{metrics.total_papers}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>{metrics.total_extracted_components} bukti ilmiah diekstrak</span>
                </div>
              </div>
            </div>

            {/* System Health / Redis & Tokens */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Kesehatan Sistem & Token</span>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Activity className="size-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span>{metrics.worker_queue_load}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Server className="size-3 text-slate-400" />
                  <span>Redis: {metrics.redis_status}</span>
                  <span>•</span>
                  <span>Token: {metrics.estimated_tokens_today}</span>
                </p>
              </div>
            </div>
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
                            ? 'bg-purple-600' 
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
                <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1">
                  <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Selesai (Ready)</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.papers_by_status.ready || 0}
                  </div>
                </div>

                <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-1">
                  <span className="text-[11px] font-medium text-blue-800 dark:text-blue-300">Sedang Diproses</span>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {metrics.papers_by_status.processing || 0}
                  </div>
                </div>

                <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1">
                  <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">Perlu Review</span>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {metrics.papers_by_status.needs_review || 0}
                  </div>
                </div>

                <div className="rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 p-3 space-y-1">
                  <span className="text-[11px] font-medium text-rose-800 dark:text-rose-300">Gagal (Failed)</span>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
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
              {metrics.recent_activity.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Belum ada aktivitas tercatat.</p>
              ) : (
                metrics.recent_activity.map((act) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">{act.title}</p>
                      <p className="text-[11px] text-muted-foreground">{act.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {act.timestamp ? new Date(act.timestamp).toLocaleString("id-ID") : "-"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
