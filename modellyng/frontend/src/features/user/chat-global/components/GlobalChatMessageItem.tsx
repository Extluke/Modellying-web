import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Sparkles,
  User,
  Copy,
  Check,
  FolderKanban,
  FileText,
  AlertCircle,
  Loader2,
  Clock,
  BookOpen,
} from "lucide-react"
import { GlobalChatMessage, CitationItem } from "../types/chatGlobalTypes"
import { useGlobalChatStore } from "../store/useGlobalChatStore"
import { toast } from "@/lib/store/useToastStore"

interface GlobalChatMessageItemProps {
  message: GlobalChatMessage
}

export function GlobalChatMessageItem({ message }: GlobalChatMessageItemProps) {
  const { openCitationModal } = useGlobalChatStore()
  const [copied, setCopied] = useState(false)

  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success("Isi pesan berhasil disalin ke papan klip.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Gagal menyalin teks pesan.")
    }
  }

  // Format jam dari timestamp epoch
  const timeFormatted = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Map sitasi berdasarkan ID (misal S1 -> CitationItem)
  const citationsMap = (message.citations || []).reduce<Record<string, CitationItem>>((acc, c) => {
    acc[c.citation_id] = c
    return acc
  }, {})

  // Ubah token [S1], [S2] dalam Markdown menjadi tautan sitasi interaktif [S1](#cite-S1)
  const processedContent = message.content.replace(/\[(S\d+)\]/g, "[$1](#cite-$1)")

  return (
    <div
      className={`flex items-start gap-3 w-full group animate-in fade-in slide-in-from-bottom-2 duration-150 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`size-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-2xs ${
          isUser
            ? "bg-primary text-primary-foreground font-bold"
            : "bg-secondary text-primary border border-border"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>

      {/* Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[78%] space-y-1.5 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Context Scope Badge if present */}
        {message.contextScope && (message.contextScope.project || message.contextScope.paper) && (
          <div
            className={`flex flex-wrap items-center gap-1.5 text-[10px] ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {message.contextScope.project && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold">
                <FolderKanban className="size-2.5" />
                <span>@{message.contextScope.project.name}</span>
              </span>
            )}
            {message.contextScope.paper && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold">
                <FileText className="size-2.5" />
                <span>/{message.contextScope.paper.title}</span>
              </span>
            )}
          </div>
        )}

        {/* Message Bubble Card */}
        <div
          className={`rounded-2xl p-4 shadow-2xs text-xs relative ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-xs"
              : "bg-card text-foreground border border-border rounded-tl-xs"
          } ${message.status === "error" ? "border-destructive/60 bg-destructive/5" : ""}`}
        >
          {/* Status Loading */}
          {message.status === "sending" && (
            <div className="flex items-center gap-2 text-muted-foreground pb-2 text-[11px]">
              <Loader2 className="size-3 animate-spin text-primary" />
              <span>Memproses analisis dokumen dan mensintesis jawaban...</span>
            </div>
          )}

          {/* Status Error Message */}
          {message.status === "error" && message.errorMessage && (
            <div className="flex items-center gap-1.5 text-destructive pb-2 text-[11px] font-semibold">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{message.errorMessage}</span>
            </div>
          )}

          {/* Markdown Content */}
          <div
            className={`prose prose-xs max-w-none leading-relaxed ${
              isUser
                ? "prose-invert text-primary-foreground font-medium"
                : "text-foreground prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  if (href?.startsWith("#cite-")) {
                    const citeId = href.replace("#cite-", "")
                    const citeItem = citationsMap[citeId]
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          if (citeItem) {
                            openCitationModal(citeItem)
                          }
                        }}
                        className="inline-flex items-center font-mono font-bold text-primary hover:underline px-1 py-0.2 mx-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] cursor-pointer"
                        title={citeItem ? `Lihat bukti: ${citeItem.paper_title} (Hal ${citeItem.page_number})` : "Lihat bukti sitasi"}
                      >
                        {children}
                      </button>
                    )
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:opacity-80"
                    >
                      {children}
                    </a>
                  )
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2 rounded-lg border border-border">
                    <table className="w-full text-[11px] text-left border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-muted px-2.5 py-1.5 font-bold border-b border-border">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-2.5 py-1.5 border-b border-border/60">
                    {children}
                  </td>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>

          {/* Citations Reference Strip for Assistant */}
          {isAssistant && message.citations && message.citations.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-border/70 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <BookOpen className="size-3 text-primary" />
                <span>Rujukan Bukti Empiris ({message.citations.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((c) => (
                  <button
                    key={c.citation_id}
                    type="button"
                    onClick={() => openCitationModal(c)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-secondary/50 hover:bg-secondary text-foreground border border-border/80 transition-colors cursor-pointer"
                  >
                    <span className="font-mono font-bold text-primary">[{c.citation_id}]</span>
                    <span className="truncate max-w-[140px]">{c.paper_title}</span>
                    <span className="text-muted-foreground font-mono text-[9px]">p.{c.page_number}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bubble Footer: Timestamp & Copy Button */}
        <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-2.5" />
            <span>{timeFormatted}</span>
          </div>

          {isAssistant && (
            <button
              type="button"
              onClick={handleCopyContent}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground flex items-center gap-0.5 cursor-pointer ml-1"
              title="Salin jawaban ini"
            >
              {copied ? <Check className="size-2.5 text-emerald-500" /> : <Copy className="size-2.5" />}
              <span>{copied ? "Tersalin" : "Salin"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
