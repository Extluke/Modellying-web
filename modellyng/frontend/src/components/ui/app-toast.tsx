import { useToastStore, ToastItem } from "@/lib/store/useToastStore"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

function ToastCard({ toast }: { toast: ToastItem }) {
  const removeToast = useToastStore((state) => state.removeToast)

  const config = {
    success: {
      bg: "bg-emerald-950/95 border-emerald-500/45 text-emerald-50",
      icon: <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" aria-hidden="true" />,
      bar: "bg-emerald-400/90",
    },
    error: {
      bg: "bg-rose-950/95 border-rose-500/45 text-rose-50",
      icon: <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" aria-hidden="true" />,
      bar: "bg-rose-400/90",
    },
    info: {
      bg: "bg-slate-900/95 border-primary/45 text-slate-100",
      icon: <Info className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />,
      bar: "bg-primary/90",
    },
    warning: {
      bg: "bg-amber-950/95 border-amber-500/45 text-amber-50",
      icon: <AlertCircle className="size-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />,
      bar: "bg-amber-400/90",
    },
  }[toast.type]

  return (
    <div
      role="status"
      className={`relative overflow-hidden w-80 sm:w-96 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 ${config.bg}`}
    >
      <div className="flex items-start gap-2.5">
        {config.icon}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-relaxed break-words">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => removeToast(toast.id)}
          aria-label="Tutup notifikasi"
          className="text-white/70 hover:text-white transition-colors p-1 rounded-md shrink-0 cursor-pointer"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Progress countdown bar (exactly 5000 ms) */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className={`h-full ${config.bar}`}
          style={{
            animation: `toast-progress ${toast.duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export function AppToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-auto max-w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
