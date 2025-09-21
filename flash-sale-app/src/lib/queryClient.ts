import type { ApiError } from '@/types/Type';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds after data is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Time in milliseconds that unused/inactive cache data remains in memory
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests
      retry: (failureCount, error: unknown) => {
        const apiError = error as ApiError;
        // Don't retry on 4xx errors (client errors)
        if (apiError?.status >= 400 && apiError?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations
      retry: (failureCount, error: unknown) => {
        const apiError = error as ApiError;
        // Don't retry on 4xx errors (client errors)
        if (apiError?.status >= 400 && apiError?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
  // Add more query keys as needed for other features
} as const;