import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Users, 
  FileText, 
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Database
} from "lucide-react"
import { adminApi, SubscriptionPlanItem } from "../api/adminApi"
import { DUMMY_SUBSCRIPTION_PLANS } from "../data/dummyAdminData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"

export default function SubscriptionsScreen() {
  const [plansList, setPlansList] = useState<SubscriptionPlanItem[]>(DUMMY_SUBSCRIPTION_PLANS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null)

  // Form state
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<number>(49000)
  const [billingPeriod, setBillingPeriod] = useState<string>("fixed_days")
  const [durationDays, setDurationDays] = useState<number>(30)
  const [dailyTokenLimit, setDailyTokenLimit] = useState<number>(15)
  const [totalTokensMax, setTotalTokensMax] = useState<number>(450)
  const [dailyFileLimit, setDailyFileLimit] = useState<number>(0)
  const [paperLimit, setPaperLimit] = useState<number>(50)
  const [aiQueryLimit, setAiQueryLimit] = useState<number>(250)
  const [features, setFeatures] = useState<string[]>([
    "Kuota 15 token setiap hari (total 450 token selama 30 hari)",
    "Seluruh fitur terbuka dan tidak ada fitur yang terkunci",
    "Akses penuh Comparative Paper Matrix & Research Gap Map",
    "Fitur AI Editing dan ringkasan paper terstruktur",
  ])
  const [newFeatureInput, setNewFeatureInput] = useState("")
  const [isPopular, setIsPopular] = useState(false)
  const [isActive, setIsActive] = useState(true)

  // Live fetch from FastAPI / PostgreSQL Database
  const { data: apiPlans, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "subscriptions", "plans"],
    queryFn: adminApi.getSubscriptionPlans,
    retry: false,
  })

  // Synchronize state when backend returns live database plans
  useEffect(() => {
    if (apiPlans && apiPlans.length > 0) {
      setPlansList(apiPlans)
    }
  }, [apiPlans])

  const displayPlans = (apiPlans && apiPlans.length > 0) ? apiPlans : plansList

  const resetForm = () => {
    setEditingPlan(null)
    setCode("")
    setName("")
    setDescription("")
    setPrice(49000)
    setBillingPeriod("fixed_days")
    setDurationDays(30)
    setDailyTokenLimit(15)
    setTotalTokensMax(450)
    setDailyFileLimit(0)
    setPaperLimit(50)
    setAiQueryLimit(250)
    setFeatures([
      "Kuota 15 token setiap hari (total 450 token selama 30 hari)",
      "Seluruh fitur terbuka dan tidak ada fitur yang terkunci",
      "Akses penuh Comparative Paper Matrix & Research Gap Map",
    ])
    setNewFeatureInput("")
    setIsPopular(false)
    setIsActive(true)
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan)
    setCode(plan.code)
    setName(plan.name)
    setDescription(plan.description || "")
    setPrice(plan.price)
    setBillingPeriod(plan.billing_period || "fixed_days")
    setDurationDays(plan.duration_days ?? 30)
    setDailyTokenLimit(plan.daily_token_limit ?? 15)
    setTotalTokensMax(plan.total_tokens_max ?? 450)
    setDailyFileLimit(plan.daily_file_limit ?? 0)
    setPaperLimit(plan.paper_limit_per_month ?? 50)
    setAiQueryLimit(plan.ai_query_limit_per_day ?? 250)

    // Format features safely for edit inputs
    const formattedFeatures = (plan.features || []).map((f) =>
      typeof f === "string" ? f : f?.text || ""
    ).filter(Boolean)
    setFeatures(formattedFeatures)

    setIsPopular(plan.is_popular)
    setIsActive(plan.is_active)
    setIsModalOpen(true)
  }

  const handleAddFeature = () => {
    if (newFeatureInput.trim()) {
      setFeatures([...features, newFeatureInput.trim()])
      setNewFeatureInput("")
    }
  }

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPlan) {
      // Update local state immediately
      const updatedItem: SubscriptionPlanItem = {
        ...editingPlan,
        name,
        description,
        price,
        billing_period: billingPeriod as SubscriptionPlanItem["billing_period"],
        duration_days: durationDays,
        daily_token_limit: dailyTokenLimit,
        total_tokens_max: totalTokensMax,
        daily_file_limit: dailyFileLimit,
        paper_limit_per_month: paperLimit,
        ai_query_limit_per_day: aiQueryLimit,
        features,
        is_popular: isPopular,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }

      setPlansList((prev) => prev.map((p) => p.id === editingPlan.id ? updatedItem : p))
      
      // Background API call
      adminApi.updateSubscriptionPlan(editingPlan.id, {
        name,
        description,
        price,
        billing_period: billingPeriod,
        duration_days: durationDays,
        daily_token_limit: dailyTokenLimit,
        total_tokens_max: totalTokensMax,
        daily_file_limit: dailyFileLimit,
        paper_limit_per_month: paperLimit,
        ai_query_limit_per_day: aiQueryLimit,
        features,
        is_popular: isPopular,
        is_active: isActive,
      }).catch(() => {})

      toast.success(`Konfigurasi paket langganan '${name}' berhasil diperbarui.`)
    } else {
      // Create new plan in local state
      const newPlan: SubscriptionPlanItem = {
        id: `plan-${Date.now()}`,
        code: code.trim().toLowerCase(),
        name,
        description,
        price,
        currency: "IDR",
        billing_period: billingPeriod as SubscriptionPlanItem["billing_period"],
        duration_days: durationDays,
        daily_token_limit: dailyTokenLimit,
        total_tokens_max: totalTokensMax,
        daily_file_limit: dailyFileLimit,
        paper_limit_per_month: paperLimit,
        ai_query_limit_per_day: aiQueryLimit,
        features,
        is_active: isActive,
        is_popular: isPopular,
        sort_order: plansList.length + 1,
        active_subscribers_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setPlansList((prev) => [...prev, newPlan])

      // Background API call
      adminApi.createSubscriptionPlan({
        code: code.trim().toLowerCase(),
        name,
        description,
        price,
        billing_period: billingPeriod,
        duration_days: durationDays,
        daily_token_limit: dailyTokenLimit,
        total_tokens_max: totalTokensMax,
        daily_file_limit: dailyFileLimit,
        paper_limit_per_month: paperLimit,
        ai_query_limit_per_day: aiQueryLimit,
        features,
        is_popular: isPopular,
        is_active: isActive,
      }).catch(() => {})

      toast.success(`Paket langganan baru '${name}' berhasil diterbitkan.`)
    }

    setIsModalOpen(false)
    resetForm()
  }

  const handleDeletePlan = (plan: SubscriptionPlanItem) => {
    if (confirm(`Yakin ingin menonaktifkan atau mengarsipkan paket '${plan.name}'?`)) {
      setPlansList((prev) =>
        prev.map((p) => p.id === plan.id ? { ...p, is_active: false } : p)
      )
      adminApi.deleteSubscriptionPlan(plan.id).catch(() => {})
      toast.info(`Paket langganan '${plan.name}' berhasil dinonaktifkan (diarsipkan).`)
    }
  }

  const formatIDR = (val: number) => {
    if (val === 0) return "Rp0"
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
            <CreditCard className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Konfigurasi Paket Langganan (CMS)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Atur harga paket mahasiswa terjangkau, kuota harian, masa aktif, dan fasilitas fitur kanonik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Badge variant="outline" className="text-[11px] px-2.5 py-1 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 font-medium">
            <Database className="size-3 text-emerald-600" />
            <span>Database Terhubung ({displayPlans.length} Paket)</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch()
              toast.info("Menyegarkan data paket langganan langsung dari database...")
            }}
            disabled={isLoading || isFetching}
            className="text-xs gap-1.5 h-8"
            title="Muat ulang paket langganan dari PostgreSQL"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="text-xs gap-1.5 h-8"
          >
            <Plus className="size-3.5" />
            <span>Buat Paket Baru</span>
          </Button>
        </div>
      </div>

      {/* Grid of Plans - 3 Canonical Student Plans */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayPlans.map((plan) => {
          const isStudent30 = plan.code === "student_30" || plan.price === 49000
          const isStudent14 = plan.code === "student_14" || plan.price === 29000
          const isFree = plan.code === "free" || plan.price === 0

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border bg-card p-5 shadow-sm flex flex-col justify-between relative transition-all hover:shadow-md ${
                isStudent30
                  ? "border-primary ring-2 ring-primary/40 shadow-indigo-100 dark:shadow-none"
                  : isStudent14
                  ? "border-blue-300 dark:border-blue-800"
                  : "border-slate-200 dark:border-slate-800"
              } ${!plan.is_active ? "opacity-60 bg-muted/20" : ""}`}
            >
              {/* Badge Rekomendasi / Kategori di Bagian Atas */}
              {isStudent30 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-0.5 shadow-sm flex items-center gap-1">
                    <Sparkles className="size-3" />
                    <span>Paling Populer & Ekonomis</span>
                  </Badge>
                </div>
              )}

              {isStudent14 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px] font-semibold px-3 py-0.5 shadow-sm flex items-center gap-1">
                    <Sparkles className="size-3" />
                    <span>Paket Tugas & Kajian Cepat</span>
                  </Badge>
                </div>
              )}

              {isFree && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="outline" className="bg-card text-muted-foreground border-slate-300 text-[10px] font-medium px-2.5 py-0.5 shadow-2xs">
                    Akun Dasar / Uji Coba
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between pt-1">
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-tight">{plan.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {plan.code}
                    </p>
                  </div>

                  <Badge variant={plan.is_active ? "default" : "secondary"} className="text-[10px]">
                    {plan.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>

                {plan.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {plan.description}
                  </p>
                )}

                {/* Price Display & Daily Equivalent */}
                <div className="border-y py-3 space-y-1">
                  <div className="text-2xl font-black text-foreground">
                    {formatIDR(plan.price)}
                    {plan.price > 0 ? (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        / {plan.duration_days ? `${plan.duration_days} hari` : plan.billing_period === "fixed_days" ? "periode" : "bln"}
                      </span>
                    ) : (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        (Gratis Selamanya)
                      </span>
                    )}
                  </div>

                  {/* Per Day Breakdown */}
                  {plan.code === "student_14" && (
                    <p className="text-[11px] text-primary font-medium">
                      ⚡ Setara Rp2.071 per hari
                    </p>
                  )}
                  {plan.code === "student_30" && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ⚡ Setara sekitar Rp1.633 per hari (Hemat 21%)
                    </p>
                  )}
                  {isFree && (
                    <p className="text-[11px] text-muted-foreground">
                      ✓ Tanpa biaya & tanpa perlu kartu kredit
                    </p>
                  )}

                  {/* Quota Badges */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1.5 flex-wrap">
                    {plan.daily_file_limit ? (
                      <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300 font-medium">
                        <FileText className="size-3 mr-1 text-primary" />
                        {plan.daily_file_limit} File / Hari
                      </Badge>
                    ) : null}

                    {plan.daily_token_limit ? (
                      <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-700 dark:text-indigo-300 font-medium">
                        <Sparkles className="size-3 mr-1 text-indigo-600" />
                        {plan.daily_token_limit} Token / Hari
                      </Badge>
                    ) : null}

                    {plan.total_tokens_max ? (
                      <span className="text-[10px] text-muted-foreground">
                        (Maks {plan.total_tokens_max} Token)
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Fasilitas Termasuk:
                  </p>
                  <ul className="space-y-2 text-xs">
                    {plan.features.map((f, i) => {
                      const isObj = typeof f === "object" && f !== null
                      const text = isObj ? (f as any).text : String(f)
                      const statusBadge = isObj ? (f as any).status_badge : null
                      const isAvailable = isObj ? (f as any).is_available !== false : true
                      const isLimited = isObj ? (f as any).is_limited : false

                      return (
                        <li key={i} className="flex items-start justify-between gap-1.5">
                          <div className="flex items-start gap-1.5 min-w-0">
                            {isAvailable ? (
                              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            ) : isLimited ? (
                              <AlertCircle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <X className="size-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                            )}
                            <span className={`text-[11px] leading-tight ${isAvailable ? "text-foreground" : "text-muted-foreground"}`}>
                              {text}
                            </span>
                          </div>
                          {statusBadge && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0 font-medium ml-1">
                              {statusBadge}
                            </Badge>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              {/* Bottom Actions & Subscriber Count */}
              <div className="pt-4 mt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5 text-primary" />
                  <span>
                    <strong>{plan.active_subscribers_count}</strong> Peneliti Aktif
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(plan)}
                    className="h-7 w-7 p-0 text-xs"
                    title="Ubah Konfigurasi Paket"
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlan(plan)}
                    className="h-7 w-7 p-0 text-xs text-destructive hover:bg-destructive/10"
                    title="Hapus / Arsipkan Paket"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <CreditCard className="size-4 text-primary" />
                <span>{editingPlan ? "Modifikasi Paket Langganan Mahasiswa" : "Buat Paket Langganan Baru"}</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Kode Unik Paket</label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={!!editingPlan}
                    placeholder="misal: student_30"
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Nama Paket</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="misal: Student Pro – 30 Hari"
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Deskripsi Target Mahasiswa</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Target mahasiswa atau manfaat utama paket..."
                  rows={2}
                  className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Harga (IDR)</label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Periode Tagihan</label>
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="fixed_days">Hari Tetap (Fixed Days)</option>
                    <option value="free">Gratis (Free)</option>
                    <option value="monthly">Bulanan (Monthly)</option>
                    <option value="annual">Tahunan (Annual)</option>
                    <option value="lifetime">Seumur Hidup (Lifetime)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Masa Aktif (Hari)</label>
                  <Input
                    type="number"
                    min="0"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Kuota Token / Hari</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyTokenLimit}
                    onChange={(e) => setDailyTokenLimit(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Maksimal Total Token</label>
                  <Input
                    type="number"
                    min="0"
                    value={totalTokensMax}
                    onChange={(e) => setTotalTokensMax(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Features List CMS */}
              <div className="space-y-2 border-t pt-3">
                <label className="font-medium text-foreground">Fasilitas / Fitur Unggulan</label>
                <div className="flex gap-2">
                  <Input
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    placeholder="Tambah poin fasilitas paket..."
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddFeature()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFeature}
                    className="text-xs shrink-0"
                  >
                    Tambah
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-secondary/50 px-2.5 py-1.5 rounded text-[11px]">
                      <span>• {f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 border-t pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">Paket Rekomendasi (Popular)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">Status Aktif</span>
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
                  className="text-xs"
                >
                  {editingPlan ? "Simpan Perubahan" : "Terbitkan Paket Baru"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
