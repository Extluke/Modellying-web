import { Button } from "@/components/ui/button"
import { Check, X, Edit3 } from "lucide-react"

export default function ReviewQueueScreen() {
  const pendingReviews = [
    {
      id: "rev-1",
      paperTitle: "BERT: Pre-training of Deep Bidirectional Transformers",
      componentTitle: "Rumusan Masalah (Problem Formulation)",
      content: "Model bahasa standar bersifat unidireksional (kiri-ke-kanan), membatasi pemilihan arsitektur selama pra-pelatihan representasi konteks.",
      confidence: 78,
      modelUsed: "gemini-1.5-flash",
    },
    {
      id: "rev-2",
      paperTitle: "BERT: Pre-training of Deep Bidirectional Transformers",
      componentTitle: "Sampel & Dataset (Sample & Dataset)",
      content: "Menggunakan BooksCorpus (800M kata) dan English Wikipedia (2,500M kata) tanpa ekstraksi daftar atau tabel.",
      confidence: 72,
      modelUsed: "gemini-1.5-flash",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Antrean Peninjauan Komponen AI
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Komponen dengan tingkat keyakinan di bawah ambang batas memerlukan konfirmasi manusia sebelum masuk ke matriks.
          </p>
        </div>

        <Button size="sm" variant="outline" className="gap-1.5 text-xs text-emerald-600">
          <Check className="size-3.5" />
          <span>Setujui Semua (Bulk Accept)</span>
        </Button>
      </div>

      <div className="space-y-4">
        {pendingReviews.map((item) => (
          <div key={item.id} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-primary">{item.paperTitle}</span>
                <h4 className="text-sm font-semibold text-foreground">{item.componentTitle}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                  {item.modelUsed}
                </span>
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Keyakinan {item.confidence}%
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/30 p-3 rounded">
              {item.content}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1">
                <X className="size-3" />
                <span>Tolak</span>
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Edit3 className="size-3" />
                <span>Revisi AI</span>
              </Button>
              <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
                <Check className="size-3" />
                <span>Setujui (Accept)</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
