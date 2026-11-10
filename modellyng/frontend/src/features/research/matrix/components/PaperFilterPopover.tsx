import { useState, useRef, useEffect } from "react"
import { Check, FileText, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MatrixPaper } from "@/features/projects/api/projectsApi"

/** A comparison needs at least two papers (same rule as the mobile app). */
export const MIN_SELECTED_PAPERS = 2

export interface PaperFilterPopoverProps {
  papers: MatrixPaper[]
  selectedPaperIds: string[]
  onTogglePaper: (paperId: string) => void
  onSelectAll: () => void
}

export function PaperFilterPopover({
  papers,
  selectedPaperIds,
  onTogglePaper,
  onSelectAll,
}: PaperFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const popoverRef = useRef<HTMLDivElement | null>(null)

  // Close the popover when clicking outside of it
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const keyword = searchQuery.trim().toLowerCase()
  const visiblePapers = papers.filter((paper) => {
    if (!keyword) return true
    return (
      paper.title.toLowerCase().includes(keyword) ||
      paper.authors?.some((author) => author.toLowerCase().includes(keyword)) ||
      paper.year?.toString().includes(keyword)
    )
  })

  const isAllSelected = selectedPaperIds.length === papers.length

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="h-10 gap-2 px-4 text-xs font-medium"
        title="Pilih paper yang ditampilkan pada matriks"
      >
        <Filter className="text-primary" />
        <span>Pilih Paper</span>
        <Badge variant="primary">
          {selectedPaperIds.length}/{papers.length}
        </Badge>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-40 w-80 max-w-[calc(100vw-3rem)] rounded-card border border-border bg-popover p-3 text-popover-foreground shadow-floating animate-in fade-in zoom-in-95 duration-100 sm:w-96">
          <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Pilih Paper</h3>
              <p className="text-xs text-muted-foreground">
                Pilih paper yang ingin dibandingkan (minimal {MIN_SELECTED_PAPERS}).
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              disabled={isAllSelected}
              className="h-8 shrink-0 px-2.5 text-xs"
            >
              Pilih Semua
            </Button>
          </div>

          {papers.length > 4 && (
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari judul, penulis, atau tahun..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 w-full rounded-button border border-input bg-card pl-9 pr-3 text-xs text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <ul className="mt-3 flex max-h-64 flex-col gap-1 overflow-y-auto">
            {visiblePapers.length === 0 ? (
              <li className="py-6 text-center text-xs text-muted-foreground">
                Tidak ada paper yang cocok dengan pencarian.
              </li>
            ) : (
              visiblePapers.map((paper) => {
                const isSelected = selectedPaperIds.includes(paper.id)
                const isLocked = isSelected && selectedPaperIds.length <= MIN_SELECTED_PAPERS

                return (
                  <li key={paper.id}>
                    <label
                      className={cn(
                        "flex items-start gap-3 rounded-button p-2.5 transition-colors",
                        isLocked ? "cursor-not-allowed" : "cursor-pointer",
                        isSelected ? "bg-primary-soft" : "hover:bg-muted/60"
                      )}
                      title={isLocked ? `Minimal ${MIN_SELECTED_PAPERS} paper harus tetap dipilih` : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLocked}
                        onChange={() => onTogglePaper(paper.id)}
                        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-input accent-primary disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 break-words text-xs font-semibold leading-snug text-foreground">
                          {paper.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <FileText className="size-3 shrink-0" />
                          <span>{paper.total_pages} hal.</span>
                          {paper.year && <span>&middot; {paper.year}</span>}
                        </p>
                      </div>
                      {isSelected && <Check className="mt-0.5 size-4 shrink-0 text-primary" />}
                    </label>
                  </li>
                )
              })
            )}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              {selectedPaperIds.length} dari {papers.length} paper terpilih
            </span>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
