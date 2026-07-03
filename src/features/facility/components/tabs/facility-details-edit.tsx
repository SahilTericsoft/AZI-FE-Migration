"use client";

import { useState, type ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LabeledInput } from "@/components/ui/labeled-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApiError } from "@/core/api/types";

import { useUpdateFacility } from "../../facility.queries";
import type { Facility } from "../../facility.types";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-base font-bold">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">{children}</div>
    </div>
  );
}

export default function FacilityDetailsEdit({
  facility,
  onDone,
}: {
  facility: Facility;
  onDone: () => void;
}) {
  const updateFacility = useUpdateFacility();
  const addr = (facility.addressDetails ?? {}) as Record<string, unknown>;
  const [form, setForm] = useState({
    name: facility.code ?? facility.name ?? "",
    type: facility.type ?? "",
    addressLine1: (addr.addressLine1 as string) ?? "",
    addressLine2: (addr.addressLine2 as string) ?? "",
    zipcode: (addr.zipcode as string) ?? "",
    city: (addr.city as string) ?? "",
    state: (addr.state as string) ?? "",
  });
  const [insuranceRequired, setInsuranceRequired] = useState(
    Boolean(facility.isInsuranceImageRequired),
  );
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const save = async () => {
    setError(null);
    if (!form.name.trim() || !form.type.trim()) {
      setError("Facility name and type are required.");
      return;
    }
    try {
      await updateFacility.mutateAsync({
        id: facility.id,
        body: {
          name: form.name.trim(),
          type: form.type.trim(),
          addressDetails: {
            ...addr,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            zipcode: form.zipcode,
            city: form.city,
            state: form.state,
          },
          isInsuranceImageRequired: insuranceRequired,
        },
      });
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the facility.");
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-3">
          {error}
        </Alert>
      )}

      <FormSection title="Basic Details">
        <LabeledInput label="Facility Name" required value={form.name} onChange={set("name")} />
        <LabeledInput label="Facility Type" required value={form.type} onChange={set("type")} />
      </FormSection>

      <FormSection title="Address Details">
        <LabeledInput label="Address Line 1" value={form.addressLine1} onChange={set("addressLine1")} />
        <LabeledInput label="Address Line 2" value={form.addressLine2} onChange={set("addressLine2")} />
        <LabeledInput label="ZIP Code" value={form.zipcode} onChange={set("zipcode")} />
        <LabeledInput label="City" value={form.city} onChange={set("city")} />
        <LabeledInput label="State" value={form.state} onChange={set("state")} />
      </FormSection>

      <div className="space-y-2">
        <Label>Is uploading insurance images mandatory for this facility?</Label>
        <RadioGroup
          className="flex gap-6"
          value={insuranceRequired ? "yes" : "no"}
          onValueChange={(v) => setInsuranceRequired(v === "yes")}
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="yes" /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="no" /> No
          </label>
        </RadioGroup>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={onDone}
          disabled={updateFacility.isPending}
          className="min-w-[220px]"
        >
          Cancel
        </Button>
        <Button onClick={save} disabled={updateFacility.isPending} className="min-w-[220px]">
          {updateFacility.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
