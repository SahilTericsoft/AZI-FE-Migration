"use client";

import { useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/core/api/types";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { locationApi } from "../../location.api";
import { locationKeys, useUpdateLocation } from "../../location.queries";
import type { Location } from "../../location.types";

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useInvalidate(id: number) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: locationKeys.view(id) });
}

export function LocationAdminEdit({ location, onDone }: { location: Location; onDone: () => void }) {
  const update = useUpdateLocation();
  const { data } = useUserOptions({ roleCodes: ["locationAdmin"] });
  const options = useMemo(
    () => (data?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [data],
  );
  const [adminId, setAdminId] = useState<string | null>(location.adminId != null ? String(location.adminId) : null);
  const [error, setError] = useState<string | null>(null);
  const invalidate = useInvalidate(location.id);

  const save = async () => {
    if (!adminId) return setError("Select a location admin.");
    try {
      await update.mutateAsync({ id: location.id, body: { adminId: Number(adminId) } });
      invalidate();
      toast.success("Admin updated.");
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not update the admin.");
    }
  };

  return (
    <div className="max-w-xl space-y-3">
      {error && <Alert variant="destructive">{error}</Alert>}
      <Label>Location Admin</Label>
      <Combobox options={options} value={adminId} onChange={setAdminId} placeholder="Select Location Admin" />
      <Actions busy={update.isPending} onCancel={onDone} onSave={save} />
    </div>
  );
}

export function LocationUsersEdit({ location, onDone }: { location: Location; onDone: () => void }) {
  const { data } = useUserOptions({ roleCodes: ["locationUser"] });
  const options = useMemo(
    () => (data?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [data],
  );
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidate = useInvalidate(location.id);

  const save = async () => {
    if (ids.length === 0) return setError("Select at least one user to assign.");
    setBusy(true);
    try {
      for (const id of ids) await locationApi.users.create({ locationId: location.id, userId: Number(id) });
      invalidate();
      toast.success("Users assigned.");
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not assign users.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-3">
      {error && <Alert variant="destructive">{error}</Alert>}
      <Label>Assign Location Users</Label>
      <MultiCombobox options={options} value={ids} onChange={setIds} placeholder="Select users" />
      <Actions busy={busy} onCancel={onDone} onSave={save} saveLabel="Assign" />
    </div>
  );
}

export function LocationPrimaryContactEdit({ location, onDone }: { location: Location; onDone: () => void }) {
  const update = useUpdateLocation();
  const invalidate = useInvalidate(location.id);
  const pc = (location.primaryContactDetails ?? {}) as Record<string, unknown>;
  const [form, setForm] = useState({
    firstName: (pc.firstName as string) ?? "",
    middleName: (pc.middleName as string) ?? "",
    lastName: (pc.lastName as string) ?? "",
    emailId: (pc.emailId as string) ?? "",
    mobileNumber: onlyDigits((pc.mobileNumber as string) ?? ""),
    secondaryMobileNumber: onlyDigits((pc.secondaryMobileNumber as string) ?? ""),
    faxNumber: onlyDigits((pc.faxNumber as string) ?? ""),
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !EMAIL_RE.test(form.emailId.trim()) || form.mobileNumber.length !== 10) {
      return setError("First name, last name, a valid email and a 10-digit mobile number are required.");
    }
    try {
      await update.mutateAsync({ id: location.id, body: { primaryContactDetails: { ...form } } });
      invalidate();
      toast.success("Primary contact updated.");
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not update the primary contact.");
    }
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First Name *" value={form.firstName} onChange={set("firstName")} />
        <Field label="Middle Name" value={form.middleName} onChange={set("middleName")} />
        <Field label="Last Name *" value={form.lastName} onChange={set("lastName")} />
        <Field label="Email ID *" value={form.emailId} onChange={set("emailId")} type="email" />
        <Field label="Mobile Number *" value={form.mobileNumber} onChange={(v) => set("mobileNumber")(onlyDigits(v).slice(0, 10))} />
        <Field label="Secondary Mobile Number" value={form.secondaryMobileNumber} onChange={(v) => set("secondaryMobileNumber")(onlyDigits(v).slice(0, 10))} />
        <Field label="Fax Number" value={form.faxNumber} onChange={(v) => set("faxNumber")(onlyDigits(v).slice(0, 10))} />
      </div>
      <Actions busy={update.isPending} onCancel={onDone} onSave={save} />
    </div>
  );
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Actions({ busy, onCancel, onSave, saveLabel = "Save" }: { busy: boolean; onCancel: () => void; onSave: () => void; saveLabel?: string }) {
  return (
    <div className={cn("mt-4 flex justify-center gap-3")}>
      <Button variant="outline" onClick={onCancel} disabled={busy} className="min-w-[160px]">Cancel</Button>
      <Button onClick={onSave} disabled={busy} className="min-w-[160px] gap-1.5">
        {busy && <Spinner className="h-4 w-4" />}{saveLabel}
      </Button>
    </div>
  );
}
