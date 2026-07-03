"use client";

import { useState, type ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/ui/labeled-input";
import type { ApiError } from "@/core/api/types";

import { useUpdateLab } from "../../lab.queries";
import type { Lab } from "../../lab.types";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-base font-bold">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">{children}</div>
    </div>
  );
}

const EMPTY = {
  name: "", labExternalId: "", npiNumber: "", cliaId: "", capId: "", colaId: "",
  emailId: "", mobileNumber: "", secondaryMobileNumber: "", faxNumber: "",
  addressLine1: "", addressLine2: "", zipcode: "", state: "", city: "",
};
type FormState = typeof EMPTY;

export default function LabDetailsEdit({ lab, onDone }: { lab: Lab; onDone: () => void }) {
  const updateLab = useUpdateLab();
  const [form, setForm] = useState<FormState>({
    ...EMPTY,
    name: lab.name ?? "",
    labExternalId: lab.labExternalId ?? "",
    npiNumber: lab.npiNumber ?? "",
    cliaId: lab.cliaId ?? "",
    capId: lab.capId ?? "",
    colaId: lab.colaId ?? "",
    emailId: lab.emailId ?? "",
    mobileNumber: lab.mobileNumber ?? "",
    secondaryMobileNumber: lab.secondaryMobileNumber ?? "",
    faxNumber: lab.faxNumber ?? "",
    addressLine1: lab.addressLine1 ?? "",
    addressLine2: lab.addressLine2 ?? "",
    zipcode: lab.zipcode ?? "",
    state: lab.state ?? "",
    city: lab.city ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const save = async () => {
    setError(null);
    const required: (keyof FormState)[] = [
      "name", "cliaId", "emailId", "mobileNumber", "addressLine1", "zipcode", "state", "city",
    ];
    if (required.some((k) => !form[k].trim())) {
      setError("Please fill all required fields (*).");
      return;
    }
    try {
      await updateLab.mutateAsync({ id: lab.id, body: { ...form } });
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the lab.");
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-3">
          {error}
        </Alert>
      )}

      <FormSection title="Lab Details">
        <LabeledInput label="Lab Name" required value={form.name} onChange={set("name")} />
        <LabeledInput label="Lab ID" value={form.labExternalId} onChange={set("labExternalId")} />
        <LabeledInput label="Lab NPI Number" inputMode="numeric" value={form.npiNumber} onChange={(v) => set("npiNumber")(v.replace(/\D/g, "").slice(0, 10))} />
        <LabeledInput label="CLIA ID" required value={form.cliaId} onChange={(v) => set("cliaId")(v.toUpperCase().slice(0, 10))} />
        <LabeledInput label="CAP ID" inputMode="numeric" value={form.capId} onChange={(v) => set("capId")(v.replace(/\D/g, "").slice(0, 7))} />
        <LabeledInput label="COLA ID" inputMode="numeric" value={form.colaId} onChange={(v) => set("colaId")(v.replace(/\D/g, "").slice(0, 5))} />
      </FormSection>

      <FormSection title="Contact Details">
        <LabeledInput label="Email ID" type="email" required value={form.emailId} onChange={set("emailId")} />
        <LabeledInput label="Mobile Number" inputMode="numeric" required value={form.mobileNumber} onChange={(v) => set("mobileNumber")(v.replace(/\D/g, "").slice(0, 10))} />
        <LabeledInput label="Secondary Mobile Number" inputMode="numeric" value={form.secondaryMobileNumber} onChange={(v) => set("secondaryMobileNumber")(v.replace(/\D/g, "").slice(0, 10))} />
        <LabeledInput label="Fax Number" inputMode="numeric" value={form.faxNumber} onChange={(v) => set("faxNumber")(v.replace(/\D/g, "").slice(0, 10))} />
      </FormSection>

      <FormSection title="Address Details">
        <LabeledInput label="Address Line 1" required value={form.addressLine1} onChange={set("addressLine1")} />
        <LabeledInput label="Address Line 2" value={form.addressLine2} onChange={set("addressLine2")} />
        <LabeledInput label="ZIP Code" required value={form.zipcode} onChange={(v) => set("zipcode")(v.replace(/\D/g, "").slice(0, 5))} />
        <LabeledInput label="State" required value={form.state} onChange={set("state")} />
        <LabeledInput label="City" required value={form.city} onChange={set("city")} />
      </FormSection>

      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" onClick={onDone} disabled={updateLab.isPending} className="min-w-[220px]">
          Cancel
        </Button>
        <Button onClick={save} disabled={updateLab.isPending} className="min-w-[220px]">
          {updateLab.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
