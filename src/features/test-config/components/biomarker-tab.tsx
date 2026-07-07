"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Download, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
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
import { useUserOptions } from "@/features/user/user.queries";

import { testConfigApi } from "../test-config.api";
import { useBiomarkerList, useDeleteBiomarker, useToggleBiomarker } from "../test-config.queries";
import { SAMPLE_TYPES } from "../test-options";
import type { Biomarker, CreatedByDetails } from "../test-config.types";
import {
  CatalogFilters,
  catalogFilterQuery,
  downloadCsv,
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "./catalog-list-chrome";
import RowActions from "./row-actions";

const COLUMNS: ColumnDef[] = [
  { key: "id", label: "Test ID", mandatory: true },
  { key: "name", label: "Test Name", mandatory: true },
  { key: "code", label: "Test Code" },
  { key: "sampleType", label: "Sample Type", mandatory: true },
  { key: "sampleCollectionDeviceName", label: "Sample Collection Device" },
  { key: "createdAt", label: "Added Date & Time" },
  { key: "createdBy", label: "Added By" },
  { key: "status", label: "Test Status", mandatory: true },
  { key: "isActive", label: "Active/Inactive", mandatory: true },
];

const fullName = (d?: CreatedByDetails | null) =>
  d ? `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() || "—" : "—";

function rowHref(b: Biomarker): string {
  return b.status === "draft"
    ? `/test-configuration/test/new?biomarkerId=${b.id}&step=report-configuration`
    : `/test-configuration/test/${b.id}`;
}

export default function BiomarkerTab() {
  const router = useRouter();
  const del = useDeleteBiomarker();
  const toggle = useToggleBiomarker();
  const { isVisible, visible, toggle: toggleCol } = useColumnPrefs("tc-test-columns", COLUMNS);

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

  const { data, isLoading, isFetching } = useBiomarkerList(query);
  const rows: Biomarker[] = data?.docs ?? [];
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

  const handleDelete = (b: Biomarker) => {
    if (!window.confirm(`Delete test "${b.name ?? b.code ?? b.id}"?`)) return;
    del.mutate(b.id, {
      onSuccess: () => toast.success("Test deleted."),
      onError: (e) => toast.error(e?.message ?? "Could not delete test."),
    });
  };

  const handleToggle = (b: Biomarker) => {
    if (!window.confirm(`${b.isActive ? "Deactivate" : "Activate"} this test?`)) return;
    toggle.mutate(b.id);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await testConfigApi.biomarkers.list({
        ...query,
        page: 1,
        limit: 1000,
      });
      const cols = COLUMNS.filter((c) => isVisible(c.key));
      const headers = cols.map((c) => c.label);
      const body = (all.docs ?? []).map((b) =>
        cols.map((c) => {
          switch (c.key) {
            case "id": return b.id;
            case "name": return b.name ?? "";
            case "code": return b.code ?? "";
            case "sampleType": return b.sampleType ?? "";
            case "sampleCollectionDeviceName": return b.sampleCollectionDeviceName ?? "";
            case "createdAt": return b.createdAt ? formatDateTime(b.createdAt) : "";
            case "createdBy": return fullName(b.createdByDetails);
            case "status": return b.status ?? "";
            case "isActive": return b.isActive ? "Active" : "Inactive";
            default: return "";
          }
        }),
      );
      if (body.length === 0) {
        toast.warning("No tests to export.");
        return;
      }
      downloadCsv("tests.csv", headers, body);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const colCount = COLUMNS.filter((c) => isVisible(c.key)).length + 1; // +actions

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search Test…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 max-w-xs"
        />
        <div className="flex items-center gap-2">
          <CatalogFilters
            sampleTypeOptions={sampleTypeOptions}
            userOptions={userOptions}
            value={filters}
            onChange={setFilters}
          />
          <ColumnPreferences columns={COLUMNS} visible={visible} onToggle={toggleCol} />
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCsv} disabled={exporting}>
            {exporting ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />} CSV
          </Button>
          <Link href="/test-configuration/test/new" className={cn(buttonVariants(), "h-9 gap-1.5")}>
            <Plus className="h-4 w-4" /> New Test
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {isVisible("id") && <TableHead>Test ID</TableHead>}
              {isVisible("name") && <TableHead>Test Name</TableHead>}
              {isVisible("code") && <TableHead>Test Code</TableHead>}
              {isVisible("sampleType") && <TableHead>Sample Type</TableHead>}
              {isVisible("sampleCollectionDeviceName") && <TableHead>Sample Collection Device</TableHead>}
              {isVisible("createdAt") && <TableHead>Added Date &amp; Time</TableHead>}
              {isVisible("createdBy") && <TableHead>Added By</TableHead>}
              {isVisible("status") && <TableHead>Test Status</TableHead>}
              {isVisible("isActive") && <TableHead className="text-center">Active/Inactive</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={colCount} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={colCount} className="py-12 text-center text-muted-foreground">No tests found.</TableCell></TableRow>
            ) : (
              rows.map((b) => (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => router.push(rowHref(b))}>
                  {isVisible("id") && <TableCell className="font-medium">{b.id}</TableCell>}
                  {isVisible("name") && <TableCell>{b.name ?? "—"}</TableCell>}
                  {isVisible("code") && <TableCell><Badge variant="secondary">{b.code ?? "—"}</Badge></TableCell>}
                  {isVisible("sampleType") && <TableCell className="capitalize">{b.sampleType ?? "—"}</TableCell>}
                  {isVisible("sampleCollectionDeviceName") && <TableCell>{b.sampleCollectionDeviceName ?? "—"}</TableCell>}
                  {isVisible("createdAt") && <TableCell>{b.createdAt ? formatDateTime(b.createdAt) : "—"}</TableCell>}
                  {isVisible("createdBy") && <TableCell>{fullName(b.createdByDetails)}</TableCell>}
                  {isVisible("status") && (
                    <TableCell>
                      <Badge variant={b.status === "draft" ? "outline" : "secondary"} className="capitalize">
                        {b.status ?? "—"}
                      </Badge>
                    </TableCell>
                  )}
                  {isVisible("isActive") && (
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={Boolean(b.isActive)}
                        onCheckedChange={() => handleToggle(b)}
                        disabled={toggle.isPending || b.status === "draft"}
                      />
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RowActions onView={() => router.push(rowHref(b))} onDelete={() => handleDelete(b)} />
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
