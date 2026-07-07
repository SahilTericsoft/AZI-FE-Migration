"use client";

import { useEffect, useState } from "react";

import { Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { CatalogListQuery } from "../test-config.types";

/** Shared filter state for the Test Configuration catalog lists. */
export interface CatalogFilterState {
  sampleTypes: string[];
  statuses: string[];
  createdById: string | null;
  startDate: string;
  endDate: string;
}

export const EMPTY_CATALOG_FILTERS: CatalogFilterState = {
  sampleTypes: [],
  statuses: [],
  createdById: null,
  startDate: "",
  endDate: "",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
];

export function catalogActiveCount(f: CatalogFilterState): number {
  return (
    (f.sampleTypes.length > 0 ? 1 : 0) +
    (f.statuses.length > 0 ? 1 : 0) +
    (f.createdById ? 1 : 0) +
    (f.startDate ? 1 : 0) +
    (f.endDate ? 1 : 0)
  );
}

/** Map applied filters onto the backend catalog list query. */
export function catalogFilterQuery(f: CatalogFilterState): Partial<CatalogListQuery> {
  return {
    sampleTypes: f.sampleTypes.length > 0 ? f.sampleTypes : undefined,
    statuses: f.statuses.length > 0 ? f.statuses : undefined,
    createdByIds: f.createdById ? [Number(f.createdById)] : undefined,
    startDate: f.startDate || undefined,
    endDate: f.endDate || undefined,
  };
}

export function CatalogFilters({
  sampleTypeOptions,
  userOptions,
  showSampleType = true,
  value,
  onChange,
}: {
  sampleTypeOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
  showSampleType?: boolean;
  value: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogFilterState>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const count = catalogActiveCount(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Filter className="h-4 w-4" />
          Filters
          {count > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <p className="text-sm font-semibold">Filters</p>

        {showSampleType && (
          <div className="space-y-1.5">
            <Label>Sample Type</Label>
            <MultiCombobox
              options={sampleTypeOptions}
              value={draft.sampleTypes}
              onChange={(sampleTypes) => setDraft((d) => ({ ...d, sampleTypes }))}
              placeholder="Any sample type"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Status</Label>
          <MultiCombobox
            options={STATUS_OPTIONS}
            value={draft.statuses}
            onChange={(statuses) => setDraft((d) => ({ ...d, statuses }))}
            placeholder="Any status"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Added By</Label>
          <Combobox
            options={userOptions}
            value={draft.createdById}
            onChange={(createdById) => setDraft((d) => ({ ...d, createdById }))}
            placeholder="Anyone"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>From</Label>
            <DatePicker
              value={draft.startDate}
              onChange={(startDate) => setDraft((d) => ({ ...d, startDate: startDate ?? "" }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <DatePicker
              value={draft.endDate}
              onChange={(endDate) => setDraft((d) => ({ ...d, endDate: endDate ?? "" }))}
            />
          </div>
        </div>

        <div className="flex justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(EMPTY_CATALOG_FILTERS);
              onChange(EMPTY_CATALOG_FILTERS);
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Build a CSV string and trigger a download. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
