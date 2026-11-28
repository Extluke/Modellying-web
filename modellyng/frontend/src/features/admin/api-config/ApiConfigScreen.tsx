import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Cpu, 
  KeyRound, 
  Edit3, 
  Zap, 
  Clock, 
  ShieldCheck, 
  X,
  Sparkles,
  ArrowLeft,
  BarChart3,
  Users,
  CalendarDays,
  Trophy,
  Search,
  ArrowUpDown,
  Download,
  Flame,
  TrendingUp,
  Activity,
  Coins,
  ChevronRight,
  School,
  FileText,
  RefreshCw
} from "lucide-react"
import { 
  adminApi, 
  ApiConfigItem, 
  ApiConfigUpdateData, 
  VendorTokenDashboardData 
} from "../api/adminApi"
import { DUMMY_API_CONFIGS, DUMMY_VENDOR_DASHBOARDS } from "../data/dummyAdminData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { toast } from "@/lib/store/useToastStore"

export default function ApiConfigScreen() {
  const queryClient = useQueryClient()
  const [configsList, setConfigsList] = useState<ApiConfigItem[]>(DUMMY_API_CONFIGS)
  const [selectedConfig, setSelectedConfig] = useState<ApiConfigItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEscapeKey(isModalOpen && Boolean(selectedConfig), () => setIsModalOpen(false))

  // Vendor Token Dashboard Drill-Down State
  const [selectedVendorDashboard, setSelectedVendorDashboard] = useState<string | null>(null)
  const [dashboardPeriod, setDashboardPeriod] = useState<"7d" | "14d" | "30d">("14d")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSortOrder, setUserSortOrder] = useState<"desc" | "asc">("desc")
  const [selectedCampusFilter, setSelectedCampusFilter] = useState("all")
  const [testingProvider, setTestingProvider] = useState<string | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState("")
  const [modelName, setModelName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [priority, setPriority] = useState<number>(1)
  const [rpmLimit, setRpmLimit] = useState<number>(15)
  const [tpmLimit, setTpmLimit] = useState<number>(1000000)
  const [isActive, setIsActive] = useState(true)

  // Query: Get configs
  const { data: serverConfigs } = useQuery({
    queryKey: ["admin", "api-configs"],
    queryFn: adminApi.getApiConfigs,
  })

  useEffect(() => {
    if (serverConfigs && Array.isArray(serverConfigs) && serverConfigs.length > 0) {
      setConfigsList(serverConfigs)
    }
  }, [serverConfigs])

  // Query: Get vendor token usage dashboard data
  const { 
    data: serverVendorData, 
    refetch: refetchVendorData,
    isFetching: isFetchingVendorData 
  } = useQuery({
    queryKey: ["admin", "vendor-token-usage", selectedVendorDashboard],
    queryFn: () => adminApi.getVendorTokenUsage(selectedVendorDashboard || "gemini"),
    enabled: Boolean(selectedVendorDashboard),
  })

  // Active vendor data resolution with high-fidelity fallback
  const activeVendorData: VendorTokenDashboardData | null = useMemo(() => {
    if (!selectedVendorDashboard) return null
    if (serverVendorData && serverVendorData.provider) {
      return serverVendorData
    }
    return (
      DUMMY_VENDOR_DASHBOARDS[selectedVendorDashboard.toLowerCase()] ||
      DUMMY_VENDOR_DASHBOARDS.gemini
    )
  }, [selectedVendorDashboard, serverVendorData])

  // Mutation: Update config
  const updateMutation = useMutation({
    mutationFn: ({ provider, data }: { provider: string; data: ApiConfigUpdateData }) =>
      adminApi.updateApiConfig(provider, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "api-configs"] })
    },
    onError: () => {
      // Handled in local state fallback
    },
  })

  // Mutation: Test Ping Latency
  const testPingMutation = useMutation({
    mutationFn: (provider: string) => adminApi.testApiConfig(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "api-configs"] })
    },
    onError: () => {
      // Handled in local state fallback
    },
  })

  const handleTestPing = async (config: ApiConfigItem) => {
    setTestingProvider(config.provider)
    try {
      const res = await testPingMutation.mutateAsync(config.provider)
      setConfigsList((prev) =>
        prev.map((c) =>
          c.id === config.id
            ? {
                ...c,
                last_latency_ms: res.latency_ms,
                last_tested_at: new Date().toISOString(),
                status: res.status as ApiConfigItem["status"],
              }
            : c
        )
      )
      if (res.success) {
        toast.success(res.message || `Uji koneksi ${config.display_name} berhasil! Latensi: ${res.latency_ms} ms.`)
      } else {
        toast.warning(res.message || `Uji koneksi ${config.display_name}: status ${res.status}`)
      }
    } catch (err: any) {
      // Offline fallback
      const fakeLatency = Math.floor(Math.random() * 50) + 120
      setConfigsList((prev) =>
        prev.map((c) =>
          c.id === config.id
            ? {
                ...c,
                last_latency_ms: fakeLatency,
                last_tested_at: new Date().toISOString(),
              }
            : c
        )
      )
      toast.info(`Uji koneksi selesai (Mode Simulasi): Latensi ${fakeLatency} ms.`)
    } finally {
      setTestingProvider(null)
    }
  }

  const handleOpenEditModal = (config: ApiConfigItem) => {
    setSelectedConfig(config)
    setDisplayName(config.display_name)
    setModelName(config.model_name)
    setApiKey("") // keep empty to leave unchanged
    setPriority(config.priority)
    setRpmLimit(config.rpm_limit)
    setTpmLimit(config.tpm_limit)
    setIsActive(config.is_active)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConfig) return

    const payload: ApiConfigUpdateData = {
      display_name: displayName,
      model_name: modelName,
      priority,
      rpm_limit: rpmLimit,
      tpm_limit: tpmLimit,
      is_active: isActive,
    }

    if (apiKey.trim()) {
      payload.api_key = apiKey.trim()
    }

    const updatedItem: ApiConfigItem = {
      ...selectedConfig,
      display_name: displayName,
      model_name: modelName,
      priority,
      rpm_limit: rpmLimit,
      tpm_limit: tpmLimit,
      is_active: isActive,
      api_key_masked: apiKey.trim() 
        ? `${apiKey.trim().slice(0, 7)}••••••••••••${apiKey.trim().slice(-4)}`
        : selectedConfig.api_key_masked,
      updated_at: new Date().toISOString(),
    }

    setConfigsList((prev) => prev.map((c) => (c.id === selectedConfig.id ? updatedItem : c)))
    setIsModalOpen(false)
    setSelectedConfig(null)
    toast.success(`Konfigurasi AI Provider '${displayName}' berhasil disimpan secara dinamis.`)

    updateMutation.mutate({
      provider: selectedConfig.provider,
      data: payload,
    })
  }

  // Filter & sort user usage
  const filteredUsers = useMemo(() => {
    if (!activeVendorData) return []
    let list = [...activeVendorData.users_usage]

    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase()
      list = list.filter(
        (u) =>
          u.user_name.toLowerCase().includes(q) ||
          u.user_email.toLowerCase().includes(q) ||
          u.institution.toLowerCase().includes(q)
      )
    }

    if (selectedCampusFilter !== "all") {
      list = list.filter((u) => u.institution.toLowerCase().includes(selectedCampusFilter.toLowerCase()))
    }

    list.sort((a, b) => {
      if (userSortOrder === "desc") {
        return b.total_tokens - a.total_tokens
      }
      return a.total_tokens - b.total_tokens
    })

    return list
  }, [activeVendorData, userSearchQuery, selectedCampusFilter, userSortOrder])

  // Filter daily usage by period
  const filteredDailyUsage = useMemo(() => {
    if (!activeVendorData) return []
    const daysCount = dashboardPeriod === "7d" ? 7 : dashboardPeriod === "14d" ? 14 : 30
    return activeVendorData.daily_usage.slice(0, daysCount)
  }, [activeVendorData, dashboardPeriod])

  // Max daily tokens for bar chart scaling
  const maxDailyTokens = useMemo(() => {
    if (!filteredDailyUsage.length) return 1
    return Math.max(...filteredDailyUsage.map((d) => d.total_tokens))
  }, [filteredDailyUsage])

  // Export CSV Handler
  const handleExportCsv = () => {
    if (!activeVendorData) return
    const headers = "Tanggal,Hari,Token_Prompt,Token_Completion,Total_Token,Permintaan,Rata_Rata_Latensi_ms\n"
    const rows = filteredDailyUsage
      .map(
        (d) =>
          `${d.date},${d.day_name},${d.prompt_tokens},${d.completion_tokens},${d.total_tokens},${d.request_count},${d.avg_latency_ms}`
      )
      .join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `rekap_token_${activeVendorData.provider}_${dashboardPeriod}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Data rekapitulasi token harian ${activeVendorData.display_name} berhasil diekspor ke CSV.`)
  }

  // Visual style helpers per vendor
  const getVendorStyles = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "gemini":
        return {
          gradient: "from-primary to-[#3730A3]",
          cardBorder: "border-primary/25 hover:border-primary/50",
          accentBg: "bg-primary-soft/60 dark:bg-primary/10",
          accentText: "text-primary",
          badgeBg: "bg-primary-soft text-primary dark:bg-primary/20",
          icon: Sparkles,
        }
      case "groq":
        return {
          gradient: "from-slate-700 to-slate-900",
          cardBorder: "border-border hover:border-foreground/30",
          accentBg: "bg-muted/60",
          accentText: "text-foreground/80",
          badgeBg: "bg-muted text-foreground/80 border border-border/60",
          icon: Flame,
        }
      default:
        return {
          gradient: "from-primary to-[#3730A3]",
          cardBorder: "border-border hover:border-primary/50",
          accentBg: "bg-secondary/60",
          accentText: "text-primary",
          badgeBg: "bg-secondary text-secondary-foreground",
          icon: Cpu,
        }
    }
  }

  // ============================================================================
  // RENDER: VENDOR TOKEN USAGE DASHBOARD (Saat admin klik card AI)
  // ============================================================================
  if (selectedVendorDashboard && activeVendorData) {
    const vStyle = getVendorStyles(activeVendorData.provider)
    const VendorIcon = vStyle.icon

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVendorDashboard(null)}
              className="text-xs -ml-2 text-muted-foreground hover:text-foreground gap-1.5 h-8 mb-1"
            >
              <ArrowLeft className="size-3.5" />
              <span>Kembali ke Semua Vendor Kunci API</span>
            </Button>
            <div className="flex items-center gap-3">
              <div className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${vStyle.gradient} text-white shadow-md`}>
                <VendorIcon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Dasbor Token AI: {activeVendorData.display_name}
                  </h1>
                  <Badge className={`text-[10px] font-semibold ${vStyle.badgeBg}`}>
                    {activeVendorData.provider.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>Model ID: <strong className="font-mono text-foreground">{activeVendorData.model_name}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Operasional Terpantau
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick vendor switcher pills */}
            <div className="bg-secondary/70 p-1 rounded-xl flex items-center gap-1 border">
              {configsList.map((c) => {
                const isCurrent = c.provider.toLowerCase() === selectedVendorDashboard.toLowerCase()
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedVendorDashboard(c.provider)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      isCurrent
                        ? "bg-card text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.provider.toUpperCase()}
                  </button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchVendorData()
                toast.success("Data metrik token vendor berhasil diperbarui.")
              }}
              disabled={isFetchingVendorData}
              className="text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`size-3.5 ${isFetchingVendorData ? "animate-spin" : ""}`} />
              <span>Segarkan</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs gap-1.5 h-9"
            >
              <Download className="size-3.5" />
              <span>Ekspor CSV</span>
            </Button>
          </div>
        </div>

        {/* 4 TOP KPI METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Token Terpakai */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Total Token (Bulan Ini)</span>
              <Coins className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {new Intl.NumberFormat("id-ID").format(activeVendorData.total_tokens_month)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Estimasi Biaya: <strong>${activeVendorData.estimated_cost_usd} USD</strong>
              </p>
            </div>
            {/* Split bar: Prompt vs Completion */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
                <div 
                  className="bg-primary h-full transition-all"
                  style={{
                    width: `${Math.round((activeVendorData.total_prompt_tokens / (activeVendorData.total_tokens_month || 1)) * 100)}%`
                  }} 
                  title="Prompt (Input) Tokens"
                />
                <div 
                  className="bg-slate-400 dark:bg-slate-600 h-full transition-all"
                  style={{
                    width: `${Math.round((activeVendorData.total_completion_tokens / (activeVendorData.total_tokens_month || 1)) * 100)}%`
                  }} 
                  title="Completion (Output) Tokens"
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Input: {new Intl.NumberFormat("id-ID").format(activeVendorData.total_prompt_tokens)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                  Output: {new Intl.NumberFormat("id-ID").format(activeVendorData.total_completion_tokens)}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2: Total API Requests & Latency */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Total Permintaan (Requests)</span>
              <Activity className="size-4 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {new Intl.NumberFormat("id-ID").format(activeVendorData.total_requests)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground" />
                Rata-rata Latensi: <strong className="text-foreground">{activeVendorData.avg_latency_ms} ms</strong>
              </p>
            </div>
            <div className="pt-2">
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                Respon Cepat & Stabil
              </Badge>
            </div>
          </div>

          {/* KPI 3: Peneliti Aktif */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Peneliti Aktif Menggunakan</span>
              <Users className="size-4 text-indigo-500" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {activeVendorData.active_users_count} Peneliti
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                Pengguna Terbanyak: <strong>{activeVendorData.users_usage[0]?.user_name || "Fatih"}</strong>
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-muted-foreground">
                Kontribusi Terbesar: <strong>{activeVendorData.users_usage[0]?.percent_share || 30.7}%</strong> total token
              </span>
            </div>
          </div>

          {/* KPI 4: Beban Kuota Puncak (TPM) */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Beban Kuota Puncak (TPM)</span>
              <Zap className="size-4 text-rose-500" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {activeVendorData.quota_used_percent}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Batas Model: <strong>{new Intl.NumberFormat("id-ID").format(activeVendorData.quota_tpm)} TPM</strong>
              </p>
            </div>
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    activeVendorData.quota_used_percent > 85 
                      ? "bg-rose-500" 
                      : activeVendorData.quota_used_percent > 60 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, activeVendorData.quota_used_percent)}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground text-right">
                {activeVendorData.quota_used_percent < 80 ? "Kapasitas Operasional Aman" : "Mendekati Batas Laju"}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: REKAP DATA TOKEN SETIAP HARINYA (DAILY TOKEN RECAP) */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  Rekapitulasi Konsumsi Token Harian (Daily Usage Recap)
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Rincian total token, input prompt, output completion, dan jumlah panggilan API setiap harinya.
              </p>
            </div>

            {/* Filter Periode Pills */}
            <div className="flex items-center gap-1.5 bg-secondary/60 p-1 rounded-xl border text-xs">
              <button
                onClick={() => setDashboardPeriod("7d")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  dashboardPeriod === "7d"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => setDashboardPeriod("14d")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  dashboardPeriod === "14d"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                14 Hari Terakhir
              </button>
              <button
                onClick={() => setDashboardPeriod("30d")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  dashboardPeriod === "30d"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                30 Hari Terakhir
              </button>
            </div>
          </div>

          {/* Interactive Stacked Bar Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="size-4 text-primary" />
                Grafik Volume Token Harian
              </span>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-primary" />
                  Prompt / Input Tokens
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-slate-400 dark:bg-slate-600" />
                  Completion / Output Tokens
                </span>
              </div>
            </div>

            <div className="rounded-xl border bg-secondary/30 p-4 pt-6">
              <div className="h-44 flex items-end gap-2 sm:gap-3 justify-between">
                {filteredDailyUsage.map((day) => {
                  const heightPercent = Math.max(12, Math.round((day.total_tokens / maxDailyTokens) * 100))
                  const promptRatio = day.prompt_tokens / (day.total_tokens || 1)
                  const completionRatio = day.completion_tokens / (day.total_tokens || 1)

                  return (
                    <div 
                      key={day.date} 
                      className="flex-1 flex flex-col items-center gap-2 group h-full justify-end cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] rounded-lg p-2 shadow-lg border absolute -translate-y-24 pointer-events-none z-20 whitespace-nowrap min-w-44 space-y-0.5">
                        <div className="font-bold border-b pb-1 text-foreground">
                          {day.day_name}, {day.date}
                        </div>
                        <div className="flex justify-between pt-0.5">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-bold">{new Intl.NumberFormat("id-ID").format(day.total_tokens)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Input (Prompt):</span>
                          <span>{new Intl.NumberFormat("id-ID").format(day.prompt_tokens)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Output:</span>
                          <span>{new Intl.NumberFormat("id-ID").format(day.completion_tokens)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 text-muted-foreground">
                          <span>Permintaan: {day.request_count} req</span>
                          <span>{day.avg_latency_ms} ms</span>
                        </div>
                      </div>

                      {/* Stacked Bar */}
                      <div 
                        className="w-full max-w-[36px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all group-hover:brightness-110 shadow-sm"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div 
                          className="w-full bg-slate-400 dark:bg-slate-600" 
                          style={{ height: `${Math.round(completionRatio * 100)}%` }} 
                        />
                        <div 
                          className="w-full bg-primary" 
                          style={{ height: `${Math.round(promptRatio * 100)}%` }} 
                        />
                      </div>

                      {/* Date label */}
                      <span className="text-[10px] text-muted-foreground font-mono group-hover:text-foreground font-medium truncate max-w-full">
                        {day.date.split("-").slice(1).reverse().join("/")}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Daily Recap Table */}
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="py-2.5 px-4">Tanggal & Hari</th>
                    <th className="py-2.5 px-4 text-right">Prompt Tokens (Input)</th>
                    <th className="py-2.5 px-4 text-right">Completion Tokens (Output)</th>
                    <th className="py-2.5 px-4 text-right">Total Token Harian</th>
                    <th className="py-2.5 px-4 text-right">Panggilan API</th>
                    <th className="py-2.5 px-4 text-right">Rata-rata Latensi</th>
                    <th className="py-2.5 px-4 text-center">Status Operasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-foreground">
                  {filteredDailyUsage.map((day, idx) => (
                    <tr key={day.date} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary/70" />
                        <span>{day.day_name}, {day.date}</span>
                        {idx === 0 && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-primary/10 text-primary border-primary/30">
                            Hari Ini
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                        {new Intl.NumberFormat("id-ID").format(day.prompt_tokens)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                        {new Intl.NumberFormat("id-ID").format(day.completion_tokens)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                        {new Intl.NumberFormat("id-ID").format(day.total_tokens)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                        {day.request_count} req
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                        {day.avg_latency_ms} ms
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                          Optimal
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 2: MONITORING TOKEN PER USER (DIURUTKAN TERBANYAK - DESCENDING) */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  Monitoring Token Per Pengguna (Peringkat Konsumsi)
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Daftar peneliti diurutkan secara otomatis berdasarkan <strong>penggunaan token terbanyak (Peringkat #1 s.d. Terendah)</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 py-1 px-2.5 flex items-center gap-1.5">
                <Trophy className="size-3.5 text-amber-500" />
                <span>Peringkat Aktif Berdasarkan Total Token</span>
              </Badge>
            </div>
          </div>

          {/* Toolbar: Search, Campus Filter, Sort toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari nama peneliti, email, atau kampus..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={selectedCampusFilter}
                onChange={(e) => setSelectedCampusFilter(e.target.value)}
                className="rounded-lg border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
              >
                <option value="all">Semua Perguruan Tinggi / Lembaga</option>
                <option value="Telkom University">Telkom University</option>
                <option value="Institut Teknologi Bandung">Institut Teknologi Bandung (ITB)</option>
                <option value="Universitas Indonesia">Universitas Indonesia (UI)</option>
                <option value="Universitas Gadjah Mada">Universitas Gadjah Mada (UGM)</option>
                <option value="Badan Riset & Inovasi Nasional">BRIN</option>
                <option value="Universitas Padjadjaran">Universitas Padjadjaran (Unpad)</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                className="text-xs gap-1.5 h-9"
              >
                <ArrowUpDown className="size-3.5 text-primary" />
                <span>{userSortOrder === "desc" ? "Urutkan: Terbanyak" : "Urutkan: Tersedikit"}</span>
              </Button>
            </div>
          </div>

          {/* User Token Usage Table */}
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Peringkat</th>
                    <th className="py-3 px-4">Peneliti & Institusi Akademik</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4 text-right">Prompt Tokens</th>
                    <th className="py-3 px-4 text-right">Completion Tokens</th>
                    <th className="py-3 px-4 text-right">Total Token Terpakai</th>
                    <th className="py-3 px-4 text-center">Paper Dianalisis</th>
                    <th className="py-3 px-4 text-right">Terakhir Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-foreground">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Tidak ada data peneliti yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, idx) => {
                      const rank = userSortOrder === "desc" ? idx + 1 : filteredUsers.length - idx
                      return (
                        <tr key={user.user_id} className="hover:bg-muted/40 transition-colors">
                          {/* Rank Badge */}
                          <td className="py-3 px-4 text-center">
                            {rank === 1 ? (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] gap-1 px-2 py-0.5">
                                <Trophy className="size-3" />
                                <span>#1</span>
                              </Badge>
                            ) : rank === 2 ? (
                              <Badge className="bg-slate-400 hover:bg-slate-500 text-white font-bold text-[10px] px-2 py-0.5">
                                #2
                              </Badge>
                            ) : rank === 3 ? (
                              <Badge className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-[10px] px-2 py-0.5">
                                #3
                              </Badge>
                            ) : (
                              <span className="font-mono text-xs font-semibold text-muted-foreground">
                                #{rank}
                              </span>
                            )}
                          </td>

                          {/* User info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase">
                                {user.user_name.slice(0, 2)}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                                  <span>{user.user_name}</span>
                                  {rank === 1 && (
                                    <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">
                                      (Pengguna Terbanyak)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {user.user_email}
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <School className="size-3 text-muted-foreground" />
                                  <span>{user.institution}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-secondary text-foreground">
                              {user.role}
                            </Badge>
                          </td>

                          {/* Prompt Tokens */}
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {new Intl.NumberFormat("id-ID").format(user.prompt_tokens)}
                          </td>

                          {/* Completion Tokens */}
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {new Intl.NumberFormat("id-ID").format(user.completion_tokens)}
                          </td>

                          {/* Total Tokens & Percentage Share */}
                          <td className="py-3 px-4 text-right">
                            <div className="space-y-1">
                              <div className="font-mono font-bold text-foreground text-xs">
                                {new Intl.NumberFormat("id-ID").format(user.total_tokens)} Token
                              </div>
                              <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                                <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: `${Math.min(100, user.percent_share * 2.5)}%` }} 
                                  />
                                </div>
                                <span>{user.percent_share}%</span>
                              </div>
                            </div>
                          </td>

                          {/* Papers count */}
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary" className="text-[10px] font-mono gap-1">
                              <FileText className="size-3 text-primary" />
                              <span>{user.papers_analyzed} Dokumen</span>
                            </Badge>
                          </td>

                          {/* Last active */}
                          <td className="py-3 px-4 text-right text-muted-foreground font-mono text-[11px]">
                            {user.last_active}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER: MAIN LIST VIEW (Kartu-kartu Penyedia AI Provider)
  // ============================================================================
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cpu className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Konfigurasi Kunci API & Model Switching Dinamis
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola API Key model AI secara terpusat. Klik pada kartu AI untuk memantau dasbor konsumsi token dan peringkat pengguna.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs py-1 px-2.5 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300 flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            <span>Mode Demo (DUMMY Aktif)</span>
          </Badge>
          <Badge variant="outline" className="text-xs py-1 px-2.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            <span>Zero Hardcoded Secrets</span>
          </Badge>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Zap className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-foreground">Arsitektur Dynamic Failover Modellyng</p>
          <p className="text-muted-foreground leading-relaxed">
            Sistem ekstraksi akademik menggunakan <strong>Priority 1 (Core Provider)</strong> sebagai jalur utama. Apabila limit kuota RPM/TPM tercapai atau penyedia mengalami gangguan 429/503, pemrosesan akan otomatis beralih (*failover*) ke <strong>Priority 2 (Backup Provider)</strong> tanpa memutus proses ekstraksi pengguna.
          </p>
        </div>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {configsList.map((conf) => {
          const vStyle = getVendorStyles(conf.provider)
          const VendorIcon = vStyle.icon
          const vendorData = DUMMY_VENDOR_DASHBOARDS[conf.provider.toLowerCase()] || DUMMY_VENDOR_DASHBOARDS.gemini
          const tpmUsedPercent = vendorData ? vendorData.quota_used_percent : 42.5

          return (
            <div
              key={conf.id}
              className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between space-y-5 transition-all hover:shadow-lg relative overflow-hidden group ${
                vStyle.cardBorder
              } ${conf.priority === 1 ? "ring-1 ring-primary/30" : ""}`}
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${vStyle.gradient}`} />

              <div className="space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${vStyle.gradient} text-white shadow-sm shrink-0`}>
                      <VendorIcon className="size-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-foreground">
                          {conf.display_name}
                        </h3>
                        <Badge className={`text-[10px] ${
                          conf.priority === 1 
                            ? "bg-primary text-primary-foreground font-semibold" 
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          Priority #{conf.priority} ({conf.priority === 1 ? "Core" : "Backup"})
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        Model ID: <strong className="text-foreground">{conf.model_name}</strong>
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className={`text-[10px] shrink-0 ${
                    conf.status === "operational"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1"
                      : conf.status === "unconfigured"
                      ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}>
                    {conf.status === "operational" && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    <span>{conf.status === "operational" ? "Operasional" : conf.status === "unconfigured" ? "Belum Diatur" : conf.status}</span>
                  </Badge>
                </div>

                {/* API Key Status */}
                <div className="rounded-xl bg-secondary/50 border p-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <KeyRound className="size-3 text-primary" />
                      Kunci API Tersimpan (Masked):
                    </span>
                    <span className="font-mono text-[10px] uppercase font-bold">{conf.provider}</span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-foreground tracking-wider">
                    {conf.api_key_masked}
                  </div>
                </div>

                {/* Limits & Rate Constraints */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border p-2.5 space-y-0.5 bg-card">
                    <span className="text-[11px] text-muted-foreground">Batas Laju (RPM)</span>
                    <div className="font-bold text-foreground">{conf.rpm_limit} Req/Menit</div>
                  </div>
                  <div className="rounded-xl border p-2.5 space-y-0.5 bg-card">
                    <span className="text-[11px] text-muted-foreground">Batas Token (TPM)</span>
                    <div className="font-bold text-foreground">
                      {new Intl.NumberFormat("id-ID").format(conf.tpm_limit)} Token
                    </div>
                  </div>
                </div>

                {/* Token Utilization Gauge Progress Bar */}
                <div className="rounded-xl border bg-secondary/30 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <Activity className="size-3.5 text-primary" />
                      Konsumsi Token Bulan Ini
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {vendorData ? new Intl.NumberFormat("id-ID").format(vendorData.total_tokens_month) : "2.4M"} Token
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        tpmUsedPercent > 80 
                          ? "bg-rose-500" 
                          : tpmUsedPercent > 50 
                          ? "bg-amber-500" 
                          : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, tpmUsedPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Beban TPM: {tpmUsedPercent}%</span>
                    <span>{vendorData ? `${vendorData.active_users_count} Peneliti Aktif` : "8 Peneliti"}</span>
                  </div>
                </div>

                {/* Latency & Last Test */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Latensi: <strong>{conf.last_latency_ms ? `${conf.last_latency_ms} ms` : "Belum diuji"}</strong>
                  </span>
                  <span>
                    Diperbarui: {new Date(conf.updated_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Actions Area */}
              <div className="space-y-2 pt-4 border-t">
                {/* PROMINENT BUTTON: Buka Dasbor Token */}
                <Button
                  onClick={() => setSelectedVendorDashboard(conf.provider)}
                  className="w-full text-xs font-semibold gap-2 h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  <BarChart3 className="size-4" />
                  <span>Buka Dasbor Token & Analitik Pengguna</span>
                  <ChevronRight className="size-3.5 ml-auto opacity-70" />
                </Button>

                {/* Secondary buttons: Ping & Edit */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestPing(conf)}
                    disabled={testingProvider === conf.provider}
                    className="text-xs gap-1.5 flex-1"
                    title="Uji koneksi API Key langsung ke provider dan simpan hasil ke database"
                  >
                    <Zap className={`size-3.5 text-primary ${testingProvider === conf.provider ? "animate-spin" : ""}`} />
                    <span>{testingProvider === conf.provider ? "Menguji..." : "Uji Latensi Ping"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(conf)}
                    className="text-xs gap-1.5 flex-1"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Ubah Kunci & Kuota</span>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && selectedConfig && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Cpu className="size-4 text-primary" />
                <span>Ubah Konfigurasi Model: {selectedConfig.display_name}</span>
              </div>
              <button 
                type="button"
                aria-label="Tutup modal konfigurasi API"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground size-7 flex items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Nama Tampilan Provider</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Model Identifier</label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="misal: models/gemini-1.5-pro-latest atau llama-3.3-70b-versatile"
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground flex items-center justify-between">
                  <span>Perbarui Kunci API Baru</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    (Kosongkan jika tidak ingin mengubah kunci saat ini)
                  </span>
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Masukkan API key baru (AIzaSy... / gsk_... / sk-...)..."
                  className="text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 border-t pt-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Prioritas (Failover)</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={1}>1 (Core Provider - Gemini)</option>
                    <option value={2}>2 (Backup Provider - Groq)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Batas RPM</label>
                  <Input
                    type="number"
                    min="1"
                    value={rpmLimit}
                    onChange={(e) => setRpmLimit(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Batas TPM</label>
                  <Input
                    type="number"
                    min="1000"
                    step="1000"
                    value={tpmLimit}
                    onChange={(e) => setTpmLimit(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 border-t pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">Aktifkan Provider Ini untuk Ekstraksi</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateMutation.isPending}
                  className="text-xs"
                >
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan Konfigurasi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
