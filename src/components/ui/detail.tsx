import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** ShadCN equivalents of the MUI DetailField/DetailSection (for converted screens). */
export function DetailField({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value?: ReactNode;
  capitalize?: boolean;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm text-foreground", capitalize && "capitalize")}>
        {empty ? "N/A" : value}
      </p>
    </div>
  );
}

export function DetailSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      {title && <h3 className="mb-3 text-base font-bold">{title}</h3>}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
        {children}
      </div>
    </div>
  );
}
