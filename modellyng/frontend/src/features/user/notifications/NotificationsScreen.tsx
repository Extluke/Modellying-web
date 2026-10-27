import { useQuery } from "@tanstack/react-query"
import { Bell, CheckCircle, Clock, Megaphone } from "lucide-react"
import { adminApi } from "@/features/admin/api/adminApi"

export default function NotificationsScreen() {
  const { data: announcements } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: adminApi.getActiveAnnouncements,
  })

  const baseNotifications = [
    {
      id: "notif-1",
      title: "Ekstraksi PDF Selesai",
      desc: "Paper 'vaswani2017_transformer.pdf' berhasil diekstraksi ke 11 komponen.",
      time: "10 menit yang lalu",
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      badge: null,
    },
    {
      id: "notif-2",
      title: "Komponen Memerlukan Peninjauan",
      desc: "2 komponen pada paper 'devlin2018_bert.pdf' memiliki skor keyakinan di bawah 80%.",
      time: "1 jam yang lalu",
      icon: Clock,
      iconColor: "text-amber-500",
      badge: null,
    },
  ]

  const announcementNotifs = (announcements || []).map((a) => ({
    id: `ann-${a.id}`,
    title: a.title,
    desc: a.summary || a.content,
    time: a.published_at ? new Date(a.published_at).toLocaleDateString("id-ID") : "Baru saja",
    icon: Megaphone,
    iconColor: "text-primary",
    badge: a.badge_text || a.category.toUpperCase(),
  }))

  const allNotifications = [...announcementNotifs, ...baseNotifications]

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <span>Pemberitahuan & Status Pekerjaan</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Notifikasi proses background worker Celery dan status ekstraksi dokumen.
        </p>
      </div>

      <div className="space-y-3">
        {allNotifications.map((n) => {
          const Icon = n.icon
          return (
            <div key={n.id} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <Icon className={`size-4 mt-0.5 shrink-0 ${n.iconColor}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-foreground">{n.title}</h4>
                    {n.badge && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                        {n.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{n.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
