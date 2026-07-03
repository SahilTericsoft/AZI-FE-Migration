"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";

import { useZipSearch, type ZipRow } from "./geo.queries";

/**
 * ZIP picker backed by the geo dataset. Picking a ZIP returns the full row so the
 * caller can auto-populate city/state. "Other" lets the user type a ZIP the
 * dataset doesn't have.
 */
export function ZipField({
  value,
  onPick,
  invalid,
  id,
}: {
  value: string;
  /** A matched ZIP row, or the sentinel "other" for manual entry, or null when cleared. */
  onPick: (row: ZipRow | "other" | null) => void;
  invalid?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data: rows = [], isFetching } = useZipSearch(debounced, open);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-invalid={invalid}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
        >
          <span className="truncate">{value || "Select ZIP code"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center gap-2 p-2">
          <Input
            autoFocus
            inputMode="numeric"
            placeholder="Search ZIP / city / state…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9"
          />
          {isFetching && <Spinner className="h-4 w-4" />}
        </div>
        <ul className="max-h-64 overflow-auto p-1">
          <li>
            <button
              type="button"
              onClick={() => {
                onPick("other");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <Check className="h-4 w-4 opacity-0" />
              Other (enter manually)
            </button>
          </li>
          {rows.length === 0 && debounced && !isFetching ? (
            <li className="px-2 py-3 text-center text-sm text-muted-foreground">No matches.</li>
          ) : (
            rows.map((r) => (
              <li key={`${r.zipcode}-${r.city}`}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(r);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Check className={cn("h-4 w-4", r.zipcode === value ? "opacity-100" : "opacity-0")} />
                  <span className="font-medium">{r.zipcode}</span>
                  <span className="text-muted-foreground">
                    {r.city}, {r.state}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
