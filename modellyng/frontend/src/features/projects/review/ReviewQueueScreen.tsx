import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  Edit3,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  BookmarkCheck,
} from "lucide-react"
import {
  useProjectReviewQueue,
  useUpdateComponent,
  useProjectDetail,
  ReviewQueueItem,
} from "../api/projectsApi"

export default function ReviewQueueScreen() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project } = useProjectDetail(projectId)

  // 1. Fetch live unreviewed components from server
  const {
    data: queueItems = [],
    isLoading,
    isError,
  } = useProjectReviewQueue(projectId, 0.8)

  const [editingItem, setEditingItem] = useState<ReviewQueueItem | null>(null)
  const [editText, setEditText] = useState<string>("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Mutation helper for each component update
  const updateMutation = useUpdateComponent(projectId || "", "")

  const handleAction = async (
    item: ReviewQueueItem,
    action: "accepted" | "rejected" | "edited",
    customValue?: string
  ) => {
    try {
      const payload: { status: "accepted" | "rejected" | "edited"; value?: { text: string } } = {
        status: action,
      }
      if (customValue !== undefined) {
        payload.value = { text: customValue }
      }

      await updateMutation.mutateAsync({
        componentKey: item.parameter_key,
        payload,
      })

      if (action === "accepted") {
        showToast(`Komponen "${item.label?.id || item.parameter_key}" disetujui.`)
      } else if (action === "rejected") {
        showToast(`Komponen "${item.label?.id || item.parameter_key}" ditolak.`)
      } else {
        showToast(`Revisi komponen berhasil disimpan.`)
      }
      setEditingItem(null)
    } catch {
      showToast("Gagal memperbarui status komponen.")
    }
  }

  const handleBulkAccept = async () => {
    if (queueItems.length === 0) return
    try {
      for (const item of queueItems) {
        await updateMutation.mutateAsync({
          componentKey: item.parameter_key,
          payload: { status: "accepted" },
        })
      }
      showToast("Seluruh komponen berhasil disetujui secara massal.")
    } catch {
      showToast("Gagal memproses persetujuan massal.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Memuat antrean peninjauan komponen riset...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
          <AlertCircle className="size-10 text-destructive mx-auto" />
          <h2 className="text-base font-semibold text-foreground">Gagal Memuat Antrean Tinjauan</h2>
          <p className="text-xs text-muted-foreground">
            Terjadi gangguan saat mengambil data dari server.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to={`/projects/${projectId}/overview`}>Kembali ke Ruang Kerja</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 rounded-lg bg-slate-900 text-white px-4 py-2 text-xs font-medium shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <Link
            to={`/projects/${projectId}/overview`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Ruang Kerja Proyek ({project?.name || "Overview"})</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Antrean Peninjauan Komponen AI</span>
            <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 px-2.5 py-0.5 text-xs font-semibold">
              {queueItems.length} Perlu Konfirmasi
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Komponen dengan status <em>needs_review</em> atau akurasi di bawah 80% memerlukan validasi peneliti manusia sebelum dialirkan ke matriks komparasi.
          </p>
        </div>

        {queueItems.length > 0 && (
          <Button
            size="sm"
            onClick={handleBulkAccept}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto"
          >
            <Check className="size-3.5" />
            <span>Setujui Semua ({queueItems.length})</span>
          </Button>
        )}
      </div>

      {/* Queue Items List */}
      {queueItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center space-y-3 bg-muted/10">
          <CheckCircle2 className="size-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-semibold text-foreground">
            Semua Komponen Telah Selesai Ditinjau!
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Tidak ada lagi komponen yang membutuhkan konfirmasi manual. Dokumen telah berstatus <strong>Ready</strong> dan siap dianalisis di Matriks Komparasi dan Sintesis.
          </p>
          <Button asChild size="sm" className="mt-2">
            <Link to={`/projects/${projectId}/overview`}>Kembali ke Ruang Kerja</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {queueItems.map((item) => {
            const conf = Math.round(item.confidence_score * 100)

            return (
              <div
                key={item.id}
                className="rounded-xl border bg-card p-5 shadow-xs space-y-3 transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                      <FileText className="size-3.5" />
                      <span>{item.paper_title}</span>
                    </span>
                    <h4 className="text-sm font-semibold text-foreground mt-0.5">
                      {item.label?.id || item.parameter_key}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                      {item.model_used}
                    </span>
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                      Keyakinan {conf}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-foreground leading-relaxed bg-secondary/30 p-3.5 rounded-lg border border-secondary/50">
                  {item.value?.text || "Tidak ada formulasi teks."}
                </p>

                {item.evidence && item.evidence.length > 0 && (
                  <div className="text-[11px] bg-primary/5 p-2.5 rounded-lg border border-primary/20 space-y-1">
                    <span className="font-semibold text-primary flex items-center gap-1 text-[10px] uppercase">
                      <BookmarkCheck className="size-3" />
                      <span>Bukti Kutipan (Halaman {item.evidence[0].page_index}):</span>
                    </span>
                    <p className="italic text-muted-foreground line-clamp-2">
                      "{item.evidence[0].quote}"
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAction(item, "rejected")}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <X className="size-3" />
                    <span>Tolak</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(item)
                      setEditText(item.value?.text || "")
                    }}
                    className="h-7 text-xs gap-1"
                  >
                    <Edit3 className="size-3" />
                    <span>Revisi Teks</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(item, "accepted")}
                    className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="size-3" />
                    <span>Setujui (Accept)</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Component Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl p-6 space-y-4">
            <div>
              <span className="text-[10px] font-semibold uppercase text-primary">
                Koreksi Manual Hasil AI
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                {editingItem.label?.id || editingItem.parameter_key} ({editingItem.paper_title})
              </h3>
            </div>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              className="w-full rounded-lg border bg-background p-3 text-xs leading-relaxed text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
              placeholder="Tuliskan koreksi formulasi teks..."
            />

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingItem(null)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => handleAction(editingItem, "edited", editText.trim())}
                className="text-xs bg-primary hover:bg-primary/90 text-white"
              >
                Simpan & Setujui Koreksi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
