import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Upload, FileText, ArrowRight, MessageSquare, CheckCircle, Clock } from "lucide-react"

export default function ProjectOverviewScreen() {
  const { projectId } = useParams<{ projectId: string }>()

  const dummyPapers = [
    {
      id: "paper-1",
      title: "Attention Is All You Need (Vaswani et al., 2017)",
      fileName: "vaswani2017_transformer.pdf",
      status: "ready",
      componentsCount: 11,
      confidence: 96,
    },
    {
      id: "paper-2",
      title: "BERT: Pre-training of Deep Bidirectional Transformers (Devlin et al., 2018)",
      fileName: "devlin2018_bert.pdf",
      status: "needs_review",
      componentsCount: 10,
      confidence: 78,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/projects" className="hover:underline">Proyek</Link>
            <span>/</span>
            <span>Workspace</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Overview Workspace ({projectId || "Default"})
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <Link to={`/projects/${projectId}/chat`}>
              <MessageSquare className="size-3.5" />
              <span>Chat Proyek</span>
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5 text-xs">
            <Upload className="size-3.5" />
            <span>Upload PDF (Maks 15)</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Daftar Dokumen Paper</h2>
        <div className="divide-y rounded-xl border bg-card">
          {dummyPapers.map((paper) => (
            <div key={paper.id} className="flex items-center justify-between p-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{paper.title}</h4>
                  <div className="mt-1 flex items-center gap-3 text-muted-foreground text-[11px]">
                    <span>{paper.fileName}</span>
                    <span>•</span>
                    <span>11 Komponen Ekstraksi</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {paper.status === "ready" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    <CheckCircle className="size-3" />
                    <span>Siap</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                    <Clock className="size-3" />
                    <span>Perlu Review</span>
                  </span>
                )}

                <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                  <Link to={`/projects/${projectId}/papers/${paper.id}`}>
                    <span>Buka Ekstraksi</span>
                    <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
