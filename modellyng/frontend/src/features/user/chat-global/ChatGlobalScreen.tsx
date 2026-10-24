import React, { useState, useEffect, useMemo } from "react"
import {
  Sparkles,
  Trash2,
  Clock,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/store/useToastStore"
import { useAuthStore } from "@/features/auth/store/authStore"
import {
  useProjects,
  useProjectDetail,
  Project,
  Paper,
} from "@/features/projects/api/projectsApi"
import { apiClient } from "@/lib/api/client"
import {
  GlobalChatMessage,
  AutocompleteState,
  AutocompleteItem,
  ContextScopeProject,
  ContextScopePaper,
  CitationItem,
} from "./types/chatGlobalTypes"
import {
  loadCachedMessages,
  saveCachedMessages,
  clearCachedMessages,
  loadChatDraft,
  saveChatDraft,
  clearChatDraft,
} from "./utils/chatCacheStorage"
import {
  detectAutocompleteTrigger,
  replaceTriggerToken,
} from "./utils/autocompleteParser"
import { useGlobalChatStore } from "./store/useGlobalChatStore"
import { GlobalChatMessagesList } from "./components/GlobalChatMessagesList"
import { GlobalChatInputBar } from "./components/GlobalChatInputBar"
import { CitationPreviewModal } from "./components/CitationPreviewModal"
import { ClearHistoryConfirmModal } from "./components/ClearHistoryConfirmModal"

interface ProjectChatResponse {
  answer: string
  citations: CitationItem[]
}

export default function ChatGlobalScreen() {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id || "anonymous"

  // Zustand Global Chat Store
  const {
    activeContextScope,
    setContextProject,
    setContextPaper,
    setClearHistoryModalOpen,
    isGenerating,
    setIsGenerating,
  } = useGlobalChatStore()

  // State Pesan & Input
  const [messages, setMessages] = useState<GlobalChatMessage[]>([])
  const [inputText, setInputText] = useState<string>("")

  // Autocomplete State
  const [autocompleteState, setAutocompleteState] = useState<AutocompleteState>({
    isOpen: false,
    triggerType: null,
    query: "",
    cursorPosition: 0,
    triggerIndex: -1,
    selectedIndex: 0,
  })

  // Queries Server State
  const { data: projects = [] } = useProjects({
    status: "active",
  })

  // Ambil detail proyek terpilih jika ada untuk daftar paper spesifik
  const activeProjectId = activeContextScope.project?.id
  const { data: projectDetail } = useProjectDetail(activeProjectId)

  // Inisialisasi: Muat riwayat pesan & draf teks dari localStorage saat mount
  useEffect(() => {
    const cached = loadCachedMessages(userId)
    setMessages(cached)

    const draft = loadChatDraft(userId)
    if (draft) {
      setInputText(draft)
    }
  }, [userId])

  // Sinkronisasi riwayat pesan ke localStorage setiap kali messages berubah
  useEffect(() => {
    if (messages.length > 0) {
      saveCachedMessages(userId, messages)
    }
  }, [messages, userId])

  // Susun Daftar Item Autocomplete
  const autocompleteItems = useMemo<AutocompleteItem[]>(() => {
    const q = autocompleteState.query.toLowerCase().trim()

    // 1. Kasus Trigger @: Daftar Proyek
    if (autocompleteState.triggerType === "project") {
      return projects
        .filter((p: Project) => {
          if (!q) return true
          return (
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
          )
        })
        .map((p: Project) => ({
          id: `proj-${p.id}`,
          type: "project" as const,
          title: p.name,
          subtitle: p.description || `${p.ready_count || 0} paper siap`,
          badgeText: `${p.ready_count || 0} Paper`,
          projectId: p.id,
          rawItem: {
            id: p.id,
            name: p.name,
            description: p.description,
          },
        }))
    }

    // 2. Kasus Trigger /: Daftar Paper
    if (autocompleteState.triggerType === "paper") {
      // Jika proyek sudah dipilih, ambil paper dari projectDetail
      if (projectDetail && projectDetail.papers) {
        return projectDetail.papers
          .filter((p: Paper) => {
            if (!q) return true
            return (
              p.title.toLowerCase().includes(q) ||
              (p.authors && p.authors.some((a) => a.toLowerCase().includes(q)))
            )
          })
          .map((p: Paper) => ({
            id: `paper-${p.id}`,
            type: "paper" as const,
            title: p.title,
            subtitle: `${p.authors?.join(", ") || "Peneliti"} (${p.year || "N/A"})`,
            badgeText: p.status === "ready" ? "Siap" : "Naskah",
            projectId: projectDetail.id,
            rawItem: {
              id: p.id,
              title: p.title,
              projectId: projectDetail.id,
              projectName: projectDetail.name,
              authors: p.authors,
              year: p.year,
            },
          }))
      }

      // Jika belum ada proyek dipilih, kumpulkan paper dari proyek yang sedang termuat
      const fallbackList: AutocompleteItem[] = []
      projects.slice(0, 5).forEach((p: Project) => {
        fallbackList.push({
          id: `proj-ref-${p.id}`,
          type: "paper" as const,
          title: `Paper pada @${p.name}`,
          subtitle: "Pilih proyek ini terlebih dahulu untuk menelaah paper spesifik",
          badgeText: "Konteks Proyek",
          projectId: p.id,
          rawItem: {
            id: p.id,
            title: p.name,
            projectId: p.id,
            projectName: p.name,
          },
        })
      })
      return fallbackList
    }

    return []
  }, [autocompleteState.triggerType, autocompleteState.query, projects, projectDetail])

  // Handler Perubahan Input Teks & Deteksi Kursor
  const handleInputChange = (val: string, cursorPos: number) => {
    setInputText(val)
    saveChatDraft(userId, val)

    // Deteksi apakah sedang mengetik @ atau /
    const detection = detectAutocompleteTrigger(val, cursorPos)

    if (detection.isTriggered) {
      setAutocompleteState({
        isOpen: true,
        triggerType: detection.triggerType,
        query: detection.query,
        cursorPosition: cursorPos,
        triggerIndex: detection.triggerIndex,
        selectedIndex: 0,
      })
    } else {
      if (autocompleteState.isOpen) {
        setAutocompleteState((prev) => ({ ...prev, isOpen: false }))
      }
    }
  }

  // Handler Pemilihan Item Autocomplete
  const handleSelectAutocomplete = (item: AutocompleteItem) => {
    // 1. Bersihkan token @query atau /query dari teks input
    const { newText, newCursorPos } = replaceTriggerToken(
      inputText,
      autocompleteState.triggerIndex,
      autocompleteState.cursorPosition
    )

    setInputText(newText)
    saveChatDraft(userId, newText)

    // 2. Sematkan tag ke konteks chip
    if (item.type === "project") {
      const projItem = item.rawItem as ContextScopeProject
      setContextProject(projItem)
      toast.info(`Fokus percakapan disetel ke proyek: @${projItem.name}`)
    } else {
      const paperItem = item.rawItem as ContextScopePaper
      setContextPaper(paperItem)
      // Jika belum ada proyek aktif tapi paper memiliki projectId, set otomatis proyeknya
      if (paperItem.projectId && !activeContextScope.project) {
        const foundProj = projects.find((p) => p.id === paperItem.projectId)
        if (foundProj) {
          setContextProject({
            id: foundProj.id,
            name: foundProj.name,
            description: foundProj.description,
          })
        }
      }
      toast.info(`Fokus telaah disetel ke naskah: /${paperItem.title.slice(0, 30)}...`)
    }

    // 3. Tutup menu autocomplete
    setAutocompleteState((prev) => ({
      ...prev,
      isOpen: false,
      cursorPosition: newCursorPos,
    }))
  }

  // Handler Kontrol Navigasi Keyboard pada Input Bar
  const handleKeyDownAutocomplete = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): boolean => {
    if (!autocompleteState.isOpen || autocompleteItems.length === 0) {
      if (e.key === "Escape") {
        setAutocompleteState((prev) => ({ ...prev, isOpen: false }))
        return true
      }
      return false
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setAutocompleteState((prev) => ({
        ...prev,
        selectedIndex: (prev.selectedIndex + 1) % autocompleteItems.length,
      }))
      return true
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setAutocompleteState((prev) => ({
        ...prev,
        selectedIndex:
          (prev.selectedIndex - 1 + autocompleteItems.length) %
          autocompleteItems.length,
      }))
      return true
    }

    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      const selected = autocompleteItems[autocompleteState.selectedIndex]
      if (selected) {
        handleSelectAutocomplete(selected)
      }
      return true
    }

    if (e.key === "Escape") {
      e.preventDefault()
      setAutocompleteState((prev) => ({ ...prev, isOpen: false }))
      return true
    }

    return false
  }

  // Pengiriman Pesan ke Asisten
  const handleSendMessage = async () => {
    const trimmed = inputText.trim()
    if (!trimmed || isGenerating) return

    const userMessageId = `msg-user-${Date.now()}`
    const assistantMessageId = `msg-asst-${Date.now() + 1}`

    const currentScope = {
      project: activeContextScope.project || undefined,
      paper: activeContextScope.paper || undefined,
    }

    const newUserMessage: GlobalChatMessage = {
      id: userMessageId,
      role: "user",
      content: trimmed,
      contextScope: currentScope,
      timestamp: Date.now(),
      status: "sent",
    }

    // Placeholder sementara untuk assistant
    const placeholderAssistantMessage: GlobalChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      contextScope: currentScope,
      timestamp: Date.now() + 1,
      status: "sending",
    }

    // Simpan pesan user dan placeholder ke tampilan
    setMessages((prev) => [...prev, newUserMessage, placeholderAssistantMessage])
    setInputText("")
    clearChatDraft(userId)
    setIsGenerating(true)

    // Eksekusi pemanggilan AI dengan mekanisme retry 1 kali
    const attemptQuery = async (retryCount = 0): Promise<ProjectChatResponse> => {
      try {
        // 1. Jika ada tag @proyek, kirim ke endpoint RAG proyek
        if (currentScope.project?.id) {
          return await apiClient.post<ProjectChatResponse>(
            `/projects/${currentScope.project.id}/chat`,
            { message: trimmed }
          )
        }

        // 2. Jika tidak ada tag proyek, gunakan asisten akademik global
        // Cek apakah ada proyek aktif pertama pengguna untuk dijadikan referensi RAG fallback
        if (projects.length > 0) {
          const fallbackProj = projects[0]
          return await apiClient.post<ProjectChatResponse>(
            `/projects/${fallbackProj.id}/chat`,
            { message: trimmed }
          )
        }

        // 3. Fallback jika user belum memiliki proyek sama sekali
        return {
          answer:
            "Halo! Saya adalah **Asisten Cerdas Global Modellyng**. Saat ini Anda belum memiliki proyek riset aktif. Untuk mendapatkan analisis berbasis bukti kutipan empiris (*evidence quotes*), silakan buat proyek baru dan unggah dokumen PDF, atau ketikkan `@` untuk memilih proyek.",
          citations: [],
        }
      } catch (err: unknown) {
        if (retryCount < 1) {
          // Retry otomatis 1 kali
          await new Promise((resolve) => setTimeout(resolve, 1500))
          return attemptQuery(retryCount + 1)
        }
        throw err
      }
    }

    try {
      const response = await attemptQuery()

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: response.answer,
                citations: response.citations || [],
                status: "sent",
              }
            : msg
        )
      )
    } catch (err: unknown) {
      // Pemulihan Draf Otomatis bila terjadi kegagalan jaringan
      setInputText(trimmed)
      saveChatDraft(userId, trimmed)

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "Terjadi kendala saat menghubungkan ke mesin asisten AI. Pertanyaan Anda telah dikembalikan ke kolom input agar tidak hilang.",
                status: "error",
                errorMessage: "Gagal memproses respons AI.",
              }
            : msg
        )
      )

      toast.error(
        "Gagal mengirim pesan ke asisten AI. Draf pesan Anda telah dikembalikan ke kolom input."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  // Handler Pembersihan Riwayat Lokal
  const handleConfirmClearHistory = () => {
    clearCachedMessages(userId)
    setMessages([])
    toast.info("Riwayat percakapan lokal berhasil dibersihkan.")
  }

  // Handler Memilih Saran Pertanyaan Cepat
  const handleSelectQuickPrompt = (prompt: string) => {
    setInputText(prompt)
    saveChatDraft(userId, prompt)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
            <Sparkles className="size-4.5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground">
                Asisten Cerdas Global Modellyng
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="size-2.5" />
                <span>Evidence-Centered</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Eksplorasi literatur lintas-dokumen dengan penanda konteks @proyek dan /paper.
            </p>
          </div>
        </div>

        {/* Right Info: Cache TTL Status & Clear History Button */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border text-[11px] text-muted-foreground">
            <Clock className="size-3 text-primary" />
            <span>Cache Lokal: 24 Jam (Auto-prune)</span>
          </div>

          {messages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setClearHistoryModalOpen(true)}
              className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30 cursor-pointer"
              title="Bersihkan riwayat percakapan lokal"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Bersihkan Riwayat</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Messages Scroll Area */}
      <GlobalChatMessagesList
        messages={messages}
        onSelectQuickPrompt={handleSelectQuickPrompt}
        isGenerating={isGenerating}
      />

      {/* Bottom Input Area with Floating Autocomplete */}
      <GlobalChatInputBar
        inputText={inputText}
        onInputChange={handleInputChange}
        onSubmit={handleSendMessage}
        isSending={isGenerating}
        autocompleteState={autocompleteState}
        onSelectAutocomplete={handleSelectAutocomplete}
        onCloseAutocomplete={() =>
          setAutocompleteState((prev) => ({ ...prev, isOpen: false }))
        }
        autocompleteItems={autocompleteItems}
        onKeyDownAutocomplete={handleKeyDownAutocomplete}
      />

      {/* Modal Dialogs */}
      <CitationPreviewModal />
      <ClearHistoryConfirmModal onConfirmClear={handleConfirmClearHistory} />
    </div>
  )
}
