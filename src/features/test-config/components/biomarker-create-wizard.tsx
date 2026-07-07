"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
import { Textarea } from "@/components/ui/textarea";
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
import { useBiomarker } from "../test-config.queries";
import { BIOMARKER_REPORT_FORMATS, SAMPLE_COLLECTION_DEVICES, SAMPLE_TYPES } from "../test-options";
import type { Option } from "../test-options";
import BiomarkerConfigStep from "./biomarker-config-step";

const STEPS = ["Basic Details", "Report Configuration", "Report Type", "Assign Lab"];

const LAYOUTS: Option[] = [
  { title: "Standard (single table)", code: "layout1" },
  { title: "Grouped tables", code: "layout3" },
  { title: "Quantitative", code: "layout5" },
];

interface BasicState {
  name: string;
  code: string;
  reportFormat: string;
  sampleType: string;
  sampleCollectionDeviceName: string;
  departmentIds: number[];
  reagentIds: number[];
  instrumentIds: number[];
}

const INITIAL: BasicState = {
  name: "",
  code: "",
  reportFormat: "",
  sampleType: "",
  sampleCollectionDeviceName: "",
  departmentIds: [],
  reagentIds: [],
  instrumentIds: [],
};

/**
 * Add / resume a FE "Test" (backend biomarker). Faithful to the legacy 4-step
 * BiomarkersAdd flow: Basic Details → Report Configuration → Report Type →
 * Assign Lab. Resumable via `?biomarkerId=&step=`.
 */
export default function BiomarkerCreateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const resumeId = searchParams.get("biomarkerId");
  const resumeStep = searchParams.get("step");
  const stepIndex = STEPS.findIndex(
    (s) => s.toLowerCase().replace(/ /g, "-") === resumeStep,
  );

  const [step, setStep] = useState(stepIndex >= 0 ? stepIndex : 0);
  const [form, setForm] = useState<BasicState>(INITIAL);
  const [biomarkerId, setBiomarkerId] = useState<number | null>(
    resumeId ? Number(resumeId) : null,
  );
  const [layout, setLayout] = useState("layout1");
  const [disclaimer, setDisclaimer] = useState("");
  const [footNote, setFootNote] = useState("");
  const [labIds, setLabIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof BasicState>(key: K, value: BasicState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Hydrate when resuming an existing (draft) biomarker.
  const { data: existing } = useBiomarker(biomarkerId);
  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? "",
        code: existing.code ?? "",
        reportFormat: existing.reportFormat ?? "",
        sampleType: existing.sampleType ?? "",
        sampleCollectionDeviceName: existing.sampleCollectionDeviceName ?? "",
        departmentIds: existing.departmentIds ?? [],
        reagentIds: existing.reagentIds ?? [],
        instrumentIds: existing.instrumentIds ?? [],
      });
      if (existing.biomarkerLayoutDetails?.[0]) {
        const l = existing.biomarkerLayoutDetails[0] as Record<string, unknown>;
        setLayout((l.layout as string) ?? "layout1");
        setDisclaimer((l.disclaimer as string) ?? "");
        setFootNote((l.footNote as string) ?? "");
      }
    }
  }, [existing]);

  const departmentsQ = useDepartmentOptions();
  const reagentsQ = useReagentOptions();
  const instrumentsQ = useInstrumentOptions();
  const labsQ = useLabLiteList();

  // Dept/Reagent/Analyser come from Lab-OS reference data that has no management
  // screen yet — they're captured when present but must not hard-block creation.
  const step1Valid =
    form.name.trim() !== "" &&
    form.name.trim().length <= 65 &&
    form.code.trim().length >= 3 &&
    form.code.trim().length <= 4 &&
    form.reportFormat !== "" &&
    form.sampleType !== "" &&
    form.sampleCollectionDeviceName !== "";

  const derivedFlags = useMemo(
    () => ({
      isPocConfigReq: form.reportFormat === "Manual",
      isConfigurationRequired: form.reportFormat === "Quantitative",
    }),
    [form.reportFormat],
  );

  const handleBasicSubmit = async () => {
    setError(null);
    setBusy(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      reportFormat: form.reportFormat,
      sampleType: form.sampleType,
      sampleCollectionDeviceName: form.sampleCollectionDeviceName,
      departmentIds: form.departmentIds,
      reagentIds: form.reagentIds,
      instrumentIds: form.instrumentIds,
      ...derivedFlags,
      loginUserId: user?.id,
    };
    try {
      const saved = biomarkerId
        ? await testConfigApi.biomarkers.update(biomarkerId, payload)
        : await testConfigApi.biomarkers.create(payload);
      setBiomarkerId(saved.id);
      setStep(1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the test.");
    } finally {
      setBusy(false);
    }
  };

  const saveReportType = async () => {
    if (biomarkerId == null) return;
    setError(null);
    setBusy(true);
    try {
      await testConfigApi.biomarkers.update(biomarkerId, {
        biomarkerLayoutDetails: [{ layout, disclaimer, footNote }],
      });
      setStep(3);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the report type.");
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    if (biomarkerId == null) return;
    setError(null);
    setBusy(true);
    try {
      await testConfigApi.biomarkers.update(biomarkerId, { status: "active" });
      await labApi.assignments.setForEntity("biomarkers", biomarkerId, labIds);
      toast.success("Test saved.");
      router.push("/test-configuration?active-tab=test");
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save lab assignments.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">{biomarkerId ? "Edit Test" : "Adding Test"}</h2>

      <Stepper steps={STEPS} activeStep={step} />

      <Card className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-3">
            {error}
          </Alert>
        )}

        {step === 0 && (
          <DetailSection title="Basic Details">
            <div className={GRID2}>
              <div className="space-y-1.5">
                <Label>Test Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 65);
                    set("name", value);
                    // Auto-derive code from the name until it reaches 4 chars.
                    if (value.length >= 3 && form.code.length < 4 && !biomarkerId) {
                      set("code", value.substring(0, 4).toUpperCase());
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">{form.name.length}/65</p>
              </div>
              <div className="space-y-1.5">
                <Label>Test Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase().slice(0, 4))}
                />
                <p className="text-xs text-muted-foreground">
                  3–4 characters. System-generated and immutable.
                </p>
              </div>
              <SelectField
                label="Sample Type"
                value={form.sampleType}
                onChange={(v) => {
                  set("sampleType", v);
                  set("sampleCollectionDeviceName", "");
                }}
                options={SAMPLE_TYPES}
              />
              <SelectField
                label="Sample Collection Device"
                value={form.sampleCollectionDeviceName}
                onChange={(v) => set("sampleCollectionDeviceName", v)}
                options={SAMPLE_COLLECTION_DEVICES}
              />
              <SelectField
                label="Report Type"
                value={form.reportFormat}
                onChange={(v) => set("reportFormat", v)}
                options={BIOMARKER_REPORT_FORMATS}
                disabled={Boolean(biomarkerId)}
              />
              <MultiIdSelect
                label="Department"
                options={(departmentsQ.data ?? []).map((d) => ({ id: d.id, label: d.name ?? `#${d.id}` }))}
                value={form.departmentIds}
                onChange={(v) => set("departmentIds", v)}
                loading={departmentsQ.isLoading}
              />
              <MultiIdSelect
                label="Reagent"
                options={(reagentsQ.data ?? []).map((r) => ({ id: r.id, label: r.name ?? `#${r.id}` }))}
                value={form.reagentIds}
                onChange={(v) => set("reagentIds", v)}
                loading={reagentsQ.isLoading}
              />
              <MultiIdSelect
                label="Analyser"
                options={(instrumentsQ.data ?? []).map((i) => ({ id: i.id, label: i.instrument ?? `#${i.id}` }))}
                value={form.instrumentIds}
                onChange={(v) => set("instrumentIds", v)}
                loading={instrumentsQ.isLoading}
              />
            </div>
            <Alert className="mt-3">
              Note: The code is system-generated and immutable. It cannot be modified or
              regenerated.
            </Alert>
          </DetailSection>
        )}

        {step === 1 && biomarkerId != null && (
          <BiomarkerConfigStep
            biomarkerId={biomarkerId}
            reportFormat={form.reportFormat}
            onDone={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <DetailSection title="Report Type">
            <SelectField label="Report Layout" value={layout} onChange={setLayout} options={LAYOUTS} />
            <div className="space-y-1.5">
              <Label>Disclaimer</Label>
              <Textarea value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Foot Note</Label>
              <Textarea value={footNote} onChange={(e) => setFootNote(e.target.value)} />
            </div>
          </DetailSection>
        )}

        {step === 3 && (
          <DetailSection title="Assign Lab">
            <MultiIdSelect
              label="Lab(s)"
              options={(labsQ.data ?? []).map((l) => ({ id: l.id, label: l.name ?? l.code ?? `#${l.id}` }))}
              value={labIds}
              onChange={setLabIds}
              loading={labsQ.isLoading}
            />
            <Alert>Selecting labs makes this test orderable there.</Alert>
          </DetailSection>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Link
          href="/test-configuration?active-tab=test"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}
        >
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
        <div className="flex gap-2">
          {step > 0 && step !== 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={busy} className="min-w-[110px]">
              Back
            </Button>
          )}
          {step === 0 && (
            <Button onClick={handleBasicSubmit} disabled={!step1Valid || busy} className="min-w-[130px] gap-1.5">
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? "Saving…" : "Proceed"}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={saveReportType} disabled={busy} className="min-w-[130px] gap-1.5">
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
