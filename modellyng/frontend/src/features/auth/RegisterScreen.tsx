import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"

export default function RegisterScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Daftar Akun Peneliti</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Buat akun Modellyng untuk mengorganisir literatur ilmiah Anda.
        </p>

        <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Dr. Nama Peneliti"
              className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              type="email"
              placeholder="nama@kampus.ac.id"
              className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Kata Sandi</label>
            <input
              type="password"
              placeholder="Minimal 8 karakter"
              className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Button asChild className="w-full" size="sm">
            <Link to={ROUTES.DASHBOARD}>Buat Akun</Link>
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Sudah memiliki akun?{" "}
          <Link to={ROUTES.AUTH.LOGIN} className="font-semibold text-primary hover:underline">
            Masuk
          </Link>
        </div>
      </div>
    </div>
  )
}
