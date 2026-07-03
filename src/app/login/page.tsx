"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/auth-context";
import LoginForm from "@/features/auth/components/login-form";

export default function LoginPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  // While loading, or right after auth (during redirect), show a spinner.
  if (status !== "unauthenticated") {
    return (
      <div className="shadcn-scope grid min-h-[100dvh] place-items-center bg-background">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return <LoginForm />;
}
