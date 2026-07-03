"use client";

import { useEffect, useState } from "react";

import { Plus, Trash2, Pencil, X } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import type { ApiError } from "@/core/api/types";

import { settingsApi } from "../system-settings.api";
import {
  REPORT_FORMAT_OPTIONS,
  REPORT_TYPE_OPTIONS,
  SETTINGS_MODULES,
  type FeatureDef,
} from "../system-settings.config";
import {
  useDepartments,
  useDropdown,
  useGeo,
  useSettingsInvalidate,
} from "../system-settings.queries";
import type { Department } from "../system-settings.types";

const cap = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export default function DropdownControls() {
  const [moduleCode, setModuleCode] = useState<string>("");
  const [featureCode, setFeatureCode] = useState<string>("");

  const moduleDef = SETTINGS_MODULES.find((m) => m.code === moduleCode);
  const featureDef = moduleDef?.features.find((f) => f.code === featureCode);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              Select Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={moduleCode}
              onValueChange={(v) => {
                setModuleCode(v);
                setFeatureCode("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {SETTINGS_MODULES.map((m) => (
                  <SelectItem key={m.code} value={m.code}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>
              Select Feature <span className="text-destructive">*</span>
            </Label>
            <Select value={featureCode} onValueChange={setFeatureCode} disabled={!moduleCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select Feature" />
              </SelectTrigger>
              <SelectContent>
                {(moduleDef?.features ?? []).map((f) => (
                  <SelectItem key={f.code} value={f.code}>
                    {f.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {!featureDef ? (
        <Card className="p-12 text-center text-muted-foreground">
          Please select a type and feature
        </Card>
      ) : featureDef.kind === "address" ? (
        <AddressFeature />
      ) : featureDef.kind === "department" ? (
        <DepartmentFeature />
      ) : (
        <GenericFeature feature={featureDef} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ generic */
function GenericFeature({ feature }: { feature: FeatureDef }) {
  const { data: rows = [], isLoading } = useDropdown(feature.code);
  const invalidate = useSettingsInvalidate();
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setSelected([]), [feature.code]);

  const allChecked = rows.length > 0 && selected.length === rows.length;

  const doDelete = async () => {
    try {
      await settingsApi.deleteDropdown(feature.code, selected);
      toast.success("Deleted successfully");
      setSelected([]);
      invalidate();
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Delete failed");
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <FeatureHeader
        title={feature.title}
        canDelete={selected.length > 0}
        onDelete={() => setConfirmDelete(true)}
        onAdd={() => setAddOpen(true)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(c) => setSelected(c ? rows.map((r) => r.code) : [])}
                aria-label="select all"
              />
            </TableHead>
            <TableHead>{cap(feature.title)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={2} className="py-10 text-center">
                <Spinner className="mx-auto" />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">
                No entries yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.code}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(r.code)}
                    onCheckedChange={(c) =>
                      setSelected((s) => (c ? [...s, r.code] : s.filter((x) => x !== r.code)))
                    }
                    aria-label={`select ${r.title}`}
                  />
                </TableCell>
                <TableCell>{cap(String(r.title))}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {addOpen && (
        <AddGenericDialog
          feature={feature}
          existing={rows.map((r) => r.code)}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            invalidate();
          }}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Please confirm!"
        message={`Are you sure you want to delete ${selected.length} entr${selected.length === 1 ? "y" : "ies"}?`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={doDelete}
      />
    </Card>
  );
}

function AddGenericDialog({
  feature,
  existing,
  onClose,
  onSaved,
}: {
  feature: FeatureDef;
  existing: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (i: number, v: string) => setValues((s) => s.map((x, idx) => (idx === i ? v : x)));

  const submit = async () => {
    setError(null);
    const clean = values.map((v) => v.trim()).filter(Boolean);
    if (clean.length === 0) {
      setError("Enter at least one value.");
      return;
    }
    const lower = clean.map((v) => v.toLowerCase());
    if (new Set(lower).size !== lower.length) {
      setError("Duplicate values in the form.");
      return;
    }
    if (lower.some((v) => existing.includes(v))) {
      setError("One or more values already exist.");
      return;
    }
    setBusy(true);
    try {
      await settingsApi.addDropdown(
        feature.code,
        clean.map((v) => ({ title: v, code: v.toLowerCase() })),
      );
      toast.success(`${cap(feature.title)} added`);
      onSaved();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="shadcn-scope">
        <DialogHeader>
          <DialogTitle>Add {cap(feature.title)}</DialogTitle>
        </DialogHeader>
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="flex flex-col gap-3">
          {values.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder={`Enter ${cap(feature.title)}`}
                value={v}
                onChange={(e) => set(i, e.target.value)}
                autoFocus={i === values.length - 1}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() =>
                  setValues((s) => (s.length === 1 ? [""] : s.filter((_, idx) => idx !== i)))
                }
                aria-label="remove"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="w-fit gap-1.5"
            onClick={() => setValues((s) => [...s, ""])}
          >
            <Plus className="h-4 w-4" /> Add More
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ address */
function AddressFeature() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const { data, isLoading } = useGeo(debounced);
  const invalidate = useSettingsInvalidate();
  const rows = data?.docs ?? [];
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const allChecked = rows.length > 0 && selected.length === rows.length;

  const doDelete = async () => {
    try {
      await settingsApi.deleteGeo(selected);
      toast.success("Deleted successfully");
      setSelected([]);
      invalidate();
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Delete failed");
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search ZIP Code, City, County or State"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full sm:w-72"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={selected.length === 0}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Address
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(c) => setSelected(c ? rows.map((r) => r.zipcode) : [])}
                aria-label="select all"
              />
            </TableHead>
            <TableHead>Zip Code</TableHead>
            <TableHead>City</TableHead>
            <TableHead>County</TableHead>
            <TableHead>State</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center">
                <Spinner className="mx-auto" />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No addresses found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.zipcode}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(r.zipcode)}
                    onCheckedChange={(c) =>
                      setSelected((s) => (c ? [...s, r.zipcode] : s.filter((x) => x !== r.zipcode)))
                    }
                    aria-label={`select ${r.zipcode}`}
                  />
                </TableCell>
                <TableCell>{r.zipcode}</TableCell>
                <TableCell>{r.city}</TableCell>
                <TableCell>{r.county}</TableCell>
                <TableCell>{r.state}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {addOpen && (
        <AddAddressDialog
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            invalidate();
          }}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Please confirm!"
        message={`Delete ${selected.length} selected address(es)?`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={doDelete}
      />
    </Card>
  );
}

function AddAddressDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ zipcode: "", city: "", county: "", state: "", country: "USA" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const valid = /^[1-9]\d{4}$/.test(form.zipcode) && form.city.trim() && form.county.trim() && form.state.trim();

  const submit = async () => {
    setError(null);
    if (!valid) {
      setError("Enter a valid 5-digit ZIP and all fields.");
      return;
    }
    setBusy(true);
    try {
      await settingsApi.addGeo([form]);
      toast.success("Address added");
      onSaved();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="shadcn-scope">
        <DialogHeader>
          <DialogTitle>Add Address</DialogTitle>
        </DialogHeader>
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="flex flex-col gap-3">
          <Field label="Zip Code" value={form.zipcode} onChange={(v) => set("zipcode", v.replace(/\D/g, "").slice(0, 5))} />
          <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
          <Field label="County" value={form.county} onChange={(v) => set("county", v)} />
          <Field label="State" value={form.state} onChange={(v) => set("state", v)} />
          <Field label="Country" value={form.country} onChange={() => {}} readOnly />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !valid}>
            {busy ? <Spinner className="h-4 w-4" /> : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------------- department */
function DepartmentFeature() {
  const { data, isLoading } = useDepartments("");
  const invalidate = useSettingsInvalidate();
  const rows = data?.docs ?? [];
  const [editing, setEditing] = useState<Department | "new" | null>(null);

  return (
    <Card className="overflow-hidden">
      <FeatureHeader title="Department" canDelete={false} onAdd={() => setEditing("new")} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Report Type</TableHead>
            <TableHead>Report Format</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center">
                <Spinner className="mx-auto" />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                No departments yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <ChipList items={d.reportType ?? []} />
                </TableCell>
                <TableCell>
                  <ChipList items={d.reportFormat ?? []} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(d)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editing && (
        <DepartmentDialog
          dept={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </Card>
  );
}

function DepartmentDialog({
  dept,
  onClose,
  onSaved,
}: {
  dept: Department | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(dept?.name ?? "");
  const [reportType, setReportType] = useState<string[]>(dept?.reportType ?? []);
  const [reportFormat, setReportFormat] = useState<string[]>(dept?.reportFormat ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim() && reportType.length > 0 && reportFormat.length > 0;

  const submit = async () => {
    setError(null);
    if (!valid) {
      setError("Fill name, report type and report format.");
      return;
    }
    setBusy(true);
    const payload = { name: name.trim(), code: name.trim().toLowerCase(), reportType, reportFormat };
    try {
      if (dept) await settingsApi.editDepartment(dept.id!, payload);
      else await settingsApi.addDepartment(payload);
      toast.success(dept ? "Department updated" : "Department added");
      onSaved();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="shadcn-scope">
        <DialogHeader>
          <DialogTitle>{dept ? "Edit" : "Add"} Department</DialogTitle>
        </DialogHeader>
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="flex flex-col gap-3">
          <Field label="Department Name" value={name} onChange={setName} />
          <div className="space-y-1.5">
            <Label>
              Report Type <span className="text-destructive">*</span>
            </Label>
            <MultiCombobox
              options={REPORT_TYPE_OPTIONS.map((o) => ({ value: o.code, label: o.title }))}
              value={reportType}
              onChange={setReportType}
              placeholder="Select Report Type"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Report Format <span className="text-destructive">*</span>
            </Label>
            <MultiCombobox
              options={REPORT_FORMAT_OPTIONS.map((o) => ({ value: o.code, label: o.title }))}
              value={reportFormat}
              onChange={setReportFormat}
              placeholder="Select Report Format"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !valid}>
            {busy ? <Spinner className="h-4 w-4" /> : dept ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------- shared */
function FeatureHeader({
  title,
  canDelete,
  onDelete,
  onAdd,
}: {
  title: string;
  canDelete: boolean;
  onDelete?: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-b p-4">
      {onDelete && (
        <Button variant="outline" className="gap-1.5" disabled={!canDelete} onClick={onDelete}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      )}
      <Button className="gap-1.5" onClick={onAdd}>
        <Plus className="h-4 w-4" /> Add {cap(title)}
      </Button>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((i) => (
        <Badge key={i} variant="secondary" className="capitalize">
          {i}
        </Badge>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {!readOnly && <span className="text-destructive">*</span>}
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} />
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="shadcn-scope max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {title}
            <button onClick={onCancel} aria-label="close">
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
