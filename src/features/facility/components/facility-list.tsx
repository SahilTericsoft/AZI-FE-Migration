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
import { Switch } from "@/components/ui/switch";
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

import { FACILITY_TYPES } from "../facility.constants";
import { useFacilityList, useToggleFacility } from "../facility.queries";
import type { Facility } from "../facility.types";

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Facility Name", mandatory: true },
  { key: "type", label: "Facility Type", mandatory: true },
  { key: "createdAt", label: "Added Date & Time" },
  { key: "createdBy", label: "Added By" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "status", label: "Facility Status", mandatory: true },
  { key: "active", label: "Active/Inactive Status", mandatory: true },
];

const TYPE_OPTIONS = FACILITY_TYPES.map((t) => ({ value: t, label: t }));

function addedByName(f: Facility): string {
  const c = (f.createdByDetails ?? null) as Record<string, unknown> | null;
  if (!c) return "—";
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return name || (c.emailId as string) || "—";
}

export default function FacilityList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<ListFilterState>(EMPTY_FILTERS);

  const { isVisible, visible, toggle } = useColumnPrefs("facility-list-columns", COLUMNS);
  const { data: usersData } = useUserOptions();
  const userOptions = useMemo(
    () => (usersData?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [usersData],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(0), [filters]);

  const { data, isLoading, isError, error, isFetching } = useFacilityList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
    types: filters.types.length ? filters.types : undefined,
    statuses: filters.statuses.length ? filters.statuses : undefined,
    createdByIds: filters.createdById ? [Number(filters.createdById)] : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const toggleFacility = useToggleFacility();

  const facilities: Facility[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  const cols = COLUMNS.filter((c) => isVisible(c.key));
  const colCount = cols.length + 1;

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Facilities</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search facilities…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-56"
          />
          <ListFilters
            typeLabel="Facility Type"
            typeOptions={TYPE_OPTIONS}
            userOptions={userOptions}
            value={filters}
            onChange={setFilters}
          />
          <ColumnPreferences columns={COLUMNS} visible={visible} onToggle={toggle} />
          <Link href="/facility/new" className={cn(buttonVariants(), "h-9 gap-1.5")}>
            <Plus className="h-4 w-4" />
            New Facility
          </Link>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load facilities."}</Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c) => (
                <TableHead key={c.key} className={c.key === "active" ? "text-center" : undefined}>
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={colCount} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : facilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="py-12 text-center text-muted-foreground">
                  No facilities found.
                </TableCell>
              </TableRow>
            ) : (
              facilities.map((facility) => (
                <TableRow key={facility.id}>
                  {cols.map((c) => (
                    <TableCell
                      key={c.key}
                      className={cn(
                        c.key === "name" && "font-medium capitalize",
                        c.key === "active" && "text-center",
                      )}
                    >
                      {renderCell(c.key, facility, toggleFacility)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Link
                      href={`/facility/${facility.id}`}
                      aria-label="view"
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                    >
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
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      </Card>
    </div>
  );
}

function renderCell(
  key: string,
  facility: Facility,
  toggleFacility: ReturnType<typeof useToggleFacility>,
) {
  const addr = (facility.addressDetails ?? {}) as Record<string, unknown>;
  switch (key) {
    case "name":
      return facility.code ?? facility.name ?? "—";
    case "type":
      return facility.type ?? "—";
    case "createdAt":
      return facility.createdAt ? formatDateTime(facility.createdAt) : "—";
    case "createdBy":
      return addedByName(facility);
    case "city":
      return (addr.city as string) ?? "—";
    case "state":
      return (addr.state as string) ?? "—";
    case "status":
      return (
        <Badge variant={facility.status === "completed" ? "success" : "outline"}>
          {facility.statusObj?.title ?? facility.status ?? "—"}
        </Badge>
      );
    case "active":
      return (
        <Switch
          checked={Boolean(facility.isActive)}
          onCheckedChange={() => toggleFacility.mutate(facility.id)}
          disabled={toggleFacility.isPending || facility.status === "draft"}
          aria-label={facility.status === "draft" ? "Activation disabled for draft" : "Toggle active"}
        />
      );
    default:
      return "—";
  }
}
