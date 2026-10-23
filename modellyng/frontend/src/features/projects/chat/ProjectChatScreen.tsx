import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Sparkles,
  Send,
  ArrowLeft,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  Bot,
  User,
  RotateCcw,
  CheckCircle2,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useProjectChatHistory,
  useSendProjectChatMessage,
  useProjectDetail,
  CitationItem,
  ChatMessageHistoryItem,
} from "../api/projectsApi"
import { PdfViewer } from "../paper-analysis/PdfViewer"

interface DisplayMessage {
  id: string
  role: "user" | "assistant"
  content: string
  citations: CitationItem[]
  created_at: string
  isOptimistic?: boolean
}

export default function ProjectChatScreen() {
  const { projectId } = useParams<{ projectId: string }>()
  const validProjectId = projectId || ""

  // Queries & Mutations
  const { data: project } = useProjectDetail(validProjectId)
  const {
    data: serverHistory,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useProjectChatHistory(validProjectId)
  const sendMutation = useSendProjectChatMessage(validProjectId)

  // Local Chat Messages & Draft State
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputText, setInputText] = useState<string>("")
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null)
  const [isPdfPanelOpen, setIsPdfPanelOpen] = useState<boolean>(true)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Restore unsent draft from localStorage
  const draftKey = `modellyng_chat_draft_${validProjectId}`
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey)
    if (savedDraft) {
      setInputText(savedDraft)
    }
  }, [draftKey])

  // Save unsent draft to localStorage
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputText(val)
    if (val.trim()) {
      localStorage.setItem(draftKey, val)
    } else {
      localStorage.removeItem(draftKey)
    }
  }

  // Synchronize server history with local message display
  useEffect(() => {
    if (serverHistory) {
      const mapped: DisplayMessage[] = serverHistory.map((item: ChatMessageHistoryItem) => ({
        id: item.id,
        role: item.role as "user" | "assistant",
        content: item.content,
        citations: item.citations || [],
        created_at: item.created_at,
      }))
      setMessages(mapped)
    }
  }, [serverHistory])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sendMutation.isPending])

  // Fast map of citation_id (e.g. "S1", "S2") to CitationItem for active assistant message
  const createCitationsMap = (citations: CitationItem[]) => {
    const map: Record<string, CitationItem> = {}
    for (const c of citations) {
      map[c.citation_id] = c
    }
    return map
  }

  // Pre-process markdown text: convert "[S1]" or "[S2]" into markdown links "[S1](#cite-S1)"
  const preprocessMarkdown = (text: string) => {
    return text.replace(/\[(S\d+)\]/g, "[$1](#cite-$1)")
  }

  const handleSelectCitation = (citation: CitationItem) => {
    setActiveCitation(citation)
    setIsPdfPanelOpen(true)
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || sendMutation.isPending) return

    // Clear draft storage
    localStorage.removeItem(draftKey)
    setInputText("")

    // Optimistic User Message
    const tempUserMsg: DisplayMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: trimmed,
      citations: [],
      created_at: new Date().toISOString(),
      isOptimistic: true,
    }

    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const response = await sendMutation.mutateAsync(trimmed)
      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        citations: response.citations,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Auto-open PDF preview on first citation if available
      if (response.citations && response.citations.length > 0) {
        setActiveCitation(response.citations[0])
      }
    } catch (err: unknown) {
      console.error("Gagal mengirim pertanyaan Tanya AI:", err)
      const errorMsg: DisplayMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "Terjadi kendala koneksi saat menghubungi mesin analisis dokumen. Mohon pastikan layanan backend dan basis data aktif.",
        citations: [],
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    }
  }

  // Suggested prompt chips
  const suggestedPrompts = useMemo(
    () => [
      "Bandingkan metodologi utama di antara seluruh paper",
      "Apa batasan dan keterbatasan riset yang dilaporkan?",
      "Bagaimana hasil dan metrik evaluasi tiap penelitian?",
      "Tunjukkan rumusan masalah yang coba diselesaikan",
    ],
    []
  )

  return (
    <div className="relative flex h-screen w-screen flex-col bg-background text-foreground overflow-hidden font-sans select-none">
      {/* Soft Ambient Aurora Mesh Glow (Aligned with Modellyng Light Theme) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 size-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -right-32 size-[550px] rounded-full bg-purple-500/5 blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 size-[600px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
      </div>

      {/* Top Header Bar (Modellyng Light Academic Header) */}
      <header className="relative z-10 flex h-14 items-center justify-between border-b bg-card/90 backdrop-blur-md px-4 sm:px-6 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/projects/${validProjectId}/overview`}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer group shadow-2xs"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform text-muted-foreground" />
            <span>Kembali ke Proyek</span>
          </Link>

          <div className="h-4 w-px bg-border shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary shrink-0" />
              <h1 className="text-xs sm:text-sm font-bold text-foreground tracking-tight truncate">
                Asisten Tanya AI Proyek: {project?.name || "Ruang Riset"}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeCitation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPdfPanelOpen((prev) => !prev)}
              className="text-xs h-8.5 gap-1.5 border-primary/25 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer rounded-xl font-medium"
            >
              {isPdfPanelOpen ? (
                <>
                  <PanelRightClose className="size-3.5" />
                  <span className="hidden sm:inline">Sembunyikan Bukti PDF</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="size-3.5" />
                  <span>Buka Bukti PDF [{activeCitation.citation_id}]</span>
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetchHistory()}
            className="size-8.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            title="Segarkan Riwayat Obrolan"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </header>

      {/* Ephemeral Warning Banner */}
      <div className="relative z-10 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 shrink-0">
        <Info className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>Catatan:</strong> Riwayat percakapan pada sesi Tanya AI ini bersifat sementara dan tidak disimpan secara permanen saat Anda meninggalkan halaman ini.
        </span>
      </div>

      {/* Main Workspace Area (Split or Full) */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Left Column: Chat Stream & Input Area */}
        <div
          className={`flex flex-col transition-all duration-200 ${
            isPdfPanelOpen && activeCitation ? "w-full lg:w-1/2 border-r" : "w-full max-w-4xl mx-auto"
          }`}
        >
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 select-text">
            {isHistoryLoading ? (
              <div className="flex h-48 items-center justify-center space-y-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground ml-2">
                  Memuat obrolan proyek...
                </span>
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 text-center space-y-4 my-8 max-w-lg mx-auto shadow-xs">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Tanya Jawab Sintesis Dokumen Paper
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Ajukan pertanyaan komparatif atau telaah bukti antar dokumen paper dalam ruang riset Anda. Setiap kesimpulan ditelusuri langsung ke nomor halaman dokumen PDF asli.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground text-left">
                    Saran pertanyaan cepat:
                  </span>
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(p)
                        inputRef.current?.focus()
                      }}
                      className="text-left text-xs p-2.5 rounded-xl border border-border/70 bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <span>{p}</span>
                      <Sparkles className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user"
                const citationsMap = createCitationsMap(msg.citations)

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                        <Bot className="size-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs space-y-3 ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-br-xs shadow-sm shadow-primary/20"
                          : "bg-card border border-border/80 text-foreground rounded-bl-xs shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-1.5 text-[10px]">
                        <span className="font-semibold flex items-center gap-1.5">
                          {isUser ? (
                            <>
                              <User className="size-3 text-white/80" />
                              <span>Anda</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-3 text-primary" />
                              <span className="text-foreground">Asisten Tanya AI</span>
                            </>
                          )}
                        </span>
                        <span className="opacity-60 font-mono text-[9px]">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Content Rendered with ReactMarkdown */}
                      <div className="text-xs leading-relaxed overflow-x-auto space-y-2 prose dark:prose-invert max-w-none">
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children }) => {
                                const match = href?.match(/^#cite-(S\d+)$/)
                                if (match) {
                                  const citeId = match[1]
                                  const citation = citationsMap[citeId]
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (citation) handleSelectCitation(citation)
                                      }}
                                      className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 transition-colors cursor-pointer"
                                      title={citation ? `${citation.paper_title} (Hal. ${citation.page_number})` : undefined}
                                    >
                                      {children}
                                    </button>
                                  )
                                }
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline"
                                  >
                                    {children}
                                  </a>
                                )
                              },
                            }}
                          >
                            {preprocessMarkdown(msg.content)}
                          </ReactMarkdown>
                        )}
                      </div>

                      {/* Citation chips below assistant answer */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-border/50 space-y-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground block">
                            Bukti Kutipan Dokumen Asli:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((c) => (
                              <button
                                key={c.citation_id}
                                type="button"
                                onClick={() => handleSelectCitation(c)}
                                className={`text-[10px] px-2 py-1 rounded-lg border text-left transition-all flex items-center gap-1.5 cursor-pointer ${
                                  activeCitation?.citation_id === c.citation_id
                                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                    : "bg-muted/40 border-border text-foreground hover:bg-muted hover:border-primary/40"
                                }`}
                              >
                                <span className="font-bold">[{c.citation_id}]</span>
                                <span className="truncate max-w-[120px]">{c.paper_title}</span>
                                <span className="opacity-70 font-mono text-[9px]">
                                  (Hal {c.page_number})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}

            {sendMutation.isPending && (
              <div className="flex gap-3 justify-start items-center">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-2xl bg-card border border-border/80 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 shadow-xs">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Menganalisis dokumen dan menyusun sintesis bukti...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar (Light Theme with Indigo Glow Box) */}
          <div className="p-3 sm:p-5 border-t bg-card/90 backdrop-blur-md">
            <form onSubmit={handleSendMessage} className="relative">
              {/* Outer Glowing Border Container */}
              <div className="relative group p-[2px] rounded-2xl bg-gradient-to-r from-primary/30 via-purple-500/30 to-indigo-500/30 hover:from-primary hover:via-purple-500 hover:to-indigo-500 shadow-xs hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 bg-card rounded-2xl px-3 py-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    disabled={sendMutation.isPending}
                    placeholder="Tanyakan sintesis atau telaah bukti antar dokumen paper..."
                    className="h-10 flex-1 bg-transparent px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    disabled={!inputText.trim() || sendMutation.isPending}
                    className="gap-1.5 h-9 px-4 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 cursor-pointer transition-all"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">Kirim</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: PDF Viewer with Animated Bounding Box Highlight */}
        {isPdfPanelOpen && activeCitation && (
          <div className="hidden lg:flex flex-1 flex-col border-l bg-card overflow-hidden">
            {/* PDF Panel Top Header */}
            <div className="flex h-12 items-center justify-between border-b px-4 bg-muted/30 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="size-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate max-w-xs">
                  {activeCitation.paper_title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  [{activeCitation.citation_id}]
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  Halaman {activeCitation.page_number}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPdfPanelOpen(false)}
                  className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                  title="Tutup Panel PDF"
                >
                  <PanelRightClose className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Evidence Quote Callout */}
            <div className="bg-primary/5 border-b border-primary/15 p-3 px-4 flex items-start gap-2.5 shrink-0">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-primary">
                  Kutipan Terkonfirmasi di Dokumen Asli:
                </span>
                <p className="text-xs text-foreground italic leading-relaxed font-serif">
                  &ldquo;{activeCitation.quote}&rdquo;
                </p>
              </div>
            </div>

            {/* Embedded Native PdfViewer Component */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <PdfViewer
                projectId={validProjectId}
                paperId={activeCitation.paper_id}
                targetPage={activeCitation.page_number}
                activeEvidence={{
                  page_index: activeCitation.page_number,
                  block_id: activeCitation.block_id,
                  quote: activeCitation.quote,
                  bbox: activeCitation.bbox,
                }}
                blocks={[
                  {
                    block_id: activeCitation.block_id,
                    page_number: activeCitation.page_number,
                    bbox: activeCitation.bbox,
                    text: activeCitation.quote,
                  },
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
