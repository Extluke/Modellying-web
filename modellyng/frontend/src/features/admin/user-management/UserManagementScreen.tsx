import { Users } from "lucide-react"

export default function UserManagementScreen() {
  return (
    <div className="p-6 space-y-4">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <span>Manajemen Pengguna & Kuota Riset</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola hak akses institusi, batas unggah PDF, dan role peneliti.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 text-center text-xs text-muted-foreground">
        Tabel manajemen pengguna sistem (Modul Administrator Masa Depan).
      </div>
    </div>
  )
}
