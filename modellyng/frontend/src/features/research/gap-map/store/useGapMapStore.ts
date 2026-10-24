import { create } from "zustand"
import { FlowFilterMode, FlowNodeData } from "../types/flowTypes"

interface GapMapState {
  selectedNode: FlowNodeData | null
  filterMode: FlowFilterMode
  isFullscreen: boolean
  activeWorkspaceTab: "canvas" | "list"
  hoveredNodeId: string | null

  // Actions
  setSelectedNode: (node: FlowNodeData | null) => void
  setFilterMode: (mode: FlowFilterMode) => void
  toggleFullscreen: () => void
  setFullscreen: (value: boolean) => void
  setActiveWorkspaceTab: (tab: "canvas" | "list") => void
  setHoveredNodeId: (id: string | null) => void
  resetStore: () => void
}

export const useGapMapStore = create<GapMapState>((set) => ({
  selectedNode: null,
  filterMode: "all",
  isFullscreen: false,
  activeWorkspaceTab: "canvas",
  hoveredNodeId: null,

  setSelectedNode: (node) => set({ selectedNode: node }),
  setFilterMode: (mode) => set({ filterMode: mode }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  setFullscreen: (value) => set({ isFullscreen: value }),
  setActiveWorkspaceTab: (tab) => set({ activeWorkspaceTab: tab }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  resetStore: () =>
    set({
      selectedNode: null,
      filterMode: "all",
      isFullscreen: false,
      activeWorkspaceTab: "canvas",
      hoveredNodeId: null,
    }),
}))
