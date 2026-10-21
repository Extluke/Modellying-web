import { ShieldAlert, Users, Cpu, Activity } from "lucide-react"

export default function AdminDashboardScreen() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 border-b pb-4">
        <ShieldAlert className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Dasbor Administrator Sistem
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pemantauan kuota model LLM, worker Celery, dan penggunaan multi-tenant Supabase.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Pengguna</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">142</div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Konsumsi Token AI (Hari ini)</span>
            <Cpu className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">1.4M</div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Worker Queue Load</span>
            <Activity className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">Optimal (98%)</div>
        </div>
      </div>
    </div>
  )
}
