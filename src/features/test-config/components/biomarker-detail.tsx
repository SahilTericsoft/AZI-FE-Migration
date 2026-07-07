"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MultiCombobox } from "@/components/ui/combobox";
import { DetailField, DetailSection } from "@/components/ui/detail";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";
import { humanizeKey } from "@/lib/format";
import {
  useDepartmentOptions,
  useInstrumentOptions,
  useReagentOptions,
} from "@/features/lab-os/lab-os.queries";

import {
  useBiomarker,
  useBiomarkerConfigs,
  useDeleteBiomarker,
  useToggleBiomarker,
  useUpdateBiomarker,
} from "../test-config.queries";
import { SAMPLE_COLLECTION_DEVICES, SAMPLE_TYPES } from "../test-options";
import type { Biomarker } from "../test-config.types";
import AssignLabCard from "./assign-lab-card";
import BiomarkerConfigStep from "./biomarker-config-step";

function useIdNameMap(options: { id: number; label: string }[]) {
  return useMemo(() => {
    const m = new Map<number, string>();
    options.forEach((o) => m.set(o.id, o.label));
    return m;
  }, [options]);
}

export default function BiomarkerDetail({ biomarkerId }: { biomarkerId: number }) {
  const router = useRouter();
  const { data: biomarker, isLoading, isError } = useBiomarker(biomarkerId);
  const toggle = useToggleBiomarker();
  const del = useDeleteBiomarker();
  const [editOpen, setEditOpen] = useState(false);
  const [editConfig, setEditConfig] = useState(false);

  const departmentsQ = useDepartmentOptions();
  const reagentsQ = useReagentOptions();
  const instrumentsQ = useInstrumentOptions();
  const deptMap = useIdNameMap((departmentsQ.data ?? []).map((d) => ({ id: d.id, label: d.name ?? `#${d.id}` })));
  const reagentMap = useIdNameMap((reagentsQ.data ?? []).map((r) => ({ id: r.id, label: r.name ?? `#${r.id}` })));
  const instrumentMap = useIdNameMap((instrumentsQ.data ?? []).map((i) => ({ id: i.id, label: i.instrument ?? `#${i.id}` })));

  const { data: configs = [] } = useBiomarkerConfigs(biomarkerId);

  if (isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[50dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !biomarker) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/test-configuration?active-tab=test" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-muted-foreground">Test not found.</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (!window.confirm(`Delete test "${biomarker.name ?? biomarker.code ?? biomarker.id}"?`)) return;
    del.mutate(biomarker.id, {
      onSuccess: () => {
        toast.success("Test deleted.");
        router.push("/test-configuration?active-tab=test");
      },
      onError: (e) => toast.error(e?.message ?? "Could not delete test."),
    });
  };

  const isDraft = biomarker.status === "draft";
  const names = (ids: number[] | null | undefined, map: Map<number, string>) =>
    (ids ?? []).map((id) => map.get(id) ?? `#${id}`);

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link href="/test-configuration?active-tab=test" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{biomarker.name ?? `Test #${biomarker.id}`}</h2>
              {biomarker.status && <Badge variant="outline">{humanizeKey(biomarker.status)}</Badge>}
              <Badge variant={biomarker.isActive ? "success" : "outline"}>
                {biomarker.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Code" value={biomarker.code} />
              <DetailField label="Sample Type" value={biomarker.sampleType} />
              <DetailField label="Report Type" value={biomarker.reportFormat} />
              <DetailField label="Created On" value={biomarker.createdAt ? formatDateTime(biomarker.createdAt) : undefined} />
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={Boolean(biomarker.isActive)} onCheckedChange={() => toggle.mutate(biomarker.id)} disabled={toggle.isPending || isDraft} /> Active
            </label>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={handleDelete} disabled={del.isPending}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Tabs defaultValue="details">
          <TabsList className="w-full overflow-x-auto px-2">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="config">Report Configuration</TabsTrigger>
            <TabsTrigger value="reportType">Report Type</TabsTrigger>
            <TabsTrigger value="labs">Assigned Labs</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="details" className="mt-0">
              <DetailSection title="Basic Details">
                <DetailField label="Test Name" value={biomarker.name} />
                <DetailField label="Test Code" value={biomarker.code} />
                <DetailField label="Sample Type" value={biomarker.sampleType} capitalize />
                <DetailField label="Sample Collection Device" value={biomarker.sampleCollectionDeviceName} capitalize />
                <DetailField label="Report Type" value={biomarker.reportFormat} />
              </DetailSection>
              <DetailSection title="Assignments">
                <ChipField label="Department(s)" items={names(biomarker.departmentIds, deptMap)} />
                <ChipField label="Reagent(s)" items={names(biomarker.reagentIds, reagentMap)} />
                <ChipField label="Analyser(s)" items={names(biomarker.instrumentIds, instrumentMap)} />
              </DetailSection>
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              {editConfig ? (
                <BiomarkerConfigStep
                  biomarkerId={biomarker.id}
                  reportFormat={biomarker.reportFormat ?? ""}
                  onDone={() => {
                    setEditConfig(false);
                    toast.success("Report configuration saved.");
                  }}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold">Report Configuration</h3>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditConfig(true)}>
                      <Pencil className="h-4 w-4" /> Edit Configuration
                    </Button>
                  </div>
                  <DetailField
                    label="Configuration Required"
                    value={biomarker.isConfigurationRequired ? "Yes" : "No"}
                  />
                  {configs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No configurations added.</p>
                  ) : (
                    configs.map((c) => (
                      <Card key={c.id} className="p-4">
                        <p className="text-sm font-medium">
                          Gender: <span className="capitalize">{c.gender}</span> · Age: {c.age}
                        </p>
                        <div className="mt-2 flex flex-col gap-1">
                          {(c.rules ?? []).map((r, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              {r.color && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />}
                              <span>
                                {r.expression === "-" ? `${r.value1} – ${r.value2}` : `${r.expression} ${r.value2}`} {r.units}
                                {r.result ? ` → ${r.result}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                        {c.expectedResults && (
                          <p className="mt-2 text-sm"><span className="text-muted-foreground">Expected Result:</span> {c.expectedResults}</p>
                        )}
                        {c.isBiomarkerNoteAvailable && c.biomarkerNotes && (
                          <p className="mt-1 text-sm"><span className="text-muted-foreground">Test Note:</span> {c.biomarkerNotes}</p>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reportType" className="mt-0">
              <DetailSection title="Report Type">
                {biomarker.biomarkerLayoutDetails?.[0] ? (
                  <>
                    <DetailField label="Layout" value={(biomarker.biomarkerLayoutDetails[0] as Record<string, unknown>).layout as string} />
                    <DetailField label="Disclaimer" value={(biomarker.biomarkerLayoutDetails[0] as Record<string, unknown>).disclaimer as string} />
                    <DetailField label="Foot Note" value={(biomarker.biomarkerLayoutDetails[0] as Record<string, unknown>).footNote as string} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No report type configured.</p>
                )}
              </DetailSection>
            </TabsContent>

            <TabsContent value="labs" className="mt-0">
              <AssignLabCard kind="biomarkers" entityId={biomarker.id} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {editOpen && (
        <EditBiomarkerDialog
          biomarker={biomarker}
          departmentOptions={(departmentsQ.data ?? []).map((d) => ({ id: d.id, label: d.name ?? `#${d.id}` }))}
          reagentOptions={(reagentsQ.data ?? []).map((r) => ({ id: r.id, label: r.name ?? `#${r.id}` }))}
          instrumentOptions={(instrumentsQ.data ?? []).map((i) => ({ id: i.id, label: i.instrument ?? `#${i.id}` }))}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

function ChipField({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-sm text-muted-foreground">None</span>
        ) : (
          items.map((n, i) => <Badge key={i} variant="secondary">{n}</Badge>)
        )}
      </div>
    </div>
  );
}

function EditBiomarkerDialog({
  biomarker,
  departmentOptions,
  reagentOptions,
  instrumentOptions,
  onClose,
}: {
  biomarker: Biomarker;
  departmentOptions: { id: number; label: string }[];
  reagentOptions: { id: number; label: string }[];
  instrumentOptions: { id: number; label: string }[];
  onClose: () => void;
}) {
  const [name, setName] = useState(biomarker.name ?? "");
  const [code, setCode] = useState(biomarker.code ?? "");
  const [sampleType, setSampleType] = useState(biomarker.sampleType ?? "");
  const [device, setDevice] = useState(biomarker.sampleCollectionDeviceName ?? "");
  const [description, setDescription] = useState(biomarker.description ?? "");
  const [departmentIds, setDepartmentIds] = useState<string[]>((biomarker.departmentIds ?? []).map(String));
  const [reagentIds, setReagentIds] = useState<string[]>((biomarker.reagentIds ?? []).map(String));
  const [instrumentIds, setInstrumentIds] = useState<string[]>((biomarker.instrumentIds ?? []).map(String));
  const update = useUpdateBiomarker();

  const valid = useMemo(() => name.trim() !== "" && code.trim() !== "", [name, code]);

  const submit = () =>
    update.mutate(
      {
        id: biomarker.id,
        body: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          sampleType: sampleType || null,
          sampleCollectionDeviceName: device || null,
          description: description.trim() || null,
          departmentIds: departmentIds.map(Number),
          reagentIds: reagentIds.map(Number),
          instrumentIds: instrumentIds.map(Number),
        },
      },
      {
        onSuccess: () => {
          toast.success("Test updated.");
          onClose();
        },
      },
    );

  return (
    <Dialog open onOpenChange={(o) => !o && !update.isPending && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Test</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto py-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldInput label="Test Name" required value={name} onChange={setName} />
            <FieldInput label="Test Code" required value={code} onChange={(v) => setCode(v.toUpperCase().slice(0, 4))} />
            <SelectInput label="Sample Type" value={sampleType} onChange={setSampleType} options={SAMPLE_TYPES} />
            <SelectInput label="Sample Collection Device" value={device} onChange={setDevice} options={SAMPLE_COLLECTION_DEVICES} />
          </div>
          <MultiInput label="Department(s)" options={departmentOptions} value={departmentIds} onChange={setDepartmentIds} />
          <MultiInput label="Reagent(s)" options={reagentOptions} value={reagentIds} onChange={setReagentIds} />
          <MultiInput label="Analyser(s)" options={instrumentOptions} value={instrumentIds} onChange={setInstrumentIds} />
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {update.isError && <Alert variant="destructive">{update.error?.message ?? "Failed to update test."}</Alert>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || update.isPending} className="gap-1.5">
            {update.isPending && <Spinner className="h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { title: string; code: string }[] }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.code} value={o.code}>{o.title}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function MultiInput({ label, options, value, onChange }: { label: string; options: { id: number; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <MultiCombobox
        options={options.map((o) => ({ value: String(o.id), label: o.label }))}
        value={value}
        onChange={onChange}
        placeholder={`Select ${label.toLowerCase()}`}
      />
    </div>
  );
}
