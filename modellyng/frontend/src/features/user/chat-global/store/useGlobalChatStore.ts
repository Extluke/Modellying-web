import { create } from "zustand"
import {
  ContextScopeProject,
  ContextScopePaper,
  ContextScopeState,
  CitationItem,
} from "../types/chatGlobalTypes"

interface GlobalChatUIState {
  // Konteks tagging aktif (@proyek dan /paper)
  activeContextScope: ContextScopeState
  setContextProject: (project: ContextScopeProject | null) => void
  setContextPaper: (paper: ContextScopePaper | null) => void
  clearContextScope: () => void

  // Modal pratinjau bukti sitasi [S#]
  activeCitationForModal: CitationItem | null
  openCitationModal: (citation: CitationItem) => void
  closeCitationModal: () => void

  // Modal konfirmasi pembersihan riwayat lokal
  clearHistoryModalOpen: boolean
  setClearHistoryModalOpen: (open: boolean) => void

  // Status proses generasi AI
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void

  // Reset store ke kondisi awal
  resetStore: () => void
}

const initialContextScope: ContextScopeState = {
  project: null,
  paper: null,
}

export const useGlobalChatStore = create<GlobalChatUIState>((set) => ({
  activeContextScope: initialContextScope,

  setContextProject: (project) =>
    set((state) => {
      // Jika proyek berganti, reset paper jika paper sebelumnya bukan bagian dari proyek baru
      const shouldResetPaper =
        project && state.activeContextScope.paper && state.activeContextScope.paper.projectId !== project.id
      return {
        activeContextScope: {
          project,
          paper: shouldResetPaper ? null : state.activeContextScope.paper,
        },
      }
    }),

  setContextPaper: (paper) =>
    set((state) => ({
      activeContextScope: {
        ...state.activeContextScope,
        paper,
      },
    })),

  clearContextScope: () =>
    set({
      activeContextScope: initialContextScope,
    }),

  activeCitationForModal: null,
  openCitationModal: (citation) => set({ activeCitationForModal: citation }),
  closeCitationModal: () => set({ activeCitationForModal: null }),

  clearHistoryModalOpen: false,
  setClearHistoryModalOpen: (open) => set({ clearHistoryModalOpen: open }),

  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),

  resetStore: () =>
    set({
      activeContextScope: initialContextScope,
      activeCitationForModal: null,
      clearHistoryModalOpen: false,
      isGenerating: false,
    }),
}))
