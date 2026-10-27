import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  ShieldCheck, 
  UserPlus, 
  Edit3, 
  Trash2, 
  X,
  History
} from "lucide-react"
import { adminApi, AdminAccountItem, AdminAccountCreateData } from "../api/adminApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"
import { useAuthStore } from "@/features/auth/store/authStore"

const PERMISSION_OPTIONS = [
  { key: "manage_users", label: "Kelola Pengguna & Kendala (Job 2)" },
  { key: "manage_subscriptions", label: "Kelola Paket Langganan CMS (Job 3)" },
  { key: "manage_cms", label: "Kelola Berita & Promo CMS (Job 4)" },
  { key: "manage_api_keys", label: "Kelola Kunci Model AI & Kuota (Job 5)" },
  { key: "manage_admins", label: "Kelola Sesama Administrator (Job 6)" },
]

export default function AdminManagementScreen() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<"admins" | "audit">("admins")

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminAccountItem | null>(null)

  // Create Form state
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [institution, setInstitution] = useState("Modellyng Core Team")
  const [adminRole, setAdminRole] = useState<string>("admin")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "manage_users",
    "manage_cms",
  ])

  // Queries
  const { data: admins, isLoading: isAdminsLoading } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: adminApi.getAdminAccounts,
  })

  const { data: auditLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => adminApi.getAuditLogs(50),
    enabled: activeTab === "audit",
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: AdminAccountCreateData) => adminApi.createAdminAccount(data),
    onSuccess: (res) => {
      toast.success(`Akun administrator '${res.email}' berhasil ditambahkan ke tim.`)
      setIsCreateModalOpen(false)
      resetCreateForm()
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menambahkan akun administrator.")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { full_name?: string; admin_role?: string; admin_permissions?: string[] } }) =>
      adminApi.updateAdminAccount(id, data),
    onSuccess: () => {
      toast.success("Hak akses administrator berhasil diperbarui.")
      setEditingAdmin(null)
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memperbarui administrator.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (adminId: string) => adminApi.deleteAdminAccount(adminId),
    onSuccess: (res) => {
      toast.success(res.message || "Administrator berhasil dihapus.")
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus administrator.")
    },
  })

  const resetCreateForm = () => {
    setEmail("")
    setFullName("")
    setPassword("AdminSandi123!")
    setInstitution("Modellyng Core Team")
    setAdminRole("admin")
    setSelectedPermissions(["manage_users", "manage_cms"])
  }

  const handleTogglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== key))
    } else {
      setSelectedPermissions([...selectedPermissions, key])
    }
  }

  const handleOpenEditModal = (admin: AdminAccountItem) => {
    setEditingAdmin(admin)
    setFullName(admin.full_name)
    setAdminRole(admin.admin_role)
    setSelectedPermissions(admin.admin_permissions || [])
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      email,
      full_name: fullName,
      password,
      institution,
      admin_role: adminRole,
      admin_permissions: selectedPermissions,
    })
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return
    updateMutation.mutate({
      id: editingAdmin.id,
      data: {
        full_name: fullName,
        admin_role: adminRole,
        admin_permissions: selectedPermissions,
      },
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Tata Kelola Sesama Administrator & Audit Log
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tambah akun pengelola platform, delegasikan hak akses terperinci (*granular permissions*), dan tinjau log audit.
            </p>
          </div>
        </div>

        {/* Tab & Add Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-secondary p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab("admins")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${
                activeTab === "admins" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>Tim Admin ({admins?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${
                activeTab === "audit" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="size-3.5" />
              <span>Jejak Audit</span>
            </button>
          </div>

          {activeTab === "admins" && (
            <Button
              size="sm"
              onClick={() => {
                resetCreateForm()
                setIsCreateModalOpen(true)
              }}
              className="text-xs gap-1.5"
            >
              <UserPlus className="size-3.5" />
              <span>Tambah Admin Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: ADMINS LIST */}
      {activeTab === "admins" && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Tingkat Peran</th>
                  <th className="py-3 px-4">Delegasi Hak Akses</th>
                  <th className="py-3 px-4">Institusi</th>
                  <th className="py-3 px-4">Terdaftar Sejak</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isAdminsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Memuat daftar administrator...
                    </td>
                  </tr>
                ) : admins?.map((adm) => {
                  const isCurrent = adm.id === currentUser?.id || adm.email === currentUser?.email
                  return (
                    <tr key={adm.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{adm.full_name}</span>
                            {isCurrent && (
                              <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                                Anda
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{adm.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          adm.admin_role === "super_admin"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                        }`}>
                          {adm.admin_role.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {adm.admin_permissions.includes("all") ? (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                              Semua Akses (Super User)
                            </span>
                          ) : (
                            adm.admin_permissions.map((p) => (
                              <span key={p} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">
                                {p.replace("manage_", "")}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        {adm.institution || "-"}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {new Date(adm.created_at).toLocaleDateString("id-ID")}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(adm)}
                            className="h-7 px-2 text-xs"
                            title="Ubah Hak Akses"
                          >
                            <Edit3 className="size-3.5 mr-1" />
                            <span>Edit</span>
                          </Button>

                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus administrator '${adm.full_name}' (${adm.email})?`)) {
                                  deleteMutation.mutate(adm.id)
                                }
                              }}
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                              title="Hapus Administrator"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Aksi Dilakukan</th>
                  <th className="py-3 px-4">Target Sistem</th>
                  <th className="py-3 px-4">Rincian Perubahan (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {isLogsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans">
                      Memuat jejak audit platform...
                    </td>
                  </tr>
                ) : !auditLogs || auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans">
                      Belum ada catatan aktivitas administratif yang terekam.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 px-4 font-semibold text-foreground font-sans">
                        {log.admin_email}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-sans">
                        {log.target_type} {log.target_id ? `(${log.target_id.substring(0, 8)}...)` : ""}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground max-w-sm truncate" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE ADMIN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <UserPlus className="size-4 text-primary" />
                <span>Tambah Akun Administrator Baru</span>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Email Admin</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@modellyng.ac.id"
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Nama Lengkap</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Misal: Fatih Administrator"
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Kata Sandi Awal</label>
                  <Input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Tingkat Peran</label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="admin">Administrator Biasa</option>
                    <option value="support_admin">Support & Bug Admin</option>
                    <option value="content_admin">Content & CMS Admin</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Institusi / Afiliasi</label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 border-t pt-3">
                <label className="font-medium text-foreground">
                  Delegasi Hak Akses Modul Administrator:
                </label>
                <div className="space-y-2">
                  {PERMISSION_OPTIONS.map((opt) => {
                    const isChecked = selectedPermissions.includes(opt.key)
                    return (
                      <label 
                        key={opt.key}
                        onClick={() => handleTogglePermission(opt.key)}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent label click
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-xs text-foreground font-medium">{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="text-xs"
                >
                  {createMutation.isPending ? "Menyimpan..." : "Buat Akun Administrator"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN PERMISSIONS MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Edit3 className="size-4 text-primary" />
                <span>Ubah Hak Akses: {editingAdmin.email}</span>
              </div>
              <button 
                onClick={() => setEditingAdmin(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Nama Lengkap</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Tingkat Peran</label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="admin">Administrator Biasa</option>
                  <option value="support_admin">Support & Bug Admin</option>
                  <option value="content_admin">Content & CMS Admin</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 border-t pt-3">
                <label className="font-medium text-foreground">
                  Pembaruan Hak Akses Fitur:
                </label>
                <div className="space-y-2">
                  {PERMISSION_OPTIONS.map((opt) => {
                    const isChecked = selectedPermissions.includes(opt.key)
                    return (
                      <label 
                        key={opt.key}
                        onClick={() => handleTogglePermission(opt.key)}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-xs text-foreground font-medium">{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAdmin(null)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateMutation.isPending}
                  className="text-xs"
                >
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan Hak Akses"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
