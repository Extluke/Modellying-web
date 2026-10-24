import { create } from "zustand"
import {
  KnowledgeGraphNodeData,
  KnowledgeNodeType,
  SaturationZone,
} from "../types/knowledgeGraphTypes"

interface KnowledgeGraphState {
  // Simpul terpilih untuk rincian naskah dan bukti
  selectedNode: KnowledgeGraphNodeData | null
  setSelectedNode: (node: KnowledgeGraphNodeData | null) => void

  // Filter Zona Saturasi ("all" | "low" | "medium" | "high")
  selectedZoneFilter: "all" | SaturationZone
  setSelectedZoneFilter: (zone: "all" | SaturationZone) => void

  // Filter Jenis Simpul ("all" | "concept" | "variable" | "method" | "dataset" | "research_gap")
  selectedTypeFilter: "all" | KnowledgeNodeType
  setSelectedTypeFilter: (type: "all" | KnowledgeNodeType) => void

  // Mode Layar Penuh (Fullscreen Canvas)
  isFullscreen: boolean
  setIsFullscreen: (fullscreen: boolean) => void
  toggleFullscreen: () => void

  // Drawer Rincian Simpul Samping
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void

  // Reset Store ke Pengaturan Awal
  resetStore: () => void
}

export const useKnowledgeGraphStore = create<KnowledgeGraphState>((set) => ({
  selectedNode: null,
  setSelectedNode: (node) =>
    set({
      selectedNode: node,
      isDrawerOpen: Boolean(node),
    }),

  selectedZoneFilter: "all",
  setSelectedZoneFilter: (zone) => set({ selectedZoneFilter: zone }),

  selectedTypeFilter: "all",
  setSelectedTypeFilter: (type) => set({ selectedTypeFilter: type }),

  isFullscreen: false,
  setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

  isDrawerOpen: false,
  setIsDrawerOpen: (open) => set({ isDrawerOpen: open }),

  resetStore: () =>
    set({
      selectedNode: null,
      selectedZoneFilter: "all",
      selectedTypeFilter: "all",
      isFullscreen: false,
      isDrawerOpen: false,
    }),
}))
