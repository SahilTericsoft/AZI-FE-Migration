"use client";

import { useEffect, useState } from "react";

import { Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ListFilterState {
  types: string[];
  statuses: string[];
  createdById: string | null;
  city: string;
  startDate: string;
  endDate: string;
}

export const EMPTY_FILTERS: ListFilterState = {
  types: [],
  statuses: [],
  createdById: null,
  city: "",
  startDate: "",
  endDate: "",
};

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Draft" },
];

export function activeFilterCount(f: ListFilterState): number {
  return (
    (f.types.length > 0 ? 1 : 0) +
    (f.statuses.length > 0 ? 1 : 0) +
    (f.createdById ? 1 : 0) +
    (f.city.trim() ? 1 : 0) +
    (f.startDate ? 1 : 0) +
    (f.endDate ? 1 : 0)
  );
}

export function ListFilters({
  typeLabel,
  typeOptions,
  userOptions,
  showCity = false,
  value,
  onChange,
}: {
  typeLabel: string;
  typeOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
  showCity?: boolean;
  value: ListFilterState;
  onChange: (next: ListFilterState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ListFilterState>(value);

  // Re-seed the draft each time the popover opens so it reflects applied state.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const count = activeFilterCount(value);

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };
  const clear = () => {
    setDraft(EMPTY_FILTERS);
    onChange(EMPTY_FILTERS);
    setOpen(false);
  };

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

        <div className="space-y-1.5">
          <Label>{typeLabel}</Label>
          <MultiCombobox
            options={typeOptions}
            value={draft.types}
            onChange={(types) => setDraft((d) => ({ ...d, types }))}
            placeholder={`Any ${typeLabel.toLowerCase()}`}
          />
        </div>

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

        {showCity && (
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input
              value={draft.city}
              placeholder="Enter city"
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <DatePicker
              value={draft.startDate}
              onChange={(startDate) => setDraft((d) => ({ ...d, startDate }))}
              placeholder="Start"
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <DatePicker
              value={draft.endDate}
              onChange={(endDate) => setDraft((d) => ({ ...d, endDate }))}
              placeholder="End"
            />
          </div>
        </div>

        <div className="flex justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear all
          </Button>
          <Button size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
