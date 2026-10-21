import { QueryClient } from "@tanstack/react-query"

/**
 * Global TanStack QueryClient instance configured according to best practices:
 * - staleTime: 5 minutes (prevents aggressive refetching)
 * - gcTime: 30 minutes (retains cached data for smooth navigation)
 * - refetchOnWindowFocus: false (avoids disruptive layout shifts during reading)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        // Do not retry 4xx client errors (401, 403, 404, etc.)
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof (error as { status: unknown }).status === "number"
        ) {
          const status = (error as { status: number }).status
          if (status >= 400 && status < 500) {
            return false
          }
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: 1,
    },
  },
})
