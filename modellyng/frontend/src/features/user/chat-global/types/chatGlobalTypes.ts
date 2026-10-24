/**
/**
 * Kontrak tipe data TypeScript untuk modul Asisten Cerdas Global (Global Chat).
 * Meliputi struktur pesan, sitasi naskah, tagging konteks (@proyek & /paper),
 * serta skema penyimpanan riwayat percakapan lokal (localStorage) dengan TTL 24 jam.
 */

export interface CitationItem {
  citation_id: string
  paper_id: string
  paper_title: string
  file_name?: string
  page_number: number
  block_id?: string
  quote: string
}

export interface ContextScopeProject {
  id: string
  name: string
  description?: string | null
}

export interface ContextScopePaper {
  id: string
  title: string
  projectId: string
  projectName?: string
  authors?: string[]
  year?: number | null
}

export interface ContextScopeState {
  project: ContextScopeProject | null
  paper: ContextScopePaper | null
}

export interface GlobalChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  contextScope?: {
    project?: ContextScopeProject
    paper?: ContextScopePaper
  }
  citations?: CitationItem[]
  timestamp: number // Epoch milliseconds
  status?: "sending" | "sent" | "error"
  errorMessage?: string
}

export interface CachedChatSession {
  version: number
  userId: string
  lastPrunedAt: number
  messages: GlobalChatMessage[]
}

export type AutocompleteTriggerType = "project" | "paper"

export interface AutocompleteItem {
  id: string
  type: AutocompleteTriggerType
  title: string
  subtitle?: string
  badgeText?: string
  projectId?: string
  rawItem: ContextScopeProject | ContextScopePaper
}

export interface AutocompleteState {
  isOpen: boolean
  triggerType: AutocompleteTriggerType | null
  query: string
  cursorPosition: number
  triggerIndex: number
  selectedIndex: number
}
