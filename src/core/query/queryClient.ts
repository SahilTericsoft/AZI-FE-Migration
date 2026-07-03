/**
 * React Query client factory.
 *
 * Server state lives in React Query (replacing the old redux-saga + useFetch
 * machinery). One client is created per browser session by the Providers tree.
 */

import { QueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/core/api/types";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 min — tune per query as needed
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          // Don't retry auth / client errors; do retry transient server errors.
          const status = (error as unknown as ApiError)?.status ?? 0;
          if (status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
