import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FolderKanban, Plus, Search, FileText, ArrowRight } from "lucide-react"

export default function ProjectsScreen() {
  const dummyProjects = [
    {
      id: "proj-1",
      name: "Tinjauan Sistematis Model Transformer untuk NLP Medis",
      description: "Analisis komparatif 12 paper arsitektur BERT vs GPT pada rekam medis elektronik.",
      paperCount: 12,
      readyCount: 10,
      updatedAt: "2 jam yang lalu",
    },
    {
      id: "proj-2",
      name: "Optimasi Algoritma Penjadwalan Cloud Computing Berkelanjutan",
      description: "Evaluasi heuristik genetika dan particle swarm optimization pada konsumsi energi server.",
      paperCount: 6,
      readyCount: 4,
      updatedAt: "Kemarin",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Proyek Riset</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola ruang kerja penelitian dan koleksi paper PDF Anda.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span>Buat Proyek Baru</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Cari judul proyek atau topik..."
            className="h-9 w-full rounded-md border bg-background pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {dummyProjects.map((p) => (
          <div
            key={p.id}
            className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="size-5" />
              </div>
              <span className="text-[11px] text-muted-foreground">{p.updatedAt}</span>
            </div>

            <h3 className="mt-3 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {p.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {p.description}
            </p>

            <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FileText className="size-3.5" />
                <span>{p.readyCount}/{p.paperCount} Paper Siap</span>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                <Link to={`/projects/${p.id}`}>
                  <span>Buka Workspace</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
