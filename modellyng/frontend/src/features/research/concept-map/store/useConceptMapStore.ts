import { create } from "zustand"
import { GapCandidateItem, LimitationNodeData } from "../types/conceptMapTypes"

export type ConceptMapTab = "limitations_map" | "pairwise_panel" | "flowchart_view"

interface ConceptMapState {
  activeWorkspaceTab: ConceptMapTab
  selectedPairId: string | null
  activeGapForDecision: GapCandidateItem | null
  decisionModalOpen: boolean
  mermaidViewMode: "diagram" | "code"
  selectedLimitationNode: LimitationNodeData | null

  // Actions
  setActiveWorkspaceTab: (tab: ConceptMapTab) => void
  setSelectedPairId: (id: string | null) => void
  openDecisionModal: (gap: GapCandidateItem) => void
  closeDecisionModal: () => void
  toggleMermaidViewMode: () => void
  setSelectedLimitationNode: (node: LimitationNodeData | null) => void
  resetStore: () => void
}

export const useConceptMapStore = create<ConceptMapState>((set) => ({
  activeWorkspaceTab: "limitations_map",
  selectedPairId: null,
  activeGapForDecision: null,
  decisionModalOpen: false,
  mermaidViewMode: "diagram",
  selectedLimitationNode: null,

  setActiveWorkspaceTab: (tab) => set({ activeWorkspaceTab: tab }),
  setSelectedPairId: (id) => set({ selectedPairId: id }),
  openDecisionModal: (gap) => set({ activeGapForDecision: gap, decisionModalOpen: true }),
  closeDecisionModal: () => set({ activeGapForDecision: null, decisionModalOpen: false }),
  toggleMermaidViewMode: () =>
    set((state) => ({
      mermaidViewMode: state.mermaidViewMode === "diagram" ? "code" : "diagram",
    })),
  setSelectedLimitationNode: (node) => set({ selectedLimitationNode: node }),
  resetStore: () =>
    set({
      activeWorkspaceTab: "limitations_map",
      selectedPairId: null,
      activeGapForDecision: null,
      decisionModalOpen: false,
      mermaidViewMode: "diagram",
      selectedLimitationNode: null,
    }),
}))
