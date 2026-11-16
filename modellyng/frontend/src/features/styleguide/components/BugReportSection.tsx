import { useState } from "react"
import {
  Bug,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Upload,
  Paperclip,
  Monitor,
  X,
  Send,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  FileText,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/lib/store/useToastStore"
import { useAuthStore } from "@/features/auth/store/authStore"

type SeverityLevel = "low" | "medium" | "high" | "critical"

interface BugReportFormData {
  title: string
  pageUrl: string
  customPageUrl: string
  severity: SeverityLevel
  description: string
  stepsToReproduce: string
  includeEnvInfo: boolean
  attachments: { name: string; size: string }[]
}

const PAGE_OPTIONS = [
  { value: "/projects/:id/overview", label: "Ruang Riset Dokumen & Upload PDF" },
  { value: "/projects/:id/papers/:paperId", label: "Penampil PDF & Ekstraksi Komponen" },
  { value: "/matrix", label: "Comparative Paper Matrix" },
  { value: "/knowledge-graph", label: "Graf Pengetahuan & Peta Celah Riset" },
  { value: "/chat", label: "Asisten Cerdas Global (Chat RAG)" },
  { value: "/settings", label: "Pengaturan Akun & Batas Kuota" },
  { value: "/settings/pricing", label: "Katalog Paket & Langganan Student Pro" },
  { value: "/login", label: "Halaman Masuk / Pendaftaran Akun" },
  { value: "custom", label: "Halaman Lainnya (Tulis URL Manual)" },
]

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; badge: string; colorClass: string; borderClass: string; desc: string; icon: typeof AlertCircle }
> = {
  low: {
    label: "Rendah (Low)",
    badge: "Minor / Visual",
    colorClass: "text-slate-600 dark:text-slate-400 bg-slate-500/10",
    borderClass: "border-slate-500/30 hover:border-slate-500",
    desc: "Masalah kosmetik, tipografi, atau pergeseran margin kecil.",
    icon: HelpCircle,
  },
  medium: {
    label: "Sedang (Medium)",
    badge: "Fungsional Lambat",
    colorClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    borderClass: "border-amber-500/40 hover:border-amber-500",
    desc: "Fitur berjalan lambat, filter tidak sinkron, atau perlu muat ulang.",
    icon: Clock,
  },
  high: {
    label: "Tinggi (High)",
    badge: "Fitur Terhambat",
    colorClass: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
    borderClass: "border-orange-500/40 hover:border-orange-500",
    desc: "Fitur penting tidak merespons atau tombol aksi tidak dapat diklik.",
    icon: AlertTriangle,
  },
  critical: {
    label: "Kritis (Critical)",
    badge: "Crash / Data Hilang",
    colorClass: "text-red-600 dark:text-red-400 bg-red-500/10",
    borderClass: "border-red-500/50 hover:border-red-500 ring-1 ring-red-500/20",
    desc: "Halaman crash, dokumen gagal disimpan, atau error sistem berulang.",
    icon: ShieldAlert,
  },
}

export function BugReportSection() {
  const { user } = useAuthStore()

  // State tampilan styleguide
  const [activePreviewMode, setActivePreviewMode] = useState<"embedded" | "modal" | "tracker">("embedded")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; title: string; createdAt: string } | null>(null)

  // Form State
  const [formData, setFormData] = useState<BugReportFormData>({
    title: "",
    pageUrl: "/projects/:id/papers/:paperId",
    customPageUrl: "",
    severity: "medium",
    description: "",
    stepsToReproduce: "",
    includeEnvInfo: true,
    attachments: [
      { name: "screenshot_error_ekstraksi.png", size: "1.2 MB" },
    ],
  })

  // Mock upload attachment
  const handleAddDummyAttachment = () => {
    const randomNum = Math.floor(Math.random() * 900) + 100
    setFormData((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        { name: `tangkapan_layar_${randomNum}.png`, size: "840 KB" },
      ],
    }))
    toast.success("Tangkapan layar berhasil dilampirkan.")
  }

  const handleRemoveAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Judul kendala wajib diisi.")
      return
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      toast.error("Deskripsi masalah minimal harus terdiri dari 10 karakter.")
      return
    }

    setIsSubmitting(true)

    // Simulasi pengiriman ke endpoint FastAPI public.bug_reports
    setTimeout(() => {
      const ticketId = `BUG-2026-${Math.floor(Math.random() * 8999) + 1000}`
      setSubmittedTicket({
        id: ticketId,
        title: formData.title,
        createdAt: "Baru saja",
      })
      setIsSubmitting(false)
      setIsModalOpen(false)
      toast.success(
        `Laporan kendala #${ticketId} berhasil dikirim! Tim pengembang akan segera meninjau tiket Anda.`
      )
    }, 900)
  }

  const handleResetForm = () => {
    setSubmittedTicket(null)
    setFormData({
      title: "",
      pageUrl: "/projects/:id/papers/:paperId",
      customPageUrl: "",
      severity: "medium",
      description: "",
      stepsToReproduce: "",
      includeEnvInfo: true,
      attachments: [],
    })
  }

  // Device Environment Preview
  const envInfoString = "Chrome 131.0 • Windows 11 (64-bit) • Layar 1920x1080 • DPR 1.0"

  return (
    <section className="space-y-8 pt-4">
      {/* Header Section */}
      <div className="space-y-2 border-b border-border/70 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
          <Bug className="size-3.5" />
          <span>Komponen Layanan Dukungan & QA</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <span>Formulir Laporan Kendala & Bug Sistem</span>
        </h2>
        <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
          Formulir baku bagi peneliti untuk melaporkan anomali ekstraksi, kendala fungsional, atau kegagalan sistem.
          Data laporan ini tersinkronisasi langsung dengan skema database <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">public.bug_reports</code> dan ditindaklanjuti secara terpadu melalui Panel Admin Job 2.
        </p>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap gap-2 pt-3">
          <Button
            size="sm"
            variant={activePreviewMode === "embedded" ? "primary" : "outline"}
            onClick={() => setActivePreviewMode("embedded")}
            className="text-xs gap-1.5"
          >
            <Layers className="size-3.5" />
            <span>Mode 1: Kartu Tersemat (Embedded Form)</span>
          </Button>

          <Button
            size="sm"
            variant={activePreviewMode === "modal" ? "primary" : "outline"}
            onClick={() => setActivePreviewMode("modal")}
            className="text-xs gap-1.5"
          >
            <Sparkles className="size-3.5" />
            <span>Mode 2: Modal Pop-up Melayang (Dialog Trigger)</span>
          </Button>

          <Button
            size="sm"
            variant={activePreviewMode === "tracker" ? "primary" : "outline"}
            onClick={() => setActivePreviewMode("tracker")}
            className="text-xs gap-1.5"
          >
            <Clock className="size-3.5" />
            <span>Mode 3: Status Tiket Pelapor (Ticket Log)</span>
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODE 1: FORMULIR TERSEMAT LENGKAP (EMBEDDED CARD) */}
      {/* ==================================================================== */}
      {activePreviewMode === "embedded" && (
        <div className="max-w-3xl mx-auto">
          {submittedTicket ? (
            <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/[0.03] p-8 text-center space-y-5 shadow-sm">
              <div className="mx-auto size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="size-8" />
              </div>

              <div className="space-y-1.5">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-xs">
                  ID Tiket: {submittedTicket.id}
                </Badge>
                <h3 className="text-lg font-bold text-foreground">Laporan Berhasil Diteruskan ke Tim Teknis</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Terima kasih atas kontribusi Anda dalam menyempurnakan Modellyng. Laporan kendala &ldquo;{submittedTicket.title}&rdquo; telah tercatat di antrean investigasi kami.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-card border text-xs max-w-md mx-auto text-left space-y-1">
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Status Awal:</span>
                  <span className="font-semibold text-foreground inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                    Menunggu Investigasi (Open)
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Estimasi Tanggapan:</span>
                  <span className="font-semibold text-foreground">Maksimal 1 x 24 Jam Kerja</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <Button size="sm" variant="outline" onClick={handleResetForm} className="text-xs gap-1.5">
                  <RotateCcw className="size-3.5" />
                  <span>Kirim Laporan Lain</span>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl border shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-card via-card to-red-500/[0.03] border-b p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
                      <Bug className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">Formulir Laporan Kendala Teknis</CardTitle>
                      <CardDescription className="text-[11px] text-muted-foreground">
                        Sampaikan bug, anomali data, atau kendala performa yang Anda temui.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="muted" className="text-[10px] font-semibold">
                    Tiket Dukungan Pengguna
                  </Badge>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-5 text-xs">
                  {/* Info Pelapor Otomatis */}
                  <div className="p-3 rounded-xl border bg-muted/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nama Pelapor</label>
                      <p className="font-semibold text-foreground text-xs">{user?.full_name || "Peneliti Modellyng"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Email Kontak</label>
                      <p className="font-semibold text-foreground text-xs">{user?.email || "peneliti@modellyng.ac.id"}</p>
                    </div>
                  </div>

                  {/* 1. Judul Masalah */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Ringkasan Kendala (Judul Laporan) <span className="text-red-500">*</span></span>
                      <span className="text-[10px] font-normal text-muted-foreground">Maksimal 100 karakter</span>
                    </label>
                    <Input
                      type="text"
                      maxLength={100}
                      placeholder="Contoh: Ekstraksi komponen PDF berhenti di tahap 4 pada berkas 15 halaman..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  {/* 2. Lokasi Halaman Terkait */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center gap-1.5">
                      <span>Halaman Tempat Terjadinya Kendala</span>
                    </label>
                    <select
                      value={formData.pageUrl}
                      onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {PAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} ({opt.value})
                        </option>
                      ))}
                    </select>

                    {formData.pageUrl === "custom" && (
                      <Input
                        type="text"
                        placeholder="Ketik alamat URL halaman yang bermasalah (misal: /projects/xyz/custom)..."
                        value={formData.customPageUrl}
                        onChange={(e) => setFormData({ ...formData, customPageUrl: e.target.value })}
                        className="h-9 text-xs mt-2"
                      />
                    )}
                  </div>

                  {/* 3. Tingkat Keparahan (Severity Grid) */}
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Tingkat Dampak / Urgensi Masalah <span className="text-red-500">*</span></span>
                      <span className="text-[10px] font-normal text-muted-foreground">Pilih sesuai dampak kendala</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(["low", "medium", "high", "critical"] as SeverityLevel[]).map((level) => {
                        const cfg = SEVERITY_CONFIG[level]
                        const isSelected = formData.severity === level
                        const Icon = cfg.icon

                        return (
                          <div
                            key={level}
                            onClick={() => setFormData({ ...formData, severity: level })}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                              isSelected
                                ? "bg-primary/[0.03] border-primary shadow-xs ring-1 ring-primary/20"
                                : `${cfg.borderClass} bg-card`
                            }`}
                          >
                            <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.colorClass}`}>
                              <Icon className="size-4" />
                            </div>

                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-foreground text-xs">{cfg.label}</span>
                                {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-tight">{cfg.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 4. Deskripsi Detail Masalah */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Deskripsi Rinci Masalah <span className="text-red-500">*</span></span>
                      <span className="text-[10px] font-normal text-muted-foreground">Jelaskan apa yang terjadi</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Jelaskan secara runtut: Apa yang Anda coba lakukan? Apa pesan kesalahan yang muncul? Dan bagaimana hasil yang diharapkan seharusnya terjadi..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-md border bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                      required
                    />
                  </div>

                  {/* 5. Langkah Reproduksi (Opsional) */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center gap-1.5">
                      <span>Langkah-langkah untuk Mengulang Kendala (Opsional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: 1. Masuk ke halaman Matriks 2. Klik filter paper 3. Pilih tombol ekspor..."
                      value={formData.stepsToReproduce}
                      onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                      className="w-full rounded-md border bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    />
                  </div>

                  {/* 6. Lampiran Tangkapan Layar / Dokumen */}
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Lampiran Tangkapan Layar / Bukti Error</span>
                      <span className="text-[10px] font-normal text-muted-foreground">PNG, JPG, PDF (Maks. 10MB)</span>
                    </label>

                    <div
                      onClick={handleAddDummyAttachment}
                      className="border border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/30 rounded-xl p-4 text-center cursor-pointer transition-all space-y-1"
                    >
                      <div className="mx-auto size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Upload className="size-4" />
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        Klik untuk mengunggah tangkapan layar atau seret berkas ke sini
                      </p>
                      <p className="text-[10px] text-muted-foreground">Simulasi: Mengklik area ini akan menambahkan contoh lampiran gambar.</p>
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {formData.attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip className="size-3.5 text-primary shrink-0" />
                              <span className="truncate font-medium text-foreground">{file.name}</span>
                              <span className="text-[10px] text-muted-foreground">({file.size})</span>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="size-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 7. Informasi Teknis Perangkat Otomatis */}
                  <div className="p-3 rounded-xl border bg-card/60 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="includeEnv"
                      checked={formData.includeEnvInfo}
                      onChange={(e) => setFormData({ ...formData, includeEnvInfo: e.target.checked })}
                      className="mt-0.5 rounded border-muted-foreground/30 text-primary focus:ring-primary size-3.5"
                    />
                    <div className="space-y-0.5 text-xs">
                      <label htmlFor="includeEnv" className="font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                        <Monitor className="size-3.5 text-primary" />
                        <span>Sertakan Informasi Teknis Perangkat & Peramban Otomatis</span>
                      </label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Membantu tim pengembang mempercepat investigasi: <code className="bg-muted px-1 py-0.2 rounded text-[10px]">{envInfoString}</code>
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/10 border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">
                    Data laporan Anda disimpan secara rahasia dan hanya digunakan untuk perbaikan sistem.
                  </p>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button type="button" variant="outline" size="sm" onClick={handleResetForm} className="text-xs">
                      Bersihkan Form
                    </Button>

                    <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs font-semibold gap-1.5">
                      {isSubmitting ? (
                        <>
                          <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Meneruskan Laporan...</span>
                        </>
                      ) : (
                        <>
                          <Send className="size-3.5" />
                          <span>Kirim Laporan Bug</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 2: MODAL POP-UP MELAYANG (FLOATING DIALOG TRIGGER) */}
      {/* ==================================================================== */}
      {activePreviewMode === "modal" && (
        <div className="space-y-6 max-w-2xl mx-auto text-center p-8 border rounded-2xl bg-card shadow-xs">
          <div className="size-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
            <Bug className="size-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">Simulasi Tombol Pemicu Modal Laporan Kendala</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Tombol ini dapat diletakkan di sudut kanan bawah antarmuka pengguna, bilah navigasi samping, atau di menu bantuan sebagai tombol mengambang (*floating action trigger*).
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20">
              <Bug className="size-4" />
              <span>Buka Dialog Lapor Bug</span>
            </Button>
          </div>

          {/* Modal Pop-up Dialog */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-2xl text-left space-y-4 p-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
                      <Bug className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Laporkan Kendala Teknis</h4>
                      <p className="text-[11px] text-muted-foreground">Kami meninjau seluruh laporan secara aktif.</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    className="size-8 p-0 rounded-full"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Judul Kendala *</label>
                    <Input
                      placeholder="Ringkasan singkat masalah..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Tingkat Urgensi</label>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {(["low", "medium", "high", "critical"] as SeverityLevel[]).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setFormData({ ...formData, severity: sev })}
                          className={`py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                            formData.severity === sev
                              ? "bg-primary text-white border-primary"
                              : "bg-muted/40 hover:bg-muted text-foreground border-border"
                          }`}
                        >
                          {SEVERITY_CONFIG[sev].label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Deskripsi Rinci *</label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan kendala yang dialami..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-md border bg-background p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                    Batal
                  </Button>
                  <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="text-xs font-semibold gap-1.5">
                    <Send className="size-3" />
                    <span>Kirim Sekarang</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 3: PELACAK STATUS TIKET (TICKET LOG TRACKER) */}
      {/* ==================================================================== */}
      {activePreviewMode === "tracker" && (
        <Card className="rounded-2xl border shadow-xs p-6 space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>Riwayat Tiket Laporan Kendala Anda</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Pantau progres penanganan kendala yang telah Anda sampaikan kepada tim pengembang.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              3 Laporan Terdata
            </Badge>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: "BUG-2026-9102",
                title: "Teks kutipan bukti PDF bergeser 2 baris pada dokumen 3 kolom",
                page: "/projects/p-12/papers/pp-44",
                severity: "medium" as SeverityLevel,
                status: "investigating",
                statusLabel: "Sedang Ditinjau",
                statusClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                date: "Hari ini, 14:20 WIB",
              },
              {
                id: "BUG-2026-8841",
                title: "Gagal mengunduh berkas matriks sintesis format Excel XLSX",
                page: "/projects/p-12/matrix",
                severity: "high" as SeverityLevel,
                status: "resolved",
                statusLabel: "Selesai Diperbaiki",
                statusClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                date: "Kemarin, 09:15 WIB",
              },
              {
                id: "BUG-2026-7210",
                title: "Perataan teks judul bab pada visualisasi alur riset terpotong",
                page: "/knowledge-graph",
                severity: "low" as SeverityLevel,
                status: "closed",
                statusLabel: "Tiket Ditutup",
                statusClass: "bg-slate-500/10 text-slate-600 border-slate-500/20",
                date: "4 hari lalu",
              },
            ].map((ticket) => {
              const sevCfg = SEVERITY_CONFIG[ticket.severity]

              return (
                <div
                  key={ticket.id}
                  className="p-3.5 rounded-xl border bg-card hover:bg-muted/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-foreground">{ticket.id}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sevCfg.colorClass} border-transparent`}>
                        {sevCfg.badge}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ticket.statusClass}`}>
                        {ticket.statusLabel}
                      </span>
                    </div>

                    <p className="font-semibold text-foreground text-xs">{ticket.title}</p>
                    <p className="text-[11px] text-muted-foreground">Lokasi: <code className="bg-muted px-1 py-0.2 rounded text-[10px]">{ticket.page}</code> • Dilaporkan {ticket.date}</p>
                  </div>

                  <Button variant="outline" size="sm" className="text-[11px] shrink-0 gap-1 h-8">
                    <span>Lihat Rincian</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </section>
  )
}
