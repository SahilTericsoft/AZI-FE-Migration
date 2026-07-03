"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";

import { useAuth } from "../auth-context";

/**
 * Client-side route guard. Wrap a page's content to require a session;
 * redirects to /login when there isn't one.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="shadcn-scope grid min-h-[60dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}
