import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send, Sparkles } from "lucide-react"

export default function ProjectChatScreen() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      <div className="flex h-12 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to={`/projects/${projectId}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>RAG Chatbot Riset Proyek ({projectId})</span>
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Menjawab hanya berbasis korpus dokumen paper yang telah diunggah.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
              AI
            </div>
            <span className="text-xs font-semibold text-foreground">Asisten Riset Modellyng</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-8">
            Halo! Saya siap menjawab pertanyaan komparatif terkait paper Anda. Setiap kesimpulan akan
            disertai kartu sitasi kutipan sumber <span className="font-semibold text-primary">[S1]</span> yang dapat langsung membuka berkas PDF.
          </p>
        </div>
      </div>

      <div className="border-t bg-card p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Tanyakan sintesis atau perbandingan lintas-paper dalam proyek ini..."
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
