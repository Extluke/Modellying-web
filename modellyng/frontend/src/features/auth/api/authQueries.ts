import { useMutation, useQuery } from "@tanstack/react-query"
import {
  authApi,
  type ForgotPasswordPayload,
  type LoginPayload,
  type MessageResponse,
  type RegisterPayload,
  type ResetPasswordPayload,
  type User,
} from "@/lib/api/auth"
import { useAuthStore } from "@/features/auth/store/authStore"

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
} as const

export function useLoginMutation() {
  return useMutation<User, unknown, LoginPayload>({
    mutationFn: (payload) => useAuthStore.getState().login(payload),
    retry: false,
  })
}

export function useRegisterMutation() {
  return useMutation<User, unknown, RegisterPayload>({
    mutationFn: (payload) => useAuthStore.getState().register(payload),
    retry: false,
  })
}

export function useForgotPasswordMutation() {
  return useMutation<MessageResponse, unknown, ForgotPasswordPayload>({
    mutationFn: (payload) => authApi.forgotPassword(payload),
    retry: false,
  })
}

export function useResetPasswordMutation() {
  return useMutation<MessageResponse, unknown, ResetPasswordPayload>({
    mutationFn: (payload) => authApi.resetPassword(payload),
    retry: false,
  })
}

export function useCurrentUserQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery<User>({
    queryKey: authKeys.me(),
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })
}
