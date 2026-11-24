import React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { AppToastContainer } from "@/components/ui/app-toast"
import { AuthSessionBootstrap } from "@/components/auth/AuthSessionBootstrap"

interface AppProvidersProps {
  children: React.ReactNode
}

/**
 * Global AppProviders wrapper.
 * Injects TanStack Query client, session hydration, and global notifications.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBootstrap />
      {children}
      <AppToastContainer />
    </QueryClientProvider>
  )
}
