"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Stepper } from "@/components/ui/stepper";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";

import { useCreateInstrument, useInstrument, useUpdateInstrument } from "../instrument.queries";
import {
  CALIBRATION_TYPES,
  INSTRUMENT_CATEGORIES,
  PLATE_TYPES,
} from "../instrument.types";

const STEPS = ["Instrument Details", "Calibration Details"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const dateOnly = (v?: string | null) => (v ? String(v).slice(0, 10) : "");

export default function InstrumentCreateWizard({ instrumentId: existingId }: { instrumentId?: number } = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const create = useCreateInstrument();
  const update = useUpdateInstrument();

  const continuing = existingId != null;
  const instrumentQ = useInstrument(existingId ?? 0);

  const [step, setStep] = useState(continuing ? 1 : 0);
  const [instrumentId, setInstrumentId] = useState<number | null>(existingId ?? null);
  const [error, setError] = useState<string | null>(null);

  const [info, setInfo] = useState({
    instrument: "", model: "", asset_number: "", serial_number: "", location: "",
    purchase_date: "", manufacturer: "", category: "", isLinked: false, plateType: "",
  });
  const [cal, setCal] = useState({
    last_calibration_date: "", next_calibration_date: "", calibration_frequency: "",
    calibration_type: "", vendor_name: "", vendor_phone_number: "", vendor_email_address: "",
  });

  const setI = (k: keyof typeof info, v: string | boolean) => setInfo((s) => ({ ...s, [k]: v }));
  const setC = (k: keyof typeof cal, v: string) => setCal((s) => ({ ...s, [k]: v }));
  const busy = create.isPending || update.isPending;

  // Continue a draft instrument: prefill both steps from the saved record.
  useEffect(() => {
    const i = instrumentQ.data;
    if (!continuing || !i) return;
    setInfo({
      instrument: i.instrument ?? "", model: i.model ?? "", asset_number: i.asset_number ?? "",
      serial_number: i.serial_number ?? "", location: i.location ?? "", purchase_date: dateOnly(i.purchase_date),
      manufacturer: i.manufacturer ?? "", category: i.category ?? "", isLinked: Boolean(i.isLinked), plateType: i.plateType ?? "",
    });
    setCal({
      last_calibration_date: dateOnly(i.last_calibration_date), next_calibration_date: dateOnly(i.next_calibration_date),
      calibration_frequency: i.calibration_frequency ?? "", calibration_type: i.calibration_type ?? "",
      vendor_name: i.vendor_name ?? "", vendor_phone_number: onlyDigits(i.vendor_phone_number ?? ""),
      vendor_email_address: i.vendor_email_address ?? "",
    });
  }, [continuing, instrumentQ.data]);

  const infoValid =
    info.instrument.trim() && info.model.trim() && info.asset_number.trim() && info.serial_number.trim() &&
    info.location.trim() && info.purchase_date && info.manufacturer.trim() && info.category &&
    (!info.isLinked || info.plateType);

  const saveInfo = async () => {
    setError(null);
    if (!infoValid) { setError("Please fill all required (*) fields."); return; }
    try {
      const body = { ...info, plateType: info.isLinked ? info.plateType : undefined };
      if (instrumentId) {
        await update.mutateAsync({ id: instrumentId, body });
      } else {
        const created = await create.mutateAsync({ ...body, loginUserId: user?.id });
        setInstrumentId(created.id);
      }
      setStep(1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the instrument.");
    }
  };

  const calValid =
    cal.calibration_frequency && cal.calibration_type.trim() && cal.vendor_name.trim() &&
    cal.vendor_phone_number.length === 10 && EMAIL_RE.test(cal.vendor_email_address.trim());

  const finish = async () => {
    setError(null);
    if (!instrumentId) return;
    if (!calValid) { setError("Please complete the calibration details (valid 10-digit phone + email)."); return; }
    try {
      await update.mutateAsync({ id: instrumentId, body: { ...cal, status: "completed" } });
      toast.success("Instrument created.");
      router.push(`/instrument/${instrumentId}`);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save calibration details.");
    }
  };

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">Adding Instrument</h2>
      <Stepper steps={STEPS} activeStep={step} />

      <Card className="p-6">
        {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}

        {step === 0 && (
          <Section>
            <Field label="Instrument Name" required value={info.instrument} onChange={(v) => setI("instrument", v)} />
            <Field label="Model" required value={info.model} onChange={(v) => setI("model", v)} />
            <Field label="Asset Number" required value={info.asset_number} onChange={(v) => setI("asset_number", v)} />
            <Field label="Serial Number" required value={info.serial_number} onChange={(v) => setI("serial_number", v)} />
            <Field label="Location" required value={info.location} onChange={(v) => setI("location", v)} />
            <Field label="Purchase Date" required type="date" value={info.purchase_date} onChange={(v) => setI("purchase_date", v)} />
            <Field label="Manufacturer" required value={info.manufacturer} onChange={(v) => setI("manufacturer", v)} />
            <SelectField label="Instrument Category" required value={info.category} onChange={(v) => setI("category", v)} options={[...INSTRUMENT_CATEGORIES]} placeholder="Select category" />
            <div className="space-y-2">
              <Label>Is this Instrument linked to a plate map?</Label>
              <RadioGroup className="flex gap-6" value={info.isLinked ? "yes" : "no"} onValueChange={(v) => setI("isLinked", v === "yes")}>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> No</label>
              </RadioGroup>
            </div>
            {info.isLinked && (
              <SelectField label="Plate Map Type" required value={info.plateType} onChange={(v) => setI("plateType", v)} options={[...PLATE_TYPES]} placeholder="Select plate type" />
            )}
          </Section>
        )}

        {step === 1 && (
          <Section>
            <Field label="Last Calibration Date" type="date" value={cal.last_calibration_date} onChange={(v) => setC("last_calibration_date", v)} />
            <Field label="Next Calibration Date" type="date" value={cal.next_calibration_date} onChange={(v) => setC("next_calibration_date", v)} />
            <Field label="Calibration Frequency" required value={cal.calibration_frequency} onChange={(v) => setC("calibration_frequency", v)} />
            <SelectField label="Calibration Type" required value={cal.calibration_type} onChange={(v) => setC("calibration_type", v)} options={[...CALIBRATION_TYPES]} placeholder="Select type" />
            <Field label="Vendor Name" required value={cal.vendor_name} onChange={(v) => setC("vendor_name", v)} />
            <PhoneField label="Phone Number" required value={cal.vendor_phone_number} onChange={(v) => setC("vendor_phone_number", v)} />
            <Field label="Vendor Email Address" required type="email" value={cal.vendor_email_address} onChange={(v) => setC("vendor_email_address", v)} />
          </Section>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/instrument" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
        <div className="flex gap-2">
          {step > 0 && <Button variant="outline" onClick={() => setStep(0)} disabled={busy} className="min-w-[110px]">Back</Button>}
          {step === 0 ? (
            <Button onClick={saveInfo} disabled={busy || !infoValid} className="min-w-[120px] gap-1.5">{busy && <Spinner className="h-4 w-4" />}Next</Button>
          ) : (
            <Button onClick={finish} disabled={busy || !calValid} className="min-w-[140px] gap-1.5">{busy && <Spinner className="h-4 w-4" />}Create Instrument</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">{children}</div>;
}

function Field({
  label, value, onChange, required, type,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PhoneField({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground">+1</span>
        <Input inputMode="numeric" value={value} placeholder="10-digit number" onChange={(e) => onChange(onlyDigits(e.target.value).slice(0, 10))} className="rounded-l-none" />
      </div>
    </div>
  );
}

function SelectField({
  label, value, onChange, options, placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
