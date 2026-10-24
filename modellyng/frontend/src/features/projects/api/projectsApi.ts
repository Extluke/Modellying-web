import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/features/auth/store/authStore"

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  status: "active" | "archived"
  paper_count: number
  ready_count: number
  created_at: string
  updated_at: string
}

export type PaperStatus =
  | "uploaded"
  | "validating"
  | "processing"
  | "needs_review"
  | "ready"
  | "failed"
  | "needs_confirmation"

export interface PaperCoverage {
  pages_total: number
  pages_readable: number
  unreadable_pages: number[]
  language: string
}

export interface PaperDocType {
  label: string
  paper_confidence: number
  reason: string
}

export interface PaperRunMeta {
  model_used?: string
  parser_version?: string
  prompt_version?: string
  schema_version?: string
}

export interface PaperError {
  code: string
  user_message: string
}

export interface SourceVerificationMetadata {
  doi: string
  title: string
  publisher: string
  journal: string
  issn: string
  year: string
  volume?: string
  issue?: string
  page?: string
  citations_count?: number
  resource_type?: string
  is_registered?: boolean
}

export interface SourceVerificationData {
  verified_at: string
  doi: string
  is_valid: boolean
  trust_score: number
  trust_verdict: string
  indexation_badges: string[]
  metadata: SourceVerificationMetadata
  summary: string
}

export interface Paper {
  id: string
  title: string
  file_name: string
  file_size_bytes: number
  total_pages: number
  sha256?: string | null
  status: PaperStatus
  stage?: string | null
  stage_detail?: {
    attempt?: number
    next_retry_at?: string | null
    current_batch?: number
    total_batches?: number
    batch_name?: string
  } | null
  error?: PaperError | null
  warnings?: string[]
  coverage?: PaperCoverage | null
  doc_type?: PaperDocType | null
  run?: PaperRunMeta | null
  doi?: string | null
  authors?: string[]
  year?: number | null
  journal?: string | null
  source_verification?: SourceVerificationData | null
  uploaded_at: string
  updated_at?: string | null
}


export interface ProjectDetail extends Project {
  papers: Paper[]
}

export interface CreateProjectPayload {
  name: string
  description?: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status?: "active" | "archived"
}

export interface ConfirmPaperPayload {
  action: "proceed" | "discard"
}

export interface EvidenceItem {
  block_id?: string
  page_index: number
  page_label?: string
  quote: string
  bbox?: [number, number, number, number]
}

export interface ExtractedComponent {
  id: string
  paper_id: string
  parameter_key: string
  parameter_version: number
  label: { id?: string; en?: string }
  group_name: string
  tab_group?: "konteks_masalah" | "metode_data" | "hasil_gap" | string
  instruction: string
  sort_order: number
  state: "found" | "not_found" | "not_applicable"
  value: { text?: string; [key: string]: unknown }
  evidence: EvidenceItem[]
  confidence_score: number | null
  status: "needs_review" | "accepted" | "edited" | "rejected"
  reviewer_notes?: string | null
  created_at: string
  updated_at: string
}

export interface TextBlock {
  block_id: string
  page_number: number
  page_label?: string
  bbox: [number, number, number, number]
  text: string
}

export interface ReviewQueueItem {
  id: string
  paper_id: string
  paper_title: string
  file_name: string
  parameter_key: string
  label: { id?: string; en?: string }
  group_name: string
  value: { text?: string; [key: string]: unknown }
  evidence: EvidenceItem[]
  confidence_score: number
  status: "needs_review" | "accepted" | "edited" | "rejected"
  model_used: string
  updated_at: string
}

export interface UpdateComponentPayload {
  status?: "needs_review" | "accepted" | "edited" | "rejected"
  value?: { text?: string; [key: string]: unknown }
  reviewer_notes?: string
}

export interface CitationItem {
  citation_id: string
  paper_id: string
  paper_title: string
  file_name: string
  page_number: number
  block_id: string
  bbox: [number, number, number, number]
  quote: string
}

export interface ChatResponse {
  answer: string
  citations: CitationItem[]
}

export interface ChatMessageHistoryItem {
  id: string
  role: "user" | "assistant"
  content: string
  citations: CitationItem[]
  created_at: string
}

export interface MatrixCell {
  id: string
  state: "found" | "not_found" | "not_applicable"
  value: { text?: string; [key: string]: unknown }
  evidence: EvidenceItem[]
  confidence_score: number
  status: "needs_review" | "accepted" | "edited" | "rejected"
}

export interface MatrixParameter {
  key: string
  label: { id?: string; en?: string }
  group_name: string
  tab_group?: string
  sort_order: number
  instruction: string
}

export interface MatrixPaper {
  id: string
  title: string
  authors: string[]
  year?: number | null
  status: string
  total_pages: number
}

export interface ComparativeMatrixResponse {
  project_id: string
  project_name: string
  parameters: MatrixParameter[]
  papers: MatrixPaper[]
  matrix: Record<string, Record<string, MatrixCell>>
}

// -----------------------------------------------------------------------------
// Query Key Factory (TanStack Query Best Practices)
// -----------------------------------------------------------------------------
export const projectKeys = {
  all: (userId?: string) => ["projects", userId ?? "anonymous"] as const,
  lists: (userId?: string) => [...projectKeys.all(userId), "list"] as const,
  list: (userId: string | undefined, filters: { search?: string; status?: string }) =>
    [...projectKeys.lists(userId), filters] as const,
  details: (userId?: string) => [...projectKeys.all(userId), "detail"] as const,
  detail: (userId: string | undefined, id: string) => [...projectKeys.details(userId), id] as const,
  components: (userId: string | undefined, projectId: string, paperId: string) =>
    [...projectKeys.detail(userId, projectId), "papers", paperId, "components"] as const,
  blocks: (userId: string | undefined, projectId: string, paperId: string) =>
    [...projectKeys.detail(userId, projectId), "papers", paperId, "blocks"] as const,
  pdf: (userId: string | undefined, projectId: string, paperId: string) =>
    [...projectKeys.detail(userId, projectId), "papers", paperId, "pdf"] as const,
  reviewQueue: (userId: string | undefined, projectId: string) =>
    [...projectKeys.detail(userId, projectId), "review-queue"] as const,
  chat: (userId: string | undefined, projectId: string) =>
    [...projectKeys.detail(userId, projectId), "chat"] as const,
  matrix: (userId: string | undefined, projectId: string) =>
    [...projectKeys.detail(userId, projectId), "matrix"] as const,
}

// -----------------------------------------------------------------------------
// React Query Hooks
// -----------------------------------------------------------------------------

export function useProjects(filters: { search?: string; status?: string } = {}) {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useQuery({
    queryKey: projectKeys.list(userId, filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search?.trim()) {
        params.append("search", filters.search.trim())
      }
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status)
      }
      const queryStr = params.toString() ? `?${params.toString()}` : ""
      return apiClient.get<Project[]>(`/projects${queryStr}`)
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 10, // 10 seconds
  })
}

export function useProjectDetail(projectId: string | undefined) {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useQuery({
    queryKey: projectKeys.detail(userId, projectId || ""),
    queryFn: async () => {
      if (!projectId) throw new Error("ID Proyek tidak valid.")
      return apiClient.get<ProjectDetail>(`/projects/${projectId}`)
    },
    enabled: Boolean(projectId) && Boolean(userId),
    staleTime: 1000 * 5,
    // Smart Polling: 3s refetch interval ONLY IF any paper is active (validating / processing)
    refetchInterval: (query) => {
      const papers = query.state.data?.papers || []
      const hasActive = papers.some((p) => ["validating", "processing"].includes(p.status))
      return hasActive ? 3000 : false
    },
    refetchIntervalInBackground: false, // Pauses polling when browser tab is hidden
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      apiClient.post<Project>("/projects", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      apiClient.put<Project>(`/projects/${id}`, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(userId, updated.id) })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) })
    },
  })
}

export function useDeletePaper(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: (paperId: string) =>
      apiClient.delete<{ success: boolean; message: string }>(
        `/projects/${projectId}/papers/${paperId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(userId, projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) })
    },
  })
}

export function useProcessPaper(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: ({ paperId, force = false }: { paperId: string; force?: boolean }) =>
      apiClient.post<Paper>(`/projects/${projectId}/papers/${paperId}/process?force=${force}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(userId, projectId) })
    },
  })
}

export function useConfirmPaper(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: ({ paperId, action }: { paperId: string; action: "proceed" | "discard" }) =>
      apiClient.post<Paper>(`/projects/${projectId}/papers/${paperId}/confirm`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(userId, projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) })
    },
  })
}

export function usePaperComponents(projectId: string | undefined, paperId: string | undefined) {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useQuery({
    queryKey: projectKeys.components(userId, projectId || "", paperId || ""),
    queryFn: async () => {
      if (!projectId || !paperId) throw new Error("Parameter proyek dan paper tidak valid.")
      return apiClient.get<ExtractedComponent[]>(`/projects/${projectId}/papers/${paperId}/components`)
    },
    enabled: Boolean(projectId) && Boolean(paperId) && Boolean(userId),
    staleTime: 1000 * 15,
  })
}

export function usePaperBlocks(projectId: string | undefined, paperId: string | undefined) {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useQuery({
    queryKey: projectKeys.blocks(userId, projectId || "", paperId || ""),
    queryFn: async () => {
      if (!projectId || !paperId) throw new Error("Parameter proyek dan paper tidak valid.")
      return apiClient.get<TextBlock[]>(`/projects/${projectId}/papers/${paperId}/blocks`)
    },
    enabled: Boolean(projectId) && Boolean(paperId) && Boolean(userId),
    staleTime: 1000 * 60,
  })
}

export function usePaperPdf(projectId: string | undefined, paperId: string | undefined) {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useQuery({
    queryKey: projectKeys.pdf(userId, projectId || "", paperId || ""),
    queryFn: async ({ signal }) => {
      if (!projectId || !paperId) throw new Error("Parameter proyek dan paper tidak valid.")
      return apiClient.getArrayBuffer(
        `/projects/${projectId}/papers/${paperId}/pdf`,
        { signal }
      )
    },
    enabled: Boolean(projectId) && Boolean(paperId) && Boolean(userId),
    staleTime: 10 * 60 * 1000, // 10 menit in-memory cache
    gcTime: 15 * 60 * 1000,    // 15 menit garbage collector retention
    refetchOnWindowFocus: false, // Menghindari refetch biner berat saat pindah tab browser
    retry: 2,
  })
}

export function useProjectReviewQueue(projectId: string | undefined, threshold = 0.8) {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useQuery({
    queryKey: projectKeys.reviewQueue(userId, projectId || ""),
    queryFn: async () => {
      if (!projectId) throw new Error("ID Proyek tidak valid.")
      return apiClient.get<ReviewQueueItem[]>(`/projects/${projectId}/review-queue?threshold=${threshold}`)
    },
    enabled: Boolean(projectId) && Boolean(userId),
    staleTime: 1000 * 10,
  })
}

export function useUpdateComponent(projectId: string, paperId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: ({
      componentKey,
      payload,
    }: {
      componentKey: string
      payload: UpdateComponentPayload
    }) =>
      apiClient.patch<ExtractedComponent>(
        `/projects/${projectId}/papers/${paperId}/components/${componentKey}`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.components(userId, projectId, paperId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.reviewQueue(userId, projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(userId, projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) })
    },
  })
}

export function useProjectChatHistory(projectId: string | undefined) {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useQuery({
    queryKey: projectKeys.chat(userId, projectId || ""),
    queryFn: async () => {
      if (!projectId) throw new Error("ID Proyek tidak valid.")
      return apiClient.get<ChatMessageHistoryItem[]>(`/projects/${projectId}/chat`)
    },
    enabled: Boolean(projectId) && Boolean(userId),
    staleTime: 1000 * 15,
  })
}

export function useSendProjectChatMessage(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: (message: string) =>
      apiClient.post<ChatResponse>(`/projects/${projectId}/chat`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.chat(userId, projectId) })
    },
  })
}

export function useComparativeMatrix(projectId: string | undefined) {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useQuery({
    queryKey: projectKeys.matrix(userId, projectId || ""),
    queryFn: async () => {
      if (!projectId) throw new Error("ID Proyek tidak valid.")
      return apiClient.get<ComparativeMatrixResponse>(`/projects/${projectId}/comparative-matrix`)
    },
    enabled: Boolean(projectId) && Boolean(userId),
    staleTime: 1000 * 30, // 30s cache
  })
}

export function useBulkAcceptReviews(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: () =>
      apiClient.post<{ success: boolean; message: string }>(
        `/projects/${projectId}/review-queue/bulk-accept`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(userId, projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.reviewQueue(userId, projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) })
    },
  })
}

export interface ComponentAiRevisePayload {
  user_instruction: string
  current_text: string
  history?: Array<{ role: string; content: string }>
}

export interface ComponentAiReviseResult {
  revised_text: string
  explanation?: string
}

export function useReviseComponentAi(projectId: string, paperId: string) {
  return useMutation({
    mutationFn: ({
      componentKey,
      payload,
    }: {
      componentKey: string
      payload: ComponentAiRevisePayload
    }) =>
      apiClient.post<ComponentAiReviseResult>(
        `/projects/${projectId}/papers/${paperId}/components/${componentKey}/ai-revise`,
        payload
      ),
  })
}

// ==============================================================================
// EXPORT SYNTHESIS MATRIX API
// ==============================================================================

export async function downloadProjectExport(
  projectId: string,
  format: "pdf" | "csv" | "xlsx",
  projectName: string
): Promise<void> {
  const token = localStorage.getItem("modellyng_token")
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
  const url = `${base}/projects/${projectId}/export?format=${format}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    let errMsg = "Gagal mengunduh berkas sintesis riset."
    try {
      const err = await response.json()
      errMsg = err.detail || errMsg
    } catch {
      // ignore
    }
    throw new Error(errMsg)
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = downloadUrl
  const cleanName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_")
  const dateStr = new Date().toISOString().slice(0, 10)
  a.download = `Modellyng_${cleanName}_${dateStr}.${format}`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(a)
}

// ==============================================================================
// SOURCE VERIFICATION HOOKS
// ==============================================================================

export interface SourceVerificationResponse {
  paper_id: string
  doi: string
  source_verification: SourceVerificationData | null
  is_verified: boolean
  status: string
}

export interface VerifySourceResult {
  already_verified: boolean
  verification: SourceVerificationData
  message: string
}

export function usePaperSourceVerification(projectId?: string, paperId?: string) {
  return useQuery({
    queryKey: ["projects", projectId, "papers", paperId, "source-verification"],
    queryFn: () =>
      apiClient.get<SourceVerificationResponse>(
        `/projects/${projectId}/papers/${paperId}/source-verification`
      ),
    enabled: Boolean(projectId && paperId),
    staleTime: 1000 * 60,
  })
}

export function useVerifyPaperSource(projectId: string, paperId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const userId = user?.id

  return useMutation({
    mutationFn: (doi?: string) =>
      apiClient.post<VerifySourceResult>(
        `/projects/${projectId}/papers/${paperId}/verify-source`,
        { doi }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "papers", paperId, "source-verification"],
      })
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(userId, projectId),
      })
      queryClient.invalidateQueries({
        queryKey: projectKeys.lists(userId),
      })
    },
  })
}


