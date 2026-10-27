import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Users, 
  FileText, 
  MessageSquare,
  X
} from "lucide-react"
import { adminApi, SubscriptionPlanItem, SubscriptionPlanCreateData } from "../api/adminApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"

export default function SubscriptionsScreen() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null)

  // Form state
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<number>(99000)
  const [billingPeriod, setBillingPeriod] = useState<string>("monthly")
  const [paperLimit, setPaperLimit] = useState<number>(50)
  const [aiQueryLimit, setAiQueryLimit] = useState<number>(250)
  const [features, setFeatures] = useState<string[]>([
    "Maksimal 50 dokumen paper per bulan",
    "Ekstraksi prioritas kecepatan tinggi",
    "Tanya AI RAG tanpa batas (250 query/hari)",
  ])
  const [newFeatureInput, setNewFeatureInput] = useState("")
  const [isPopular, setIsPopular] = useState(false)
  const [isActive, setIsActive] = useState(true)

  // Query: Get plans
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ["admin", "subscriptions", "plans"],
    queryFn: adminApi.getSubscriptionPlans,
  })

  // Mutation: Create Plan
  const createMutation = useMutation({
    mutationFn: (data: SubscriptionPlanCreateData) => adminApi.createSubscriptionPlan(data),
    onSuccess: () => {
      toast.success("Paket langganan baru berhasil dibuat.")
      setIsModalOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", "plans"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal membuat paket langganan.")
    },
  })

  // Mutation: Update Plan
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubscriptionPlanCreateData> }) =>
      adminApi.updateSubscriptionPlan(id, data),
    onSuccess: () => {
      toast.success("Konfigurasi paket langganan berhasil diperbarui.")
      setIsModalOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", "plans"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memperbarui paket langganan.")
    },
  })

  // Mutation: Delete/Archive Plan
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscriptionPlan(id),
    onSuccess: (res) => {
      toast.success(res.message || "Paket langganan berhasil diproses.")
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", "plans"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus paket langganan.")
    },
  })

  const resetForm = () => {
    setEditingPlan(null)
    setCode("")
    setName("")
    setDescription("")
    setPrice(99000)
    setBillingPeriod("monthly")
    setPaperLimit(50)
    setAiQueryLimit(250)
    setFeatures([
      "Maksimal 50 dokumen paper per bulan",
      "Ekstraksi prioritas kecepatan tinggi",
      "Tanya AI RAG tanpa batas (250 query/hari)",
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
    setBillingPeriod(plan.billing_period)
    setPaperLimit(plan.paper_limit_per_month)
    setAiQueryLimit(plan.ai_query_limit_per_day)
    setFeatures(plan.features || [])
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
      updateMutation.mutate({
        id: editingPlan.id,
        data: {
          name,
          description,
          price,
          billing_period: billingPeriod,
          paper_limit_per_month: paperLimit,
          ai_query_limit_per_day: aiQueryLimit,
          features,
          is_popular: isPopular,
          is_active: isActive,
        },
      })
    } else {
      createMutation.mutate({
        code: code.trim().toLowerCase(),
        name,
        description,
        price,
        billing_period: billingPeriod,
        paper_limit_per_month: paperLimit,
        ai_query_limit_per_day: aiQueryLimit,
        features,
        is_popular: isPopular,
        is_active: isActive,
      })
    }
  }

  const formatIDR = (val: number) => {
    if (val === 0) return "Gratis"
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
              Atur harga berbayar, kuota ekstraksi dokumen per bulan, limit tanya AI, dan fasilitas fitur premium.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleOpenCreateModal}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Buat Paket Langganan Baru</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-muted-foreground">Memuat paket langganan...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          Gagal memuat paket: {(error as Error).message}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between relative transition-all hover:shadow-md ${
                plan.is_popular ? "border-primary ring-1 ring-primary/30" : ""
              } ${!plan.is_active ? "opacity-60 bg-muted/20" : ""}`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-0.5 shadow-sm">
                    Paling Diminati (Rekomendasi)
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      kode: {plan.code}
                    </p>
                  </div>

                  <Badge variant={plan.is_active ? "default" : "secondary"} className="text-[10px]">
                    {plan.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>

                {plan.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                )}

                {/* Price Display */}
                <div className="border-y py-3 space-y-0.5">
                  <div className="text-2xl font-black text-foreground">
                    {formatIDR(plan.price)}
                    {plan.price > 0 && (
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        /{plan.billing_period === "monthly" ? "bulan" : plan.billing_period}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <FileText className="size-3 text-primary" />
                      Limit: <strong>{plan.paper_limit_per_month} paper</strong>/bln
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3 text-primary" />
                      Limit AI: <strong>{plan.ai_query_limit_per_day}</strong>/hari
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Fasilitas Termasuk:
                  </p>
                  <ul className="space-y-2 text-xs">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-foreground leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Actions & Subscriber Count */}
              <div className="pt-5 mt-5 border-t flex items-center justify-between">
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
                    className="h-8 px-2 text-xs"
                    title="Ubah Konfigurasi Paket"
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Yakin ingin menonaktifkan atau menghapus paket '${plan.name}'?`)) {
                        deleteMutation.mutate(plan.id)
                      }
                    }}
                    className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                    title="Hapus / Arsipkan Paket"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <CreditCard className="size-4 text-primary" />
                <span>{editingPlan ? "Modifikasi Paket Langganan" : "Buat Paket Langganan Baru"}</span>
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
                    placeholder="misal: pro_scholar"
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Nama Paket</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="misal: Pro Scholar"
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Deskripsi Singkat</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Target pengguna atau manfaat utama paket..."
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
                    <option value="free">Gratis (Free)</option>
                    <option value="monthly">Bulanan (Monthly)</option>
                    <option value="annual">Tahunan (Annual)</option>
                    <option value="lifetime">Seumur Hidup (Lifetime)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Batas Paper / Bulan</label>
                  <Input
                    type="number"
                    min="1"
                    value={paperLimit}
                    onChange={(e) => setPaperLimit(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Batas Tanya AI / Hari</label>
                  <Input
                    type="number"
                    min="5"
                    value={aiQueryLimit}
                    onChange={(e) => setAiQueryLimit(Number(e.target.value))}
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Menyimpan..."
                    : editingPlan
                    ? "Simpan Perubahan"
                    : "Terbitkan Paket Baru"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
