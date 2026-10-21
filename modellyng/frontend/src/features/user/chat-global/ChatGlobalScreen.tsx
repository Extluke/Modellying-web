import { Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChatGlobalScreen() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      <div className="flex h-12 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">
            Asisten Cerdas Global Modellyng
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono">
            Ketik @ untuk pilih proyek, / untuk pilih paper
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
              AI
            </div>
            <span className="text-xs font-semibold text-foreground">Asisten Cerdas Global</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-8">
            Saya asisten lintas-proyek Anda. Anda dapat mengajukan pertanyaan umum tentang literatur atau
            memanggil proyek tertentu dengan mengetikkan <span className="font-semibold text-primary">@nama_proyek</span>.
          </p>
        </div>
      </div>

      <div className="border-t bg-card p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Tanyakan apa saja atau ketik @ untuk tag proyek..."
            className="h-10 flex-1 rounded-md border bg-background px-4 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button className="gap-1.5">
            <Send className="size-4" />
            <span>Kirim</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
