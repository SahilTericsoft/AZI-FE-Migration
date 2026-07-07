"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Download, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColumnPreferences, useColumnPrefs, type ColumnDef } from "@/components/ui/column-preferences";
import { Input } from "@/components/ui/input";
import { ListPagination } from "@/components/ui/list-pagination";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
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
import { humanizeKey } from "@/lib/format";
import { useUserOptions } from "@/features/user/user.queries";

import { testConfigApi } from "../test-config.api";
import { useDeleteTest, useTestList, useToggleTest } from "../test-config.queries";
import { SAMPLE_TYPES } from "../test-options";
import type { CreatedByDetails, Test } from "../test-config.types";
import {
  CatalogFilters,
  catalogFilterQuery,
  downloadCsv,
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "./catalog-list-chrome";
import RowActions from "./row-actions";

const COLUMNS: ColumnDef[] = [
  { key: "id", label: "Panel ID", mandatory: true },
  { key: "name", label: "Panel Name", mandatory: true },
  { key: "code", label: "Panel Code" },
  { key: "sampleType", label: "Sample Type", mandatory: true },
  { key: "createdAt", label: "Added Date & Time" },
  { key: "createdBy", label: "Added By" },
  { key: "status", label: "Panel Status", mandatory: true },
  { key: "isActive", label: "Active/Inactive", mandatory: true },
];

const fullName = (d?: CreatedByDetails | null) =>
  d ? `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() || "—" : "—";

export default function TestTab() {
  const router = useRouter();
  const del = useDeleteTest();
  const toggle = useToggleTest();
  const { isVisible, visible, toggle: toggleCol } = useColumnPrefs("tc-panel-columns", COLUMNS);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(0), [filters]);

  const query = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: search || undefined,
      ...catalogFilterQuery(filters),
    }),
    [page, rowsPerPage, search, filters],
  );

  const { data, isLoading, isError, error, isFetching } = useTestList(query);
  const tests: Test[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  const { data: usersData } = useUserOptions();
  const userOptions = useMemo(
    () =>
      (usersData?.docs ?? []).map((u) => ({
        value: String(u.id),
        label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || `#${u.id}`,
      })),
    [usersData],
  );
  const sampleTypeOptions = SAMPLE_TYPES.map((s) => ({ value: s.code, label: s.title }));

  const handleDelete = (test: Test) => {
    if (!window.confirm(`Delete panel "${test.name ?? test.code ?? test.id}"?`)) return;
    del.mutate(test.id, {
      onSuccess: () => toast.success("Panel deleted."),
      onError: (e) => toast.error(e?.message ?? "Could not delete panel."),
    });
  };

  const handleToggle = (test: Test) => {
    if (!window.confirm(`${test.isActive ? "Deactivate" : "Activate"} this panel?`)) return;
    toggle.mutate(test.id);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await testConfigApi.tests.list({ ...query, page: 1, limit: 1000 });
      const cols = COLUMNS.filter((c) => isVisible(c.key));
      const headers = cols.map((c) => c.label);
      const body = (all.docs ?? []).map((t) =>
        cols.map((c) => {
          switch (c.key) {
            case "id": return t.id;
            case "name": return t.name ?? "";
            case "code": return t.code ?? "";
            case "sampleType": return t.sampleType ?? "";
            case "createdAt": return t.createdAt ? formatDateTime(t.createdAt) : "";
            case "createdBy": return fullName(t.createdByDetails);
            case "status": return t.status ?? "";
            case "isActive": return t.isActive ? "Active" : "Inactive";
            default: return "";
          }
        }),
      );
      if (body.length === 0) {
        toast.warning("No panels to export.");
        return;
      }
      downloadCsv("panels.csv", headers, body);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const colCount = COLUMNS.filter((c) => isVisible(c.key)).length + 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search Panel…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 max-w-xs"
        />
        <div className="flex items-center gap-2">
          <CatalogFilters sampleTypeOptions={sampleTypeOptions} userOptions={userOptions} value={filters} onChange={setFilters} />
          <ColumnPreferences columns={COLUMNS} visible={visible} onToggle={toggleCol} />
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCsv} disabled={exporting}>
            {exporting ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} CSV
          </Button>
          <Link href="/test-configuration/panel/new" className={cn(buttonVariants(), "h-9 gap-1.5")}>
            <Plus className="h-4 w-4" /> New Panel
          </Link>
        </div>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load panels."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {isVisible("id") && <TableHead>Panel ID</TableHead>}
              {isVisible("name") && <TableHead>Panel Name</TableHead>}
              {isVisible("code") && <TableHead>Panel Code</TableHead>}
              {isVisible("sampleType") && <TableHead>Sample Type</TableHead>}
              {isVisible("createdAt") && <TableHead>Added Date &amp; Time</TableHead>}
              {isVisible("createdBy") && <TableHead>Added By</TableHead>}
              {isVisible("status") && <TableHead>Panel Status</TableHead>}
              {isVisible("isActive") && <TableHead className="text-center">Active/Inactive</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={colCount} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : tests.length === 0 ? (
              <TableRow><TableCell colSpan={colCount} className="py-12 text-center text-muted-foreground">No panels found.</TableCell></TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id} className="cursor-pointer" onClick={() => router.push(`/test-configuration/panel/${test.id}`)}>
                  {isVisible("id") && <TableCell className="font-medium">{test.id}</TableCell>}
                  {isVisible("name") && <TableCell>{test.name ?? "—"}</TableCell>}
                  {isVisible("code") && <TableCell><Badge variant="secondary">{test.code ?? "—"}</Badge></TableCell>}
                  {isVisible("sampleType") && <TableCell className="capitalize">{test.sampleType ?? "—"}</TableCell>}
                  {isVisible("createdAt") && <TableCell>{test.createdAt ? formatDateTime(test.createdAt) : "—"}</TableCell>}
                  {isVisible("createdBy") && <TableCell>{fullName(test.createdByDetails)}</TableCell>}
                  {isVisible("status") && (
                    <TableCell>
                      <Badge variant="outline">{test.status ? humanizeKey(test.status) : "—"}</Badge>
                    </TableCell>
                  )}
                  {isVisible("isActive") && (
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={Boolean(test.isActive)} disabled={toggle.isPending} onCheckedChange={() => handleToggle(test)} />
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RowActions onView={() => router.push(`/test-configuration/panel/${test.id}`)} onDelete={() => handleDelete(test)} />
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
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      </Card>
    </div>
  );
}
