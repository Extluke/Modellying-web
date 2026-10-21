import { Workflow, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ConceptMapScreen() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Workflow className="size-5 text-primary" />
            <span>Peta Relasi Konsep Ilmiah (Mermaid Flowchart)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualisasi alur logika: Paper Sumber ➔ Konsep Teoretis ➔ Bukti Kutipan Empiris.
          </p>
        </div>

        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <Code2 className="size-3.5" />
          <span>Lihat Kode Mermaid</span>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center justify-center min-h-[360px]">
        <div className="text-center space-y-2">
          <Workflow className="size-8 text-primary mx-auto opacity-80" />
          <h3 className="text-xs font-semibold">Diagram Alur Mermaid Dinamis</h3>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
            Merender hubungan kausalitas antar temuan secara visual langsung di DOM browser.
          </p>
        </div>
      </div>
    </div>
  )
}
