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

import { labRoleLabel, labTypeLabel } from "../lab.format";
import { useLabList, useToggleLab } from "../lab.queries";
import type { Lab } from "../lab.types";

// Column catalog. Mandatory columns are always shown and can't be deselected.
const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Lab Name", mandatory: true },
  { key: "labType", label: "Lab Type" },
  { key: "labRole", label: "Lab Role", mandatory: true },
  { key: "director", label: "Director", mandatory: true },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "createdAt", label: "Added Date & Time" },
  { key: "createdBy", label: "Added By" },
  { key: "status", label: "Lab Status", mandatory: true },
  { key: "active", label: "Active/Inactive Status", mandatory: true },
];

const LAB_TYPE_OPTIONS = [
  { value: "externalLab", label: "External Lab" },
  { value: "inHouseLab", label: "In-House Lab" },
];

function directorName(lab: Lab): string {
  const d = (lab.directorDetails ?? null) as Record<string, unknown> | null;
  if (!d) return "—";
  const name = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  return name || "—";
}

function addedByName(lab: Lab): string {
  const c = (lab.createdByDetails ?? null) as Record<string, unknown> | null;
  if (!c) return "—";
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return name || (c.emailId as string) || "—";
}

export default function LabList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<ListFilterState>(EMPTY_FILTERS);

  const { isVisible, visible, toggle } = useColumnPrefs("lab-list-columns", COLUMNS);
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

  // Reset to first page whenever filters change.
  useEffect(() => setPage(0), [filters]);

  const { data, isLoading, isError, error, isFetching } = useLabList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
    labTypes: filters.types.length ? filters.types : undefined,
    statuses: filters.statuses.length ? filters.statuses : undefined,
    createdByIds: filters.createdById ? [Number(filters.createdById)] : undefined,
    cities: filters.city.trim() ? [filters.city.trim()] : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const toggleLab = useToggleLab();

  const labs: Lab[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  const cols = COLUMNS.filter((c) => isVisible(c.key));
  const colCount = cols.length + 1; // + actions

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Labs</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search labs…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-56"
          />
          <ListFilters
            typeLabel="Lab Type"
            typeOptions={LAB_TYPE_OPTIONS}
            userOptions={userOptions}
            showCity
            value={filters}
            onChange={setFilters}
          />
          <ColumnPreferences columns={COLUMNS} visible={visible} onToggle={toggle} />
          <Link href="/lab/new" className={cn(buttonVariants(), "h-9 gap-1.5")}>
            <Plus className="h-4 w-4" />
            New Lab
          </Link>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load labs."}</Alert>
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
            ) : labs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="py-12 text-center text-muted-foreground">
                  No labs found.
                </TableCell>
              </TableRow>
            ) : (
              labs.map((lab) => (
                <TableRow key={lab.id}>
                  {cols.map((c) => (
                    <TableCell
                      key={c.key}
                      className={cn(
                        c.key === "name" && "font-medium capitalize",
                        c.key === "active" && "text-center",
                      )}
                    >
                      {renderCell(c.key, lab, toggleLab)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Link
                      href={`/lab/${lab.id}`}
                      aria-label={lab.status === "draft" ? "continue" : "view"}
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
  lab: Lab,
  toggleLab: ReturnType<typeof useToggleLab>,
) {
  switch (key) {
    case "name":
      return lab.name ?? lab.code ?? "—";
    case "labType":
      return labTypeLabel(lab.labType) ?? "—";
    case "labRole":
      return labRoleLabel(lab.labRole) ?? "—";
    case "director":
      return directorName(lab);
    case "mobileNumber":
      return lab.mobileNumber ?? "—";
    case "city":
      return lab.city ?? "—";
    case "state":
      return lab.state ?? "—";
    case "createdAt":
      return lab.createdAt ? formatDateTime(lab.createdAt) : "—";
    case "createdBy":
      return addedByName(lab);
    case "status":
      return (
        <Badge variant={lab.status === "completed" ? "success" : "outline"}>
          {lab.statusObj?.title ?? lab.status ?? "—"}
        </Badge>
      );
    case "active":
      return (
        <Switch
          checked={Boolean(lab.isActive)}
          onCheckedChange={() => toggleLab.mutate(lab.id)}
          disabled={toggleLab.isPending || lab.status === "draft"}
          aria-label={lab.status === "draft" ? "Activation disabled for draft" : "Toggle active"}
        />
      );
    default:
      return "—";
  }
}
