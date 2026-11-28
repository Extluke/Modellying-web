import { useState } from "react"
import {
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { toast } from "@/lib/store/useToastStore"
import { type User } from "@/lib/api/auth"
import { type PricingPlan } from "@/features/styleguide/components/PricingSection"
import {
  ADMIN_WHATSAPP_DISPLAY,
  generatePricingWhatsAppMessage,
  buildPricingWhatsAppUrl,
  formatSubscriptionTierName,
} from "../utils/whatsappPricing"

interface WhatsAppPaymentModalProps {
  isOpen: boolean
  plan: PricingPlan | null
  user: User | null
  onClose: () => void
}

export function WhatsAppPaymentModal({
  isOpen,
  plan,
  user,
  onClose,
}: WhatsAppPaymentModalProps) {
  const [copied, setCopied] = useState(false)

  useEscapeKey(isOpen && Boolean(plan), onClose)

  if (!isOpen || !plan) return null

  const messageTemplate = generatePricingWhatsAppMessage(plan, user)
  const whatsappUrl = buildPricingWhatsAppUrl(plan, user)

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageTemplate)
      setCopied(true)
      toast.success("Draf template pesan WhatsApp berhasil disalin ke clipboard!", 5000)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Gagal menyalin teks pesan. Silakan salin secara manual.", 5000)
    }
  }

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    toast.success(
      `Membuka WhatsApp Admin Modellyng (${ADMIN_WHATSAPP_DISPLAY}). Silakan kirim pesan untuk dipandu pembayarannya!`,
      5000
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-payment-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative emerald glow on top */}
        <div className="absolute -top-12 -right-12 size-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="wa-payment-modal-title" className="text-base font-bold text-foreground">
                  Konfirmasi Pembelian via WhatsApp Admin
                </h3>
                <Badge
                  variant="ready"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]"
                >
                  Resmi & Terverifikasi
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Admin Modellyng siap memandu instruksi pembayaran QRIS & Transfer Bank.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Selected Plan Summary Card */}
        <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Paket yang Dipilih:
              </span>
              <h4 className="text-sm font-bold text-foreground mt-0.5">
                {plan.name}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-primary">
                {plan.priceFormatted}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                {plan.durationText}
              </span>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="size-3.5 text-primary shrink-0" />
              <span className="truncate">
                Nama:{" "}
                <strong className="text-foreground">
                  {user?.full_name || "Pengguna Riset"}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-3.5 text-primary shrink-0" />
              <span className="truncate">
                Email:{" "}
                <strong className="text-foreground">
                  {user?.email || "Belum Login"}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-primary bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/20">
            <Zap className="size-3 shrink-0" />
            <span>
              Paket Saat Ini: <strong>{formatSubscriptionTierName(user?.subscription_tier)}</strong>
            </span>
          </div>
        </div>

        {/* Pre-filled Message Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <span>Draf Pesan WhatsApp Otomatis:</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyMessage}
              className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="size-3 text-muted-foreground" />
                  <span>Salin Pesan</span>
                </>
              )}
            </Button>
          </div>

          <div className="relative rounded-xl border border-border/80 bg-background/90 p-3 text-xs text-muted-foreground font-mono leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
            {messageTemplate}
          </div>
          <p className="text-[10px] text-muted-foreground">
            * Pesan di atas akan otomatis muncul di kolom chat WhatsApp Anda saat tombol di bawah diklik.
          </p>
        </div>

        {/* Supported Payment Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-900 dark:text-emerald-300">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Didukung:</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <QrCode className="size-3 text-foreground" /> QRIS Instan
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="size-3 text-foreground" /> Transfer Bank
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-xs cursor-pointer"
          >
            Tutup
          </Button>

          <Button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <MessageCircle className="size-4" />
            <span>Lanjut ke WhatsApp Admin ({ADMIN_WHATSAPP_DISPLAY})</span>
            <ExternalLink className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
