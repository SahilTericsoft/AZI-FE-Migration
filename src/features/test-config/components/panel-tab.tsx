"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Download, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColumnPreferences, useColumnPrefs, type ColumnDef } from "@/components/ui/column-preferences";
import { MultiCombobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListPagination } from "@/components/ui/list-pagination";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDateTime } from "@/lib/datetime";
import { humanizeKey } from "@/lib/format";
import { useUserOptions } from "@/features/user/user.queries";

import { testConfigApi } from "../test-config.api";
import {
  useBiomarkerOptions,
  useCreatePanel,
  useDeletePanel,
  usePanelList,
  useTestOptions,
  useTogglePanel,
} from "../test-config.queries";
import { SAMPLE_TYPES } from "../test-options";
import type { CreatedByDetails, Panel } from "../test-config.types";
import {
  CatalogFilters,
  catalogFilterQuery,
  downloadCsv,
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "./catalog-list-chrome";
import RowActions from "./row-actions";

const SAMPLE_TYPE_LABELS = ["Blood", "Serum", "Plasma", "Urine", "Saliva", "Swab", "Tissue", "Stool"];

const COLUMNS: ColumnDef[] = [
  { key: "id", label: "Profile ID", mandatory: true },
  { key: "name", label: "Profile Name", mandatory: true },
  { key: "panels", label: "Panel(s)", mandatory: true },
  { key: "sampleType", label: "Sample Type", mandatory: true },
  { key: "createdAt", label: "Added Date & Time" },
  { key: "createdBy", label: "Added By" },
  { key: "status", label: "Profile Status", mandatory: true },
  { key: "isActive", label: "Active/Inactive", mandatory: true },
];

const fullName = (d?: CreatedByDetails | null) =>
  d ? `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() || "—" : "—";

export default function PanelTab() {
  const router = useRouter();
  const del = useDeletePanel();
  const toggle = useTogglePanel();
  const { isVisible, visible, toggle: toggleCol } = useColumnPrefs("tc-profile-columns", COLUMNS);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const { data, isLoading, isError, error, isFetching } = usePanelList(query);
  const panels: Panel[] = data?.docs ?? [];
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

  const handleDelete = (panel: Panel) => {
    if (!window.confirm(`Delete profile "${panel.name ?? panel.code ?? panel.id}"?`)) return;
    del.mutate(panel.id, {
      onSuccess: () => toast.success("Profile deleted."),
      onError: (e) => toast.error(e?.message ?? "Could not delete profile."),
    });
  };

  const handleToggle = (panel: Panel) => {
    if (!window.confirm(`${panel.isActive ? "Deactivate" : "Activate"} this profile?`)) return;
    toggle.mutate(panel.id);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await testConfigApi.panels.list({ ...query, page: 1, limit: 1000 });
      const cols = COLUMNS.filter((c) => isVisible(c.key));
      const headers = cols.map((c) => c.label);
      const body = (all.docs ?? []).map((p) =>
        cols.map((c) => {
          switch (c.key) {
            case "id": return p.id;
            case "name": return p.name ?? "";
            case "panels": return p.testIds?.length ?? 0;
            case "sampleType": return p.sampleType ?? "";
            case "createdAt": return p.createdAt ? formatDateTime(p.createdAt) : "";
            case "createdBy": return fullName(p.createdByDetails);
            case "status": return p.status ?? "";
            case "isActive": return p.isActive ? "Active" : "Inactive";
            default: return "";
          }
        }),
      );
      if (body.length === 0) {
        toast.warning("No profiles to export.");
        return;
      }
      downloadCsv("profiles.csv", headers, body);
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
          placeholder="Search Profile…"
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
          <Button className="h-9 gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New Profile
          </Button>
        </div>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load profiles."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {isVisible("id") && <TableHead>Profile ID</TableHead>}
              {isVisible("name") && <TableHead>Profile Name</TableHead>}
              {isVisible("panels") && <TableHead>Panel(s)</TableHead>}
              {isVisible("sampleType") && <TableHead>Sample Type</TableHead>}
              {isVisible("createdAt") && <TableHead>Added Date &amp; Time</TableHead>}
              {isVisible("createdBy") && <TableHead>Added By</TableHead>}
              {isVisible("status") && <TableHead>Profile Status</TableHead>}
              {isVisible("isActive") && <TableHead className="text-center">Active/Inactive</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={colCount} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : panels.length === 0 ? (
              <TableRow><TableCell colSpan={colCount} className="py-12 text-center text-muted-foreground">No profiles found.</TableCell></TableRow>
            ) : (
              panels.map((panel) => (
                <TableRow key={panel.id} className="cursor-pointer" onClick={() => router.push(`/test-configuration/profile/${panel.id}`)}>
                  {isVisible("id") && <TableCell className="font-medium">{panel.id}</TableCell>}
                  {isVisible("name") && <TableCell>{panel.name ?? "—"}</TableCell>}
                  {isVisible("panels") && (
                    <TableCell>
                      {panel.testIds && panel.testIds.length > 0 ? (
                        <Badge variant="secondary">{panel.testIds.length} panel(s)</Badge>
                      ) : "—"}
                    </TableCell>
                  )}
                  {isVisible("sampleType") && <TableCell className="capitalize">{panel.sampleType ?? "—"}</TableCell>}
                  {isVisible("createdAt") && <TableCell>{panel.createdAt ? formatDateTime(panel.createdAt) : "—"}</TableCell>}
                  {isVisible("createdBy") && <TableCell>{fullName(panel.createdByDetails)}</TableCell>}
                  {isVisible("status") && (
                    <TableCell>
                      <Badge variant="outline">{panel.status ? humanizeKey(panel.status) : "—"}</Badge>
                    </TableCell>
                  )}
                  {isVisible("isActive") && (
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={Boolean(panel.isActive)} disabled={toggle.isPending} onCheckedChange={() => handleToggle(panel)} />
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RowActions onView={() => router.push(`/test-configuration/profile/${panel.id}`)} onDelete={() => handleDelete(panel)} />
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

      {dialogOpen && <CreateProfileDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}

function CreateProfileDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [testIds, setTestIds] = useState<string[]>([]);
  const [biomarkerIds, setBiomarkerIds] = useState<string[]>([]);
  const [hasOrderingLimit, setHasOrderingLimit] = useState<"yes" | "no">("no");
  const [alertLimit, setAlertLimit] = useState("");
  const [maxLimit, setMaxLimit] = useState("");
  const [limitError, setLimitError] = useState<string | null>(null);
  const create = useCreatePanel();
  const { data: testOptions = [] } = useTestOptions();
  const { data: biomarkerOptions = [] } = useBiomarkerOptions();

  const limitsValid =
    hasOrderingLimit === "no" ||
    (/^\d+$/.test(alertLimit) &&
      /^\d+$/.test(maxLimit) &&
      Number(maxLimit) >= 1 &&
      Number(maxLimit) <= 10 &&
      Number(alertLimit) >= 1 &&
      Number(alertLimit) <= Number(maxLimit));

  const valid = useMemo(
    () => name.trim() !== "" && code.trim() !== "" && limitsValid,
    [name, code, limitsValid],
  );

  const handleSubmit = () => {
    setLimitError(null);
    if (hasOrderingLimit === "yes" && !limitsValid) {
      setLimitError("Alert & Max limit must be 1–10, and Alert Limit cannot exceed Max Limit.");
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        code: code.trim(),
        sampleType: sampleType || undefined,
        testIds: testIds.length > 0 ? testIds.map(Number) : undefined,
        biomarkerIds: biomarkerIds.length > 0 ? biomarkerIds.map(Number) : undefined,
        hasOrderingLimit: hasOrderingLimit === "yes",
        ...(hasOrderingLimit === "yes"
          ? { alertLimit: Number(alertLimit), maxLimit: Number(maxLimit) }
          : { alertLimit: null, maxLimit: null }),
      },
      {
        onSuccess: () => {
          toast.success("Profile created.");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Profile</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto py-1">
          <div className="space-y-1.5">
            <Label htmlFor="panel-name">Profile Name</Label>
            <Input id="panel-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="panel-code">Profile Code</Label>
            <Input id="panel-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sample Type</Label>
            <Select value={sampleType} onValueChange={setSampleType}>
              <SelectTrigger><SelectValue placeholder="Select sample type" /></SelectTrigger>
              <SelectContent>
                {SAMPLE_TYPE_LABELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Select Panel(s)</Label>
            <MultiCombobox
              options={testOptions.map((t) => ({ value: String(t.id), label: t.name ?? `#${t.id}`, sublabel: t.code ?? undefined }))}
              value={testIds}
              onChange={setTestIds}
              placeholder={testOptions.length === 0 ? "No active panels yet" : "Select panels"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Select Test(s)</Label>
            <MultiCombobox
              options={biomarkerOptions.map((b) => ({ value: String(b.id), label: b.name ?? `#${b.id}`, sublabel: b.code ?? undefined }))}
              value={biomarkerIds}
              onChange={setBiomarkerIds}
              placeholder={biomarkerOptions.length === 0 ? "No active tests yet" : "Select tests"}
            />
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <Label>Is there any ordering limit?</Label>
            <RadioGroup className="flex gap-6" value={hasOrderingLimit} onValueChange={(v) => setHasOrderingLimit(v as "yes" | "no")}>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Yes</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> No</label>
            </RadioGroup>
            {hasOrderingLimit === "yes" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="alert-limit">Alert Limit <span className="text-destructive">*</span></Label>
                  <Input id="alert-limit" inputMode="numeric" value={alertLimit} onChange={(e) => setAlertLimit(e.target.value.replace(/\D/g, "").slice(0, 2))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-limit">Max Limit <span className="text-destructive">*</span></Label>
                  <Input id="max-limit" inputMode="numeric" value={maxLimit} onChange={(e) => setMaxLimit(e.target.value.replace(/\D/g, "").slice(0, 2))} />
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  Per-patient monthly order limit for this profile (1–10). Alert Limit ≤ Max Limit.
                </p>
              </div>
            )}
            {limitError && <Alert variant="destructive">{limitError}</Alert>}
          </div>
          {create.isError && <Alert variant="destructive">{create.error?.message ?? "Failed to create profile."}</Alert>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!valid || create.isPending} className="gap-1.5">
            {create.isPending && <Spinner className="h-4 w-4" />}
            Create Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
