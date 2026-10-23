import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileCode2,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { downloadProjectExport } from "../api/projectsApi"
import { toast } from "@/lib/store/useToastStore"

interface ExportDropdownButtonProps {
  projectId: string
  projectName: string
  paperCount: number
}

type ExportFormat = "pdf" | "csv" | "xlsx"

export function ExportDropdownButton({
  projectId,
  projectName,
  paperCount,
}: ExportDropdownButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Menutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleDownload = async (format: ExportFormat) => {
    if (paperCount === 0) {
      toast.warning("Belum ada dokumen paper dalam proyek ini untuk diunduh.")
      setIsOpen(false)
      return
    }

    setDownloadingFormat(format)
    setIsOpen(false)

    try {
      await downloadProjectExport(projectId, format, projectName)
      toast.success(
        `Berkas sintesis riset (.${format}) berhasil diunduh.`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh berkas sintesis."
      toast.error(msg)
    } finally {
      setDownloadingFormat(null)
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Tombol Utama Unduh */}
      <Button
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={Boolean(downloadingFormat)}
        className="gap-2 h-10 px-4 text-xs font-semibold border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer shadow-xs"
        title="Unduh matriks sintesis 13 parameter proyek ini"
      >
        {downloadingFormat ? (
          <>
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Mengunduh {downloadingFormat.toUpperCase()}...</span>
          </>
        ) : (
          <>
            <Download className="size-4 text-primary" />
            <span>Unduh</span>
            <ChevronDown className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </Button>

      {/* Menu Pilihan Format Unduhan */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-card border border-border shadow-xl ring-1 ring-black/5 z-50 p-2 animate-in fade-in-0 zoom-in-95 duration-150 space-y-1">
          <div className="px-3 py-2 border-b border-border/70">
            <p className="text-xs font-bold text-foreground">Unduh Matriks Sintesis</p>
            <p className="text-[11px] text-muted-foreground">
              Pilih format berkas ekstraksi 13 parameter kanonik:
            </p>
          </div>

          {/* Opsi 1: PDF */}
          <button
            type="button"
            onClick={() => handleDownload("pdf")}
            className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-primary/10 transition-colors cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform shrink-0">
              <FileText className="size-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground group-hover:text-primary">
                  Dokumen PDF (.pdf)
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded font-semibold">
                  A4 Cetak
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Laporan komprehensif matriks sintesis & bukti kutipan dokumen kanonik.
              </p>
            </div>
          </button>

          {/* Opsi 2: XLSX (Excel) */}
          <button
            type="button"
            onClick={() => handleDownload("xlsx")}
            className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-primary/10 transition-colors cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <FileSpreadsheet className="size-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground group-hover:text-primary">
                  Lembar Kerja Excel (.xlsx)
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                  Tabel Multi-Sheet
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Tabel berformat terstruktur 13 parameter, auto-fit, dan profil sumber.
              </p>
            </div>
          </button>

          {/* Opsi 3: CSV */}
          <button
            type="button"
            onClick={() => handleDownload("csv")}
            className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-primary/10 transition-colors cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
              <FileCode2 className="size-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground group-hover:text-primary">
                  Tabel Data CSV (.csv)
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded font-semibold">
                  UTF-8 BOM
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Data mentah terkompresi untuk pengolahan statistik (SPSS, R, Python).
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
