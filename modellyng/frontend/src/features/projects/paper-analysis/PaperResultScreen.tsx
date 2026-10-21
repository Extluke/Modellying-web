import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PdfViewer } from "@/features/projects/paper-analysis/PdfViewer"
import { EvidencePanel } from "@/features/projects/paper-analysis/EvidencePanel"
import { ArrowLeft, Sparkles, Check, Edit3 } from "lucide-react"

export default function PaperResultScreen() {
  const { projectId, paperId } = useParams<{ projectId: string; paperId: string }>()

  const dummyComponents = [
    {
      key: "methodology",
      title: "1. Metodologi Penelitian",
      content: "Studi komparatif arsitektur Multi-Head Attention berbasis Transformer tanpa recurrent / convolution layer.",
      confidence: 96,
      quote: "The Transformer is the first transduction model relying entirely on self-attention to compute representations...",
      page: 1,
    },
    {
      key: "problem_formulation",
      title: "2. Rumusan Masalah",
      content: "Komputasi sekuensial pada model RNN (LSTM/GRU) membatasi paralelisasi pada urutan teks panjang.",
      confidence: 94,
      quote: "Recurrent models typically factor computation along the symbol positions of the input and output sequences...",
      page: 2,
    },
    {
      key: "main_findings",
      title: "3. Temuan Utama",
      content: "Mencapai skor BLEU 28.4 pada penerjemahan WMT 2014 English-to-German dengan waktu pelatihan hanya 3.5 hari di 8 GPU.",
      confidence: 98,
      quote: "On the WMT 2014 English-to-German translation task, the big transformer model establishes a new state-of-the-art BLEU score of 28.4...",
      page: 7,
    },
  ]

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* Top Bar */}
      <div className="flex h-12 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to={`/projects/${projectId}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xs font-semibold text-foreground truncate max-w-md">
              Attention Is All You Need (Paper #{paperId})
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Edit3 className="size-3" />
            <span>Revisi AI</span>
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
            <Check className="size-3" />
            <span>Setujui Ekstraksi</span>
          </Button>
        </div>
      </div>

      {/* Split-Screen: Left 11 Components, Right PDF Viewer & Evidence */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: 11 Extracted Components */}
        <div className="w-1/2 overflow-y-auto border-r p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" />
              <span>11 Komponen Hasil Ekstraksi AI</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">Model: Gemini 1.5 Pro</span>
          </div>

          <div className="space-y-3">
            {dummyComponents.map((comp) => (
              <div key={comp.key} className="rounded-lg border bg-card p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-foreground">{comp.title}</h4>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Akurasi {comp.confidence}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {comp.content}
                </p>
                <div className="rounded bg-secondary/50 p-2.5 text-[11px] text-foreground border-l-2 border-primary">
                  <span className="font-medium">Bukti Kutipan (Hal {comp.page}): </span>
                  <span className="italic text-muted-foreground">"{comp.quote}"</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Interactive PDF Viewer & Evidence Span */}
        <div className="w-1/2 flex flex-col bg-secondary/20">
          <PdfViewer />
          <EvidencePanel />
        </div>
      </div>
    </div>
  )
}
