import { apiClient } from "./client"

export type UserRole = "researcher" | "admin"
export type UserStatus = "active" | "suspended" | "deactivated"
export type SubscriptionTier =
  | "free"
  | "pro"
  | "student_14"
  | "student_30"
  | "enterprise"
  | "developer"

export interface User {
  id: string
  full_name: string
  email: string
  role: UserRole | string
  subscription_tier?: SubscriptionTier | string
  institution?: string | null
  status?: UserStatus
  email_verified?: boolean
  citation_format?: string
  ai_confidence_threshold?: number
  admin_role?: string | null
  created_at: string
}

export interface AuthResponse {
  token: string
  token_type: string
  expires_at?: string | null
  user: User
}

export interface RegisterResponse {
  requires_verification: boolean
  message: string
  email: string
  expires_in_seconds: number
  resend_cooldown_seconds: number
  delivery_channel: string
  dev_verification_code?: string | null
  dev_verification_url?: string | null
  user: User
}

export type VerifyEmailPayload =
  | { token: string }
  | { email: string; code: string }

export interface VerifyEmailResponse {
  success: boolean
  verified: boolean
  email: string
  message: string
}

export interface ResendVerificationPayload {
  email: string
}

export interface MessageResponse {
  success: boolean
  message: string
  details?: string
}

export interface ResendVerificationResponse extends MessageResponse {
  resend_cooldown_seconds?: number
  expires_in_seconds?: number
  delivery_channel?: string | null
  dev_verification_code?: string | null
  dev_verification_url?: string | null
}

export interface LoginPayload {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterPayload {
  full_name: string
  email: string
  institution?: string
  password: string
  confirm_password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  new_password: string
  confirm_password: string
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>("/auth/login", payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResponse>("/auth/register", payload),

  verifyEmail: (payload: VerifyEmailPayload) =>
    apiClient.post<VerifyEmailResponse>("/auth/verify-email", payload),

  resendVerification: (payload: ResendVerificationPayload) =>
    apiClient.post<ResendVerificationResponse>("/auth/resend-verification", payload),

  logout: () => apiClient.post<MessageResponse>("/auth/logout"),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<MessageResponse>("/auth/forgot-password", payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<MessageResponse>("/auth/reset-password", payload),

  getMe: () => apiClient.get<User>("/auth/me"),
}
