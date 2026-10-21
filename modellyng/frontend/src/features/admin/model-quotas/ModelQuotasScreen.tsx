import { Cpu } from "lucide-react"

export default function ModelQuotasScreen() {
  return (
    <div className="p-6 space-y-4">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Cpu className="size-5 text-primary" />
          <span>Pengaturan Kuota & Prioritas Model AI</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Konfigurasi failover Model Switching Engine (Fatih) dan limit API key.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 text-center text-xs text-muted-foreground">
        Panel monitoring switching engine: Gemini 1.5 Pro ➔ Flash ➔ Claude 3.5 Sonnet.
      </div>
    </div>
  )
}
