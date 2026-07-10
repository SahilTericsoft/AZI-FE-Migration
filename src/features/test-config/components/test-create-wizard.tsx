"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Paperclip, Trash2, Upload } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MultiCombobox } from "@/components/ui/combobox";
import { DetailSection } from "@/components/ui/detail";
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
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";
import { labApi } from "@/features/lab/lab.api";
import { useLabLiteList } from "@/features/lab/lab.queries";
import {
  useDepartmentOptions,
  useInstrumentOptions,
  useReagentOptions,
} from "@/features/lab-os/lab-os.queries";

import { testConfigApi } from "../test-config.api";
import {
  devicesForSampleType,
  useBiomarkerOptions,
  useCptCodeOptions,
  useCreateTest,
  useIcdCodeOptions,
  useSampleTypesWithDevices,
  useUpdateTest,
} from "../test-config.queries";
import {
  categoriesForReportFormat,
  REPORTING_SCHEDULES,
  REPORT_FORMATS,
  RESULTING_MODES,
} from "../test-options";
import type { Attachment } from "../test-config.types";
import ReportTypeDesigner, {
  emptyReportLayout,
  type ReportLayoutValue,
} from "./report-type-designer";

const STEPS = [
  "Basic Details",
  "Report Type",
  "ICD Code",
  "CPT Code",
  "Configuration",
  "Assign Lab",
  "Attachments",
];

interface WizardState {
  name: string;
  code: string;
  sampleType: string;
  sampleCollectionDeviceName: string;
  sampleQuantity: string;
  reportFormat: string;
  testCategory: string;
  biomarkerIds: number[];
  departmentIds: number[];
  reagentIds: number[];
  instrumentIds: number[];
  resultingMode: string;
  hasOrderingLimit: boolean;
  maxLimit: string;
  alertLimit: string;
  isIntakeFormRequired: boolean;
  isStateReportingRequired: boolean;
  reportingSchedule: string;
  stateReportingUrl: string;
  loincName: string;
  loincCode: string;
  isBulkImportRequired: boolean;
  isIcdCodeRequired: boolean;
  icdCodes: number[];
  isCptCodeRequired: boolean;
  cptCodes: number[];
  layout: string;
  disclaimer: string;
  footNote: string;
  labIds: number[];
}

const INITIAL: WizardState = {
  name: "", code: "", sampleType: "", sampleCollectionDeviceName: "", sampleQuantity: "",
  reportFormat: "", testCategory: "", biomarkerIds: [], departmentIds: [], reagentIds: [],
  instrumentIds: [], resultingMode: "", hasOrderingLimit: false, maxLimit: "", alertLimit: "",
  isIntakeFormRequired: false, isStateReportingRequired: false, reportingSchedule: "",
  stateReportingUrl: "", loincName: "", loincCode: "", isBulkImportRequired: false,
  isIcdCodeRequired: false, icdCodes: [], isCptCodeRequired: false, cptCodes: [],
  layout: "layout1", disclaimer: "", footNote: "", labIds: [],
};

export default function TestCreateWizard() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(INITIAL);
  const [reportLayout, setReportLayout] = useState<ReportLayoutValue>(emptyReportLayout());
  const [testId, setTestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Panel Code: auto-derive from the name (legacy behaviour — first 4 chars,
  // uppercased) until the user has typed a 4-char code of their own.
  const handleNameChange = (raw: string) => {
    const name = raw.slice(0, 50);
    setForm((f) => {
      const next = { ...f, name };
      if (name.length >= 3 && f.code.length < 4) {
        next.code = name.slice(0, 4).toUpperCase();
      }
      return next;
    });
  };

  // Live uniqueness check against the backend (`/tests/check-code`), debounced.
  const [codeStatus, setCodeStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  useEffect(() => {
    const code = form.code.trim();
    if (code.length < 3) {
      setCodeStatus("idle");
      return;
    }
    setCodeStatus("checking");
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const existing = (await testConfigApi.tests.checkCode(code)) as
          | { id?: number }
          | null;
        // A match on the panel we are currently editing (resume) is not a clash.
        const taken = !!existing && existing.id !== testId;
        if (!cancelled) setCodeStatus(taken ? "taken" : "available");
      } catch {
        if (!cancelled) setCodeStatus("idle");
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [form.code, testId]);

  const create = useCreateTest();
  const update = useUpdateTest();

  const biomarkersQ = useBiomarkerOptions();
  const departmentsQ = useDepartmentOptions();
  const reagentsQ = useReagentOptions();
  const instrumentsQ = useInstrumentOptions();
  const icdQ = useIcdCodeOptions();
  const cptQ = useCptCodeOptions();
  const labsQ = useLabLiteList();

  // Sample types + collection devices from the backend (legacy linkage).
  const sampleTypesQ = useSampleTypesWithDevices();
  const sampleTypeOptions = useMemo(
    () => (sampleTypesQ.data ?? []).map((s) => ({ title: s.sampleType, code: s.sampleType.toLowerCase() })),
    [sampleTypesQ.data],
  );
  const deviceOptions = useMemo(
    () => devicesForSampleType(form.sampleType, sampleTypesQ.data),
    [form.sampleType, sampleTypesQ.data],
  );

  const categoryOptions = useMemo(() => categoriesForReportFormat(form.reportFormat), [form.reportFormat]);

  // The panel's selected tests (biomarkers) are the options for report blocks.
  const reportTestOptions = useMemo(
    () =>
      form.biomarkerIds.map((id) => {
        const b = (biomarkersQ.data ?? []).find((x) => x.id === id);
        return { id, label: b?.name ?? b?.code ?? `#${id}` };
      }),
    [form.biomarkerIds, biomarkersQ.data],
  );

  // Dept/Reagent/Analyser come from Lab-OS reference data with no management
  // screen yet — captured when present but not blocking.
  const step1Valid =
    form.name.trim() !== "" &&
    form.code.trim().length >= 3 &&
    codeStatus !== "taken" &&
    form.sampleType !== "" &&
    form.sampleCollectionDeviceName !== "" &&
    form.sampleQuantity.trim() !== "" &&
    form.reportFormat !== "" &&
    form.testCategory !== "" &&
    form.biomarkerIds.length > 0 &&
    form.resultingMode !== "";

  const busy = create.isPending || update.isPending;

  const handleCreateBasic = async () => {
    setError(null);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      code: form.code.trim(),
      sampleType: form.sampleType,
      sampleCollectionDeviceName: form.sampleCollectionDeviceName,
      sampleQuantity: form.sampleQuantity.trim(),
      reportFormat: form.reportFormat,
      testCategory: form.testCategory,
      resultingMode: form.resultingMode,
      biomarkerIds: form.biomarkerIds,
      departmentIds: form.departmentIds,
      reagentIds: form.reagentIds,
      instrumentIds: form.instrumentIds,
      hasOrderingLimit: form.hasOrderingLimit,
      ...(form.hasOrderingLimit ? { maxLimit: Number(form.maxLimit), alertLimit: Number(form.alertLimit) } : {}),
      loginUserId: user?.id,
    };
    try {
      const test = testId
        ? await update.mutateAsync({ id: testId, body: payload })
        : await create.mutateAsync(payload);
      setTestId(test.id);
      setStep(1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not create the panel.");
    }
  };

  const saveStep = async (fields: Record<string, unknown>, nextStep: number) => {
    if (testId == null) return;
    setError(null);
    try {
      await update.mutateAsync({ id: testId, body: fields });
      setStep(nextStep);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save.");
    }
  };

  const saveAssignLab = async () => {
    if (testId == null) return;
    setError(null);
    try {
      await labApi.assignments.setForEntity("tests", testId, form.labIds);
      setStep(6);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save lab assignments.");
    }
  };

  const handleFinish = async () => {
    if (testId == null) return;
    setError(null);
    try {
      await update.mutateAsync({ id: testId, body: { status: "active" } });
      toast.success("Panel saved.");
      router.push("/test-configuration?active-tab=panel");
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not finish.");
    }
  };

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">Adding Panel</h2>

      <Stepper steps={STEPS} activeStep={step} />

      <Card className="p-6">
        {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}

        {step === 0 && (
          <div className="flex flex-col gap-5">
            <DetailSection title="Basic Details">
              <div className={GRID2}>
                <div className="space-y-1.5">
                  <Label>Panel Name *</Label>
                  <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{form.name.length}/50</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Panel Code *</Label>
                  <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase().slice(0, 4))} />
                  {codeStatus === "checking" ? (
                    <p className="text-xs text-muted-foreground">Checking availability…</p>
                  ) : codeStatus === "taken" ? (
                    <p className="text-xs text-destructive">This code already exists.</p>
                  ) : codeStatus === "available" ? (
                    <p className="text-xs text-emerald-600">Code available.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">3–4 characters</p>
                  )}
                </div>
                <SelectField label="Sample Type" value={form.sampleType} onChange={(v) => { set("sampleType", v); set("sampleCollectionDeviceName", ""); }} options={sampleTypeOptions} />
                <SelectField label="Sample Collection Device" value={form.sampleCollectionDeviceName} onChange={(v) => set("sampleCollectionDeviceName", v)} options={deviceOptions} disabled={form.sampleType === ""} />
                <div className="space-y-1.5">
                  <Label>Sample Quantity *</Label>
                  <Input value={form.sampleQuantity} onChange={(e) => set("sampleQuantity", e.target.value)} placeholder="e.g. 3 mL" />
                </div>
                <SelectField label="Report Type" value={form.reportFormat} onChange={(v) => { set("reportFormat", v); set("testCategory", ""); }} options={REPORT_FORMATS} />
                <SelectField label="Test Category" value={form.testCategory} onChange={(v) => set("testCategory", v)} options={categoryOptions} disabled={form.reportFormat === ""} />
                <SelectField label="Resulting Mode" value={form.resultingMode} onChange={(v) => set("resultingMode", v)} options={RESULTING_MODES} />
              </div>

              <MultiIdSelect
                label="Select Test(s)"
                options={(biomarkersQ.data ?? []).map((b) => ({ id: b.id, label: b.name ?? b.code ?? `#${b.id}` }))}
                value={form.biomarkerIds}
                onChange={(v) => set("biomarkerIds", v)}
                loading={biomarkersQ.isLoading}
              />

              <div className={GRID2}>
                <MultiIdSelect label="Department" options={(departmentsQ.data ?? []).map((d) => ({ id: d.id, label: d.name ?? `#${d.id}` }))} value={form.departmentIds} onChange={(v) => set("departmentIds", v)} loading={departmentsQ.isLoading} />
                <MultiIdSelect label="Reagent" options={(reagentsQ.data ?? []).map((r) => ({ id: r.id, label: r.name ?? `#${r.id}` }))} value={form.reagentIds} onChange={(v) => set("reagentIds", v)} loading={reagentsQ.isLoading} />
                <MultiIdSelect label="Analyser" options={(instrumentsQ.data ?? []).map((i) => ({ id: i.id, label: i.instrument ?? `#${i.id}` }))} value={form.instrumentIds} onChange={(v) => set("instrumentIds", v)} loading={instrumentsQ.isLoading} />
              </div>
            </DetailSection>

            <DetailSection title="Ordering Limits">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.hasOrderingLimit} onCheckedChange={(c) => set("hasOrderingLimit", c)} />
                Set an ordering limit for this panel
              </label>
              {form.hasOrderingLimit && (
                <div className={GRID2}>
                  <div className="space-y-1.5">
                    <Label>Max Limit</Label>
                    <Input type="number" value={form.maxLimit} onChange={(e) => set("maxLimit", e.target.value)} />
                    <p className="text-xs text-muted-foreground">Max 10</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Alert Limit</Label>
                    <Input type="number" value={form.alertLimit} onChange={(e) => set("alertLimit", e.target.value)} />
                    <p className="text-xs text-muted-foreground">≤ Max Limit</p>
                  </div>
                </div>
              )}
            </DetailSection>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold">Report Type</h3>
            <ReportTypeDesigner
              value={reportLayout}
              onChange={setReportLayout}
              testOptions={reportTestOptions}
              testName={form.name || undefined}
            />
          </div>
        )}

        {step === 2 && (
          <DetailSection title="ICD Code">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isIcdCodeRequired} onCheckedChange={(c) => set("isIcdCodeRequired", c)} />
              ICD codes required
            </label>
            {form.isIcdCodeRequired && (
              <MultiIdSelect
                label="ICD Code(s)"
                options={(icdQ.data ?? []).map((c) => ({ id: c.id, label: `${"icdCode" in c ? c.icdCode : c.id}${c.description ? ` — ${c.description}` : ""}` }))}
                value={form.icdCodes}
                onChange={(v) => set("icdCodes", v)}
                loading={icdQ.isLoading}
              />
            )}
          </DetailSection>
        )}

        {step === 3 && (
          <DetailSection title="CPT Code">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isCptCodeRequired} onCheckedChange={(c) => set("isCptCodeRequired", c)} />
              CPT codes required
            </label>
            {form.isCptCodeRequired && (
              <MultiIdSelect
                label="CPT Code(s)"
                options={(cptQ.data ?? []).map((c) => ({ id: c.id, label: `${c.cptCode ?? `#${c.id}`}${c.description ? ` — ${c.description}` : ""}` }))}
                value={form.cptCodes}
                onChange={(v) => set("cptCodes", v)}
                loading={cptQ.isLoading}
              />
            )}
          </DetailSection>
        )}

        {step === 4 && (
          <DetailSection title="Configuration">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isIntakeFormRequired} onCheckedChange={(c) => set("isIntakeFormRequired", c)} />
              Intake form required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isStateReportingRequired} onCheckedChange={(c) => set("isStateReportingRequired", c)} />
              State reporting required
            </label>
            {form.isStateReportingRequired && (
              <div className={GRID2}>
                <SelectField label="Reporting Schedule" value={form.reportingSchedule} onChange={(v) => set("reportingSchedule", v)} options={REPORTING_SCHEDULES} />
                <TextInput label="State Reporting URL" value={form.stateReportingUrl} onChange={(v) => set("stateReportingUrl", v)} />
                <TextInput label="LOINC Panel Name" value={form.loincName} onChange={(v) => set("loincName", v)} />
                <TextInput label="LOINC Specimen Code" value={form.loincCode} onChange={(v) => set("loincCode", v)} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isBulkImportRequired} onCheckedChange={(c) => set("isBulkImportRequired", c)} />
              Bulk import required
            </label>
          </DetailSection>
        )}

        {step === 5 && (
          <DetailSection title="Assign Lab">
            <MultiIdSelect
              label="Lab(s)"
              options={(labsQ.data ?? []).map((l) => ({ id: l.id, label: l.name ?? l.code ?? `#${l.id}` }))}
              value={form.labIds}
              onChange={(v) => set("labIds", v)}
              loading={labsQ.isLoading}
            />
            <Alert>Selecting labs makes this panel orderable there.</Alert>
          </DetailSection>
        )}

        {step === 6 && testId != null && <AttachmentsStep testId={testId} />}
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/test-configuration?active-tab=panel" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={busy} className="min-w-[110px]">
              Back
            </Button>
          )}
          {step === 0 && (
            <Button onClick={handleCreateBasic} disabled={!step1Valid || busy} className="min-w-[130px] gap-1.5">
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? "Saving…" : "Proceed"}
            </Button>
          )}
          {step === 1 && (
            <StepNext
              busy={busy}
              onClick={() =>
                saveStep(
                  {
                    testLayoutDetails: [
                      {
                        layout: reportLayout.layout,
                        disclaimer: reportLayout.disclaimer,
                        footNote: reportLayout.footNote,
                        blocks: reportLayout.blocks,
                      },
                    ],
                  },
                  2,
                )
              }
            />
          )}
          {step === 2 && (
            <StepNext busy={busy} onClick={() => saveStep({ isIcdCodeRequired: form.isIcdCodeRequired, icdCodes: form.icdCodes }, 3)} />
          )}
          {step === 3 && (
            <StepNext busy={busy} onClick={() => saveStep({ isCptCodeRequired: form.isCptCodeRequired, cptCodes: form.cptCodes }, 4)} />
          )}
          {step === 4 && (
            <StepNext
              busy={busy}
              onClick={() =>
                saveStep(
                  {
                    isIntakeFormRequired: form.isIntakeFormRequired,
                    isStateReportingRequired: form.isStateReportingRequired,
                    isBulkImportRequired: form.isBulkImportRequired,
                    stateReporting: form.isStateReportingRequired
                      ? {
                          reportingSchedule: form.reportingSchedule,
                          stateReportingUrl: form.stateReportingUrl,
                          loincName: form.loincName,
                          loincCode: form.loincCode,
                        }
                      : null,
                  },
                  5,
                )
              }
            />
          )}
          {step === 5 && <StepNext busy={busy} onClick={saveAssignLab} />}
          {step === 6 && (
            <Button onClick={handleFinish} disabled={busy} className="min-w-[140px] gap-1.5">
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? "Saving…" : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepNext({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <Button disabled={busy} className="min-w-[130px] gap-1.5" onClick={onClick}>
      {busy && <Spinner className="h-4 w-4" />}
      {busy ? "Saving…" : "Next"}
    </Button>
  );
}

function AttachmentsStep({ testId }: { testId: number }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const label = name.trim() || file.name;
    setUploading(true);
    try {
      const record = await testConfigApi.testAttachments.upload(testId, label, file);
      setItems((prev) => [...prev, record]);
      setName("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Attachment uploaded.");
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Attachment upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (index: number) => {
    try {
      await testConfigApi.testAttachments.remove(testId, index);
      setItems((prev) => prev.filter((_, i) => i !== index));
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not remove attachment.");
    }
  };

  return (
    <DetailSection title="Attachments">
      <div className="col-span-full flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Attachment Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Method sheet" />
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />} Upload
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attachments uploaded yet (optional).</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <a href={a.secureUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                  <Paperclip className="h-4 w-4" /> {a.attachmentName}
                  {a.mimeType && <Badge variant="secondary">{a.mimeType}</Badge>}
                </a>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DetailSection>
  );
}

const GRID2 = "grid grid-cols-1 gap-4 sm:grid-cols-2";

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
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
  options: { title: string; code: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        <span className="text-destructive"> *</span>
      </Label>
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

function MultiIdSelect({
  label,
  options,
  value,
  onChange,
  loading,
}: {
  label: string;
  options: { id: number; label: string }[];
  value: number[];
  onChange: (ids: number[]) => void;
  loading?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <MultiCombobox
        options={options.map((o) => ({ value: String(o.id), label: o.label }))}
        value={value.map(String)}
        onChange={(v) => onChange(v.map(Number))}
        loading={loading}
        placeholder={`Select ${label.toLowerCase()}`}
      />
    </div>
  );
}
