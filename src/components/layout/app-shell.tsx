"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Bell, ChevronDown, ChevronRight, Lock, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/auth-context";

import { NAV, titleForPath, type NavItem } from "./nav-config";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canAccess } = useAuth();

  // The "magic": derive the visible sidebar purely from the user's ACL grants.
  const visibleNav = useMemo<NavItem[]>(
    () =>
      NAV.flatMap((item) => {
        if (item.children) {
          const children = item.children.filter((c) => canAccess(c.code));
          if (children.length === 0 && !item.href) return [];
          return [{ ...item, children }];
        }
        return canAccess(item.code) ? [item] : [];
      }),
    [canAccess],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "CRM Operations": true,
  });

  const instanceName =
    (user?.systemConfig?.instanceName as string | undefined) || "AdvanzInnovation";
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.emailId ||
    "User";
  const roleTitle = user?.roleObj?.title ?? undefined;
  const title = titleForPath(pathname);

  const isActive = (href?: string) =>
    Boolean(href) && (pathname === href || pathname.startsWith(`${href}/`));

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const renderLeaf = (item: NavItem, nested = false) => {
    const active = isActive(item.href);
    const classes = cn(
      "flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-colors",
      nested ? "pl-9 pr-3 mx-3" : "px-3 mx-3",
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-foreground/80 hover:bg-muted",
    );
    const inner = (
      <>
        <item.icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
        <span>{item.label}</span>
      </>
    );
    return item.href ? (
      <Link key={item.label} href={item.href} className={classes}>
        {inner}
      </Link>
    ) : (
      <div key={item.label} className={cn(classes, "cursor-default opacity-50")}>
        {inner}
      </div>
    );
  };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar */}
      <aside className="shadcn-scope flex w-[268px] shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[#6E43DB] to-[#E86B3C] text-sm font-extrabold text-white">
            Aᶻ
          </div>
          <span className="text-[17px] font-extrabold">AdvanzInnovation</span>
        </div>
        <div className="h-px bg-border" />
        <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
          {visibleNav.map((item) => {
            if (!item.children) return renderLeaf(item);
            const open = openGroups[item.label] ?? false;
            const groupActive = item.children.some((c) => isActive(c.href));
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setOpenGroups((g) => ({ ...g, [item.label]: !open }))}
                  className={cn(
                    "mx-3 flex w-[calc(100%-1.5rem)] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted",
                    groupActive ? "text-primary" : "text-foreground",
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight
                    className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
                  />
                </button>
                {open && (
                  <div className="mt-0.5 space-y-0.5">
                    {item.children.map((child) => renderLeaf(child, true))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shadcn-scope sticky top-0 z-10 flex h-16 items-center gap-1 border-b border-border bg-card px-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-primary">{instanceName}</p>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
          </div>
          <button
            type="button"
            aria-label="notifications"
            className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:bg-muted"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="lock"
            className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:bg-muted"
          >
            <Lock className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-muted focus:outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[160px] truncate">{fullName}</span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[14rem]">
              <DropdownMenuLabel className="flex flex-col">
                <span className="truncate">{fullName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.emailId}
                  {roleTitle ? ` · ${roleTitle}` : ""}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
