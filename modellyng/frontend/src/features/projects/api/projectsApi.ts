import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"

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

export interface Paper {
  id: string
  title: string
  file_name: string
  file_size_bytes: number
  status: "uploaded" | "validating" | "processing" | "needs_review" | "ready" | "failed"
  total_pages: number
  uploaded_at: string
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

export interface CreatePaperPayload {
  title: string
  file_name: string
  file_size_bytes?: number
  total_pages?: number
  authors?: string[]
  year?: number
}

// -----------------------------------------------------------------------------
// Query Key Factory (TanStack Query Best Practices)
// -----------------------------------------------------------------------------
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: { search?: string; status?: string }) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// -----------------------------------------------------------------------------
// React Query Hooks
// -----------------------------------------------------------------------------

export function useProjects(filters: { search?: string; status?: string } = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
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
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useProjectDetail(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId || ""),
    queryFn: async () => {
      if (!projectId) throw new Error("ID Proyek tidak valid.")
      return apiClient.get<ProjectDetail>(`/projects/${projectId}`)
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 20, // 20 seconds
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      apiClient.post<Project>("/projects", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      apiClient.put<Project>(`/projects/${id}`, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(updated.id) })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useAddPaper(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePaperPayload) =>
      apiClient.post<Paper>(`/projects/${projectId}/papers`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useDeletePaper(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (paperId: string) =>
      apiClient.delete<{ success: boolean; message: string }>(
        `/projects/${projectId}/papers/${paperId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
