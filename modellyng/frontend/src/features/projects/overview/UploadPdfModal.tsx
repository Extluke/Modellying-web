import { useState, useRef, useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  UploadCloud,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
} from "lucide-react"
import { uploadFileWithProgress } from "@/lib/api/client"
import { projectKeys, Paper } from "../api/projectsApi"
import { useAuthStore } from "@/features/auth/store/authStore"

interface UploadFileItem {
  id: string
  file: File
  name: string
  size: number
  status: "validating" | "queued" | "uploading" | "success" | "error"
  progress: number
  errorMessage?: string
  abortController?: AbortController
}

interface UploadPdfModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  existingFilenames?: string[]
}

const MAX_FILES = 15
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const CONCURRENCY_LIMIT = 2

export function UploadPdfModal({
  isOpen,
  onClose,
  projectId,
  existingFilenames = [],
}: UploadPdfModalProps) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  const [queue, setQueue] = useState<UploadFileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isAuthExpired, setIsAuthExpired] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Warn on page unload if uploads are active
  const hasActiveUploads = queue.some((item) =>
    ["validating", "uploading"].includes(item.status)
  )

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasActiveUploads) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasActiveUploads])

  // Listen for 401 unauthorized to pause queue
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsPaused(true)
      setIsAuthExpired(true)
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized)
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized)
  }, [])

  // Client-side magic bytes validation (%PDF-)
  const validateMagicBytes = async (file: File): Promise<boolean> => {
    try {
      const slice = file.slice(0, 5)
      const buffer = await slice.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const header = String.fromCharCode(...bytes)
      return header.startsWith("%PDF-")
    } catch {
      return false
    }
  }

  // Handle file additions
  const handleAddFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return

      const remainingSlots = MAX_FILES - queue.length
      if (remainingSlots <= 0) {
        return
      }

      const filesToProcess = Array.from(fileList).slice(0, remainingSlots)
      const newItems: UploadFileItem[] = []

      for (const file of filesToProcess) {
        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`
        let errorMsg: string | undefined

        // 1. Extension check
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          errorMsg = "Bukan file PDF (.pdf)"
        }
        // 2. Size check
        else if (file.size > MAX_FILE_SIZE) {
          errorMsg = "Ukuran melebihi batas 50 MB"
        }

        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          status: errorMsg ? "error" : "validating",
          progress: 0,
          errorMessage: errorMsg,
          abortController: new AbortController(),
        })
      }

      setQueue((prev) => [...prev, ...newItems])

      // Asynchronously validate magic bytes for non-error files
      for (const item of newItems) {
        if (item.status === "error") continue

        const isValidPdf = await validateMagicBytes(item.file)
        setQueue((prev) =>
          prev.map((q) => {
            if (q.id === item.id) {
              if (!isValidPdf) {
                return {
                  ...q,
                  status: "error",
                  errorMessage: "Bukan PDF valid (Header %PDF- tidak ditemukan)",
                }
              }
              return { ...q, status: "queued" }
            }
            return q
          })
        )
      }
    },
    [queue.length]
  )

  // Upload Worker Loop (Concurrency 2-3)
  useEffect(() => {
    if (isPaused) return

    const activeUploads = queue.filter((i) => i.status === "uploading").length
    const availableSlots = CONCURRENCY_LIMIT - activeUploads
    if (availableSlots <= 0) return

    const nextBatch = queue
      .filter((i) => i.status === "queued")
      .slice(0, availableSlots)

    if (nextBatch.length === 0) return

    // Mark as uploading
    setQueue((prev) =>
      prev.map((item) =>
        nextBatch.some((b) => b.id === item.id)
          ? { ...item, status: "uploading", progress: 5 }
          : item
      )
    )

    // Execute uploads in parallel
    nextBatch.forEach((item) => {
      const formData = new FormData()
      formData.append("file", item.file)
      formData.append("auto_process", "true")

      uploadFileWithProgress<Paper>(
        `/projects/${projectId}/papers/upload`,
        formData,
        (percent) => {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
          )
        },
        item.abortController?.signal
      )
        .then(() => {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: "success", progress: 100 } : q
            )
          )
          // Targeted TanStack Query invalidation
          queryClient.invalidateQueries({ queryKey: projectKeys.detail(userId, projectId) })
          queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) })
        })
        .catch((err: any) => {
          if (err.name === "AbortError") {
            // User cancelled
            return
          }
          let msg = "Gagal mengunggah file."
          if (err?.detail?.message) {
            msg = err.detail.message
          } else if (err?.message) {
            msg = err.message
          }

          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "error", errorMessage: msg, progress: 0 }
                : q
            )
          )
        })
    })
  }, [queue, isPaused, projectId, queryClient, userId])

  const handleCancelItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id)
      if (item && item.status === "uploading") {
        item.abortController?.abort()
      }
      return prev.filter((q) => q.id !== id)
    })
  }

  const handleRetryItem = (id: string) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: "queued",
              errorMessage: undefined,
              progress: 0,
              abortController: new AbortController(),
            }
          : q
      )
    )
  }

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status !== "success"))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isOpen) return null

  const successCount = queue.filter((q) => q.status === "success").length
  const totalQueued = queue.length

  return (
    <div
      onClick={hasActiveUploads ? undefined : onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground tracking-tight">
                Unggah Dokumen Paper Riset
              </h3>
              <p className="text-xs text-muted-foreground">
                Mendukung hingga 15 file PDF sekaligus untuk ekstraksi parameter dan bukti kutipan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 401 Session warning */}
        {isAuthExpired && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex items-center justify-between text-xs text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Sesi login Anda kedaluwarsa. Antrean dijeda agar file tidak hilang.</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Masuk Ulang
            </Button>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleAddFiles(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-border hover:border-primary/50 hover:bg-accent/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleAddFiles(e.target.files)}
          />
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2 shadow-xs">
            <UploadCloud className="size-6" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            Tarik & lepas file PDF ke sini, atau{" "}
            <span className="text-primary underline underline-offset-2">pilih dari komputer</span>
          </p>
          <span className="text-[11px] text-muted-foreground mt-1">
            Mendukung 1–15 file sekaligus (maks. 50 MB per PDF, validasi magic bytes %PDF-)
          </span>
        </div>

        {/* Queue List Container */}
        {queue.length > 0 && (
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
              <span>
                Antrean Unggah ({successCount}/{totalQueued} Selesai)
              </span>
              <div className="flex items-center gap-2">
                {hasActiveUploads && (
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {isPaused ? (
                      <>
                        <PlayCircle className="size-3.5" />
                        <span>Lanjutkan</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="size-3.5" />
                        <span>Jeda</span>
                      </>
                    )}
                  </button>
                )}
                {successCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Hapus yang selesai
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {queue.map((item) => {
                const isDuplicateName = existingFilenames.includes(item.name)

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/70 bg-card p-3 shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate max-w-sm">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{formatSize(item.size)}</span>
                            {isDuplicateName && (
                              <span className="text-amber-500 font-medium">
                                (Nama file serupa sudah ada)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === "validating" && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            <span>Validasi</span>
                          </span>
                        )}

                        {item.status === "queued" && (
                          <span className="text-[11px] text-muted-foreground">Antre</span>
                        )}

                        {item.status === "uploading" && (
                          <span className="text-[11px] font-semibold text-primary">
                            {item.progress}%
                          </span>
                        )}

                        {item.status === "success" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            <span>Terunggah</span>
                          </span>
                        )}

                        {item.status === "error" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRetryItem(item.id)}
                              className="text-[10px] font-medium text-primary hover:underline"
                            >
                              Coba lagi
                            </button>
                            <span className="text-destructive">
                              <AlertCircle className="size-3.5" />
                            </span>
                          </div>
                        )}

                        {item.status !== "success" && (
                          <button
                            type="button"
                            onClick={() => handleCancelItem(item.id)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                            title="Batalkan / Hapus"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {item.status === "uploading" && (
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-150 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === "error" && item.errorMessage && (
                      <p className="text-[11px] text-destructive leading-tight bg-destructive/10 px-2 py-1 rounded-md">
                        {item.errorMessage}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-xs text-muted-foreground">
            {hasActiveUploads ? (
              <span className="flex items-center gap-1.5 text-primary">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Sedang mengunggah dokumen ke pipeline...</span>
              </span>
            ) : (
              "Semua file siap diproses"
            )}
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
          >
            {hasActiveUploads ? "Tutup (Berjalan di Latar)" : "Selesai"}
          </Button>
        </div>
      </div>
    </div>
  )
}
