import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"

export default function ForgotPasswordScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Pemulihan Kata Sandi</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kami akan mengirimkan tautan reset kata sandi ke email Anda.
        </p>

        <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email Terdaftar</label>
            <input
              type="email"
              placeholder="nama@institusi.ac.id"
              className="h-9 w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Button asChild className="w-full" size="sm">
            <Link to={ROUTES.AUTH.LOGIN}>Kirim Tautan Pemulihan</Link>
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Ingat kata sandi?{" "}
          <Link to={ROUTES.AUTH.LOGIN} className="font-semibold text-primary hover:underline">
            Kembali ke login
          </Link>
        </div>
      </div>
    </div>
  )
}
