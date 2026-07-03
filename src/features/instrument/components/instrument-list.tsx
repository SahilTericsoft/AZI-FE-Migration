"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ChevronRight, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ColumnPreferences,
  useColumnPrefs,
  type ColumnDef,
} from "@/components/ui/column-preferences";
import { Input } from "@/components/ui/input";
import { ListFilters, EMPTY_FILTERS, type ListFilterState } from "@/components/ui/list-filters";
import { ListPagination } from "@/components/ui/list-pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { useInstruments } from "../instrument.queries";
import { INSTRUMENT_CATEGORIES, type Instrument } from "../instrument.types";

const COLUMNS: ColumnDef[] = [
  { key: "id", label: "Instrument ID", mandatory: true },
  { key: "instrument", label: "Instrument Name", mandatory: true },
  { key: "category", label: "Instrument Category" },
  { key: "serial_number", label: "Serial Number" },
  { key: "manufacturer", label: "Manufacturer Name", mandatory: true },
  { key: "location", label: "Location" },
  { key: "updatedAt", label: "Last Updated On", mandatory: true },
  { key: "createdAt", label: "Created Timestamp" },
  { key: "createdBy", label: "Created By", mandatory: true },
  { key: "status", label: "Instrument Status", mandatory: true },
];

const CATEGORY_OPTIONS = INSTRUMENT_CATEGORIES.map((c) => ({ value: c, label: c }));

function addedByName(i: Instrument): string {
  const c = (i.createdByDetails ?? null) as Record<string, unknown> | null;
  if (!c) return "—";
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "—";
}

export default function InstrumentList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<ListFilterState>(EMPTY_FILTERS);

  const { isVisible, visible, toggle } = useColumnPrefs("instrument-list-columns", COLUMNS);
  const { data: usersData } = useUserOptions();
  const userOptions = useMemo(
    () => (usersData?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [usersData],
  );

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(0), [filters]);

  const { data, isLoading, isError, error, isFetching } = useInstruments({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
    categories: filters.types.length ? filters.types : undefined,
    statuses: filters.statuses.length ? filters.statuses : undefined,
    createdByIds: filters.createdById ? [Number(filters.createdById)] : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });
  const rows: Instrument[] = data?.docs ?? [];
  const total = data?.total ?? 0;
  const cols = COLUMNS.filter((c) => isVisible(c.key));

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Instruments</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Search name / serial…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="h-9 w-52" />
          <ListFilters
            typeLabel="Instrument Category"
            typeOptions={CATEGORY_OPTIONS}
            userOptions={userOptions}
            value={filters}
            onChange={setFilters}
          />
          <ColumnPreferences columns={COLUMNS} visible={visible} onToggle={toggle} />
          <Link href="/instrument/new" className={cn(buttonVariants(), "h-9 gap-1.5")}>
            <Plus className="h-4 w-4" /> New Instrument
          </Link>
        </div>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load instruments."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={cols.length + 1} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={cols.length + 1} className="py-12 text-center text-muted-foreground">No instruments found.</TableCell></TableRow>
            ) : (
              rows.map((i) => (
                <TableRow key={i.id}>
                  {cols.map((c) => (
                    <TableCell key={c.key} className={cn(c.key === "id" && "font-medium")}>{renderCell(c.key, i)}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Link href={`/instrument/${i.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")} aria-label={i.status === "draft" ? "continue" : "view"}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ListPagination
          page={page}
          rowsPerPage={rowsPerPage}
          total={total}
          isFetching={isFetching && !isLoading}
          rowsPerPageOptions={[10, 25, 100]}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      </Card>
    </div>
  );
}

function renderCell(key: string, i: Instrument) {
  switch (key) {
    case "id": return `#${i.id}`;
    case "instrument": return i.instrument ?? "—";
    case "category": return i.category ?? "—";
    case "serial_number": return i.serial_number ?? "—";
    case "manufacturer": return i.manufacturer ?? "—";
    case "location": return i.location ?? "—";
    case "updatedAt": return i.updatedAt ? formatDateTime(i.updatedAt) : "—";
    case "createdAt": return i.createdAt ? formatDateTime(i.createdAt) : "—";
    case "createdBy": return <span className="capitalize">{addedByName(i)}</span>;
    case "status":
      return <Badge variant={i.status === "completed" ? "success" : "outline"} className="capitalize">{i.status ?? "—"}</Badge>;
    default: return "—";
  }
}
