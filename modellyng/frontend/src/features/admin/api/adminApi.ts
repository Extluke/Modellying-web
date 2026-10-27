import { apiClient } from "@/lib/api/client"

// ==============================================================================
// TYPES DEFINITION FOR 6 ADMIN JOBS
// ==============================================================================

// --- JOB 1: DASBOR METRIK ---
export interface AdminActivityItem {
  id: string
  event_type: string
  title: string
  description: string
  timestamp: string
}

export interface PlanDistributionItem {
  code: string
  name: string
  subscriber_count: number
  percentage: number
}

export interface AdminDashboardMetrics {
  total_users: number
  subscribed_users_count: number
  free_users_count: number
  subscribed_ratio_percent: number
  total_revenue_idr: number
  plan_distribution: PlanDistributionItem[]
  total_projects: number
  total_papers: number
  total_extracted_components: number
  papers_by_status: Record<string, number>
  worker_queue_load: string
  redis_status: string
  estimated_tokens_today: string
  recent_activity: AdminActivityItem[]
}

// --- JOB 2: PENGGUNA & LAPORAN BUG ---
export interface AdminUserItem {
  id: string
  email: string
  full_name: string
  institution: string | null
  role: string
  status: "active" | "suspended" | "deactivated"
  suspension_reason: string | null
  subscription_tier: string
  citation_format: string
  total_projects: number
  total_papers: number
  created_at: string
  updated_at: string
}

export interface AdminUserListResponse {
  users: AdminUserItem[]
  total: number
  page: number
  page_size: number
}

export interface AdminBugReportItem {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  title: string
  description: string
  page_url: string | null
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "investigating" | "resolved" | "closed"
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
}

// --- JOB 3: SUBSCRIPTION PLANS CMS ---
export interface SubscriptionPlanItem {
  id: string
  code: string
  name: string
  description: string | null
  price: number
  currency: string
  billing_period: "free" | "monthly" | "annual" | "lifetime"
  paper_limit_per_month: number
  ai_query_limit_per_day: number
  features: string[]
  is_active: boolean
  is_popular: boolean
  sort_order: number
  active_subscribers_count: number
  created_at: string
  updated_at: string
}

export interface SubscriptionPlanCreateData {
  code: string
  name: string
  description?: string
  price: number
  currency?: string
  billing_period?: string
  paper_limit_per_month?: number
  ai_query_limit_per_day?: number
  features: string[]
  is_active?: boolean
  is_popular?: boolean
  sort_order?: number
}

// --- JOB 4: CMS PENGUMUMAN & PROMO ---
export interface AnnouncementItem {
  id: string
  title: string
  content: string
  summary: string | null
  category: "promo" | "info" | "update" | "terms" | "program"
  badge_text: string | null
  banner_url: string | null
  target_role: "all" | "researcher" | "subscribed_only"
  status: "draft" | "scheduled" | "published" | "archived"
  scheduled_at: string | null
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AnnouncementCreateData {
  title: string
  content: string
  summary?: string
  category: string
  badge_text?: string
  banner_url?: string
  target_role?: string
  status: string
  scheduled_at?: string
}

// --- JOB 5: DYNAMIC API CONFIGURATION ---
export interface ApiConfigItem {
  id: string
  provider: "gemini" | "groq" | "openai" | "anthropic"
  display_name: string
  model_name: string
  api_key_masked: string
  priority: number
  rpm_limit: number
  tpm_limit: number
  is_active: boolean
  status: "operational" | "rate_limited" | "invalid_key" | "unconfigured"
  last_tested_at: string | null
  last_latency_ms: number | null
  updated_at: string
}

export interface ApiConfigUpdateData {
  display_name?: string
  model_name?: string
  api_key?: string
  priority?: number
  rpm_limit?: number
  tpm_limit?: number
  is_active?: boolean
}

export interface ApiConfigTestResult {
  provider: string
  success: boolean
  latency_ms: number
  status: string
  message: string
}

// --- JOB 6: MULTI-ADMIN & AUDIT LOGS ---
export interface AdminAccountItem {
  id: string
  email: string
  full_name: string
  institution: string | null
  admin_role: "super_admin" | "support_admin" | "content_admin" | "admin"
  admin_permissions: string[]
  created_at: string
  updated_at: string
}

export interface AdminAccountCreateData {
  email: string
  full_name: string
  password: string
  institution?: string
  admin_role: string
  admin_permissions: string[]
}

export interface AdminAuditLogItem {
  id: string
  admin_id: string | null
  admin_email: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export interface AdminActionResponse {
  success: boolean
  message: string
}

// ==============================================================================
// ADMIN API CLIENT SERVICE
// ==============================================================================
export const adminApi = {
  // Job 1
  getDashboardMetrics: () =>
    apiClient.get<AdminDashboardMetrics>("/admin/dashboard/metrics"),

  // Job 2
  getUsers: (params?: { search?: string; role?: string; status?: string; page?: number; page_size?: number }) => {
    const q = new URLSearchParams()
    if (params?.search) q.append("search", params.search)
    if (params?.role) q.append("role", params.role)
    if (params?.status) q.append("status", params.status)
    if (params?.page) q.append("page", String(params.page))
    if (params?.page_size) q.append("page_size", String(params.page_size))
    const queryStr = q.toString() ? `?${q.toString()}` : ""
    return apiClient.get<AdminUserListResponse>(`/admin/users${queryStr}`)
  },

  updateUserStatus: (userId: string, data: { status: string; suspension_reason?: string | null }) =>
    apiClient.patch<AdminActionResponse>(`/admin/users/${userId}/status`, data),

  updateUserRole: (userId: string, data: { role: string }) =>
    apiClient.patch<AdminUserItem>(`/admin/users/${userId}/role`, data),

  resetUserPassword: (userId: string, data: { new_password: string }) =>
    apiClient.post<AdminActionResponse>(`/admin/users/${userId}/reset-password`, data),

  deleteUser: (userId: string) =>
    apiClient.delete<AdminActionResponse>(`/admin/users/${userId}`),

  getBugReports: (statusFilter?: string) => {
    const q = statusFilter ? `?status_filter=${statusFilter}` : ""
    return apiClient.get<AdminBugReportItem[]>(`/admin/bug-reports${q}`)
  },

  updateBugReport: (bugId: string, data: { status: string; admin_notes?: string | null }) =>
    apiClient.patch<AdminActionResponse>(`/admin/bug-reports/${bugId}`, data),

  // Job 3
  getSubscriptionPlans: () =>
    apiClient.get<SubscriptionPlanItem[]>("/admin/subscriptions/plans"),

  createSubscriptionPlan: (data: SubscriptionPlanCreateData) =>
    apiClient.post<SubscriptionPlanItem>("/admin/subscriptions/plans", data),

  updateSubscriptionPlan: (planId: string, data: Partial<SubscriptionPlanCreateData>) =>
    apiClient.put<SubscriptionPlanItem>(`/admin/subscriptions/plans/${planId}`, data),

  deleteSubscriptionPlan: (planId: string) =>
    apiClient.delete<AdminActionResponse>(`/admin/subscriptions/plans/${planId}`),

  // Job 4
  getAnnouncements: (params?: { category?: string; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.category) q.append("category", params.category)
    if (params?.status) q.append("status", params.status)
    const queryStr = q.toString() ? `?${q.toString()}` : ""
    return apiClient.get<AnnouncementItem[]>(`/admin/cms/announcements${queryStr}`)
  },

  createAnnouncement: (data: AnnouncementCreateData) =>
    apiClient.post<AnnouncementItem>("/admin/cms/announcements", data),

  updateAnnouncement: (id: string, data: Partial<AnnouncementCreateData>) =>
    apiClient.put<AnnouncementItem>(`/admin/cms/announcements/${id}`, data),

  deleteAnnouncement: (id: string) =>
    apiClient.delete<AdminActionResponse>(`/admin/cms/announcements/${id}`),

  getActiveAnnouncements: () =>
    apiClient.get<AnnouncementItem[]>("/announcements/active"),

  // Job 5
  getApiConfigs: () =>
    apiClient.get<ApiConfigItem[]>("/admin/api-config"),

  updateApiConfig: (provider: string, data: ApiConfigUpdateData) =>
    apiClient.put<ApiConfigItem>(`/admin/api-config/${provider}`, data),

  testApiConfig: (provider: string) =>
    apiClient.post<ApiConfigTestResult>(`/admin/api-config/${provider}/test`),

  // Job 6
  getAdminAccounts: () =>
    apiClient.get<AdminAccountItem[]>("/admin/admins"),

  createAdminAccount: (data: AdminAccountCreateData) =>
    apiClient.post<AdminAccountItem>("/admin/admins", data),

  updateAdminAccount: (adminId: string, data: { full_name?: string; admin_role?: string; admin_permissions?: string[] }) =>
    apiClient.patch<AdminAccountItem>(`/admin/admins/${adminId}`, data),

  deleteAdminAccount: (adminId: string) =>
    apiClient.delete<AdminActionResponse>(`/admin/admins/${adminId}`),

  getAuditLogs: (limit = 50) =>
    apiClient.get<AdminAuditLogItem[]>(`/admin/audit-logs?limit=${limit}`),
}
