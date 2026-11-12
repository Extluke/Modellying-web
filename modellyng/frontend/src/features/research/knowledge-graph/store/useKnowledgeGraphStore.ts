import { create } from "zustand"
import type { GraphNodeKind, GraphZoneKey } from "../types/knowledgeGraphTypes"

interface KnowledgeGraphUiState {
  /** Node whose detail panel is open. */
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void

  zoneFilter: "all" | GraphZoneKey
  setZoneFilter: (zone: "all" | GraphZoneKey) => void

  kindFilter: "all" | GraphNodeKind
  setKindFilter: (kind: "all" | GraphNodeKind) => void

  query: string
  setQuery: (query: string) => void

  isFullscreen: boolean
  toggleFullscreen: () => void
  setFullscreen: (fullscreen: boolean) => void

  /** Back to the default view. Called when another project is opened. */
  reset: () => void
}

const initialState = {
  selectedNodeId: null,
  zoneFilter: "all" as const,
  kindFilter: "all" as const,
  query: "",
  isFullscreen: false,
}

export const useKnowledgeGraphStore = create<KnowledgeGraphUiState>((set) => ({
  ...initialState,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setZoneFilter: (zone) => set({ zoneFilter: zone }),
  setKindFilter: (kind) => set({ kindFilter: kind }),
  setQuery: (query) => set({ query }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  reset: () => set(initialState),
}))
