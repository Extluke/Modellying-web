import { Settings, User, Sliders, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
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
