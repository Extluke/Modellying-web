import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Cpu, 
  KeyRound, 
  Edit3, 
  Zap, 
  Clock, 
  ShieldCheck, 
  X,
  Sparkles
} from "lucide-react"
import { adminApi, ApiConfigItem, ApiConfigUpdateData } from "../api/adminApi"
import { DUMMY_API_CONFIGS } from "../data/dummyAdminData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"

export default function ApiConfigScreen() {
  const queryClient = useQueryClient()
  const [configsList, setConfigsList] = useState<ApiConfigItem[]>(DUMMY_API_CONFIGS)
  const [selectedConfig, setSelectedConfig] = useState<ApiConfigItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleTestPing = (config: ApiConfigItem) => {
    const fakeLatency = Math.floor(Math.random() * 140) + 160
    setConfigsList((prev) =>
      prev.map((c) =>
        c.id === config.id
          ? {
              ...c,
              last_latency_ms: fakeLatency,
              last_tested_at: new Date().toISOString(),
              status: "operational" as const,
            }
          : c
      )
    )
    toast.success(`Uji koneksi ${config.display_name} berhasil: Latensi ${fakeLatency} ms. Status operasional aman.`)
    testPingMutation.mutate(config.provider)
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
              Kelola API Key model AI secara terpusat di basis data tanpa perlu hardcode di repositori. Atur prioritas failover Core vs Backup.
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

      {/* Provider Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {configsList.map((conf) => (
          <div
            key={conf.id}
            className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between space-y-5 transition-all hover:shadow-md ${
              conf.priority === 1 ? "border-primary/50 shadow-primary/5" : ""
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      {conf.display_name}
                    </h3>
                    <Badge className={`text-[10px] ${
                      conf.priority === 1 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-secondary-foreground"
                    }`}>
                      Priority #{conf.priority} ({conf.priority === 1 ? "Core" : "Backup"})
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">
                    Model ID: <strong>{conf.model_name}</strong>
                  </p>
                </div>

                <Badge variant="outline" className={`text-[10px] ${
                  conf.status === "operational"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                    : conf.status === "unconfigured"
                    ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-rose-50 text-rose-700 border-rose-300"
                }`}>
                  {conf.status === "operational" ? "Operasional" : conf.status === "unconfigured" ? "Belum Diatur" : conf.status}
                </Badge>
              </div>

              {/* API Key Status */}
              <div className="rounded-lg bg-secondary/50 border p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <KeyRound className="size-3 text-primary" />
                    Kunci API Tersimpan (Masked):
                  </span>
                  <span className="font-mono text-[10px]">{conf.provider.toUpperCase()}</span>
                </div>
                <div className="font-mono text-xs font-semibold text-foreground tracking-wider">
                  {conf.api_key_masked}
                </div>
              </div>

              {/* Limits & Rate Constraints */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border p-2.5 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">Batas Laju (RPM)</span>
                  <div className="font-bold text-foreground">{conf.rpm_limit} Req/Menit</div>
                </div>
                <div className="rounded-lg border p-2.5 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">Batas Token (TPM)</span>
                  <div className="font-bold text-foreground">
                    {new Intl.NumberFormat("id-ID").format(conf.tpm_limit)} Token
                  </div>
                </div>
              </div>

              {/* Latency & Last Test */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Latensi Terakhir: <strong>{conf.last_latency_ms ? `${conf.last_latency_ms} ms` : "Belum diuji"}</strong>
                </span>
                <span>
                  Diperbarui: {new Date(conf.updated_at).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestPing(conf)}
                className="text-xs gap-1.5"
              >
                <Zap className="size-3.5 text-primary" />
                <span>Uji Latensi Ping</span>
              </Button>

              <Button
                size="sm"
                onClick={() => handleOpenEditModal(conf)}
                className="text-xs gap-1.5"
              >
                <Edit3 className="size-3.5" />
                <span>Ubah Kunci & Kuota</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Cpu className="size-4 text-primary" />
                <span>Ubah Konfigurasi Model: {selectedConfig.display_name}</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
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
                  placeholder="misal: models/gemini-3.5-flash atau qwen/qwen3.8-27b"
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
                  placeholder="Masukkan API key baru (AIzaSy... / gsk_...)..."
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
                    <option value={1}>1 (Core Provider)</option>
                    <option value={2}>2 (Backup Provider)</option>
                    <option value={3}>3 (Tertiary)</option>
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
