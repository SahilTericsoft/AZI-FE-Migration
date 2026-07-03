"use client";

import { useState, type ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/ui/labeled-input";
import type { ApiError } from "@/core/api/types";

import { useUpdateLocation } from "../../location.queries";
import type { Location } from "../../location.types";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-base font-bold">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">{children}</div>
    </div>
  );
}

export default function LocationDetailsEdit({
  location,
  onDone,
}: {
  location: Location;
  onDone: () => void;
}) {
  const updateLocation = useUpdateLocation();
  const addr = (location.addressDetails ?? {}) as Record<string, unknown>;
  const [form, setForm] = useState({
    name: location.code ?? location.name ?? "",
    type: location.type ?? "",
    addressLine1: (addr.addressLine1 as string) ?? "",
    addressLine2: (addr.addressLine2 as string) ?? "",
    zipcode: (addr.zipcode as string) ?? "",
    city: (addr.city as string) ?? "",
    state: (addr.state as string) ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const save = async () => {
    setError(null);
    if (!form.name.trim() || !form.type.trim()) {
      setError("Location name and type are required.");
      return;
    }
    try {
      await updateLocation.mutateAsync({
        id: location.id,
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
        },
      });
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the location.");
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
        <LabeledInput label="Location Name" required value={form.name} onChange={set("name")} />
        <LabeledInput label="Location Type" required value={form.type} onChange={set("type")} />
      </FormSection>

      <FormSection title="Address Details">
        <LabeledInput label="Address Line 1" value={form.addressLine1} onChange={set("addressLine1")} />
        <LabeledInput label="Address Line 2" value={form.addressLine2} onChange={set("addressLine2")} />
        <LabeledInput label="ZIP Code" value={form.zipcode} onChange={set("zipcode")} />
        <LabeledInput label="City" value={form.city} onChange={set("city")} />
        <LabeledInput label="State" value={form.state} onChange={set("state")} />
      </FormSection>

      <div className="mt-6 flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={onDone}
          disabled={updateLocation.isPending}
          className="min-w-[220px]"
        >
          Cancel
        </Button>
        <Button onClick={save} disabled={updateLocation.isPending} className="min-w-[220px]">
          {updateLocation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
