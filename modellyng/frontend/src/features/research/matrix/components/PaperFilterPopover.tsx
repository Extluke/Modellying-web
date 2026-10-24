import { useState, useRef, useEffect } from "react"
import { Filter, Check, RotateCcw, CheckSquare, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MatrixPaper } from "@/features/projects/api/projectsApi"

export interface PaperFilterPopoverProps {
  papers: MatrixPaper[]
  selectedPaperIds: string[]
  onTogglePaper: (paperId: string) => void
  onSelectAll: () => void
  onReset: () => void
}

export function PaperFilterPopover({
  papers,
  selectedPaperIds,
  onTogglePaper,
  onSelectAll,
  onReset,
}: PaperFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const popoverRef = useRef<HTMLDivElement | null>(null)

  // Tutup popover jika mengklik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const filteredPapers = papers.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      (p.authors && p.authors.some((a) => a.toLowerCase().includes(q))) ||
      (p.year && p.year.toString().includes(q))
    )
  })

  const isAllSelected = selectedPaperIds.length === papers.length

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-xs border-border hover:bg-secondary"
        title="Pilih kolom paper yang ingin ditampilkan pada matriks"
      >
        <Filter className="size-3.5 text-primary" />
        <span>Filter Kolom Paper</span>
        <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary border border-primary/20 font-mono">
          {selectedPaperIds.length}/{papers.length}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-9.5 z-40 w-80 sm:w-96 rounded-xl border bg-card p-3 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <div>
              <h4 className="text-xs font-bold text-foreground">Seleksi Kolom Paper</h4>
              <p className="text-[10px] text-muted-foreground">
                Tampilkan atau sembunyikan paper pada tabel komparasi
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                disabled={isAllSelected}
                className="h-7 text-[10px] gap-1 px-2 cursor-pointer"
                title="Pilih seluruh dokumen paper"
              >
                <CheckSquare className="size-3" />
                <span>Pilih Semua</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-7 text-[10px] gap-1 px-2 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Kembalikan ke seluruh paper terpilih"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </Button>
            </div>
          </div>

          {/* Quick Search */}
          {papers.length > 4 && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 size-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari judul paper atau penulis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-full rounded-md border bg-background pl-7.5 pr-2.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* Paper List */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/50">
            {filteredPapers.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground italic">
                Tidak ada paper yang cocok dengan pencarian.
              </p>
            ) : (
              filteredPapers.map((paper) => {
                const isSelected = selectedPaperIds.includes(paper.id)
                const isLastSelected = isSelected && selectedPaperIds.length === 1

                return (
                  <label
                    key={paper.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors pt-2 ${
                      isSelected
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/50 opacity-70"
                    }`}
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLastSelected}
                        onChange={() => onTogglePaper(paper.id)}
                        className="size-3.5 rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer disabled:opacity-40"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <FileText className="size-2.5" />
                          <span>{paper.total_pages} Hal</span>
                          {paper.year && <span>• {paper.year}</span>}
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                            paper.status === "ready"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {paper.status.replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-foreground line-clamp-1 leading-snug mt-0.5">
                        {paper.title}
                      </p>

                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {paper.authors && paper.authors.length > 0
                          ? paper.authors.join(", ")
                          : "Penulis tidak terdata"}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="size-3 text-primary mt-1 shrink-0" />
                    )}
                  </label>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Minimal 1 paper harus aktif.</span>
            <Button
              size="sm"
              variant="default"
              onClick={() => setIsOpen(false)}
              className="h-6 text-[10px] px-2.5"
            >
              Terapkan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
