import { Download, FileSpreadsheet, FileText, Presentation } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ExportScreen() {
  const formats = [
    {
      title: "Microsoft Word (.docx)",
      description: "Naskah terstruktur lengkap dengan bab pendahuluan, metodologi, dan tabel sitasi.",
      icon: FileText,
      badge: "Laporan Riset",
    },
    {
      title: "Microsoft Excel (.xlsx)",
      description: "Matriks perbandingan 10 parameter ilmiah dan daftar pustaka lengkap.",
      icon: FileSpreadsheet,
      badge: "Tabel Matriks",
    },
    {
      title: "CSV Dataset (.csv)",
      description: "Data mentah teks komponen ilmiah dan skor keyakinan untuk analisis kuantitatif.",
      icon: FileSpreadsheet,
      badge: "Raw Data",
    },
    {
      title: "PowerPoint (.pptx)",
      description: "Slide presentasi ringkasan komparasi dan rekomendasi novelty riset.",
      icon: Presentation,
      badge: "Slide Presentasi",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Download className="size-5 text-primary" />
          <span>Ekspor Hasil Kompilasi Riset</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Unduh dokumen hasil ekstraksi dan sintesis dalam berbagai format resmi siap publikasi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {formats.map((fmt, idx) => {
          const Icon = fmt.icon
          return (
            <div key={idx} className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {fmt.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{fmt.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {fmt.description}
                </p>
              </div>

              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                <Download className="size-3.5" />
                <span>Unduh Berkas</span>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
