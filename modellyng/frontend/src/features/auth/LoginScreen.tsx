import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"

export default function LoginScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Masuk ke Modellyng</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Masukkan email dan kata sandi akun riset Anda.
        </p>

        <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              type="email"
              placeholder="nama@institusi.ac.id"
              className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Kata Sandi</label>
              <Link
                to={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-[11px] text-primary hover:underline"
              >
                Lupa sandi?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Button asChild className="w-full" size="sm">
            <Link to={ROUTES.DASHBOARD}>Masuk ke Dasbor</Link>
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Belum punya akun?{" "}
          <Link to={ROUTES.AUTH.REGISTER} className="font-semibold text-primary hover:underline">
            Daftar sekarang
          </Link>
        </div>
      </div>
    </div>
  )
}
