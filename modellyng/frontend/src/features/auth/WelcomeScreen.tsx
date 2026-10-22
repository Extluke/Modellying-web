import { Link } from "react-router-dom"
import { ROUTES } from "@/app/routes"

export default function WelcomeScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center select-none">
      <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-7xl md:text-8xl">
        INI BAGIAN MU CAY
      </h1>

      <p className="mt-8 text-lg sm:text-xl text-muted-foreground">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="font-medium text-primary underline underline-offset-8 transition-colors hover:text-primary/80"
        >
          klik disini untuk login
        </Link>
      </p>
    </div>
  )
}

