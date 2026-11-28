import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bell, Check, CheckCheck, CheckCircle, Clock, Inbox, Megaphone } from "lucide-react"
import { adminApi } from "@/features/admin/api/adminApi"
import { Button } from "@/components/ui/button"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { AnimatedContent, SpotlightCard } from "@/components/react-bits"
import { toast } from "@/lib/store/useToastStore"

type NotifCategory = "all" | "announcement" | "extraction"

const READ_NOTIFS_KEY = "modellyng_read_notifications"

function getInitialReadIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_NOTIFS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<NotifCategory>("all")
  const [readIds, setReadIds] = useState<string[]>(getInitialReadIds)

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: adminApi.getActiveAnnouncements,
  })

  const allNotifications = useMemo(() => {
    const baseNotifications = [
      {
        id: "notif-1",
        category: "extraction" as const,
        title: "Ekstraksi PDF Selesai",
        desc: "Paper 'vaswani2017_transformer.pdf' berhasil diekstraksi ke 11 komponen.",
        time: "10 menit yang lalu",
        icon: CheckCircle,
        iconColor: "text-emerald-600",
        badge: null,
      },
      {
        id: "notif-2",
        category: "extraction" as const,
        title: "Komponen Memerlukan Peninjauan",
        desc: "2 komponen pada paper 'devlin2018_bert.pdf' memiliki skor keyakinan di bawah 80%.",
        time: "1 jam yang lalu",
        icon: Clock,
        iconColor: "text-amber-500",
        badge: "Review",
      },
    ]

    const announcementNotifs = (announcements || []).map((a) => ({
      id: `ann-${a.id}`,
      category: "announcement" as const,
      title: a.title,
      desc: a.summary || a.content,
      time: a.published_at ? new Date(a.published_at).toLocaleDateString("id-ID") : "Baru saja",
      icon: Megaphone,
      iconColor: "text-primary",
      badge: a.badge_text || a.category.toUpperCase(),
    }))

    return [...announcementNotifs, ...baseNotifications]
  }, [announcements])

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return allNotifications
    return allNotifications.filter((item) => item.category === activeTab)
  }, [allNotifications, activeTab])

  const unreadCount = allNotifications.filter((n) => !readIds.includes(n.id)).length

  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      try {
        localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }

  const handleMarkAllRead = () => {
    const nextIds = allNotifications.map((n) => n.id)
    setReadIds(nextIds)
    try {
      localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(nextIds))
    } catch {
      // Ignore storage errors
    }
    toast.success("Semua pemberitahuan telah ditandai sudah dibaca.", 5000)
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            <span>Pemberitahuan &amp; Status Pekerjaan</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20 tabular-nums">
                {unreadCount} Baru
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Notifikasi proses antrean latar belakang, hasil ekstraksi dokumen, dan pengumuman sistem.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="gap-1.5 text-xs shrink-0 self-start sm:self-auto"
        >
          <CheckCheck className="size-3.5 text-primary" />
          <span>Tandai Semua Dibaca</span>
        </Button>
      </div>

      <FilterTabs<NotifCategory>
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "all", label: "Semua", count: allNotifications.length },
          {
            id: "announcement",
            label: "Sistem & Promo",
            count: allNotifications.filter((n) => n.category === "announcement").length,
          },
          {
            id: "extraction",
            label: "Ekstraksi Paper",
            count: allNotifications.filter((n) => n.category === "extraction").length,
          },
        ]}
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Memuat pemberitahuan">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/10 p-10 text-center space-y-2">
          <div className="size-11 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Inbox className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Belum Ada Pemberitahuan pada Kategori Ini</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Pembaruan ekstraksi PDF dan pengumuman resmi akan muncul di sini saat tersedia.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n, idx) => {
            const Icon = n.icon
            const isRead = readIds.includes(n.id)
            return (
              <AnimatedContent key={n.id} delay={idx * 45} distance={12} duration={380}>
                <SpotlightCard
                  className={`p-4 transition-colors ${
                    isRead ? "bg-card/70 opacity-80" : "bg-card border-primary/25 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`size-4 mt-0.5 shrink-0 ${n.iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {!isRead && (
                            <span
                              className="size-2 rounded-full bg-primary shrink-0"
                              title="Belum dibaca"
                            />
                          )}
                          <h4 className="text-xs font-semibold text-foreground truncate">
                            {n.title}
                          </h4>
                          {n.badge && (
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded shrink-0">
                              {n.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground tabular-nums">{n.time}</span>
                          <button
                            type="button"
                            onClick={() => toggleRead(n.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title={isRead ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                          >
                            <Check className="size-3" />
                            <span>{isRead ? "Belum dibaca" : "Dibaca"}</span>
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{n.desc}</p>
                    </div>
                  </div>
                </SpotlightCard>
              </AnimatedContent>
            )
          })}
        </div>
      )}
    </div>
  )
}
