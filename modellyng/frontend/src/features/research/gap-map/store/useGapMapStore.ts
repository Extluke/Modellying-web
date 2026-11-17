import { create } from "zustand"
import { FlowFilterMode, FlowNodeData } from "../types/flowTypes"

interface GapMapState {
  selectedNode: FlowNodeData | null
  /** Id of the research gap opened in the detail panel (knowledge-graph gap node id). */
  selectedGapId: string | null
  /** Id of the gap whose "Summary Gap & Rekomendasi" dialog is open. */
  summaryGapId: string | null
  filterMode: FlowFilterMode
  isFullscreen: boolean
  hoveredNodeId: string | null

  // Actions
  setSelectedNode: (node: FlowNodeData | null) => void
  setSelectedGapId: (id: string | null) => void
  setSummaryGapId: (id: string | null) => void
  setFilterMode: (mode: FlowFilterMode) => void
  toggleFullscreen: () => void
  setFullscreen: (value: boolean) => void
  setHoveredNodeId: (id: string | null) => void
  resetStore: () => void
}

const INITIAL_STATE = {
  selectedNode: null,
  selectedGapId: null,
  summaryGapId: null,
  filterMode: "all" as FlowFilterMode,
  isFullscreen: false,
  hoveredNodeId: null,
}

export const useGapMapStore = create<GapMapState>((set) => ({
  ...INITIAL_STATE,

  setSelectedNode: (node) => set({ selectedNode: node }),
  setSelectedGapId: (id) => set({ selectedGapId: id }),
  setSummaryGapId: (id) => set({ summaryGapId: id }),
  setFilterMode: (mode) => set({ filterMode: mode }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  setFullscreen: (value) => set({ isFullscreen: value }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  resetStore: () => set(INITIAL_STATE),
}))
