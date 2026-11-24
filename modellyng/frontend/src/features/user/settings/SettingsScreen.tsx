import { useMemo } from "react"
import {
  Settings,
  User,
  Sliders,
  LogOut,
  Crown,
  Sparkles,
  ArrowRight,
  BarChart3,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  History,
} from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/features/auth/store/authStore"
import { ROUTES } from "@/app/routes"
import { formatSubscriptionTierName } from "@/features/user/pricing/utils/whatsappPricing"
import { useUserQuota, useUserUsageLogs } from "@/features/user/pricing/hooks/useUserQuota"
import { useSubscriptionPlans } from "@/features/user/pricing/hooks/useSubscriptionPlans"
import { toast } from "@/lib/store/useToastStore"

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { quota, isLoading: isQuotaLoading, invalidateQuota } = useUserQuota()
  const { data: usageLogs, isLoading: isLogsLoading } = useUserUsageLogs(5)
  const { plans: subscriptionPlans } = useSubscriptionPlans()

  const isDev = quota?.is_developer ?? (user?.subscription_tier === "developer" || user?.role === "admin")
  const isPro =
    quota?.tier_category === "student" ||
    (Boolean(user?.subscription_tier) && user?.subscription_tier !== "free" && user?.subscription_tier !== "developer")

  const paidPlansText = useMemo(() => {
    const paid = subscriptionPlans.filter((p) => p.priceNumeric > 0 && p.id !== "free")
    if (paid.length > 0) {
      return `Tersedia paket ${paid.map((p) => `${p.name} (${p.priceFormatted})`).join(" dan ")} via WhatsApp Admin`
    }
    return "Pilihan paket langganan fleksibel tersedia via WhatsApp Admin"
  }, [subscriptionPlans])

  const activeTierCode = quota?.tier || user?.subscription_tier || "free"
  const activeTierName = quota?.tier_name || formatSubscriptionTierName(activeTierCode)

  const usedFiles = quota?.files_uploaded_today ?? 0
  const dailyLimit = quota?.daily_file_limit ?? (isDev ? 999999 : isPro ? 15 : 3)
  const remainingFiles = quota?.remaining_files ?? (isDev ? 999999 : Math.max(0, dailyLimit - usedFiles))

  const progressPercent = isDev
    ? 100
    : Math.min(100, Math.round((usedFiles / (dailyLimit || 1)) * 100))

  const getRemainingTimeDisplay = (resetsAtIso?: string): string => {
    if (!resetsAtIso) return "Pukul 00:00 WIB"
    try {
      const diffMs = new Date(resetsAtIso).getTime() - Date.now()
      if (diffMs <= 0) return "segera di-reset"
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}j ${minutes}m lagi`
    } catch {
      return "Pukul 00:00 WIB"
    }
  }

  const handleRefreshQuota = () => {
    invalidateQuota()
    toast.info("Status kuota harian berhasil disinkronkan dengan basis data.", 5000)
  }

  const handleLogout = () => {
    logout()
    toast.info("Anda telah keluar dari sesi Modellyng.", 5000)
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          <span>Pengaturan Akun & Preferensi Sitasi</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Atur profil peneliti, standar format sitasi, dan ambang keyakinan AI.
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile Card */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <User className="size-4 text-primary" />
            <span>Profil Peneliti</span>
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Nama Lengkap</label>
              <input
                type="text"
                defaultValue={user?.full_name || "Peneliti Modellyng"}
                className="h-9 w-full rounded-md border bg-background px-3 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                defaultValue={user?.email || "peneliti@modellyng.ac.id"}
                disabled
                className="h-9 w-full rounded-md border bg-muted px-3 text-xs opacity-75"
              />
            </div>
          </div>
        </div>

        {/* Subscription Plan & Upgrade Access Card (Real-time data) */}
        <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Status Paket Akun</span>
                <Badge
                  variant={isDev ? "primary" : isPro ? "ready" : "muted"}
                  className="text-[10px] font-semibold px-2 py-0.2"
                >
                  {activeTierName} (Aktif)
                </Badge>
                {quota?.days_remaining != null && quota.days_remaining > 0 && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Sisa {quota.days_remaining} Hari
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isDev ? (
                  <>
                    Anda menggunakan akun <strong className="text-foreground">Developer</strong> dengan hak akses administratif penuh dan tanpa batasan kuota.
                  </>
                ) : isPro ? (
                  <>
                    Anda saat ini aktif pada paket <strong className="text-primary">{activeTierName}</strong> dengan kuota <span className="font-semibold text-primary">{dailyLimit} token setiap hari</span>, akses penuh Comparative Matrix, dan Research Gap Map interaktif.
                  </>
                ) : (
                  <>
                    Anda saat ini menggunakan paket <strong className="text-foreground">Free Plan</strong> dengan batas <span className="font-semibold text-foreground">{dailyLimit} upload per hari</span>.
                    Upgrade ke Student Pro untuk mendapatkan <span className="font-semibold text-primary">15 token setiap hari</span>, akses penuh Comparative Matrix, dan Research Gap Map interaktif.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-border/50">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary shrink-0" />
              <span>
                {isPro
                  ? "Dukungan prioritas & perpanjangan paket via WhatsApp Admin"
                  : paidPlansText}
              </span>
            </div>

            <Button asChild size="sm" className="gap-2 text-xs font-semibold rounded-lg shadow-sm shadow-primary/20 shrink-0">
              <Link to={ROUTES.USER.PRICING}>
                <Crown className="size-3.5 text-amber-300" />
                <span>{isPro ? "Kelola / Perpanjang Paket" : "Lihat Pilihan Paket & Upgrade"}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Real-Time Usage Limits Card */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <span>Batas Penggunaan & Kuota Harian (Real-Time Tracking)</span>
            </h3>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRefreshQuota}
                disabled={isQuotaLoading}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                title="Sinkronkan kuota dengan basis data"
              >
                <RefreshCw className={`size-3 ${isQuotaLoading ? "animate-spin text-primary" : ""}`} />
                <span>Sinkron</span>
              </Button>
              <Badge variant="outline" className="text-[10px] font-medium border-muted-foreground/30">
                {activeTierName}
              </Badge>
            </div>
          </div>

          {/* Upload File Progress (Real Data) */}
          <div className="p-3.5 rounded-lg border bg-muted/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Kuota Upload PDF & Ekstraksi Hari Ini</span>
              </span>
              <span className="font-semibold text-foreground">
                {isDev ? (
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    Tanpa Batas <span className="text-[11px] font-normal text-muted-foreground">(Akses Developer)</span>
                  </span>
                ) : (
                  <>
                    <span className={remainingFiles <= 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-primary font-bold"}>
                      {usedFiles} / {dailyLimit} File
                    </span>{" "}
                    <span className="text-[11px] font-normal text-muted-foreground">
                      (Sisa {remainingFiles} file)
                    </span>
                  </>
                )}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isDev
                    ? "bg-purple-600"
                    : remainingFiles <= 0
                      ? "bg-amber-500"
                      : "bg-primary"
                  }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground gap-1 pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-amber-500" />
                Reset berkala: <strong>Setiap 24 Jam (Pukul 00:00 WIB)</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                Reset kuota dalam {getRemainingTimeDisplay(quota?.resets_at)}
              </span>
            </div>
          </div>

          {/* Feature Access Matrix based on Real Tier */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-muted-foreground block">
                Hak Akses Fitur untuk Paket {activeTierName}:
              </label>
              {remainingFiles <= 0 && !isDev && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Batas Harian Tercapai
                </span>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/50">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-[11px]">Ringkasan & Analisis Dasar</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Ekstraksi 11 komponen utama & sitasi dasar aktif.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/50">
                {isDev || isPro ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-[11px]">Comparative Paper Matrix</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isDev || isPro
                      ? "Akses penuh multi-paper, ekspor & perbandingan mendalam."
                      : "Tabel dasar terlihat, perbandingan antar-paper dikunci."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/50">
                {isDev || isPro ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-[11px]">Research Gap Map</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isDev || isPro
                      ? "Visualisasi alur riset interaktif terbuka penuh."
                      : "Preview terbatas, visualisasi flow map dibuat blur."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/50">
                {isDev || isPro ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-[11px]">AI Editing & Rumusan Masalah</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isDev || isPro
                      ? "Bantuan AI untuk merevisi formulasi komponen aktif."
                      : "Terkunci penuh, khusus pengguna Student Pro."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Ledger / Real-time Token Usage History */}
          <div className="pt-2 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <History className="size-3.5 text-primary" />
                <span>Riwayat Transaksi Token & Kuota Terbaru</span>
              </span>
              <span className="text-[10px] text-muted-foreground">
                Tercatat di PostgreSQL Ledger
              </span>
            </div>

            {isLogsLoading ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                Memuat riwayat transaksi...
              </div>
            ) : !usageLogs || usageLogs.length === 0 ? (
              <div className="p-3 rounded-lg border border-dashed bg-muted/20 text-center text-[11px] text-muted-foreground">
                Belum ada aktivitas pemotongan kuota hari ini. Unggah dokumen PDF untuk mulai analisis.
              </div>
            ) : (
              <div className="divide-y rounded-lg border bg-background/60 overflow-hidden">
                {usageLogs.map((log) => {
                  const isRefund = log.action_type === "quota_refund"
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full shrink-0 ${isRefund ? "bg-amber-500" : "bg-primary"
                            }`}
                        />
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground text-[11px] flex items-center gap-1.5">
                            <span>
                              {isRefund
                                ? "Pengembalian Kuota (Auto-Refund)"
                                : "Konsumsi Kuota Unggah Dokumen"}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isRefund
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-primary/10 text-primary"
                                }`}
                            >
                              {isRefund ? `+${log.amount}` : `-${log.amount}`} Kuota
                            </span>
                          </p>
                          {log.notes && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-muted-foreground shrink-0 font-mono">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta",
                          }) + " WIB"
                          : "-"}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Citation Preferences */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            <span>Preferensi Sitasi & Model AI</span>
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Format Standar Daftar Pustaka</label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-xs">
                <option value="APA">APA 7th Edition (Default)</option>
                <option value="IEEE">IEEE Reference Style</option>
                <option value="Harvard">Harvard Referencing</option>
                <option value="Chicago">Chicago Manual of Style</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="font-medium text-muted-foreground">
                  Ambang Batas Keyakinan Peninjauan AI
                </label>
                <span className="font-semibold text-primary">80%</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Komponen dengan skor di bawah 80% akan otomatis masuk ke Antrean Review.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
          >
            <LogOut className="size-3.5" />
            <span>Keluar Akun</span>
          </Button>
          <Button size="sm">Simpan Perubahan</Button>
        </div>
      </div>
    </div>
  )
}
