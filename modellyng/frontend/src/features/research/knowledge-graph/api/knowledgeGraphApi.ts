import { useMutation } from "@tanstack/react-query"
import { apiClient, type ApiError } from "@/lib/api/client"
import type {
  AiResearchSynthesis,
  SynthesizeGraphNodesPayload,
} from "../types/knowledgeGraphTypes"

/**
 * Drafts thesis titles, research questions and a novelty statement from the selected graph nodes
 * (mobile: "Buat Rumusan Masalah (AI)" on a research-gap node).
 */
export function useSynthesizeGraphNodes(projectId: string) {
  return useMutation<AiResearchSynthesis, ApiError, SynthesizeGraphNodesPayload>({
    mutationFn: (payload) =>
      apiClient.post<AiResearchSynthesis>(`/projects/${projectId}/knowledge-graph/synthesize`, payload),
  })
}
