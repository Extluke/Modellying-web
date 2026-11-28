import { useState, useMemo, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSubscriptionPlans } from "@/features/user/pricing/hooks/useSubscriptionPlans"
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
  Check,
  Star,
  RefreshCw,
  Sparkles,
  Crown,
  BookOpen,
  Filter
} from "lucide-react"
import { adminApi, AdminUserItem, AdminBugReportItem } from "../api/adminApi"
import { DUMMY_USERS, DUMMY_BUG_REPORTS } from "../data/dummyAdminData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useEscapeKey } from "@/hooks/useEscapeKey"
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
      return "bg-primary-soft text-primary dark:bg-primary/15 border-primary/25"
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
      return "bg-primary-soft text-primary border-primary/25 dark:bg-primary/15"
  }
}

function getTierInfo(tier?: string) {
  switch (tier?.toLowerCase()) {
    case "student_30":
    case "pro_30":
    case "pro":
      return {
        label: "Student Pro 30 Hari",
        badgeClass: "bg-primary-soft text-primary dark:bg-primary/15 border-primary/25",
        icon: Sparkles,
      }
    case "student_14":
    case "pro_14":
      return {
        label: "Student Pro 14 Hari",
        badgeClass: "bg-muted text-foreground border-border",
        icon: Sparkles,
      }
    case "enterprise":
      return {
        label: "Lab Enterprise",
        badgeClass: "bg-primary text-primary-foreground border-primary",
        icon: Crown,
      }
    case "developer":
      return {
        label: "Developer Access",
        badgeClass: "bg-muted text-foreground border-border",
        icon: Crown,
      }
    default:
      if (!tier || tier === "free") {
        return {
          label: "Free Plan",
          badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
          icon: BookOpen,
        }
      }
      return {
        label: tier.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        badgeClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300/40",
        icon: Sparkles,
      }
  }
}

export default function UserManagementScreen() {
  const queryClient = useQueryClient()
  const { plans: subscriptionPlans } = useSubscriptionPlans()
  const [activeTab, setActiveTab] = useState<"users" | "bugs">("users")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("")
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

  // Modal State for Subscription Change
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [selectedUserForSub, setSelectedUserForSub] = useState<AdminUserItem | null>(null)
  const [targetSubTier, setTargetSubTier] = useState<string>("student_30")
  const [targetSubStatus, setTargetSubStatus] = useState<"active" | "pending_approval" | "rejected">("active")

  useEscapeKey(isPasswordModalOpen && Boolean(selectedUser), () => setIsPasswordModalOpen(false))
  useEscapeKey(isStatusModalOpen && Boolean(selectedUser), () => setIsStatusModalOpen(false))
  useEscapeKey(isSubModalOpen && Boolean(selectedUserForSub), () => setIsSubModalOpen(false))

  // Email Inbox Bug states (Gmail Style)
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null)
  const [inlineStatus, setInlineStatus] = useState<string>("investigating")
  const [inlineNotes, setInlineNotes] = useState<string>("")
  const [starredBugIds, setStarredBugIds] = useState<string[]>(["bug-01", "bug-05"])
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([])

  // Optional background fetch from API
  const { data: apiUserData } = useQuery({
    queryKey: ["admin", "users", { search, roleFilter, statusFilter }],
    queryFn: () => adminApi.getUsers({ search, role: roleFilter, status: statusFilter }),
    retry: false,
  })

  // Sync users list when API returns live database records
  useEffect(() => {
    if (apiUserData?.users && apiUserData.users.length > 0) {
      setUsersList(apiUserData.users)
    }
  }, [apiUserData?.users])

  const { data: apiBugData } = useQuery({
    queryKey: ["admin", "bug-reports", bugStatusFilter],
    queryFn: () => adminApi.getBugReports(bugStatusFilter || undefined),
    retry: false,
  })

  // Count pending subscription approvals
  const pendingApprovalsCount = useMemo(() => {
    return usersList.filter((u) => u.subscription_status === "pending_approval").length
  }, [usersList])

  // Filtered users list based on state
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const term = search.toLowerCase()
      const matchSearch = !term || 
        u.full_name.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term) || 
        (u.institution && u.institution.toLowerCase().includes(term))
      const matchRole = !roleFilter || u.role === roleFilter
      const matchStatus = !statusFilter || u.status === statusFilter
      
      let matchSubscription = true
      if (subscriptionFilter === "pending_approval") {
        matchSubscription = u.subscription_status === "pending_approval"
      } else if (subscriptionFilter === "student_30") {
        matchSubscription = u.subscription_tier === "student_30" || u.subscription_tier === "pro"
      } else if (subscriptionFilter === "student_14") {
        matchSubscription = u.subscription_tier === "student_14"
      } else if (subscriptionFilter === "free") {
        matchSubscription = !u.subscription_tier || u.subscription_tier === "free"
      } else if (subscriptionFilter) {
        matchSubscription = u.subscription_tier === subscriptionFilter
      }

      return matchSearch && matchRole && matchStatus && matchSubscription
    })
  }, [usersList, search, roleFilter, statusFilter, subscriptionFilter])

  // Filtered bug reports list based on state, search & stars
  const filteredBugs = useMemo(() => {
    const source = (apiBugData && apiBugData.length > 0) ? apiBugData : bugReportsList
    return source.filter((b) => {
      let matchStatus = true
      if (bugStatusFilter === "starred") {
        matchStatus = starredBugIds.includes(b.id)
      } else if (bugStatusFilter) {
        matchStatus = b.status === bugStatusFilter
      }
      const term = bugSearch.toLowerCase()
      const matchSearch = !term ||
        b.title.toLowerCase().includes(term) ||
        b.description.toLowerCase().includes(term) ||
        (b.user_name && b.user_name.toLowerCase().includes(term)) ||
        (b.user_email && b.user_email.toLowerCase().includes(term))
      return matchStatus && matchSearch
    })
  }, [apiBugData, bugReportsList, bugStatusFilter, bugSearch, starredBugIds])

  const activeBug = useMemo(() => {
    if (!selectedBugId) return null
    const source = (apiBugData && apiBugData.length > 0) ? apiBugData : bugReportsList
    return source.find((b) => b.id === selectedBugId) || null
  }, [selectedBugId, apiBugData, bugReportsList])

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setStarredBugIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCheckboxes.length === filteredBugs.length) {
      setSelectedCheckboxes([])
    } else {
      setSelectedCheckboxes(filteredBugs.map((b) => b.id))
    }
  }

  const toggleSelectRow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSelectedCheckboxes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleBulkStatusChange = (newStatus: AdminBugReportItem["status"]) => {
    if (selectedCheckboxes.length === 0) return
    setBugReportsList((prev) =>
      prev.map((b) =>
        selectedCheckboxes.includes(b.id)
          ? {
              ...b,
              status: newStatus,
              resolved_at: newStatus === "resolved" ? new Date().toISOString() : b.resolved_at,
            }
          : b
      )
    )
    const statusLabel = 
      newStatus === "resolved" ? "Terselesaikan" : 
      newStatus === "investigating" ? "Sedang Diinvestigasi" : 
      newStatus === "closed" ? "Ditutup" : "Open"
    toast.success(`${selectedCheckboxes.length} tiket terpilih berhasil diubah statusnya menjadi '${statusLabel}'.`)
    setSelectedCheckboxes([])
  }

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

  // Subscription Approval & Management Handlers
  const handleApproveSubscription = async (user: AdminUserItem) => {
    const tierName = getTierInfo(user.subscription_tier).label
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              subscription_status: "active",
              subscription_approved_at: new Date().toISOString(),
            }
          : u
      )
    )

    try {
      await adminApi.updateUserSubscription(user.id, {
        subscription_tier: user.subscription_tier,
        subscription_status: "active",
      })
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      await queryClient.invalidateQueries({ queryKey: ["user-quota"] })
      toast.success(
        `Permintaan langganan paket '${tierName}' untuk pengguna '${user.full_name}' berhasil disetujui (ACC). Hak akses akademik telah aktif.`
      )
    } catch {
      toast.error(`Gagal menyetujui paket langganan untuk ${user.full_name}.`)
    }
  }

  const handleRejectSubscription = async (user: AdminUserItem) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              subscription_tier: "free",
              subscription_status: "rejected",
            }
          : u
      )
    )

    try {
      await adminApi.updateUserSubscription(user.id, {
        subscription_tier: "free",
        subscription_status: "rejected",
      })
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      await queryClient.invalidateQueries({ queryKey: ["user-quota"] })
      toast.info(
        `Permintaan langganan untuk pengguna '${user.full_name}' telah ditolak. Akun dikembalikan ke paket Free Explorer.`
      )
    } catch {
      toast.error(`Gagal menolak paket langganan.`)
    }
  }

  const handleOpenSubModal = (user: AdminUserItem) => {
    setSelectedUserForSub(user)
    setTargetSubTier(user.subscription_tier || "free")
    setTargetSubStatus(user.subscription_status || "active")
    setIsSubModalOpen(true)
  }

  const handleSaveSubscriptionChange = async () => {
    if (!selectedUserForSub) return
    const tierName = getTierInfo(targetSubTier).label
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === selectedUserForSub.id
          ? {
              ...u,
              subscription_tier: targetSubTier,
              subscription_status: targetSubStatus,
            }
          : u
      )
    )

    try {
      await adminApi.updateUserSubscription(selectedUserForSub.id, {
        subscription_tier: targetSubTier,
        subscription_status: targetSubStatus,
      })
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      await queryClient.invalidateQueries({ queryKey: ["user-quota"] })

      const statusLabel = 
        targetSubStatus === "active" ? "Aktif Disetujui (ACC)" : 
        targetSubStatus === "pending_approval" ? "Menunggu ACC Admin" : "Ditolak"

      toast.success(
        `Paket langganan pengguna '${selectedUserForSub.full_name}' berhasil diubah menjadi '${tierName}' (${statusLabel}).`
      )
    } catch {
      toast.error(`Gagal menyimpan perubahan paket langganan ke server.`)
    }

    setIsSubModalOpen(false)
    setSelectedUserForSub(null)
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
          {/* Alert Banner Permohonan Langganan Pending ACC */}
          {pendingApprovalsCount > 0 && (
            <div className="rounded-xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Clock className="size-5 animate-pulse text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Terdapat {pendingApprovalsCount} Pengguna Baru Menunggu Persetujuan (ACC) Langganan
                  </p>
                  <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                    Pengguna baru yang mendaftar atau mengajukan upgrade paket akademik memerlukan persetujuan Administrator agar fitur dan kuota ekstra aktif.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSubscriptionFilter("pending_approval")}
                  className="h-7 text-xs border-amber-400 text-amber-900 bg-white/80 hover:bg-amber-100 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700"
                >
                  <Filter className="size-3 mr-1" />
                  Filter Pending ({pendingApprovalsCount})
                </Button>
              </div>
            </div>
          )}

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

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Subscription Filter */}
              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="text-xs rounded-md border bg-card px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="">Semua Paket Langganan</option>
                <option value="pending_approval">⏳ Menunggu Persetujuan (Pending ACC)</option>
                <option value="student_30">Student Pro – 30 Hari (Rp49.000)</option>
                <option value="student_14">Student Pro – 14 Hari (Rp29.000)</option>
                <option value="free">Free Plan (Rp0)</option>
              </select>

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
                    <th className="py-3 px-4">Tipe Langganan & Status ACC</th>
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
                    filteredUsers.map((u) => {
                      const tierInfo = getTierInfo(u.subscription_tier)
                      const TierIcon = tierInfo.icon
                      const isPendingAcc = u.subscription_status === "pending_approval"

                      return (
                        <tr 
                          key={u.id} 
                          className={`hover:bg-secondary/20 transition-colors ${
                            isPendingAcc ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <span>{u.full_name}</span>
                                {u.role === "admin" && (
                                  <Badge className="text-[9px] bg-primary-soft text-primary dark:bg-primary/15 border border-primary/25">
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

                          {/* Element Baru: Subscription Type & Status Persetujuan (ACC) */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5">
                              {/* Paket Tier Badge */}
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${tierInfo.badgeClass}`}>
                                  <TierIcon className="size-3" />
                                  <span>{tierInfo.label}</span>
                                </span>
                              </div>

                              {/* Status ACC / Persetujuan */}
                              {isPendingAcc ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 shadow-xs">
                                    <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                                    Menunggu ACC Admin
                                  </span>
                                  {u.subscription_requested_at && (
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="size-2.5" />
                                      <span>Diajukan: {u.subscription_requested_at}</span>
                                    </p>
                                  )}
                                </div>
                              ) : u.subscription_status === "rejected" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                                  <X className="size-2.5" />
                                  Ditolak (Free)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                                  <CheckCircle2 className="size-2.5" />
                                  Aktif Disetujui
                                </span>
                              )}
                            </div>
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
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Quick Action: ACC Langganan jika pending */}
                              {isPendingAcc && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveSubscription(u)}
                                    className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                                    title="Setujui (ACC) Permintaan Langganan Ini"
                                  >
                                    <Check className="size-3.5 mr-1 stroke-[3]" />
                                    <span>ACC Langganan</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectSubscription(u)}
                                    className="h-7 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950"
                                    title="Tolak Permintaan Langganan"
                                  >
                                    <X className="size-3.5 mr-1" />
                                    <span>Tolak</span>
                                  </Button>
                                </>
                              )}

                              {/* Ubah Paket Manual */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenSubModal(u)}
                                className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                                title="Ubah Paket & Status Langganan"
                              >
                                <Sparkles className="size-3.5 mr-1" />
                                <span>Ubah Paket</span>
                              </Button>

                              {/* Reset password button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPasswordModal(u)}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
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
                      )
                    })
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

      {/* TAB 2: BUG REPORTS & TICKETS - GMAIL STYLE INBOX */}
      {activeTab === "bugs" && (
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Kotak Masuk Laporan Kendala & Tiket Pengguna (Tampilan Format Email Resmi)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] gap-1.5 px-2.5 py-1 bg-primary/5 text-primary border-primary/20">
                <Inbox className="size-3.5" />
                <span>{filteredBugs.length} Tiket di Kotak Masuk</span>
              </Badge>
            </div>
          </div>

          {/* VIEW MODE 1: GMAIL INBOX LIST (When no bug is selected) */}
          {!activeBug ? (
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
              {/* Gmail Top Toolbar */}
              <div className="p-3 border-b bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left actions & Checkboxes */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 pl-1 pr-2 border-r">
                    <input
                      type="checkbox"
                      checked={filteredBugs.length > 0 && selectedCheckboxes.length === filteredBugs.length}
                      onChange={toggleSelectAll}
                      title="Pilih Semua Tiket"
                      className="size-4 rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        toast.info("Menyegarkan kotak masuk...")
                      }}
                      className="size-7 text-muted-foreground hover:text-foreground"
                      title="Segarkan Kotak Masuk"
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </div>

                  {selectedCheckboxes.length > 0 ? (
                    <div className="flex items-center gap-2 animate-in fade-in">
                      <span className="text-xs font-semibold text-primary">
                        {selectedCheckboxes.length} dipilih
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange("investigating")}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Tandai Investigasi
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange("resolved")}
                        className="h-7 text-[11px] px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      >
                        <Check className="size-3 mr-1" />
                        Tandai Selesai
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange("closed")}
                        className="h-7 text-[11px] px-2 text-muted-foreground"
                      >
                        Tutup Tiket
                      </Button>
                    </div>
                  ) : (
                    /* Filter Tabs like Gmail categories */
                    <div className="flex items-center gap-1 overflow-x-auto text-[11px] no-scrollbar">
                      {[
                        { id: "", label: "Semua Pesan" },
                        { id: "open", label: "Open (Belum Ditangani)" },
                        { id: "investigating", label: "Sedang Diinvestigasi" },
                        { id: "resolved", label: "Selesai" },
                        { id: "starred", label: "⭐ Berbintang" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setBugStatusFilter(tab.id)}
                          className={`px-3 py-1 rounded-md transition-colors font-medium shrink-0 ${
                            bugStatusFilter === tab.id
                              ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                              : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right search input */}
                <div className="flex items-center gap-2 self-end lg:self-auto">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={bugSearch}
                      onChange={(e) => setBugSearch(e.target.value)}
                      placeholder="Telusuri laporan bug..."
                      className="h-8 pl-8 pr-7 text-xs w-48 sm:w-64 bg-background"
                    />
                    {bugSearch && (
                      <button
                        onClick={() => setBugSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 pl-1">
                    1-{filteredBugs.length} dari {filteredBugs.length}
                  </span>
                </div>
              </div>

              {/* Gmail Inbox Rows List */}
              <div className="divide-y divide-border/60 overflow-x-auto min-h-[420px]">
                {filteredBugs.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Inbox className="size-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs text-muted-foreground font-medium">
                      Kotak masuk kosong atau tidak ada tiket yang cocok dengan pencarian Anda.
                    </p>
                  </div>
                ) : (
                  filteredBugs.map((bug) => {
                    const isChecked = selectedCheckboxes.includes(bug.id)
                    const isStarred = starredBugIds.includes(bug.id)
                    const isOpen = bug.status === "open"

                    return (
                      <div
                        key={bug.id}
                        onClick={() => setSelectedBugId(bug.id)}
                        className={`group flex items-center gap-3 px-4 py-3 text-xs transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-primary/5 dark:bg-primary/10"
                            : isOpen
                            ? "bg-card font-medium hover:bg-muted/40"
                            : "bg-muted/10 text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelectRow(e as any, bug.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="size-4 rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer shrink-0"
                        />

                        {/* Star Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleStar(e, bug.id)}
                          className="p-0.5 text-muted-foreground/40 hover:text-amber-400 shrink-0 transition-colors"
                          title={isStarred ? "Hapus Bintang" : "Tandai Berbintang"}
                        >
                          <Star className={`size-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>

                        {/* Sender Name Column (Fixed width like Gmail) */}
                        <div className="w-36 sm:w-44 md:w-52 shrink-0 truncate">
                          <span className={`text-xs truncate ${isOpen ? "font-bold text-foreground" : "font-normal text-foreground/80"}`}>
                            {bug.user_name || bug.user_email || "Peneliti"}
                          </span>
                        </div>

                        {/* Subject & Snippet Inline (Exact Gmail Signature Layout!) */}
                        <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                          <span className={`truncate ${isOpen ? "font-bold text-foreground" : "font-semibold text-foreground/85"}`}>
                            {bug.title}
                          </span>
                          <span className="text-muted-foreground/40 shrink-0">-</span>
                          <span className="text-muted-foreground truncate hidden sm:inline">
                            {bug.description}
                          </span>
                        </div>

                        {/* Severity & Status Badges */}
                        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getSeverityBadge(bug.severity)}`}>
                            {bug.severity}
                          </span>
                          <Badge variant="outline" className={`text-[9px] py-0 px-1.5 ${getStatusBadge(bug.status)}`}>
                            {bug.status}
                          </Badge>
                          {bug.admin_notes && (
                            <span title="Sudah ditindaklanjuti admin">
                              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            </span>
                          )}
                        </div>

                        {/* Date Column (Right-aligned like Gmail) */}
                        <div className="w-16 sm:w-20 text-right shrink-0 text-[11px] text-muted-foreground font-medium">
                          <span className={isOpen ? "font-bold text-foreground" : ""}>
                            {new Date(bug.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: GMAIL EMAIL DETAIL VIEW (When a bug is opened) */
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Email Detail Top Toolbar */}
              <div className="p-3 border-b bg-muted/20 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBugId(null)}
                  className="h-8 gap-2 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
                >
                  <ArrowLeft className="size-4" />
                  <span>Kembali ke Kotak Masuk</span>
                </Button>

                {/* Quick actions on the email */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground mr-1 hidden sm:inline">
                    Tiket #{activeBug.id}
                  </span>
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
                    variant="default"
                    size="sm"
                    onClick={() => handleQuickStatusChange("resolved")}
                    disabled={activeBug.status === "resolved"}
                    className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="size-3 mr-1" />
                    Tandai Selesai
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickStatusChange("closed")}
                    disabled={activeBug.status === "closed"}
                    className="h-7 text-[11px] px-2 text-muted-foreground"
                  >
                    Tutup
                  </Button>
                </div>
              </div>

              {/* Email Content Area */}
              <div className="p-6 space-y-6 max-w-5xl">
                {/* Subject Header */}
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(activeBug.severity)}`}>
                      Urgensi: {activeBug.severity}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${getStatusBadge(activeBug.status)}`}>
                      Status: {activeBug.status}
                    </Badge>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                    {activeBug.title}
                  </h1>
                </div>

                {/* Sender Card (Gmail Email Header Layout) */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/20 border">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(activeBug.user_name || activeBug.user_email)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">
                          {activeBug.user_name || "Peneliti Modellyng"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
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
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-lg shrink-0">
                      <ExternalLink className="size-3.5" />
                      <span className="truncate max-w-[220px]">Lokasi: {activeBug.page_url}</span>
                    </div>
                  )}
                </div>

                {/* Email Body Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Mail className="size-3.5 text-primary" />
                    <span>Pesan Detail Kendala yang Dilaporkan:</span>
                  </div>
                  <div className="rounded-xl border bg-card p-6 shadow-2xs text-xs sm:text-sm text-foreground/95 whitespace-pre-wrap leading-relaxed space-y-3 font-normal">
                    <p>{activeBug.description}</p>

                    {activeBug.page_url && (
                      <div className="sm:hidden pt-3 border-t text-xs text-primary font-mono flex items-center gap-1.5">
                        <ExternalLink className="size-3.5" />
                        <span>Lokasi berkas: {activeBug.page_url}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Previous Admin Note / Response */}
                {activeBug.admin_notes && (
                  <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/5 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>Tanggapan / Catatan Resolusi Terakhir Admin:</span>
                      </span>
                      {activeBug.resolved_at && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          Diselesaikan pada {new Date(activeBug.resolved_at).toLocaleDateString("id-ID")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed italic bg-background/60 p-3 rounded-lg border">
                      "{activeBug.admin_notes}"
                    </p>
                  </div>
                )}

                {/* Reply & Follow-Up Box */}
                <div className="rounded-xl border bg-card p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <MessageSquare className="size-3.5 text-primary" />
                      <span>Kirim Balasan & Tindak Lanjut Resolusi</span>
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
                          <option value="open">Open (Belum Selesai)</option>
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
          )}
        </div>
      )}

      {/* MODAL 1: RESET PASSWORD */}
      {isPasswordModalOpen && selectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPasswordModalOpen(false)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <KeyRound className="size-4 text-primary" />
                <span>Reset Kata Sandi Pengguna</span>
              </div>
              <button 
                type="button"
                aria-label="Tutup modal reset sandi"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-muted-foreground hover:text-foreground size-7 flex items-center justify-center rounded-md hover:bg-muted"
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
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsStatusModalOpen(false)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <ShieldAlert className="size-4 text-rose-600" />
                <span>
                  {targetStatus === "active" ? "Aktifkan Kembali Akun" : "Penangguhan Akun Pengguna"}
                </span>
              </div>
              <button 
                type="button"
                aria-label="Tutup modal status akun"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-muted-foreground hover:text-foreground size-7 flex items-center justify-center rounded-md hover:bg-muted"
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

      {/* MODAL 3: UBAH PAKET & STATUS LANGGANAN */}
      {isSubModalOpen && selectedUserForSub && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSubModalOpen(false)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Sparkles className="size-4 text-primary" />
                <span>Kelola Paket Langganan & Status ACC</span>
              </div>
              <button 
                type="button"
                aria-label="Tutup modal langganan"
                onClick={() => setIsSubModalOpen(false)}
                className="text-muted-foreground hover:text-foreground size-7 flex items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-secondary/60 text-xs space-y-1">
              <div className="font-semibold text-foreground">{selectedUserForSub.full_name}</div>
              <div className="text-muted-foreground font-mono text-[11px]">{selectedUserForSub.email}</div>
              <div className="text-muted-foreground text-[11px]">Institusi: {selectedUserForSub.institution || "-"}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  Pilih Paket Langganan
                </label>
                <select
                  value={targetSubTier}
                  onChange={(e) => setTargetSubTier(e.target.value)}
                  className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {subscriptionPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.priceNumeric > 0 ? `(${p.priceFormatted} • ${p.durationText})` : `(${p.priceFormatted})`}
                    </option>
                  ))}
                  {!subscriptionPlans.some((p) => p.id === "free") && (
                    <option value="free">Free Plan (Rp0 / Akun Dasar Gratis)</option>
                  )}
                  <option value="developer">Developer Access (Akses Penuh Tanpa Batas Kuota)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  Status Persetujuan (ACC Status)
                </label>
                <select
                  value={targetSubStatus}
                  onChange={(e) => setTargetSubStatus(e.target.value as "active" | "pending_approval" | "rejected")}
                  className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">✓ Disetujui / Aktif (ACC Berhasil)</option>
                  <option value="pending_approval">⏳ Menunggu Persetujuan Admin (Pending ACC)</option>
                  <option value="rejected">✕ Ditolak (Kembalikan ke Free)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSubModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSubscriptionChange}
                className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
