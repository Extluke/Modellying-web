import React, { useRef, useEffect } from "react"
import {
  Send,
  Loader2,
  FolderKanban,
  FileText,
  X,
  Command,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGlobalChatStore } from "../store/useGlobalChatStore"
import { ContextAutocompleteMenu } from "./ContextAutocompleteMenu"
import { AutocompleteItem, AutocompleteState } from "../types/chatGlobalTypes"

interface GlobalChatInputBarProps {
  inputText: string
  onInputChange: (val: string, cursorPos: number) => void
  onSubmit: () => void
  isSending: boolean
  autocompleteState: AutocompleteState
  onSelectAutocomplete: (item: AutocompleteItem) => void
  onCloseAutocomplete: () => void
  autocompleteItems: AutocompleteItem[]
  onKeyDownAutocomplete: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean
}

export function GlobalChatInputBar({
  inputText,
  onInputChange,
  onSubmit,
  isSending,
  autocompleteState,
  onSelectAutocomplete,
  onCloseAutocomplete,
  autocompleteItems,
  onKeyDownAutocomplete,
}: GlobalChatInputBarProps) {
  const { activeContextScope, setContextProject, setContextPaper } =
    useGlobalChatStore()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Otomatis sesuaikan tinggi textarea berdasarkan panjang teks
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`
    }
  }, [inputText])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Jika menu autocomplete sedang terbuka, delegasikan event navigasi keyboard
    if (autocompleteState.isOpen) {
      const handled = onKeyDownAutocomplete(e)
      if (handled) return
    }

    // 2. Enter tanpa Shift memicu pengiriman pesan
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isSending && inputText.trim()) {
        onSubmit()
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    const cursorPos = e.target.selectionStart || 0
    onInputChange(val, cursorPos)
  }

  const hasContext = Boolean(
    activeContextScope.project || activeContextScope.paper
  )

  return (
    <div className="relative border-t border-border bg-card/90 backdrop-blur-md p-4 shrink-0 shadow-lg">
      <div className="max-w-4xl mx-auto space-y-2 relative">
        {/* Floating Autocomplete Popover */}
        {autocompleteState.isOpen && (
          <ContextAutocompleteMenu
            items={autocompleteItems}
            triggerType={autocompleteState.triggerType || "project"}
            query={autocompleteState.query}
            selectedIndex={autocompleteState.selectedIndex}
            onSelectItem={onSelectAutocomplete}
            onClose={onCloseAutocomplete}
          />
        )}

        {/* Active Context Chips Bar */}
        {hasContext && (
          <div className="flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150 pb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
              Fokus Konteks:
            </span>

            {/* Chip Proyek (@) */}
            {activeContextScope.project && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                <FolderKanban className="size-3.5" />
                <span className="truncate max-w-[200px]">
                  @{activeContextScope.project.name}
                </span>
                <button
                  type="button"
                  onClick={() => setContextProject(null)}
                  className="p-0.5 rounded-md hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                  title="Hapus fokus proyek ini"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {/* Chip Paper (/) */}
            {activeContextScope.paper && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shadow-2xs">
                <FileText className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate max-w-[240px]">
                  /{activeContextScope.paper.title}
                </span>
                <button
                  type="button"
                  onClick={() => setContextPaper(null)}
                  className="p-0.5 rounded-md hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                  title="Hapus fokus paper ini"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Input Textarea Container */}
        <div className="flex items-end gap-2.5 rounded-2xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all shadow-2xs">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              activeContextScope.paper
                ? `Tanyakan apa saja tentang naskah "${activeContextScope.paper.title.slice(0, 30)}..."`
                : activeContextScope.project
                ? `Tanyakan temuan pada proyek "${activeContextScope.project.name}" (ketik / untuk paper spesifik)...`
                : "Tanyakan literatur akademik atau ketik @ untuk pilih proyek, / untuk pilih paper..."
            }
            className="flex-1 max-h-36 resize-none bg-transparent px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
          />

          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={isSending || !inputText.trim()}
            className="size-9 p-0 rounded-xl shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
            title="Kirim pertanyaan (Enter)"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>

        {/* Bottom Helper Bar */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Command className="size-2.5" />
              <span>Tekan Enter untuk kirim, Shift+Enter untuk baris baru</span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="hidden sm:inline">Ketik @ untuk proyek &bull; / untuk paper</span>
            <span>{inputText.length} karakter</span>
          </div>
        </div>
      </div>
    </div>
  )
}
