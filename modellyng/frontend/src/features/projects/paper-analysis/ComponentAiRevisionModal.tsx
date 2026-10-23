import { useState, useEffect, useRef } from "react"
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Check,
  Loader2,
  Bot,
  User,
  GripHorizontal,
  BookmarkCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ExtractedComponent,
  useReviseComponentAi,
  useUpdateComponent,
} from "../api/projectsApi"
import { toast } from "@/lib/store/useToastStore"

interface ChatTurn {
  id: string
  role: "assistant" | "user"
  content: string
  isDraft?: boolean
  explanation?: string
}

interface ComponentAiRevisionModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  paperId: string
  component: ExtractedComponent
  paperTitle?: string
}

export function ComponentAiRevisionModal({
  isOpen,
  onClose,
  projectId,
  paperId,
  component,
  paperTitle = "Dokumen Paper Ilmiah",
}: ComponentAiRevisionModalProps) {
  const reviseMutation = useReviseComponentAi(projectId, paperId)
  const updateMutation = useUpdateComponent(projectId, paperId)

  const componentLabel =
    component.label?.id || component.label?.en || component.parameter_key
  const currentText =
    component.value?.text || "Informasi belum diekstraksi."

  // Messages and flow state
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [inputText, setInputText] = useState("")
  const [activeDraft, setActiveDraft] = useState<string | null>(null)
  const [isWaitingDecision, setIsWaitingDecision] = useState(false)

  // Draggable window state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, initialPosX: 0, initialPosY: 0 })

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Initialize greeting message on open or when component changes
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 })
      setActiveDraft(null)
      setIsWaitingDecision(false)
      setInputText("")

      const initialGreeting: ChatTurn = {
        id: `greeting-${Date.now()}`,
        role: "assistant",
        content: `Halo! Saya Asisten Revisi Ilmiah Modellyng. Anda sedang meninjau komponen **${componentLabel}**. Formulasi saat ini adalah:\n\n> "${currentText}"\n\nSilakan berikan instruksi perbaikan atau penajaman naskah yang Anda inginkan...`,
      }
      setMessages([initialGreeting])
    }
  }, [isOpen, component.parameter_key, currentText, componentLabel])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, reviseMutation.isPending])

  // Focus input when waiting decision becomes false
  useEffect(() => {
    if (!isWaitingDecision && !reviseMutation.isPending) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isWaitingDecision, reviseMutation.isPending])

  // Dragging logic
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPosX: position.x,
      initialPosY: position.y,
    }
    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return
      const deltaX = ev.clientX - dragStartRef.current.x
      const deltaY = ev.clientY - dragStartRef.current.y
      setPosition({
        x: dragStartRef.current.initialPosX + deltaX,
        y: dragStartRef.current.initialPosY + deltaY,
      })
    }

    const onPointerUp = () => {
      isDraggingRef.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  // Handle Send Prompt
  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const prompt = inputText.trim()
    if (!prompt || reviseMutation.isPending || isWaitingDecision) return

    setInputText("")

    // 1. Add User Message
    const userMsg: ChatTurn = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
    }
    setMessages((prev) => [...prev, userMsg])

    // Hide input during generation
    setIsWaitingDecision(true)

    try {
      // 2. Call Backend AI Revision endpoint
      const result = await reviseMutation.mutateAsync({
        componentKey: component.parameter_key,
        payload: {
          user_instruction: prompt,
          current_text: activeDraft || currentText,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      })

      const newDraft = result.revised_text
      setActiveDraft(newDraft)

      // 3. Add Assistant Revised Draft Message
      const aiResponse: ChatTurn = {
        id: `ai-draft-${Date.now()}`,
        role: "assistant",
        content: newDraft,
        isDraft: true,
        explanation: result.explanation,
      }
      setMessages((prev) => [...prev, aiResponse])
      // Keep isWaitingDecision = true so input stays hidden until user chooses Tolak or Setuju!
    } catch {
      toast.error("Gagal memproses draf revisi AI. Silakan coba kembali.")
      setIsWaitingDecision(false)
    }
  }

  // Handle User Accepts Revision
  const handleAcceptRevision = async () => {
    if (!activeDraft) return
    try {
      await updateMutation.mutateAsync({
        componentKey: component.parameter_key,
        payload: {
          value: { text: activeDraft },
          status: "accepted",
          reviewer_notes: "Disetujui melalui Asisten AI Revisi Ilmiah.",
        },
      })
      toast.success(`Formulasi parameter "${componentLabel}" berhasil disetujui.`)
      onClose()
    } catch {
      toast.error("Gagal menyimpan persetujuan revisi.")
    }
  }

  // Handle User Rejects / Asks for Further Revision
  const handleRejectRevision = () => {
    // Unfreeze input bar to allow next prompt turn
    setIsWaitingDecision(false)
    const rejectNotice: ChatTurn = {
      id: `notice-${Date.now()}`,
      role: "assistant",
      content:
        "Draf ditolak. Silakan tuliskan arahan atau aspek yang perlu disempurnakan lebih lanjut pada kotak di bawah...",
    }
    setMessages((prev) => [...prev, rejectNotice])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {/* Floating Draggable Modal Drawer Container */}
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        className="w-full max-w-2xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col h-[620px] max-h-[85vh] animate-in zoom-in-95 duration-200 select-none transition-shadow hover:shadow-primary/10"
      >
        {/* Header (Draggable Handle Bar) */}
        <div
          onPointerDown={handlePointerDownHeader}
          className="flex h-13 items-center justify-between border-b px-4 bg-muted/40 cursor-grab active:cursor-grabbing shrink-0 select-none"
          title="Tahan dan geser untuk memindahkan posisi jendela"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 shadow-2xs">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                <span>Asisten Revisi: {componentLabel}</span>
              </h3>
              <p className="text-[10px] text-muted-foreground truncate">
                {paperTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center text-muted-foreground/60 mr-2">
              <GripHorizontal className="size-4" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Tutup Jendela Revisi"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-background/50 select-text">
          {messages.map((msg) => {
            const isUser = msg.role === "user"

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
                  className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-xs space-y-2.5 ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-xs shadow-sm shadow-primary/20"
                      : "bg-card border border-border/80 text-foreground rounded-bl-xs shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-1 text-[10px]">
                    <span className="font-semibold flex items-center gap-1.5">
                      {isUser ? (
                        <>
                          <User className="size-3 text-white/80" />
                          <span>Instruksi Anda</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3 text-primary" />
                          <span>Asisten Revisi Ilmiah</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="text-xs leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* Explanation if any */}
                  {msg.explanation && (
                    <div className="text-[11px] text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10 italic">
                      {msg.explanation}
                    </div>
                  )}

                  {/* Decision Gate Actions for Latest Draft */}
                  {msg.isDraft && isWaitingDecision && (
                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRejectRevision}
                        disabled={updateMutation.isPending}
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Tolak & Minta Revisi Ulang</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAcceptRevision}
                        disabled={updateMutation.isPending}
                        className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer rounded-xl shadow-xs"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        <span>Setujui & Simpan</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* AI Generating Indicator */}
          {reviseMutation.isPending && (
            <div className="flex gap-3 justify-start items-center">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Bot className="size-4" />
              </div>
              <div className="rounded-2xl bg-card border border-border/80 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 shadow-xs">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Menganalisis naskah dokumen dan menyusun formulasi revisi baru...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area: Hidden when waiting for user decision on draft */}
        <div className="border-t bg-card p-3 sm:p-4 shrink-0">
          {isWaitingDecision ? (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-2.5 text-center text-xs text-primary font-medium flex items-center justify-center gap-2">
              <BookmarkCheck className="size-4 text-primary" />
              <span>
                Draf revisi telah dihasilkan. Silakan pilih <strong>Setujui & Simpan</strong> atau <strong>Tolak & Minta Revisi Ulang</strong> di atas.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSendPrompt} className="relative">
              <div className="relative group p-[1.5px] rounded-2xl bg-gradient-to-r from-primary/30 via-purple-500/30 to-indigo-500/30 hover:from-primary hover:via-purple-500 hover:to-indigo-500 shadow-2xs hover:shadow-xs transition-all duration-300">
                <div className="flex items-center gap-2 bg-card rounded-2xl px-3 py-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={reviseMutation.isPending}
                    placeholder={`Tulis instruksi revisi untuk ${componentLabel} (cth: 'Pertajam metodologi sampling')...`}
                    className="h-10 flex-1 bg-transparent px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    disabled={!inputText.trim() || reviseMutation.isPending}
                    className="gap-1.5 h-8.5 px-3.5 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer transition-all"
                  >
                    {reviseMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    <span>Kirim</span>
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
