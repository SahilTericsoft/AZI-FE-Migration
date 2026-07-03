"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

export interface ComboOption {
  value: string;
  label: string;
  sublabel?: string;
}

function filterOptions(options: ComboOption[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return options;
  return options.filter(
    (o) => o.label.toLowerCase().includes(s) || (o.sublabel ?? "").toLowerCase().includes(s),
  );
}

/** Single-select searchable combobox (replaces MUI Autocomplete). */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  loading,
  id,
}: {
  options: ComboOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  loading?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => filterOptions(options, q), [options, q]);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground")}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2">
          <Input
            autoFocus
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9"
          />
        </div>
        <ul className="max-h-60 overflow-auto p-1">
          {loading ? (
            <li className="px-2 py-3 text-center text-sm text-muted-foreground">Loading…</li>
          ) : filtered.length === 0 ? (
            <li className="px-2 py-3 text-center text-sm text-muted-foreground">No results.</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value === value ? null : o.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Check className={cn("h-4 w-4", o.value === value ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.sublabel && <span className="text-xs text-muted-foreground">{o.sublabel}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** Multi-select searchable combobox with chips (replaces MUI multiple Autocomplete). */
export function MultiCombobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  loading,
  id,
}: {
  options: ComboOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  loading?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => filterOptions(options, q), [options, q]);
  const selected = options.filter((o) => value.includes(o.value));

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          className="h-auto min-h-10 w-full justify-between py-1.5 font-normal"
        >
          <span className="flex flex-1 flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((o) => (
                <Badge key={o.value} variant="secondary" className="gap-1">
                  {o.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(o.value);
                    }}
                    className="rounded-full hover:bg-background/60"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2">
          <Input
            autoFocus
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9"
          />
        </div>
        <ul className="max-h-60 overflow-auto p-1">
          {loading ? (
            <li className="px-2 py-3 text-center text-sm text-muted-foreground">Loading…</li>
          ) : filtered.length === 0 ? (
            <li className="px-2 py-3 text-center text-sm text-muted-foreground">No results.</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Check
                    className={cn("h-4 w-4", value.includes(o.value) ? "opacity-100" : "opacity-0")}
                  />
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.sublabel && <span className="text-xs text-muted-foreground">{o.sublabel}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
