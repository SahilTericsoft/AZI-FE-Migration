"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { codeForPath } from "@/components/layout/nav-config";
import { cn } from "@/lib/cn";

import { useAuth } from "../auth-context";

/**
 * Route-level ACL guard. The flip side of the sidebar filter: the same
 * `codeForPath` registry blocks the page itself. Ungated routes pass through.
 */
export default function RequirePermission({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { canAccess } = useAuth();

  const code = codeForPath(pathname);
  if (canAccess(code)) return <>{children}</>;

  return (
    <div className="shadcn-scope grid min-h-[60dvh] place-items-center text-foreground">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <Lock className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="text-lg font-bold">You don&apos;t have access to this module</h2>
        <p className="text-sm text-muted-foreground">
          This page is gated by the <code>{code}</code> permission, which isn&apos;t
          enabled for your role. Ask an administrator to grant it under Access Level.
        </p>
        <Link href="/dashboard" className={cn(buttonVariants())}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
