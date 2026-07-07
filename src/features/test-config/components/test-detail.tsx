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
  useBiomarkerOptions,
  useDeleteTest,
  useTest,
  useToggleTest,
  useUpdateTest,
} from "../test-config.queries";
import {
  categoriesForReportFormat,
  REPORT_FORMATS,
  RESULTING_MODES,
  SAMPLE_COLLECTION_DEVICES,
  SAMPLE_TYPES,
  type Option,
} from "../test-options";
import type { Test } from "../test-config.types";
import AssignLabCard from "./assign-lab-card";
import PanelCodes from "./panel-codes";
import PanelReportType from "./panel-report-type";
import TestAttachments from "./test-attachments";

const yesNo = (v?: boolean | null) => (v ? "Yes" : "No");

export default function TestDetail({ testId }: { testId: number }) {
  const router = useRouter();
  const { data: test, isLoading, isError } = useTest(testId);
  const toggle = useToggleTest();
  const del = useDeleteTest();
  const [editOpen, setEditOpen] = useState(false);

  const { data: biomarkerOptions = [] } = useBiomarkerOptions();
  const biomarkerName = useMemo(() => {
    const m = new Map<number, string>();
    biomarkerOptions.forEach((b) => m.set(b.id, b.name ?? b.code ?? `#${b.id}`));
    return m;
  }, [biomarkerOptions]);

  if (isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[50dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !test) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link
          href="/test-configuration?active-tab=panel"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-muted-foreground">Panel not found.</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (!window.confirm(`Delete panel "${test.name ?? test.code ?? test.id}"?`)) return;
    del.mutate(test.id, {
      onSuccess: () => {
        toast.success("Panel deleted.");
        router.push("/test-configuration?active-tab=panel");
      },
      onError: (e) => toast.error(e?.message ?? "Could not delete panel."),
    });
  };

  const stateReporting = (test.stateReporting ?? {}) as Record<string, unknown>;

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link
        href="/test-configuration?active-tab=panel"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{test.name ?? `Panel #${test.id}`}</h2>
              {test.status && <Badge variant="outline">{humanizeKey(test.status)}</Badge>}
              <Badge variant={test.isActive ? "success" : "outline"}>
                {test.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Panel Code" value={test.code} />
              <DetailField label="Sample Type" value={test.sampleType} />
              <DetailField label="Category" value={test.testCategory} />
              <DetailField
                label="Created On"
                value={test.createdAt ? formatDateTime(test.createdAt) : undefined}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={Boolean(test.isActive)}
                onCheckedChange={() => toggle.mutate(test.id)}
                disabled={toggle.isPending}
              />{" "}
              Active
            </label>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-destructive"
              onClick={handleDelete}
              disabled={del.isPending}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Tabs defaultValue="details">
          <TabsList className="w-full overflow-x-auto px-2">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="report">Report Configuration</TabsTrigger>
            <TabsTrigger value="reportType">Report Type</TabsTrigger>
            <TabsTrigger value="codes">ICD / CPT</TabsTrigger>
            <TabsTrigger value="labs">Assigned Labs</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="details" className="mt-0">
              <DetailSection title="Basic Details">
                <DetailField label="Panel Name" value={test.name} />
                <DetailField label="Panel Code" value={test.code} />
                <DetailField label="Sample Type" value={test.sampleType} />
                <DetailField label="Sample Collection Device" value={test.sampleCollectionDeviceName} />
                <DetailField label="Sample Quantity" value={test.sampleQuantity} />
                <DetailField label="Report Format" value={test.reportFormat} />
                <DetailField label="Panel Category" value={test.testCategory} />
                <DetailField label="Resulting Mode" value={test.resultingMode} />
                <DetailField label="Description" value={test.description} />
              </DetailSection>

              <DetailSection title="Tests">
                <div className="col-span-full flex flex-wrap gap-2">
                  {test.biomarkerIds && test.biomarkerIds.length > 0 ? (
                    test.biomarkerIds.map((id) => (
                      <Badge key={id} variant="secondary">
                        {biomarkerName.get(id) ?? `#${id}`}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </DetailSection>
            </TabsContent>

            <TabsContent value="report" className="mt-0">
              <DetailSection title="Intake & State Reporting">
                <DetailField label="Intake Form Required" value={yesNo(test.isIntakeFormRequired)} />
                <DetailField label="State Reporting Required" value={yesNo(test.isStateReportingRequired)} />
                <DetailField label="Bulk Import Required" value={yesNo(test.isBulkImportRequired)} />
                {test.isStateReportingRequired && (
                  <>
                    <DetailField
                      label="Reporting Schedule"
                      value={stateReporting.reportingSchedule as string | undefined}
                    />
                    <DetailField
                      label="State Reporting URL"
                      value={stateReporting.stateReportingUrl as string | undefined}
                    />
                    <DetailField
                      label="LOINC Panel Name"
                      value={stateReporting.loincName as string | undefined}
                    />
                    <DetailField
                      label="LOINC Specimen Code"
                      value={stateReporting.loincCode as string | undefined}
                    />
                  </>
                )}
              </DetailSection>
            </TabsContent>

            <TabsContent value="reportType" className="mt-0">
              <PanelReportType test={test} />
            </TabsContent>

            <TabsContent value="codes" className="mt-0">
              <PanelCodes test={test} />
            </TabsContent>

            <TabsContent value="labs" className="mt-0">
              <AssignLabCard kind="tests" entityId={test.id} />
            </TabsContent>

            <TabsContent value="attachments" className="mt-0">
              <TestAttachments testId={test.id} attachments={test.attachments ?? []} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {editOpen && <EditTestDialog test={test} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

function EditTestDialog({ test, onClose }: { test: Test; onClose: () => void }) {
  const [name, setName] = useState(test.name ?? "");
  const [code, setCode] = useState(test.code ?? "");
  const [sampleType, setSampleType] = useState(test.sampleType ?? "");
  const [device, setDevice] = useState(test.sampleCollectionDeviceName ?? "");
  const [sampleQuantity, setSampleQuantity] = useState(test.sampleQuantity ?? "");
  const [reportFormat, setReportFormat] = useState(test.reportFormat ?? "");
  const [testCategory, setTestCategory] = useState(test.testCategory ?? "");
  const [resultingMode, setResultingMode] = useState(test.resultingMode ?? "");
  const [description, setDescription] = useState(test.description ?? "");
  const [biomarkerIds, setBiomarkerIds] = useState<string[]>(
    (test.biomarkerIds ?? []).map(String),
  );
  const update = useUpdateTest();
  const { data: biomarkerOptions = [] } = useBiomarkerOptions();

  const categoryOptions = useMemo(() => categoriesForReportFormat(reportFormat), [reportFormat]);
  const valid = useMemo(
    () => name.trim() !== "" && code.trim().length >= 3,
    [name, code],
  );

  const submit = () =>
    update.mutate(
      {
        id: test.id,
        body: {
          name: name.trim(),
          code: code.trim(),
          sampleType: sampleType || null,
          sampleCollectionDeviceName: device || null,
          sampleQuantity: sampleQuantity.trim() || null,
          reportFormat: reportFormat || null,
          testCategory: testCategory || null,
          resultingMode: resultingMode || null,
          description: description.trim() || null,
          biomarkerIds: biomarkerIds.map(Number),
        },
      },
      {
        onSuccess: () => {
          toast.success("Panel updated.");
          onClose();
        },
      },
    );

  return (
    <Dialog open onOpenChange={(o) => !o && !update.isPending && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Panel</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Panel Name <span className="text-destructive">*</span>
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))} />
            </div>
            <div className="space-y-1.5">
              <Label>
                Panel Code <span className="text-destructive">*</span>
              </Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              />
              <p className="text-xs text-muted-foreground">3–4 characters</p>
            </div>
            <SelectField label="Sample Type" value={sampleType} onChange={setSampleType} options={SAMPLE_TYPES} />
            <SelectField
              label="Sample Collection Device"
              value={device}
              onChange={setDevice}
              options={SAMPLE_COLLECTION_DEVICES}
            />
            <div className="space-y-1.5">
              <Label>Sample Quantity</Label>
              <Input value={sampleQuantity} onChange={(e) => setSampleQuantity(e.target.value)} placeholder="e.g. 3 mL" />
            </div>
            <SelectField
              label="Report Format"
              value={reportFormat}
              onChange={(v) => {
                setReportFormat(v);
                setTestCategory("");
              }}
              options={REPORT_FORMATS}
            />
            <SelectField
              label="Panel Category"
              value={testCategory}
              onChange={setTestCategory}
              options={categoryOptions}
              disabled={reportFormat === ""}
            />
            <SelectField
              label="Resulting Mode"
              value={resultingMode}
              onChange={setResultingMode}
              options={RESULTING_MODES}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Test(s)</Label>
            <MultiCombobox
              options={biomarkerOptions.map((b) => ({
                value: String(b.id),
                label: b.name ?? `#${b.id}`,
                sublabel: b.code ?? undefined,
              }))}
              value={biomarkerIds}
              onChange={setBiomarkerIds}
              placeholder={biomarkerOptions.length === 0 ? "No active tests" : "Select tests"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {update.isError && (
            <Alert variant="destructive">{update.error?.message ?? "Failed to update panel."}</Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || update.isPending} className="gap-1.5">
            {update.isPending && <Spinner className="h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.code} value={o.code}>
              {o.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
