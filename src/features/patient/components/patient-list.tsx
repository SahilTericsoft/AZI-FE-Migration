"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { Download, Eye, Flag, Plus, Upload } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ColumnPreferences,
  useColumnPrefs,
  type ColumnDef,
} from "@/components/ui/column-preferences";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListPagination } from "@/components/ui/list-pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Filter as FilterIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFacilityLiteList } from "@/features/facility/facility.queries";
import { useLocationLiteList } from "@/features/location/location.queries";
import { usePanelOptions, useTestOptions } from "@/features/test-config/test-config.queries";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { patientApi } from "../patient.api";
import { usePatientList } from "../patient.queries";
import type { Patient } from "../patient.types";
import PatientBulkUploadDialog from "./patient-bulk-upload-dialog";
import PatientFormDialog from "./patient-form-dialog";

const COLUMNS: ColumnDef[] = [
  { key: "firstName", label: "First Name", mandatory: true },
  { key: "lastName", label: "Last Name", mandatory: true },
  { key: "dateOfBirth", label: "Date of Birth", mandatory: true },
  { key: "gender", label: "Gender" },
  { key: "mobileNumber", label: "Phone", mandatory: true },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "createdBy", label: "Added By", mandatory: true },
  { key: "externalPatientId", label: "External ID" },
  { key: "linkedLocations", label: "Linked Locations", mandatory: true },
  { key: "linkedFacilities", label: "Linked Facilities", mandatory: true },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

interface Filters {
  genders: string[];
  createdById: string | null;
  city: string;
  facilityId: string | null;
  locationId: string | null;
  panelIds: string[];
  testIds: string[];
  startDate: string;
  endDate: string;
}
const EMPTY_FILTERS: Filters = {
  genders: [], createdById: null, city: "", facilityId: null, locationId: null,
  panelIds: [], testIds: [], startDate: "", endDate: "",
};

function addedByName(p: Patient): string {
  const c = (p.createdByDetails ?? null) as Record<string, unknown> | null;
  if (!c) return "—";
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || (c.emailId as string) || "—";
}

function linked(p: Patient, key: "linkedLocations" | "linkedFacilities"): string {
  const v = (p as unknown as Record<string, unknown>)[key];
  if (Array.isArray(v) && v.length) {
    return v
      .map((x) => (typeof x === "object" && x ? (x as Record<string, unknown>).name : x))
      .filter(Boolean)
      .join(", ");
  }
  return "—";
}

export default function PatientList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [flagged, setFlagged] = useState(false);

  const { isVisible, visible, toggle } = useColumnPrefs("patient-list-columns", COLUMNS);
  const { data: usersData } = useUserOptions();
  const userOptions = useMemo(
    () => (usersData?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [usersData],
  );

  // Counts for the flag button tooltip / badge.
  const { data: flagCount } = useQuery({
    queryKey: ["patient", "flagged-count"],
    queryFn: () => patientApi.flaggedCount(),
  });
  const flaggedTotal = (flagCount?.alertLimitCount ?? 0) + (flagCount?.maxLimitCount ?? 0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(0), [filters, flagged]);

  const { data, isLoading, isError, error, isFetching } = usePatientList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
    genders: filters.genders.length ? filters.genders : undefined,
    createdByIds: filters.createdById ? [Number(filters.createdById)] : undefined,
    cities: filters.city.trim() ? [filters.city.trim()] : undefined,
    facilityIds: filters.facilityId ? [Number(filters.facilityId)] : undefined,
    locationIds: filters.locationId ? [Number(filters.locationId)] : undefined,
    panelIds: filters.panelIds.length ? filters.panelIds.map(Number) : undefined,
    testIds: filters.testIds.length ? filters.testIds.map(Number) : undefined,
    isAlertPatientFlag: flagged ? true : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const patients: Patient[] = data?.docs ?? [];
  const total = data?.total ?? 0;
  const cols = COLUMNS.filter((c) => isVisible(c.key));

  const exportCsv = () => {
    if (patients.length === 0) {
      toast.warning("No patients to export on this page.");
      return;
    }
    const header = cols.map((c) => c.label);
    const rows = patients.map((p) => cols.map((c) => csvCell(c.key, p)));
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "patients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Patients</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search patients…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-48"
          />
          <Button
            variant={flagged ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setFlagged((f) => !f)}
            title={`Patients who crossed the alert/max limit — Alert: ${flagCount?.alertLimitCount ?? 0} | Max: ${flagCount?.maxLimitCount ?? 0}`}
          >
            <Flag className="h-4 w-4" /> Flagged{flaggedTotal > 0 ? ` (${flaggedTotal})` : ""}
          </Button>
          <PatientFilters userOptions={userOptions} value={filters} onChange={setFilters} />
          <ColumnPreferences columns={COLUMNS} visible={visible} onToggle={toggle} />
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setBulkOpen(true)}>
            <Upload className="h-4 w-4" /> Bulk Upload
          </Button>
          <Button className="h-9 gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New Patient
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load patients."}</Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={cols.length + 1} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={cols.length + 1} className="py-12 text-center text-muted-foreground">
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  {cols.map((c) => (
                    <TableCell key={c.key} className={cn(["firstName", "lastName", "city", "state"].includes(c.key) && "capitalize")}>
                      {renderCell(c.key, patient)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Link
                      href={`/patient/${patient.id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
                    >
                      <Eye className="h-4 w-4" /> View
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

      <PatientFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      {bulkOpen && <PatientBulkUploadDialog onClose={() => setBulkOpen(false)} />}
    </div>
  );
}

function renderCell(key: string, p: Patient): string {
  switch (key) {
    case "firstName": return p.firstName ?? "—";
    case "lastName": return p.lastName ?? "—";
    case "dateOfBirth": return p.dateOfBirth ?? "—";
    case "gender": return p.gender ?? "—";
    case "mobileNumber": return p.mobileNumber ?? "—";
    case "address": return p.addressLine1 ?? "—";
    case "city": return p.city ?? "—";
    case "state": return p.state ?? "—";
    case "createdBy": return addedByName(p);
    case "externalPatientId": return p.externalPatientId ?? "—";
    case "linkedLocations": return linked(p, "linkedLocations");
    case "linkedFacilities": return linked(p, "linkedFacilities");
    default: return "—";
  }
}

function csvCell(key: string, p: Patient): string {
  const v = renderCell(key, p);
  return v === "—" ? "" : v;
}

function PatientFilters({
  userOptions, value, onChange,
}: {
  userOptions: { value: string; label: string }[];
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);

  const facilities = useFacilityLiteList();
  // Location options are scoped to the selected facility (disabled until then).
  const locations = useLocationLiteList(
    draft.facilityId ? { facilityId: Number(draft.facilityId) } : {},
  );
  const panelsQ = usePanelOptions();
  const testsQ = useTestOptions();

  const facilityOptions = (facilities.data ?? []).map((f) => ({ value: String(f.id), label: f.code ?? f.name ?? `#${f.id}` }));
  const locationOptions = (locations.data ?? []).map((l) => ({ value: String(l.id), label: l.code ?? l.name ?? `#${l.id}` }));
  const panelOptions = (panelsQ.data ?? []).map((p) => ({ value: String(p.id), label: p.name ?? `#${p.id}` }));
  const testOptions = (testsQ.data ?? []).map((t) => ({ value: String(t.id), label: t.name ?? `#${t.id}` }));

  const count =
    (value.genders.length ? 1 : 0) + (value.createdById ? 1 : 0) + (value.city.trim() ? 1 : 0) +
    (value.facilityId ? 1 : 0) + (value.locationId ? 1 : 0) + (value.panelIds.length ? 1 : 0) +
    (value.testIds.length ? 1 : 0) + (value.startDate ? 1 : 0) + (value.endDate ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <FilterIcon className="h-4 w-4" /> Filters{count > 0 ? ` (${count})` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[80vh] w-80 space-y-3 overflow-y-auto">
        <p className="text-sm font-semibold">Filters</p>
        <div className="space-y-1.5">
          <Label>Test</Label>
          <MultiCombobox options={testOptions} value={draft.testIds} onChange={(testIds) => setDraft((d) => ({ ...d, testIds }))} placeholder="Any test" loading={testsQ.isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label>Panel</Label>
          <MultiCombobox options={panelOptions} value={draft.panelIds} onChange={(panelIds) => setDraft((d) => ({ ...d, panelIds }))} placeholder="Any panel" loading={panelsQ.isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <MultiCombobox options={GENDER_OPTIONS} value={draft.genders} onChange={(genders) => setDraft((d) => ({ ...d, genders }))} placeholder="Any gender" />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input value={draft.city} placeholder="Enter city" onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Added By</Label>
          <Combobox options={userOptions} value={draft.createdById} onChange={(createdById) => setDraft((d) => ({ ...d, createdById }))} placeholder="Anyone" />
        </div>
        <div className="space-y-1.5">
          <Label>Facility Name</Label>
          <Combobox options={facilityOptions} value={draft.facilityId} onChange={(facilityId) => setDraft((d) => ({ ...d, facilityId, locationId: null }))} placeholder="Any facility" />
        </div>
        <div className="space-y-1.5">
          <Label>Location Name</Label>
          {draft.facilityId ? (
            <Combobox options={locationOptions} value={draft.locationId} onChange={(locationId) => setDraft((d) => ({ ...d, locationId }))} placeholder="Any location" />
          ) : (
            <Input value="" disabled placeholder="Select a facility first" className="bg-muted" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5"><Label>Start Date</Label><DatePicker value={draft.startDate} onChange={(startDate) => setDraft((d) => ({ ...d, startDate }))} placeholder="Start" /></div>
          <div className="space-y-1.5"><Label>End Date</Label><DatePicker value={draft.endDate} onChange={(endDate) => setDraft((d) => ({ ...d, endDate }))} placeholder="End" /></div>
        </div>
        <div className="flex justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={() => { setDraft(EMPTY_FILTERS); onChange(EMPTY_FILTERS); setOpen(false); }}>Clear all</Button>
          <Button size="sm" onClick={() => { onChange(draft); setOpen(false); }}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
