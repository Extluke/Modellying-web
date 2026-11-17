import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/features/auth/store/authStore"

export interface UserQuotaStatus {
  tier: string
  tier_name: string
  tier_category: string
  daily_file_limit: number
  files_uploaded_today: number
  remaining_files: number
  daily_token_limit: number
  tokens_used_today: number
  remaining_tokens: number
  days_remaining: number | null
  resets_at: string
  can_upload: boolean
  is_developer: boolean
}

export const USER_QUOTA_QUERY_KEY = ["subscription", "quota-status"] as const

export function useUserQuota() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  const query = useQuery<UserQuotaStatus>({
    queryKey: USER_QUOTA_QUERY_KEY,
    queryFn: async () => {
      return await apiClient.get<UserQuotaStatus>("/subscription/quota-status")
    },
    enabled: !!token,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  })

  const invalidateQuota = () => {
    queryClient.invalidateQueries({ queryKey: USER_QUOTA_QUERY_KEY })
  }

  return {
    ...query,
    quota: query.data,
    invalidateQuota,
  }
}

export interface UserUsageLog {
  id: string
  action_type: string
  amount: number
  reference_id: string | null
  notes: string | null
  created_at: string
}

export const USER_USAGE_LOGS_QUERY_KEY = ["subscription", "usage-logs"] as const

export function useUserUsageLogs(limit: number = 5) {
  const token = useAuthStore((s) => s.token)

  return useQuery<UserUsageLog[]>({
    queryKey: [...USER_USAGE_LOGS_QUERY_KEY, limit],
    queryFn: async () => {
      return await apiClient.get<UserUsageLog[]>(`/subscription/usage-logs?limit=${limit}`)
    },
    enabled: !!token,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  })
}
