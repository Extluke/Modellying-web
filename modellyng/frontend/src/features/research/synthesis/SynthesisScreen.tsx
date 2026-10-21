import { Sparkles, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SynthesisScreen() {
  const recommendations = [
    "Arsitektur Linear Transformer dengan Dynamic Kernel Decay untuk Efisiensi Dokumen Panjang",
    "Integrasi State Space Models (Mamba) pada Pra-Pelatihan Representasi Bidireksional",
    "Mekanisme Sparse Attention Adaptif Berbasis Bobot Entropi Kalimat pada Rekam Medis",
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <span>Sintesis Riset & Rekomendasi Judul Tesis</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Formulasi rumusan masalah, novelty riset, dan 3 usulan judul penelitian ilmiah berbasis AI.
          </p>
        </div>

        <Button size="sm" className="gap-1.5 text-xs">
          <Copy className="size-3.5" />
          <span>Salin Paragraf Akademik</span>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-foreground">3 Rekomendasi Usulan Judul Riset</h3>
          <div className="space-y-2">
            {recommendations.map((title, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border bg-secondary/20 p-3 text-xs">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5 shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium text-foreground leading-relaxed">{title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Sintesis Rumusan Masalah Komprehensif</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Berdasarkan komparasi 18 paper dalam proyek, terdapat jurang metodologis mendasar antara kompleksitas
            kuadratik komputasi attention dengan kebutuhan pemrosesan dokumen ilmiah berkonteks penuh. Penelitian ini
            mengusulkan reduksi parameter tanpa mengorbankan ketertelusuran bukti semantik.
          </p>
        </div>
      </div>
    </div>
  )
}
