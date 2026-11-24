import { useEffect } from "react"
import { ShieldCheck, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type LegalTab = "terms" | "privacy"

interface TermsPrivacyModalProps {
  isOpen: boolean
  activeTab: LegalTab
  onTabChange: (tab: LegalTab) => void
  onClose: () => void
  onAccept?: () => void
}

export function TermsPrivacyModal({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  onAccept,
}: TermsPrivacyModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              {activeTab === "terms" ? (
                <FileText className="size-4" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
            </div>
            <div>
              <h3 id="legal-modal-title" className="text-sm font-bold text-foreground">
                Ketentuan Layanan & Privasi Modellyng
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Standar penggunaan platform analisis literatur ilmiah berbasis bukti.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 pt-3 flex items-center gap-2 border-b border-border bg-muted/20">
          <button
            type="button"
            onClick={() => onTabChange("terms")}
            className={cn(
              "px-3 py-2 text-xs font-semibold border-b-2 transition-colors",
              activeTab === "terms"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Syarat & Ketentuan Riset
          </button>
          <button
            type="button"
            onClick={() => onTabChange("privacy")}
            className={cn(
              "px-3 py-2 text-xs font-semibold border-b-2 transition-colors",
              activeTab === "privacy"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Kebijakan Privasi Data PDF
          </button>
        </div>

        <div className="p-5 max-h-80 overflow-y-auto flex flex-col gap-3 text-xs text-muted-foreground leading-relaxed">
          {activeTab === "terms" ? (
            <>
              <p className="text-foreground font-semibold">
                1. Penggunaan Akademik & Etika Riset
              </p>
              <p>
                Modellyng disediakan untuk membantu peneliti mengekstraksi, memverifikasi bukti kutipan, dan membandingkan literatur ilmiah. Peneliti tetap bertanggung jawab penuh atas validasi akhir karya ilmiah dan kepatuhan hak cipta jurnal sumber.
              </p>
              <p className="text-foreground font-semibold">
                2. Pendaftaran Email Google & Keamanan Akun
              </p>
              <p>
                Pendaftaran akun publik menggunakan alamat email Google (@gmail.com) yang sah. Anda bertanggung jawab menjaga kerahasiaan kata sandi dan seluruh aktivitas pada ruang kerja riset Anda.
              </p>
              <p className="text-foreground font-semibold">
                3. Batas Kuota Harian & Paket Layanan
              </p>
              <p>
                Akun Free Plan memperoleh batas unggah standar harian yang direset otomatis pukul 00:00 WIB. Penyalahgunaan sistem atau spam dapat mengakibatkan penangguhan akses sementara oleh administrator.
              </p>
            </>
          ) : (
            <>
              <p className="text-foreground font-semibold">
                1. Isolasi Dokumen PDF Privat (Multi-Tenant)
              </p>
              <p>
                Seluruh berkas PDF yang Anda unggah disimpan pada penyimpanan terisolasi per pengguna dan proyek. Dokumen Anda tidak dipublikasikan dan tidak dapat diakses oleh akun peneliti lain.
              </p>
              <p className="text-foreground font-semibold">
                2. Pemrosesan Ekstraksi & Ketertelusuran Bukti
              </p>
              <p>
                Teks dokumen diproses secara aman untuk ekstraksi 13 parameter ilmiah, indeksasi blok halaman, serta pencarian semantik RAG khusus pada ruang kerja milik Anda.
              </p>
              <p className="text-foreground font-semibold">
                3. Enkripsi Kredensial & Kontrol Data
              </p>
              <p>
                Kata sandi Anda diamankan dengan algoritma hashing Argon2id dan tidak pernah disimpan dalam bentuk teks biasa. Anda dapat menghapus proyek beserta seluruh dokumen PDF terkait kapan saja.
              </p>
            </>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          {onAccept && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onAccept()
                onClose()
              }}
            >
              Saya Mengerti & Setuju
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
