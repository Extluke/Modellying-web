import React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"

interface AppProvidersProps {
  children: React.ReactNode
}

/**
 * Global AppProviders wrapper.
 * Injects TanStack Query client, theme state, and global error boundaries.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
