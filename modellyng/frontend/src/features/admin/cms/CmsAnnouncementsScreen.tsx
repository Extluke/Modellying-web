import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Megaphone, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  X
} from "lucide-react"
import { adminApi, AnnouncementItem, AnnouncementCreateData } from "../api/adminApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/store/useToastStore"

export default function CmsAnnouncementsScreen() {
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null)

  // Form states
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<string>("promo")
  const [badgeText, setBadgeText] = useState("")
  const [targetRole, setTargetRole] = useState<string>("all")
  const [status, setStatus] = useState<string>("published")
  const [scheduledAt, setScheduledAt] = useState<string>("")

  // Query: Announcements
  const { data: announcements, isLoading, error } = useQuery({
    queryKey: ["admin", "announcements", { categoryFilter, statusFilter }],
    queryFn: () => adminApi.getAnnouncements({ category: categoryFilter, status: statusFilter }),
  })

  // Mutation: Create
  const createMutation = useMutation({
    mutationFn: (data: AnnouncementCreateData) => adminApi.createAnnouncement(data),
    onSuccess: () => {
      toast.success("Pengumuman CMS berhasil diterbitkan ke sistem & notifikasi pengguna.")
      setIsModalOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menerbitkan pengumuman.")
    },
  })

  // Mutation: Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnnouncementCreateData> }) =>
      adminApi.updateAnnouncement(id, data),
    onSuccess: () => {
      toast.success("Konten pengumuman CMS berhasil diperbarui.")
      setIsModalOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memperbarui pengumuman.")
    },
  })

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAnnouncement(id),
    onSuccess: (res) => {
      toast.success(res.message || "Pengumuman berhasil dihapus.")
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus pengumuman.")
    },
  })

  const resetForm = () => {
    setEditingItem(null)
    setTitle("")
    setSummary("")
    setContent("")
    setCategory("promo")
    setBadgeText("PROMO SPECIAL")
    setTargetRole("all")
    setStatus("published")
    setScheduledAt("")
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: AnnouncementItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setSummary(item.summary || "")
    setContent(item.content)
    setCategory(item.category)
    setBadgeText(item.badge_text || "")
    setTargetRole(item.target_role)
    setStatus(item.status)
    setScheduledAt(item.scheduled_at ? item.scheduled_at.substring(0, 16) : "")
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: AnnouncementCreateData = {
      title,
      summary,
      content,
      category,
      badge_text: badgeText || undefined,
      target_role: targetRole,
      status,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Megaphone className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              CMS Berita, Promo & Pengumuman Sistem
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola siaran promo diskon, pembaruan fitur v2.0, syarat & ketentuan, dan jadwal siaran terjadwal (schedule broadcast).
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleOpenCreateModal}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Buat Pengumuman Baru</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs rounded-md border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Semua Kategori</option>
          <option value="promo">Promo & Diskon</option>
          <option value="update">Pembaruan Fitur (Update)</option>
          <option value="info">Informasi Umum (Info)</option>
          <option value="terms">Perubahan Syarat & Ketentuan</option>
          <option value="program">Program Akademik</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs rounded-md border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Semua Status Siaran</option>
          <option value="published">Tayang Langsung (Published)</option>
          <option value="scheduled">Terjadwal (Scheduled)</option>
          <option value="draft">Konsep (Draft)</option>
          <option value="archived">Diarsipkan (Archived)</option>
        </select>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-muted-foreground">Memuat pengumuman CMS...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          Gagal memuat konten: {(error as Error).message}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {announcements?.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${
                      item.category === "promo"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : item.category === "update"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    }`}>
                      {item.category.toUpperCase()}
                    </Badge>
                    {item.badge_text && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {item.badge_text}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    item.status === "published"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : item.status === "scheduled"
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 flex items-center gap-1"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {item.status === "scheduled" && <Clock className="size-3" />}
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-foreground leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {item.summary || item.content}
                </p>

                {item.status === "scheduled" && item.scheduled_at && (
                  <div className="p-2 rounded bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/50 text-[11px] text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    <span>Jadwal Kirim: {new Date(item.scheduled_at).toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="capitalize">Audiens: {item.target_role.replace("_", " ")}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(item)}
                    className="h-7 px-2 text-xs"
                    title="Ubah Berita / Promo"
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus pengumuman '${item.title}'?`)) {
                        deleteMutation.mutate(item.id)
                      }
                    }}
                    className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Megaphone className="size-4 text-primary" />
                <span>{editingItem ? "Ubah Konten Pengumuman CMS" : "Buat Berita / Promo Baru"}</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Judul Pengumuman / Promo</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Diskon 50% Paket Pro Scholar Dies Natalis"
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Kategori Konten</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="promo">Promo & Diskon</option>
                    <option value="update">Pembaruan Fitur (Update)</option>
                    <option value="info">Informasi Penting (Info)</option>
                    <option value="terms">Perubahan Syarat & Ketentuan</option>
                    <option value="program">Program Akademik</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Teks Badge (Label Menonjol)</label>
                  <Input
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="Misal: PROMO 50%, V2.0"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Ringkasan Singkat (Muncul di Banner Dasbor)</label>
                <Input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ringkasan 1-2 kalimat..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Isi Lengkap Berita / Ketentuan</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan detail pengumuman lengkap..."
                  rows={4}
                  required
                  className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Target Audiens</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">Semua Pengguna</option>
                    <option value="researcher">Seluruh Peneliti</option>
                    <option value="subscribed_only">Hanya Pengguna Berlangganan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Status Siaran</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-md border bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="published">Tayang Langsung (Published)</option>
                    <option value="scheduled">Terjadwal (Scheduled)</option>
                    <option value="draft">Simpan Konsep (Draft)</option>
                    <option value="archived">Arsipkan (Archived)</option>
                  </select>
                </div>
              </div>

              {/* Scheduling Field */}
              {status === "scheduled" && (
                <div className="space-y-1 bg-sky-50/60 dark:bg-sky-950/30 p-3 rounded-lg border border-sky-200/50">
                  <label className="font-medium text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    <span>Jadwal Pengiriman (Waktu Siar)</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required={status === "scheduled"}
                    className="text-xs bg-card"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Sistem akan otomatis menayangkan pengumuman ke dasbor dan memicu lonceng notifikasi pada jadwal ini.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Menyimpan..."
                    : editingItem
                    ? "Simpan Perubahan"
                    : "Terbitkan Pengumuman"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
