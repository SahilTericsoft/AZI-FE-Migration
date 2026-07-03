import type { ReactNode } from "react";

import AppShell from "@/components/layout/app-shell";
import RequireAuth from "@/features/auth/components/require-auth";
import RequirePermission from "@/features/auth/components/require-permission";

/**
 * Authenticated app group: everything here renders inside the sidebar/header
 * shell, requires a session (redirects to /login otherwise), and enforces the
 * per-route ACL permission (renders an access notice otherwise).
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>
        <RequirePermission>{children}</RequirePermission>
      </AppShell>
    </RequireAuth>
  );
}
