import { Button } from "@/components/ui/button"
import { TableProperties, Download, Filter } from "lucide-react"

export default function MatrixScreen() {
  const dummyMatrix = [
    {
      parameter: "1. Metodologi / Model",
      paper1: "Transformer Self-Attention",
      paper2: "Bi-directional Encoder (BERT)",
    },
    {
      parameter: "2. Ukuran Dataset",
      paper1: "WMT 2014 En-De (4.5M pairs)",
      paper2: "BooksCorpus + English Wikipedia (3.3B words)",
    },
    {
      parameter: "3. Metrik Utama",
      paper1: "BLEU Score 28.4",
      paper2: "GLUE Score 80.5",
    },
    {
      parameter: "4. Keterbatasan",
      paper1: "Quadratic complexity terhadap panjang sekuens",
      paper2: "Biaya komputasi pra-pelatihan sangat masif",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TableProperties className="size-5 text-primary" />
            <span>Matriks Komparasi 10 Parameter Ilmiah</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Perbandingan terstruktur antar paper berstatus Ready dengan sinkronisasi gulir horizontal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="size-3.5" />
            <span>Filter Parameter</span>
          </Button>
          <Button size="sm" className="gap-1.5 text-xs">
            <Download className="size-3.5" />
            <span>Ekspor Matriks (Excel/CSV)</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
              <th className="p-4 w-1/4 border-r">Parameter Analisis</th>
              <th className="p-4 w-3/8 border-r">Attention Is All You Need</th>
              <th className="p-4 w-3/8">BERT: Bidirectional Transformers</th>
            </tr>
          </thead>
          <tbody className="divide-y text-foreground">
            {dummyMatrix.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/10 transition-colors">
                <td className="p-4 font-semibold text-primary border-r bg-muted/10">
                  {row.parameter}
                </td>
                <td className="p-4 border-r leading-relaxed">{row.paper1}</td>
                <td className="p-4 leading-relaxed">{row.paper2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
