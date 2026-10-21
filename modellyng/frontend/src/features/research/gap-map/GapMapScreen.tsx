import { Compass, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GapMapScreen() {
  const gaps = [
    {
      domain: "Efisiensi Komputasi Memori",
      status: "Unresolved Gap",
      description: "Belum ada mekanisme attention adaptif yang mampu bekerja sub-kuadratik pada panjang konteks 128k token di perangkat edge.",
      potentialNovelty: "Tinggi (High Impact)",
    },
    {
      domain: "Kekurangan Dataset Bahasa Minoritas",
      status: "Emerging Opportunity",
      description: "Sebagian besar model pra-pelatihan hanya mengeksplorasi bahasa dengan sumber daya melimpah (high-resource languages).",
      potentialNovelty: "Sedang (Medium Impact)",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Compass className="size-5 text-primary" />
            <span>Peta Celah Riset (Research Gap Map)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sintesis limitasi dan peluang masa depan (future work) yang belum dijawab oleh paper terkait.
          </p>
        </div>

        <Button size="sm" className="gap-1.5 text-xs">
          <Sparkles className="size-3.5" />
          <span>Sintesis Celah Baru dengan AI</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {gaps.map((gap, idx) => (
          <div key={idx} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">{gap.domain}</span>
              <span className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                {gap.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {gap.description}
            </p>
            <div className="flex items-center justify-between pt-2 border-t text-[11px]">
              <span className="text-muted-foreground">Potensi Kebaruan:</span>
              <span className="font-semibold text-emerald-600">{gap.potentialNovelty}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
