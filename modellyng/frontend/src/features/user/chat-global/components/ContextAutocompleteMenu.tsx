import { useEffect, useRef } from "react"
import { FolderKanban, FileText, Sparkles, CornerDownLeft, X } from "lucide-react"
import { AutocompleteItem, AutocompleteTriggerType } from "../types/chatGlobalTypes"

interface ContextAutocompleteMenuProps {
  items: AutocompleteItem[]
  triggerType: AutocompleteTriggerType
  query: string
  selectedIndex: number
  onSelectItem: (item: AutocompleteItem) => void
  onClose: () => void
}

export function ContextAutocompleteMenu({
  items,
  triggerType,
  query,
  selectedIndex,
  onSelectItem,
  onClose,
}: ContextAutocompleteMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Scroll otomatis ke item yang sedang disorot oleh keyboard navigasi
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector<HTMLButtonElement>(
        `[data-index="${selectedIndex}"]`
      )
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [selectedIndex])

  const isProject = triggerType === "project"

  return (
    <div
      role="listbox"
      aria-label={isProject ? "Daftar Rekomendasi Proyek" : "Daftar Rekomendasi Paper"}
      className="absolute bottom-full left-0 right-0 mb-2 z-40 max-h-64 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {/* Header Info */}
      <div className="px-3.5 py-2 border-b border-border/70 bg-muted/30 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          {isProject ? (
            <>
              <FolderKanban className="size-3.5 text-primary" />
              <span>Pilih Proyek Riset (@proyek):</span>
            </>
          ) : (
            <>
              <FileText className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Pilih Paper Spesifik (/paper):</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {query && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              Filter: &ldquo;{query}&rdquo;
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Tutup menu rekomendasi"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      {/* Item List */}
      <div ref={containerRef} className="overflow-y-auto p-1.5 space-y-1 max-h-48">
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-medium">
              {isProject ? "Tidak ada proyek yang sesuai." : "Tidak ada paper yang sesuai."}
            </p>
            <p className="text-[10px] text-muted-foreground/80">
              {query
                ? `Tidak ditemukan hasil dengan kata kunci "${query}".`
                : isProject
                ? "Belum ada proyek aktif."
                : "Belum ada paper siap analisis."}
            </p>
          </div>
        ) : (
          items.map((item, index) => {
            const isSelected = index === selectedIndex
            return (
              <button
                key={item.id}
                type="button"
                data-index={index}
                onClick={() => onSelectItem(item)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer text-xs ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30 text-primary shadow-2xs font-semibold"
                    : "text-foreground hover:bg-muted/70 border border-transparent"
                }`}
              >
                <div
                  className={`mt-0.5 p-1 rounded-lg shrink-0 ${
                    item.type === "project"
                      ? "bg-primary/15 text-primary"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {item.type === "project" ? (
                    <FolderKanban className="size-3.5" />
                  ) : (
                    <FileText className="size-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-bold">{item.title}</span>
                    {item.badgeText && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                        {item.badgeText}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-[11px] text-muted-foreground truncate leading-snug">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {isSelected && (
                  <span className="text-[10px] text-primary flex items-center gap-0.5 shrink-0 self-center font-mono">
                    <CornerDownLeft className="size-2.5" />
                    <span>Pilih</span>
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Footer Helper Petunjuk Tombol */}
      <div className="px-3 py-1.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>&uarr;&darr; Navigasi</span>
          <span>&crarr; Pilih</span>
          <span>Esc Batal</span>
        </div>
        <div className="flex items-center gap-1 text-primary">
          <Sparkles className="size-2.5" />
          <span>Konteks Cerdas</span>
        </div>
      </div>
    </div>
  )
}
