import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  X,
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  BookOpen,
  Calendar,
  Hash,
  Quote,
  Sparkles,
} from "lucide-react"
import {
  SourceVerificationData,
  usePaperSourceVerification,
  useVerifyPaperSource,
} from "../api/projectsApi"
import { toast } from "@/lib/store/useToastStore"

interface DoiVerificationDrawerProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  paperId: string
  paperTitle: string
  initialDoi?: string | null
  existingVerification?: SourceVerificationData | null
}

export function DoiVerificationDrawer({
  isOpen,
  onClose,
  projectId,
  paperId,
  paperTitle,
  initialDoi = "",
  existingVerification,
}: DoiVerificationDrawerProps) {
  // Query status verifikasi yang tersimpan di server
  const { data: serverStatus } = usePaperSourceVerification(
    projectId,
    paperId
  )

  const verifyMutation = useVerifyPaperSource(projectId, paperId)

  // Ambil verifikasi yang tersimpan baik dari cache server maupun prop
  const activeVerification: SourceVerificationData | null =
    serverStatus?.source_verification || existingVerification || null

  const isAlreadyVerified = Boolean(activeVerification)

  // Local state input DOI
  const [doiInput, setDoiInput] = useState<string>("")

  // Sinkronisasi DOI dari prop/server saat terbuka
  useEffect(() => {
    if (activeVerification?.doi) {
      setDoiInput(activeVerification.doi)
    } else if (serverStatus?.doi) {
      setDoiInput(serverStatus.doi)
    } else if (initialDoi) {
      setDoiInput(initialDoi)
    }
  }, [activeVerification, serverStatus, initialDoi, isOpen])

  if (!isOpen) return null

  const handleVerify = async () => {
    const clean = doiInput.trim()
    if (!clean) {
      toast.warning("Silakan masukkan nomor DOI yang ingin diverifikasi.")
      return
    }

    try {
      const res = await verifyMutation.mutateAsync(clean)
      if (res.already_verified) {
        toast.info(res.message || "Dokumen paper ini telah diverifikasi sebelumnya.")
      } else {
        toast.success("Keabsahan sumber paper berhasil diverifikasi secara resmi.")
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memverifikasi keabsahan sumber paper."
      toast.error(msg)
    }
  }

  const isVerifying = verifyMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop overlay gelap dengan efek blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => {
          if (!isVerifying) onClose()
        }}
      />

      {/* Drawer Panel yang meluncur dari sebelah KIRI layar */}
      <div className="relative z-50 w-full max-w-md sm:max-w-lg bg-card text-card-foreground border-r border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300 ease-out">
        {/* Header Drawer */}
        <div className="p-5 border-b border-border/80 flex items-start justify-between gap-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-xs shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Cek Keabsahan Sumber
                </h2>
                {isAlreadyVerified && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>Terverifikasi</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Verifikasi keabsahan naskah, integritas penerbit, dan indeksasi ilmiah berbasis pangkalan data kanonik Crossref & DataCite.
              </p>
            </div>
          </div>

          {/* Tombol Tutup Silang (X) */}
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            title="Tutup Panel"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Loading Overlay Freeze saat sistem memverifikasi */}
        {isVerifying && (
          <div className="absolute inset-0 z-30 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in-0 duration-200">
            <div className="relative">
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-md">
                <Loader2 className="size-8 animate-spin" />
              </div>
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-sm font-bold text-foreground">
                Memverifikasi Keabsahan Sumber...
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Menghubungkan ke basis data Crossref & DataCite, memeriksa indeksasi jurnal, dan menganalisis reputasi penerbit resmi.
              </p>
            </div>
          </div>
        )}

        {/* Konten Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Card Info Dokumen Aktif */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-border/80 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Dokumen yang Sedang Dibuka:
            </span>
            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
              {paperTitle}
            </p>
          </div>

          {/* Form Input DOI & Tombol Verifikasi */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>DOI (Digital Object Identifier)</span>
                {isAlreadyVerified && (
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Lock className="size-3 text-muted-foreground" />
                    <span>Terkunci Permanen (1x)</span>
                  </span>
                )}
              </label>
              <div className="relative">
                <Input
                  value={doiInput}
                  onChange={(e) => setDoiInput(e.target.value)}
                  disabled={isAlreadyVerified || isVerifying}
                  placeholder="Contoh: 10.1016/j.envres.2023.116000"
                  className={`font-mono text-xs h-10 ${
                    isAlreadyVerified
                      ? "bg-muted/70 text-muted-foreground cursor-not-allowed border-border"
                      : "border-border focus-visible:ring-primary"
                  }`}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isAlreadyVerified
                  ? "Verifikasi sumber hanya dapat dilakukan satu kali dan telah dicatat permanen dalam basis data kanonik."
                  : "Nomor DOI yang terdeteksi dari naskah fisik. Anda dapat melengkapi atau memperbaikinya sebelum memverifikasi."}
              </p>
            </div>

            {/* Tombol Verifikasi Sumber (Hanya aktif jika belum pernah diverifikasi) */}
            {!isAlreadyVerified && (
              <Button
                onClick={handleVerify}
                disabled={isVerifying || !doiInput.trim()}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 shadow-sm shadow-primary/25 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sedang Memeriksa Sistem...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>Verifikasi Sumber</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* HASIL & RINGKASAN KEABSAHAN (Muncul setelah verifikasi atau jika dibuka ke-2 kalinya) */}
          {activeVerification && (
            <div className="space-y-4 pt-2 animate-in fade-in-0 duration-300">
              <div className="flex items-center gap-2 pb-1 border-b border-border/80">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Laporan Keabsahan & Kredibilitas Sumber
                </h3>
              </div>

              {/* Status & Skor Kredibilitas */}
              <div
                className={`p-4 rounded-2xl border ${
                  activeVerification.is_valid
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
                } space-y-2.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeVerification.is_valid ? (
                      <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="text-xs font-bold">
                      {activeVerification.trust_verdict}
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full font-mono text-xs font-bold bg-white/70 dark:bg-black/30 shadow-xs">
                    Skor: {activeVerification.trust_score}/100
                  </div>
                </div>

                {/* Badges Indeksasi */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeVerification.indexation_badges?.map((badge, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/40 border border-emerald-600/20 text-emerald-800 dark:text-emerald-200"
                    >
                      ✓ {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ringkasan Auditor Keabsahan (Apakah Paper Ini Bisa Dipercaya?) */}
              <div className="p-4 rounded-2xl bg-card border border-border/90 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                  <Quote className="size-3.5 text-primary" />
                  <span>Apakah Naskah Ini Dapat Dipercaya?</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {activeVerification.summary}
                </p>
              </div>

              {/* Detail Informasi Terdaftar (Metadata Kanonik) */}
              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                <span className="text-[11px] font-bold text-foreground">
                  Metadata Kanonik Terverifikasi:
                </span>

                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  {/* Judul Resmi */}
                  {activeVerification.metadata?.title && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <BookOpen className="size-3.5 mt-0.5 text-primary shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">Judul Resmi: </span>
                        <span>{activeVerification.metadata.title}</span>
                      </div>
                    </div>
                  )}

                  {/* Penerbit */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-3.5 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Penerbit Resmi: </span>
                      <span>{activeVerification.metadata?.publisher || "-"}</span>
                    </div>
                  </div>

                  {/* Berkala Ilmiah / Jurnal */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="size-3.5 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Berkala / Jurnal: </span>
                      <span>{activeVerification.metadata?.journal || "-"}</span>
                    </div>
                  </div>

                  {/* ISSN */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="size-3.5 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Nomor ISSN: </span>
                      <span className="font-mono">{activeVerification.metadata?.issn || "-"}</span>
                    </div>
                  </div>

                  {/* Tahun & Sitasi */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3.5 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Tahun Terbit: </span>
                      <span>{activeVerification.metadata?.year || "-"}</span>
                      {typeof activeVerification.metadata?.citations_count === "number" && (
                        <span className="ml-2 pl-2 border-l border-border text-[11px]">
                          Sitasi Kanonik: <b>{activeVerification.metadata.citations_count}</b>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informasi Kunci Operasional */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Verifikasi keabsahan sumber paper ini telah sah dan terkunci permanen. Dokumen memenuhi standar ketertelusuran akademik kanonik.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Drawer */}
        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isVerifying}
            className="text-xs h-9 px-4 cursor-pointer"
          >
            Tutup Panel
          </Button>
        </div>
      </div>
    </div>
  )
}
