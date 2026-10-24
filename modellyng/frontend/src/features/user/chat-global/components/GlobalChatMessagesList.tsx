import { useRef, useEffect } from "react"
import { Sparkles, HelpCircle, ArrowRight, BookOpen, Layers, Lightbulb } from "lucide-react"
import { GlobalChatMessage, ContextScopeProject, ContextScopePaper } from "../types/chatGlobalTypes"
import { GlobalChatMessageItem } from "./GlobalChatMessageItem"

interface GlobalChatMessagesListProps {
  messages: GlobalChatMessage[]
  onSelectQuickPrompt: (
    prompt: string,
    context?: { project?: ContextScopeProject; paper?: ContextScopePaper }
  ) => void
  isGenerating: boolean
}

export function GlobalChatMessagesList({
  messages,
  onSelectQuickPrompt,
  isGenerating,
}: GlobalChatMessagesListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Otomatis scroll ke bawah saat pesan baru bertambah atau saat status generasi berubah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isGenerating])

  const quickPrompts = [
    {
      title: "Ringkasan Metodologi",
      prompt: "Rangkum dan bandingkan metodologi utama yang digunakan dalam literatur yang telah diekstraksi.",
      icon: Layers,
    },
    {
      title: "Deteksi Keterbatasan & Gap",
      prompt: "Apa saja keterbatasan (limitations) dan peluang masa depan (future work) yang paling krusial untuk dijadikan topik tesis?",
      icon: Lightbulb,
    },
    {
      title: "Pencarian Bukti Spesifik",
      prompt: "Tunjukkan bukti kutipan empiris terkait variabel penelitian dan ukuran sampel dataset.",
      icon: BookOpen,
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Empty State jika belum ada pesan */}
        {messages.length === 0 ? (
          <div className="py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
            {/* Hero Welcome Card */}
            <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-xs text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Sparkles className="size-40 text-primary" />
              </div>

              <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-2xs">
                <Sparkles className="size-6" />
              </div>

              <div className="space-y-1 max-w-lg mx-auto">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Asisten Riset Akademis Berbasis Bukti
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ajukan pertanyaan literatur lintas-dokumen atau persempit fokus penelusuran dengan mengetikkan{" "}
                  <span className="font-bold text-primary">@proyek</span> untuk memilih proyek, atau{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">/paper</span> untuk menelaah naskah spesifik.
                </p>
              </div>

              {/* Tagging Explanation Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px]">
                <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-foreground font-semibold flex items-center gap-1.5">
                  <span className="text-primary font-mono font-bold">@</span>
                  <span>Fokus Proyek Tertentu</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-foreground font-semibold flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">/</span>
                  <span>Fokus Naskah Paper</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-foreground font-semibold flex items-center gap-1.5">
                  <HelpCircle className="size-3 text-amber-500" />
                  <span>Cache Lokal 24 Jam</span>
                </span>
              </div>
            </div>

            {/* Quick Inspiration Prompts Grid */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                <HelpCircle className="size-3.5 text-primary" />
                <span>Inspirasi Pertanyaan Akademik Cepat:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickPrompts.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectQuickPrompt(item.prompt)}
                      className="p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 hover:border-primary/40 transition-all text-left space-y-2 cursor-pointer shadow-2xs group flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs">
                          <Icon className="size-4" />
                          <span>{item.title}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                          {item.prompt}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center text-[10px] font-semibold text-primary opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        <span>Gunakan Pertanyaan</span>
                        <ArrowRight className="size-3 ml-1" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Render Messages List */
          <div className="space-y-5 pb-4">
            {messages.map((msg) => (
              <GlobalChatMessageItem key={msg.id} message={msg} />
            ))}
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  )
}
