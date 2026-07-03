"use client";

/**
 * Client provider tree for the whole app:
 *   - QueryClientProvider — React Query (server-state)
 *   - TooltipProvider — Radix tooltips
 *   - AuthProvider — session/ACL
 *   - Toaster — shadcn/sonner notifications
 *
 * One QueryClient per browser session (lazy `useState` initializer so it isn't
 * recreated on re-render and isn't shared across requests on the server).
 */

import { useState, type ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/core/query/queryClient";
import { AuthProvider } from "@/features/auth/auth-context";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
