import {
  Settings,
  User,
  Sliders,
  LogOut,
  Crown,
  Sparkles,
  ArrowRight,
  BarChart3,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/features/auth/store/authStore"
import { ROUTES } from "@/app/routes"

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          <span>Pengaturan Akun & Preferensi Sitasi</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Atur profil peneliti, standar format sitasi, dan ambang keyakinan AI.
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile Card */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <User className="size-4 text-primary" />
            <span>Profil Peneliti</span>
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Nama Lengkap</label>
              <input
                type="text"
                defaultValue={user?.full_name || "Peneliti Modellyng"}
                className="h-9 w-full rounded-md border bg-background px-3 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                defaultValue={user?.email || "peneliti@modellyng.ac.id"}
                disabled
                className="h-9 w-full rounded-md border bg-muted px-3 text-xs opacity-75"
              />
            </div>
          </div>
        </div>

        {/* Subscription Plan & Upgrade Access Card */}
        <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Status Paket Akun</span>
                <Badge variant="muted" className="text-[10px] font-semibold px-2 py-0.2">
                  Free Plan (Aktif)
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda saat ini menggunakan paket gratis dengan batas <span className="font-semibold text-foreground">3 upload per hari</span>.
                Upgrade ke Student Pro untuk mendapatkan <span className="font-semibold text-primary">15 token setiap hari</span>, akses penuh Comparative Matrix, dan Research Gap Map interaktif.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-border/50">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary shrink-0" />
              <span>
                Tersedia paket <strong>Student Pro 14 Hari</strong> (Rp29.000) dan <strong>30 Hari</strong> (Rp49.000)
              </span>
            </div>

            <Button asChild size="sm" className="gap-2 text-xs font-semibold rounded-lg shadow-sm shadow-primary/20 shrink-0">
              <Link to={ROUTES.USER.PRICING}>
                <Crown className="size-3.5 text-amber-300" />
                <span>Lihat Pilihan Paket & Upgrade</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Usage Limits Card (Dummy Frontend Data) */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <span>Batas Penggunaan & Kuota Harian (Usage Limit)</span>
            </h3>
            <Badge variant="outline" className="text-[10px] font-medium border-muted-foreground/30">
              Free Plan
            </Badge>
          </div>

          {/* Upload File Progress */}
          <div className="p-3.5 rounded-lg border bg-muted/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Kuota Upload PDF Hari Ini</span>
              </span>
              <span className="font-semibold text-foreground">
                1 / 3 File <span className="text-[11px] font-normal text-muted-foreground">(Sisa 2 file)</span>
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: "33.3%" }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground gap-1 pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-amber-500" />
                Reset berkala: <strong>Setiap 24 Jam (Pukul 00:00 WIB)</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                Reset kuota dalam 8j 21m
              </span>
            </div>
          </div>

          {/* Feature Access Limitations List */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-medium text-muted-foreground block">
              Status Akses Fitur Akun Gratis:
            </label>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/50">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-[11px]">Ringkasan & Analisis Dasar</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Ekstraksi 11 komponen utama & sitasi dasar aktif.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/50">
                <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-[11px]">Comparative Paper Matrix</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Tabel dasar terlihat, analisis mendalam dikunci.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/50">
                <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-[11px]">Research Gap Map</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Preview terbatas, visualisasi flow map dibuat blur.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/50">
                <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-[11px]">AI Editing & Perumusan Solusi</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Terkunci penuh, khusus pengguna Student Pro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Citation Preferences */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            <span>Preferensi Sitasi & Model AI</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Format Standar Daftar Pustaka</label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-xs">
                <option value="APA">APA 7th Edition (Default)</option>
                <option value="IEEE">IEEE Reference Style</option>
                <option value="Harvard">Harvard Referencing</option>
                <option value="Chicago">Chicago Manual of Style</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="font-medium text-muted-foreground">
                  Ambang Batas Keyakinan Peninjauan AI
                </label>
                <span className="font-semibold text-primary">80%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Komponen dengan skor di bawah 80% akan otomatis masuk ke Antrean Review.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
          >
            <LogOut className="size-3.5" />
            <span>Keluar Akun</span>
          </Button>
          <Button size="sm">Simpan Perubahan</Button>
        </div>
      </div>
    </div>
  )
}
