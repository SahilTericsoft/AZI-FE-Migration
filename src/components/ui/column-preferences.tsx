"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ColumnDef {
  /** Stable key persisted in localStorage and used for visibility checks. */
  key: string;
  label: string;
  /** Mandatory columns are always visible and cannot be deselected. */
  mandatory?: boolean;
}

export interface ColumnPrefs {
  isVisible: (key: string) => boolean;
  visibleKeys: string[];
}

const defaultVisible = (columns: ColumnDef[]) =>
  columns.filter((c) => c.mandatory).map((c) => c.key);

/**
 * Persisted, mandatory-aware column visibility. Defaults to the mandatory
 * columns; mandatory keys are always forced on regardless of stored state.
 */
export function useColumnPrefs(storageKey: string, columns: ColumnDef[]) {
  const mandatory = useMemo(() => columns.filter((c) => c.mandatory).map((c) => c.key), [columns]);

  const [visible, setVisible] = useState<Set<string>>(() => new Set(defaultVisible(columns)));

  // Load persisted prefs on mount (client-only; avoids SSR hydration mismatch).
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      if (raw) {
        const keys: string[] = JSON.parse(raw);
        setVisible(new Set([...keys, ...mandatory]));
      }
    } catch {
      /* ignore malformed storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<string>) => {
      setVisible(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const toggle = useCallback(
    (key: string, on: boolean) => {
      if (mandatory.includes(key)) return; // can't change mandatory
      const next = new Set(visible);
      if (on) next.add(key);
      else next.delete(key);
      persist(next);
    },
    [mandatory, persist, visible],
  );

  const isVisible = useCallback((key: string) => visible.has(key), [visible]);

  return { visible, isVisible, toggle, columns };
}

/** Dropdown of checkboxes; mandatory columns are checked + disabled. */
export function ColumnPreferences({
  columns,
  visible,
  onToggle,
}: {
  columns: ColumnDef[];
  visible: Set<string>;
  onToggle: (key: string, on: boolean) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <SlidersHorizontal className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60">
        <p className="mb-2 text-sm font-semibold">Column Preferences</p>
        <div className="flex flex-col gap-2">
          {columns.map((c) => (
            <label
              key={c.key}
              className="flex items-center gap-2 text-sm"
              title={c.mandatory ? "Required column" : undefined}
            >
              <Checkbox
                checked={c.mandatory ? true : visible.has(c.key)}
                disabled={c.mandatory}
                onCheckedChange={(v) => onToggle(c.key, Boolean(v))}
              />
              <span className={c.mandatory ? "text-muted-foreground" : ""}>{c.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
