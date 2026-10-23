import { useToastStore, ToastItem } from "@/lib/store/useToastStore"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

function ToastCard({ toast }: { toast: ToastItem }) {
  const removeToast = useToastStore((state) => state.removeToast)

  const config = {
    success: {
      bg: "bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/40 text-emerald-100",
      icon: <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />,
      bar: "bg-emerald-400/80",
    },
    error: {
      bg: "bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/40 text-rose-100",
      icon: <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />,
      bar: "bg-rose-400/80",
    },
    info: {
      bg: "bg-slate-900/90 dark:bg-slate-900/95 border-primary/40 text-slate-100",
      icon: <Info className="size-4 shrink-0 text-primary mt-0.5" />,
      bar: "bg-primary/80",
    },
  }[toast.type]

  return (
    <div
      className={`relative overflow-hidden w-80 sm:w-96 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${config.bg}`}
    >
      <div className="flex items-start gap-2.5">
        {config.icon}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-relaxed break-words">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => removeToast(toast.id)}
          className="text-white/60 hover:text-white transition-colors p-0.5 rounded-md shrink-0"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Progress countdown bar (exactly 5s) */}
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
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-auto">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
