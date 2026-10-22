import { apiClient } from "./client"

export interface User {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

export interface AuthResponse {
  token: string
  token_type: string
  user: User
}

export interface MessageResponse {
  success: boolean
  message: string
  details?: string
}

export interface LoginPayload {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterPayload {
  full_name: string
  email: string
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
    apiClient.post<AuthResponse>("/auth/register", payload),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<MessageResponse>("/auth/forgot-password", payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<MessageResponse>("/auth/reset-password", payload),

  getMe: () => apiClient.get<User>("/auth/me"),
}
