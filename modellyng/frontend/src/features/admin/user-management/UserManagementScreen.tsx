import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Users, 
  Search, 
  KeyRound, 
  UserX, 
  UserCheck, 
  ShieldAlert, 
  Bug, 
  X
} from "lucide-react"
import { adminApi, AdminUserItem, AdminBugReportItem } from "../api/adminApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"

export default function UserManagementScreen() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"users" | "bugs">("users")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [bugStatusFilter, setBugStatusFilter] = useState<string>("")

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<"active" | "suspended" | "deactivated">("suspended")
  const [suspensionReason, setSuspensionReason] = useState("")

  const [selectedBug, setSelectedBug] = useState<AdminBugReportItem | null>(null)
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)
  const [bugResolutionStatus, setBugResolutionStatus] = useState<string>("investigating")
  const [bugAdminNotes, setBugAdminNotes] = useState("")

  // Query: Users list
  const { 
    data: userData, 
    isLoading: isUsersLoading, 
  } = useQuery({
    queryKey: ["admin", "users", { search, roleFilter, statusFilter }],
    queryFn: () => adminApi.getUsers({ search, role: roleFilter, status: statusFilter }),
  })

  // Query: Bug reports
  const { 
    data: bugReports, 
    isLoading: isBugsLoading, 
  } = useQuery({
    queryKey: ["admin", "bug-reports", bugStatusFilter],
    queryFn: () => adminApi.getBugReports(bugStatusFilter || undefined),
  })

  // Mutation: Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, pass }: { userId: string; pass: string }) =>
      adminApi.resetUserPassword(userId, { new_password: pass }),
    onSuccess: (res) => {
      toast.success(res.message || "Kata sandi pengguna berhasil diatur ulang.")
      setIsPasswordModalOpen(false)
      setNewPassword("")
      setSelectedUser(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal mengatur ulang kata sandi.")
    },
  })

  // Mutation: Update user status (suspend/reactivate)
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: string; reason?: string }) =>
      adminApi.updateUserStatus(userId, { status, suspension_reason: reason }),
    onSuccess: (res) => {
      toast.success(res.message || "Status pengguna berhasil diperbarui.")
      setIsStatusModalOpen(false)
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memperbarui status pengguna.")
    },
  })

  // Mutation: Update bug report
  const updateBugMutation = useMutation({
    mutationFn: ({ bugId, status, notes }: { bugId: string; status: string; notes?: string }) =>
      adminApi.updateBugReport(bugId, { status, admin_notes: notes }),
    onSuccess: (res) => {
      toast.success(res.message || "Laporan kendala berhasil diperbarui.")
      setIsBugModalOpen(false)
      setSelectedBug(null)
      queryClient.invalidateQueries({ queryKey: ["admin", "bug-reports"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memperbarui laporan bug.")
    },
  })

  const handleOpenPasswordModal = (user: AdminUserItem) => {
    setSelectedUser(user)
    setNewPassword("GantiSandi123!")
    setIsPasswordModalOpen(true)
  }

  const handleOpenStatusModal = (user: AdminUserItem, newStatus: "active" | "suspended" | "deactivated") => {
    setSelectedUser(user)
    setTargetStatus(newStatus)
    setSuspensionReason(user.suspension_reason || (newStatus === "suspended" ? "Terdeteksi aktivitas pelanggaran hak cipta dokumen akademik." : ""))
    setIsStatusModalOpen(true)
  }

  const handleOpenBugModal = (bug: AdminBugReportItem) => {
    setSelectedBug(bug)
    setBugResolutionStatus(bug.status)
    setBugAdminNotes(bug.admin_notes || "")
    setIsBugModalOpen(true)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Konfigurasi & Manajemen Pengguna
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kendali akun peneliti, penanganan kesulitan login (reset sandi), sanksi pelanggaran, dan laporan bug teknis.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-secondary p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${
              activeTab === "users" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-3.5" />
            <span>Daftar Pengguna ({userData?.total || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("bugs")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${
              activeTab === "bugs" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bug className="size-3.5" />
            <span>Laporan Bug & Tiket ({bugReports?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama pengguna, email, atau institusi kampus..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs rounded-md border bg-card px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Semua Peran</option>
                <option value="researcher">Peneliti (Researcher)</option>
                <option value="admin">Administrator</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-md border bg-card px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="suspended">Ditangguhkan (Suspended)</option>
                <option value="deactivated">Dinonaktifkan</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Institusi</th>
                    <th className="py-3 px-4">Paket</th>
                    <th className="py-3 px-4">Proyek / Paper</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi Administrator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Memuat data pengguna...
                      </td>
                    </tr>
                  ) : !userData?.users || userData.users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Tidak ada pengguna yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    userData.users.map((u) => (
                      <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {u.role === "admin" && (
                                <Badge className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">{u.email}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground">
                          {u.institution || "-"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            u.subscription_tier === "pro" 
                              ? "bg-primary/10 text-primary border border-primary/20" 
                              : u.subscription_tier === "enterprise"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300/30"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {u.subscription_tier}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground">
                          {u.total_projects} Proyek • {u.total_papers} Paper
                        </td>

                        <td className="py-3.5 px-4">
                          {u.status === "active" ? (
                            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950 border-emerald-200">
                              Aktif
                            </Badge>
                          ) : u.status === "suspended" ? (
                            <div className="space-y-0.5">
                              <Badge variant="destructive" className="text-[10px]">
                                Ditangguhkan
                              </Badge>
                              {u.suspension_reason && (
                                <p className="text-[10px] text-destructive/80 italic max-w-xs truncate" title={u.suspension_reason}>
                                  "{u.suspension_reason}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Nonaktif
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset password button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPasswordModal(u)}
                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                              title="Bantu Pengguna: Reset Kata Sandi"
                            >
                              <KeyRound className="size-3.5 mr-1" />
                              <span>Reset Sandi</span>
                            </Button>

                            {/* Status toggle button */}
                            {u.status === "active" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenStatusModal(u, "suspended")}
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                                title="Tangguhkan Akun Karena Pelanggaran"
                              >
                                <UserX className="size-3.5 mr-1" />
                                <span>Tangguhkan</span>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenStatusModal(u, "active")}
                                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                title="Aktifkan Kembali Akun"
                              >
                                <UserCheck className="size-3.5 mr-1" />
                                <span>Aktifkan</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUG REPORTS & TICKETS */}
      {activeTab === "bugs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Daftar kendala teknis dan laporan kesalahan sistem yang dilaporkan oleh peneliti saat menganalisis dokumen PDF.
            </p>

            <select
              value={bugStatusFilter}
              onChange={(e) => setBugStatusFilter(e.target.value)}
              className="text-xs rounded-md border bg-card px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Semua Status Tiket</option>
              <option value="open">Open (Baru)</option>
              <option value="investigating">Sedang Diinvestigasi</option>
              <option value="resolved">Selesai (Resolved)</option>
              <option value="closed">Ditutup (Closed)</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {isBugsLoading ? (
              <div className="col-span-2 py-12 text-center text-xs text-muted-foreground">
                Memuat tiket kendala teknis...
              </div>
            ) : !bugReports || bugReports.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-xs text-muted-foreground">
                Belum ada tiket laporan bug terbuka. Semua sistem berjalan lancar!
              </div>
            ) : (
              bugReports.map((bug) => (
                <div key={bug.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        bug.severity === "critical"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                          : bug.severity === "high"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                      }`}>
                        {bug.severity}
                      </span>

                      <Badge variant="outline" className={`text-[10px] ${
                        bug.status === "resolved" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                          : bug.status === "investigating"
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {bug.status}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground leading-snug">
                      {bug.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {bug.description}
                    </p>

                    {bug.admin_notes && (
                      <div className="p-2.5 rounded-lg bg-secondary/50 border text-[11px] text-muted-foreground">
                        <strong className="text-foreground">Catatan Admin:</strong> {bug.admin_notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Oleh: <strong>{bug.user_name || bug.user_email || "Anonim"}</strong></span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenBugModal(bug)}
                      className="h-7 text-xs"
                    >
                      Perbarui Resolusi
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: RESET PASSWORD */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <KeyRound className="size-4 text-primary" />
                <span>Reset Kata Sandi Pengguna</span>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                Gunakan fitur ini apabila pengguna mengalami kesulitan login atau lupa sandi. Kata sandi baru akan di-hash secara aman menggunakan algoritma Argon2id di server.
              </p>
              <div className="p-2.5 rounded-lg bg-secondary/60 text-foreground font-medium">
                Akun: {selectedUser.full_name} ({selectedUser.email})
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Kata Sandi Baru
              </label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => resetPasswordMutation.mutate({ userId: selectedUser.id, pass: newPassword })}
                disabled={resetPasswordMutation.isPending || newPassword.length < 6}
                className="text-xs"
              >
                {resetPasswordMutation.isPending ? "Menyimpan..." : "Terapkan Sandi Baru"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUSPEND / ACTIVATE USER */}
      {isStatusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <ShieldAlert className="size-4 text-rose-600" />
                <span>
                  {targetStatus === "active" ? "Aktifkan Kembali Akun" : "Penangguhan Akun Pengguna"}
                </span>
              </div>
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {targetStatus === "active" 
                ? `Akun ${selectedUser.full_name} akan diaktifkan kembali dan dapat login seperti biasa.`
                : `Akun ${selectedUser.full_name} (${selectedUser.email}) akan ditangguhkan dan diblokir dari akses platform.`}
            </p>

            {targetStatus !== "active" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Alasan Pelanggaran / Sanksi
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Misal: Pelanggaran kuota rate limit atau unggahan berkas tidak wajar..."
                  rows={3}
                  className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                variant={targetStatus === "active" ? "default" : "destructive"}
                size="sm"
                onClick={() => updateStatusMutation.mutate({ 
                  userId: selectedUser.id, 
                  status: targetStatus, 
                  reason: suspensionReason 
                })}
                disabled={updateStatusMutation.isPending}
                className="text-xs"
              >
                {updateStatusMutation.isPending ? "Memproses..." : targetStatus === "active" ? "Aktifkan Akun" : "Tangguhkan Akun"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BUG REPORT RESOLUTION */}
      {isBugModalOpen && selectedBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Bug className="size-4 text-primary" />
                <span>Resolusi Laporan Kendala Sistem</span>
              </div>
              <button 
                onClick={() => setIsBugModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">{selectedBug.title}</h4>
              <p className="text-[11px] text-muted-foreground">{selectedBug.description}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Status Penanganan
                </label>
                <select
                  value={bugResolutionStatus}
                  onChange={(e) => setBugResolutionStatus(e.target.value)}
                  className="w-full text-xs rounded-md border bg-card p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="open">Open (Menunggu Tindakan)</option>
                  <option value="investigating">Sedang Diinvestigasi Tim Pengembang</option>
                  <option value="resolved">Selesai / Diperbaiki (Resolved)</option>
                  <option value="closed">Ditutup (Closed)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Catatan Tindakan Teknis Admin
                </label>
                <textarea
                  value={bugAdminNotes}
                  onChange={(e) => setBugAdminNotes(e.target.value)}
                  placeholder="Jelaskan tindakan perbaikan atau solusi yang diberikan..."
                  rows={3}
                  className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBugModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => updateBugMutation.mutate({
                  bugId: selectedBug.id,
                  status: bugResolutionStatus,
                  notes: bugAdminNotes,
                })}
                disabled={updateBugMutation.isPending}
                className="text-xs"
              >
                {updateBugMutation.isPending ? "Menyimpan..." : "Simpan Resolusi"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
