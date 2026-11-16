import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  Users, 
  Search, 
  KeyRound, 
  UserX, 
  UserCheck, 
  ShieldAlert, 
  Bug, 
  X,
  Mail,
  Inbox,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  Check
} from "lucide-react"
import { adminApi, AdminUserItem, AdminBugReportItem } from "../api/adminApi"
import { DUMMY_USERS, DUMMY_BUG_REPORTS } from "../data/dummyAdminData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"

function getInitials(name?: string | null): string {
  if (!name) return "U"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300"
    case "high":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300"
    case "medium":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300"
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
    case "investigating":
      return "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
    case "closed":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
    default:
      return "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300"
  }
}

export default function UserManagementScreen() {
  const [activeTab, setActiveTab] = useState<"users" | "bugs">("users")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [bugStatusFilter, setBugStatusFilter] = useState<string>("")
  const [bugSearch, setBugSearch] = useState("")

  // State for interactive dummy data
  const [usersList, setUsersList] = useState<AdminUserItem[]>(DUMMY_USERS)
  const [bugReportsList, setBugReportsList] = useState<AdminBugReportItem[]>(DUMMY_BUG_REPORTS)

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<"active" | "suspended" | "deactivated">("suspended")
  const [suspensionReason, setSuspensionReason] = useState("")

  // Email Inbox Bug states
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null)
  const [inlineStatus, setInlineStatus] = useState<string>("investigating")
  const [inlineNotes, setInlineNotes] = useState<string>("")
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  // Optional background fetch from API
  const { data: apiUserData } = useQuery({
    queryKey: ["admin", "users", { search, roleFilter, statusFilter }],
    queryFn: () => adminApi.getUsers({ search, role: roleFilter, status: statusFilter }),
    retry: false,
  })

  const { data: apiBugData } = useQuery({
    queryKey: ["admin", "bug-reports", bugStatusFilter],
    queryFn: () => adminApi.getBugReports(bugStatusFilter || undefined),
    retry: false,
  })

  // Filtered users list based on state
  const filteredUsers = useMemo(() => {
    const source = (apiUserData?.users && apiUserData.users.length > 0) ? apiUserData.users : usersList
    return source.filter((u) => {
      const term = search.toLowerCase()
      const matchSearch = !term || 
        u.full_name.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term) || 
        (u.institution && u.institution.toLowerCase().includes(term))
      const matchRole = !roleFilter || u.role === roleFilter
      const matchStatus = !statusFilter || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [apiUserData, usersList, search, roleFilter, statusFilter])

  // Filtered bug reports list based on state & search
  const filteredBugs = useMemo(() => {
    const source = (apiBugData && apiBugData.length > 0) ? apiBugData : bugReportsList
    return source.filter((b) => {
      const matchStatus = !bugStatusFilter || b.status === bugStatusFilter
      const term = bugSearch.toLowerCase()
      const matchSearch = !term ||
        b.title.toLowerCase().includes(term) ||
        b.description.toLowerCase().includes(term) ||
        (b.user_name && b.user_name.toLowerCase().includes(term)) ||
        (b.user_email && b.user_email.toLowerCase().includes(term))
      return matchStatus && matchSearch
    })
  }, [apiBugData, bugReportsList, bugStatusFilter, bugSearch])

  const activeBug = useMemo(() => {
    if (selectedBugId) {
      const found = filteredBugs.find((b) => b.id === selectedBugId)
      if (found) return found
    }
    return filteredBugs[0] || null
  }, [filteredBugs, selectedBugId])

  useEffect(() => {
    if (activeBug) {
      setInlineStatus(activeBug.status)
      setInlineNotes(activeBug.admin_notes || "")
    }
  }, [activeBug?.id])

  const handleApplyInlineResolution = () => {
    if (!activeBug) return
    setBugReportsList((prev) =>
      prev.map((b) =>
        b.id === activeBug.id
          ? {
              ...b,
              status: inlineStatus as AdminBugReportItem["status"],
              admin_notes: inlineNotes,
              resolved_at: inlineStatus === "resolved" ? new Date().toISOString() : b.resolved_at,
            }
          : b
      )
    )

    adminApi.updateBugReport(activeBug.id, {
      status: inlineStatus,
      admin_notes: inlineNotes,
    }).catch(() => {})

    const statusLabel = 
      inlineStatus === "resolved" ? "Terselesaikan" : 
      inlineStatus === "investigating" ? "Sedang Diinvestigasi" : 
      inlineStatus === "closed" ? "Ditutup" : "Open"
    toast.success(`Tanggapan berhasil dikirim dan status tiket #${activeBug.id} diubah menjadi '${statusLabel}'.`)
  }

  const handleQuickStatusChange = (status: AdminBugReportItem["status"]) => {
    if (!activeBug) return
    setInlineStatus(status)
    setBugReportsList((prev) =>
      prev.map((b) =>
        b.id === activeBug.id
          ? {
              ...b,
              status,
              resolved_at: status === "resolved" ? new Date().toISOString() : b.resolved_at,
            }
          : b
      )
    )
    adminApi.updateBugReport(activeBug.id, {
      status,
      admin_notes: inlineNotes,
    }).catch(() => {})

    const statusLabel = 
      status === "resolved" ? "Terselesaikan" : 
      status === "investigating" ? "Sedang Diinvestigasi" : 
      status === "closed" ? "Ditutup" : "Open"
    toast.success(`Status tiket #${activeBug.id} diubah menjadi '${statusLabel}'.`)
  }

  // Actions
  const handleOpenPasswordModal = (user: AdminUserItem) => {
    setSelectedUser(user)
    setNewPassword("GantiSandi123!")
    setIsPasswordModalOpen(true)
  }

  const handleApplyPasswordReset = () => {
    if (!selectedUser || newPassword.length < 6) return
    // Try background API call if available
    adminApi.resetUserPassword(selectedUser.id, { new_password: newPassword }).catch(() => {})
    
    toast.success(`Kata sandi untuk pengguna '${selectedUser.full_name}' (${selectedUser.email}) berhasil diatur ulang menjadi sandi baru.`)
    setIsPasswordModalOpen(false)
    setNewPassword("")
    setSelectedUser(null)
  }

  const handleOpenStatusModal = (user: AdminUserItem, newStatus: "active" | "suspended" | "deactivated") => {
    setSelectedUser(user)
    setTargetStatus(newStatus)
    setSuspensionReason(user.suspension_reason || (newStatus === "suspended" ? "Terdeteksi aktivitas pelanggaran hak cipta dokumen akademik." : ""))
    setIsStatusModalOpen(true)
  }

  const handleApplyStatusChange = () => {
    if (!selectedUser) return
    // Update local state immediately for interactive demo
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              status: targetStatus,
              suspension_reason: targetStatus === "active" ? null : suspensionReason,
            }
          : u
      )
    )

    // Background API call
    adminApi.updateUserStatus(selectedUser.id, {
      status: targetStatus,
      suspension_reason: suspensionReason,
    }).catch(() => {})

    const label = targetStatus === "active" ? "diaktifkan kembali" : `ditangguhkan (${targetStatus})`
    toast.success(`Akun pengguna '${selectedUser.full_name}' berhasil ${label}.`)
    setIsStatusModalOpen(false)
    setSelectedUser(null)
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
            <span>Daftar Pengguna ({filteredUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("bugs")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${
              activeTab === "bugs" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bug className="size-3.5" />
            <span>Laporan Bug & Tiket ({filteredBugs.length})</span>
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
                placeholder="Cari nama pengguna, email, atau institusi perguruan tinggi..."
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
                    <th className="py-3 px-4">Institusi Riset</th>
                    <th className="py-3 px-4">Paket</th>
                    <th className="py-3 px-4">Proyek / Paper</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi Administrator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Tidak ada pengguna yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
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
                            <span className="text-[11px] text-muted-foreground font-mono">{u.email}</span>
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
                          <strong>{u.total_projects}</strong> Proyek • <strong>{u.total_papers}</strong> Paper
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

            {/* Pagination footer info */}
            <div className="px-4 py-3 bg-secondary/20 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Menampilkan {filteredUsers.length} dari {filteredUsers.length} pengguna terdaftar</span>
              <span>Halaman 1 dari 1</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUG REPORTS & TICKETS - EMAIL INBOX INTERFACE */}
      {activeTab === "bugs" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Kotak Masuk Tiket & Laporan Kendala Sistem dari Peneliti (Tampilan Pesan Email)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] gap-1.5 px-2.5 py-1 bg-primary/5 text-primary border-primary/20">
                <Inbox className="size-3.5" />
                <span>{filteredBugs.length} Tiket Masuk</span>
              </Badge>
            </div>
          </div>

          {/* Email Client Shell */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[640px] max-h-[780px]">
            {/* LEFT PANE: INBOX LIST */}
            <div className={`w-full md:w-80 lg:w-[380px] shrink-0 border-r flex flex-col bg-card/60 ${mobileDetailOpen ? "hidden md:flex" : "flex"}`}>
              {/* Search & Filter Header */}
              <div className="p-3 border-b space-y-2.5 bg-muted/20">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={bugSearch}
                    onChange={(e) => setBugSearch(e.target.value)}
                    placeholder="Cari subjek, pesan, pelapor..."
                    className="h-8 pl-8 text-xs bg-background"
                  />
                  {bugSearch && (
                    <button
                      onClick={() => setBugSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  {[
                    { id: "", label: "Semua" },
                    { id: "open", label: "Open" },
                    { id: "investigating", label: "Ditinjau" },
                    { id: "resolved", label: "Selesai" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setBugStatusFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-md shrink-0 transition-colors font-medium ${
                        bugStatusFilter === filter.id
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-secondary/70 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Email List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {filteredBugs.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Inbox className="size-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs text-muted-foreground">Tidak ada pesan tiket yang cocok</p>
                  </div>
                ) : (
                  filteredBugs.map((bug) => {
                    const isSelected = activeBug?.id === bug.id
                    return (
                      <button
                        key={bug.id}
                        onClick={() => {
                          setSelectedBugId(bug.id)
                          setMobileDetailOpen(true)
                        }}
                        className={`w-full text-left p-3.5 transition-all flex gap-3 relative ${
                          isSelected
                            ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary"
                            : "hover:bg-muted/40 border-l-4 border-l-transparent"
                        }`}
                      >
                        {/* Avatar Initials */}
                        <div className={`size-8 rounded-full shrink-0 flex items-center justify-center font-bold text-[11px] ${
                          bug.severity === "critical"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : bug.severity === "high"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {getInitials(bug.user_name || bug.user_email)}
                        </div>

                        {/* Thread Preview */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs truncate ${isSelected || bug.status === "open" ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                              {bug.user_name || bug.user_email || "Peneliti"}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(bug.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                            </span>
                          </div>

                          <p className={`text-xs truncate ${isSelected ? "font-semibold text-primary" : "font-medium text-foreground/90"}`}>
                            {bug.title}
                          </p>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {bug.description}
                          </p>

                          <div className="flex items-center gap-1.5 pt-1">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${getSeverityBadge(bug.severity)}`}>
                              {bug.severity}
                            </span>
                            <Badge variant="outline" className={`text-[9px] py-0 px-1.5 ${getStatusBadge(bug.status)}`}>
                              {bug.status}
                            </Badge>
                            {bug.admin_notes && (
                              <span className="ml-auto flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="size-3" />
                                <span>Dibalas</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANE: READING & ACTION PANE */}
            <div className={`flex-1 flex flex-col bg-background/50 overflow-hidden ${!mobileDetailOpen ? "hidden md:flex" : "flex"}`}>
              {activeBug ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Top Email Toolbar */}
                  <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileDetailOpen(false)}
                        className="md:hidden h-8 px-2 text-xs gap-1"
                      >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali</span>
                      </Button>
                      <span className="text-xs font-mono text-muted-foreground">
                        Tiket #{activeBug.id}
                      </span>
                    </div>

                    {/* Quick status actions */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickStatusChange("investigating")}
                        disabled={activeBug.status === "investigating"}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Tandai Investigasi
                      </Button>
                      <Button
                        variant={activeBug.status === "resolved" ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleQuickStatusChange("resolved")}
                        disabled={activeBug.status === "resolved"}
                        className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check className="size-3 mr-1" />
                        Tandai Selesai
                      </Button>
                    </div>
                  </div>

                  {/* Email Body Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Subject */}
                    <div className="space-y-3 pb-4 border-b">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(activeBug.severity)}`}>
                          Tingkat: {activeBug.severity}
                        </span>
                        <Badge variant="outline" className={`text-[10px] ${getStatusBadge(activeBug.status)}`}>
                          Status: {activeBug.status}
                        </Badge>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                        {activeBug.title}
                      </h2>
                    </div>

                    {/* Sender Info Card (Like an Email Header) */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-card border shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {getInitials(activeBug.user_name || activeBug.user_email)}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {activeBug.user_name || "Peneliti Modellyng"}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              &lt;{activeBug.user_email || "no-email@modellying.ac.id"}&gt;
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Clock className="size-3 text-muted-foreground" />
                            <span>Dikirim: {new Date(activeBug.created_at).toLocaleString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })} WIB</span>
                          </p>
                        </div>
                      </div>

                      {activeBug.page_url && (
                        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-primary font-mono bg-primary/10 px-2.5 py-1 rounded-md shrink-0">
                          <ExternalLink className="size-3" />
                          <span className="truncate max-w-[180px]">{activeBug.page_url}</span>
                        </div>
                      )}
                    </div>

                    {/* Email Message Content */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Mail className="size-3.5 text-primary" />
                        <span>Isi Laporan Kendala dari Pengguna:</span>
                      </div>
                      <div className="rounded-xl border bg-card p-5 shadow-xs text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed space-y-3 font-normal">
                        <p>{activeBug.description}</p>

                        {activeBug.page_url && (
                          <div className="sm:hidden pt-2 border-t text-[11px] text-primary font-mono flex items-center gap-1">
                            <ExternalLink className="size-3" />
                            <span>Tautan: {activeBug.page_url}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Previous Admin Reply if exists */}
                    {activeBug.admin_notes && (
                      <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/5 p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>Catatan & Resolusi Terakhir Admin:</span>
                          </span>
                          {activeBug.resolved_at && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {new Date(activeBug.resolved_at).toLocaleDateString("id-ID")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed italic bg-background/50 p-3 rounded-lg border">
                          "{activeBug.admin_notes}"
                        </p>
                      </div>
                    )}

                    {/* Inline Reply / Resolution Action Form */}
                    <div className="rounded-xl border bg-card p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <MessageSquare className="size-3.5 text-primary" />
                          <span>Tulis Balasan / Tindak Lanjut Resolusi</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">Admin Desk</span>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="w-full sm:w-60 space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground">
                              Ubah Status Tiket:
                            </label>
                            <select
                              value={inlineStatus}
                              onChange={(e) => setInlineStatus(e.target.value)}
                              className="w-full text-xs rounded-md border bg-background p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="open">Open (Menunggu Tindakan)</option>
                              <option value="investigating">Sedang Diinvestigasi Tim</option>
                              <option value="resolved">Selesai / Diperbaiki (Resolved)</option>
                              <option value="closed">Ditutup (Closed)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            Pesan Balasan / Solusi Teknis untuk Pengguna:
                          </label>
                          <textarea
                            value={inlineNotes}
                            onChange={(e) => setInlineNotes(e.target.value)}
                            placeholder="Contoh: Kendala gagal parsing tabel telah diperbaiki pada mesin ekstraksi v1.4. Dokumen Anda sudah siap dianalisis kembali..."
                            rows={3}
                            className="w-full rounded-md border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                          />
                        </div>

                        <div className="flex items-center justify-end pt-1">
                          <Button
                            size="sm"
                            onClick={handleApplyInlineResolution}
                            className="text-xs gap-1.5 px-4"
                          >
                            <Send className="size-3.5" />
                            <span>Kirim Balasan & Simpan Resolusi</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="size-14 rounded-2xl bg-muted/50 border flex items-center justify-center text-muted-foreground">
                    <Mail className="size-7" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-sm font-semibold text-foreground">Pilih Laporan Kendala</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pilih salah satu pesan tiket pada panel sebelah kiri untuk membaca detail laporan bug dan menulis balasan resolusi kepada pengguna.
                    </p>
                  </div>
                </div>
              )}
            </div>
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
                onClick={handleApplyPasswordReset}
                disabled={newPassword.length < 6}
                className="text-xs"
              >
                Terapkan Sandi Baru
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
                onClick={handleApplyStatusChange}
                className="text-xs"
              >
                {targetStatus === "active" ? "Aktifkan Akun" : "Tangguhkan Akun"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
