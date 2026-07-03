"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Alert } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";
import { useLabLiteList } from "@/features/lab/lab.queries";
import {
  useDepartmentOptions,
  useInstrumentOptions,
  useReagentOptions,
} from "@/features/lab-os/lab-os.queries";

import {
  useBiomarkerOptions,
  useCptCodeOptions,
  useCreateTest,
  useIcdCodeOptions,
  useUpdateTest,
} from "../test-config.queries";
import {
  categoriesForReportFormat,
  REPORTING_SCHEDULES,
  REPORT_FORMATS,
  RESULTING_MODES,
  SAMPLE_COLLECTION_DEVICES,
  SAMPLE_TYPES,
} from "../test-options";

const STEPS = ["Basic Details", "Report Configuration", "Report Type", "Assign Lab"];

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

const LAYOUTS = [
  { title: "Standard (single table)", code: "layout1" },
  { title: "Grouped tables", code: "layout3" },
  { title: "Quantitative", code: "layout5" },
];

export default function TestCreateWizard() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(INITIAL);
  const [testId, setTestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const create = useCreateTest();
  const update = useUpdateTest();

  const biomarkersQ = useBiomarkerOptions();
  const departmentsQ = useDepartmentOptions();
  const reagentsQ = useReagentOptions();
  const instrumentsQ = useInstrumentOptions();
  const icdQ = useIcdCodeOptions();
  const cptQ = useCptCodeOptions();
  const labsQ = useLabLiteList();

  const categoryOptions = useMemo(() => categoriesForReportFormat(form.reportFormat), [form.reportFormat]);

  const step1Valid =
    form.name.trim() !== "" &&
    form.code.trim().length >= 3 &&
    form.sampleType !== "" &&
    form.sampleCollectionDeviceName !== "" &&
    form.sampleQuantity.trim() !== "" &&
    form.reportFormat !== "" &&
    form.testCategory !== "" &&
    form.biomarkerIds.length > 0 &&
    form.departmentIds.length > 0 &&
    form.reagentIds.length > 0 &&
    form.instrumentIds.length > 0 &&
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
      const test = await create.mutateAsync(payload);
      setTestId(test.id);
      setStep(1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not create the test.");
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

  const handleFinish = async () => {
    await saveStep({ labIds: form.labIds, status: "active" }, step);
    router.push("/test-configuration?active-tab=test");
  };

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">Adding Test</h2>

      <Stepper steps={STEPS} activeStep={step} />

      <Card className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-3">
            {error}
          </Alert>
        )}

        {step === 0 && (
          <div className="flex flex-col gap-5">
            <DetailSection title="Basic Details">
              <div className={GRID2}>
                <div className="space-y-1.5">
                  <Label>Test Name *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value.slice(0, 50))} />
                  <p className="text-xs text-muted-foreground">{form.name.length}/50</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Test Code *</Label>
                  <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase().slice(0, 4))} />
                  <p className="text-xs text-muted-foreground">3–4 characters</p>
                </div>
                <SelectField label="Sample Type" value={form.sampleType} onChange={(v) => set("sampleType", v)} options={SAMPLE_TYPES} />
                <SelectField label="Sample Collection Device" value={form.sampleCollectionDeviceName} onChange={(v) => set("sampleCollectionDeviceName", v)} options={SAMPLE_COLLECTION_DEVICES} />
                <div className="space-y-1.5">
                  <Label>Sample Quantity *</Label>
                  <Input value={form.sampleQuantity} onChange={(e) => set("sampleQuantity", e.target.value)} placeholder="e.g. 3 mL" />
                </div>
                <SelectField label="Report Type" value={form.reportFormat} onChange={(v) => { set("reportFormat", v); set("testCategory", ""); }} options={REPORT_FORMATS} />
                <SelectField label="Test Category" value={form.testCategory} onChange={(v) => set("testCategory", v)} options={categoryOptions} disabled={form.reportFormat === ""} />
                <SelectField label="Resulting Mode" value={form.resultingMode} onChange={(v) => set("resultingMode", v)} options={RESULTING_MODES} />
              </div>

              <MultiIdSelect
                label="Select Test(s) / Biomarkers"
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
                Set an ordering limit for this test
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
          <div className="flex flex-col gap-5">
            <DetailSection title="Intake & State Reporting">
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

            <div className="h-px bg-border" />

            <DetailSection title="Billing Codes">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isIcdCodeRequired} onCheckedChange={(c) => set("isIcdCodeRequired", c)} />
                ICD codes required
              </label>
              {form.isIcdCodeRequired && (
                <MultiIdSelect
                  label="ICD Code(s)"
                  options={(icdQ.data ?? []).map((c) => ({
                    id: c.id,
                    label: `${"icdCode" in c ? c.icdCode : c.id}${c.description ? ` — ${c.description}` : ""}`,
                  }))}
                  value={form.icdCodes}
                  onChange={(v) => set("icdCodes", v)}
                  loading={icdQ.isLoading}
                />
              )}
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isCptCodeRequired} onCheckedChange={(c) => set("isCptCodeRequired", c)} />
                CPT codes required
              </label>
              {form.isCptCodeRequired && (
                <MultiIdSelect
                  label="CPT Code(s)"
                  options={(cptQ.data ?? []).map((c) => ({
                    id: c.id,
                    label: `${c.cptCode ?? `#${c.id}`}${c.description ? ` — ${c.description}` : ""}`,
                  }))}
                  value={form.cptCodes}
                  onChange={(v) => set("cptCodes", v)}
                  loading={cptQ.isLoading}
                />
              )}
            </DetailSection>
          </div>
        )}

        {step === 2 && (
          <DetailSection title="Report Layout">
            <SelectField label="Report Layout" value={form.layout} onChange={(v) => set("layout", v)} options={LAYOUTS} />
            <div className="space-y-1.5">
              <Label>Disclaimer</Label>
              <Textarea value={form.disclaimer} onChange={(e) => set("disclaimer", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Foot Note</Label>
              <Textarea value={form.footNote} onChange={(e) => set("footNote", e.target.value)} />
            </div>
            <Alert>
              The full report designer (per-table biomarker grouping, pathogen / resistance-gene
              blocks) is captured in <code>testLayoutDetails</code>; this step seeds the layout,
              disclaimer and footnote.
            </Alert>
          </DetailSection>
        )}

        {step === 3 && (
          <DetailSection title="Assign Lab">
            <MultiIdSelect
              label="Lab(s)"
              options={(labsQ.data ?? []).map((l) => ({ id: l.id, label: l.name ?? l.code ?? `#${l.id}` }))}
              value={form.labIds}
              onChange={(v) => set("labIds", v)}
              loading={labsQ.isLoading}
            />
            <Alert>
              Selecting labs makes this test orderable there. Persisted on the test record; a
              dedicated lab–test mapping service is a later migration.
            </Alert>
          </DetailSection>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/test-configuration?active-tab=test" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
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
            <Button
              disabled={busy}
              className="min-w-[130px] gap-1.5"
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
                    isIcdCodeRequired: form.isIcdCodeRequired,
                    icdCodes: form.icdCodes,
                    isCptCodeRequired: form.isCptCodeRequired,
                    cptCodes: form.cptCodes,
                  },
                  2,
                )
              }
            >
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? "Saving…" : "Next"}
            </Button>
          )}
          {step === 2 && (
            <Button
              disabled={busy}
              className="min-w-[130px] gap-1.5"
              onClick={() =>
                saveStep(
                  { testLayoutDetails: [{ layout: form.layout, disclaimer: form.disclaimer, footNote: form.footNote }] },
                  3,
                )
              }
            >
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? "Saving…" : "Next"}
            </Button>
          )}
          {step === 3 && (
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
