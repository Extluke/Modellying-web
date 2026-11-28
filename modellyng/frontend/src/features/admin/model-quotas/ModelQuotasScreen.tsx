import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Cpu,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  RefreshCw,
} from "lucide-react"
import { ROUTES } from "@/app/routes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedContent, CountUp, SpotlightCard } from "@/components/react-bits"
import { adminApi, type ApiConfigItem } from "../api/adminApi"
import { DUMMY_API_CONFIGS } from "../data/dummyAdminData"

function getStatusMeta(status: ApiConfigItem["status"]) {
  switch (status) {
    case "operational":
      return {
        label: "Operasional",
        className:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      }
    case "rate_limited":
      return {
        label: "Rate Limited",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
      }
    case "invalid_key":
      return {
        label: "API Key Bermasalah",
        className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
      }
    default:
      return {
        label: "Belum Dikonfigurasi",
        className: "bg-muted text-muted-foreground border-border",
      }
  }
}

export default function ModelQuotasScreen() {
  const {
    data: serverConfigs,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "api-configs"],
    queryFn: adminApi.getApiConfigs,
    retry: false,
  })

  const configs = useMemo(() => {
    const source =
      serverConfigs && Array.isArray(serverConfigs) && serverConfigs.length > 0
        ? serverConfigs
        : DUMMY_API_CONFIGS
    return [...source].sort((a, b) => a.priority - b.priority)
  }, [serverConfigs])

  const activeCount = configs.filter((c) => c.is_active).length
  const totalRpm = configs.reduce((acc, c) => acc + (c.rpm_limit || 0), 0)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cpu className="size-5 text-primary" />
            <span>Pengaturan Kuota &amp; Prioritas Model AI</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pemantauan urutan failover Model Switching Engine (Google Gemini Core dan Groq Cloud) serta ambang batas RPM/TPM.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            <span>Segarkan Status</span>
          </Button>
          <Button asChild size="sm" className="text-xs gap-1.5">
            <Link to={ROUTES.ADMIN.API_CONFIG}>
              <span>Kelola API Key</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Ringkasan Failover & Kapasitas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <AnimatedContent delay={0} distance={14} duration={420} immediate>
          <SpotlightCard className="p-4 shadow-xs space-y-1.5 h-full">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Provider Aktif Terdaftar
            </span>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              <CountUp to={activeCount} /> / {configs.length}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Gemini Core &amp; Groq Failover Engine
            </p>
          </SpotlightCard>
        </AnimatedContent>

        <AnimatedContent delay={60} distance={14} duration={420} immediate>
          <SpotlightCard className="p-4 shadow-xs space-y-1.5 h-full" spotlightColor="rgba(16, 185, 129, 0.12)">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Kapasitas Total Request / Menit
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              <CountUp to={totalRpm} /> RPM
            </div>
            <p className="text-[11px] text-muted-foreground">
              Akumulasi kuota gabungan lintas provider aktif
            </p>
          </SpotlightCard>
        </AnimatedContent>

        <AnimatedContent delay={120} distance={14} duration={420} immediate>
          <SpotlightCard className="p-4 shadow-xs space-y-1.5 h-full" spotlightColor="rgba(81, 71, 229, 0.12)">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Rantai Switching Otomatis
            </span>
            <div className="text-sm font-bold text-primary pt-1">
              {configs.map((c) => c.provider.toUpperCase()).join(" -> ")}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Perpindahan instan saat RPM atau latensi melewati batas
            </p>
          </SpotlightCard>
        </AnimatedContent>
      </div>

      {/* Daftar Prioritas Provider Resmi */}
      <div className="grid gap-4 md:grid-cols-2">
        {configs.map((cfg, idx) => {
          const statusMeta = getStatusMeta(cfg.status)
          return (
            <AnimatedContent key={cfg.id} delay={idx * 70} distance={14} duration={440} immediate>
              <SpotlightCard className="p-5 shadow-sm space-y-4 h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold tabular-nums">
                      #{cfg.priority}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-foreground">{cfg.display_name}</h2>
                        <Badge variant="outline" className={`text-[10px] ${statusMeta.className}`}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {cfg.model_name}
                      </p>
                    </div>
                  </div>

                  {cfg.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="size-3.5" />
                      <span>Aktif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 shrink-0">
                      <AlertTriangle className="size-3.5" />
                      <span>Nonaktif</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Zap className="size-3 text-primary" />
                      <span>RPM Limit</span>
                    </span>
                    <strong className="font-mono text-foreground block mt-0.5 tabular-nums">
                      {cfg.rpm_limit.toLocaleString("id-ID")}
                    </strong>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="size-3 text-emerald-500" />
                      <span>TPM Limit</span>
                    </span>
                    <strong className="font-mono text-foreground block mt-0.5 tabular-nums">
                      {cfg.tpm_limit.toLocaleString("id-ID")}
                    </strong>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Activity className="size-3 text-blue-500" />
                      <span>Latensi</span>
                    </span>
                    <strong className="font-mono text-foreground block mt-0.5 tabular-nums">
                      {cfg.last_latency_ms ? `${cfg.last_latency_ms} ms` : "-"}
                    </strong>
                  </div>
                </div>
              </SpotlightCard>
            </AnimatedContent>
          )
        })}
      </div>
    </div>
  )
}
