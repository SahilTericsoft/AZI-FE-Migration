"use client";

import { useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";
import { userApi } from "@/features/user/user.api";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { facilityApi } from "../../facility.api";
import { facilityKeys } from "../../facility.queries";
import type { Facility } from "../../facility.types";

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useInvalidate(facilityId: number) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: facilityKeys.view(facilityId) });
}

/** Reassign the facility admin (facility-admin role only). */
export function FacilityAdminEdit({ facility, onDone }: { facility: Facility; onDone: () => void }) {
  const { data } = useUserOptions({ roleCodes: ["facilityAdmin"] });
  const options = useMemo(
    () => (data?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [data],
  );
  const [adminId, setAdminId] = useState<string | null>(
    facility.adminId != null ? String(facility.adminId) : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidate = useInvalidate(facility.id);

  const save = async () => {
    if (!adminId) {
      setError("Select a facility admin.");
      return;
    }
    setBusy(true);
    try {
      await facilityApi.setAdmin(facility.id, Number(adminId));
      invalidate();
      toast.success("Admin updated.");
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not update the admin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-3">
      {error && <Alert variant="destructive">{error}</Alert>}
      <Label>Facility Admin</Label>
      <Combobox options={options} value={adminId} onChange={setAdminId} placeholder="Select Facility Admin" />
      <Actions busy={busy} onCancel={onDone} onSave={save} />
    </div>
  );
}

/** Assign additional facility users. */
export function FacilityUsersEdit({ facility, onDone }: { facility: Facility; onDone: () => void }) {
  const { data } = useUserOptions();
  const options = useMemo(
    () => (data?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [data],
  );
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidate = useInvalidate(facility.id);

  const save = async () => {
    if (ids.length === 0) {
      setError("Select at least one user to assign.");
      return;
    }
    setBusy(true);
    try {
      for (const id of ids) await facilityApi.addUser(facility.id, Number(id));
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
      <Label>Assign Facility Users</Label>
      <MultiCombobox options={options} value={ids} onChange={setIds} placeholder="Select users" />
      <Actions busy={busy} onCancel={onDone} onSave={save} saveLabel="Assign" />
    </div>
  );
}

/** Add a provider/physician via NPI lookup or manual entry. */
export function FacilityPhysiciansEdit({ facility, onDone }: { facility: Facility; onDone: () => void }) {
  const { user } = useAuth();
  const invalidate = useInvalidate(facility.id);
  const [form, setForm] = useState({
    npiNumber: "", firstName: "", middleName: "", lastName: "", emailId: "", mobileNumber: "", faxNumber: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [npiLooking, setNpiLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupNpi = async () => {
    if (!/^\d{10}$/.test(form.npiNumber)) {
      setError("NPI Number should be 10 digits.");
      return;
    }
    setError(null);
    setNpiLooking(true);
    try {
      const d = await facilityApi.npiLookup(form.npiNumber);
      setForm((f) => ({
        ...f,
        firstName: d.firstName || f.firstName,
        middleName: d.middleName || f.middleName,
        lastName: d.lastName || f.lastName,
        mobileNumber: onlyDigits(d.mobileNumber || ""),
        faxNumber: onlyDigits(d.faxNumber || ""),
      }));
      toast.success("Provider details fetched.");
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "NPI lookup failed.");
    } finally {
      setNpiLooking(false);
    }
  };

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Enter the physician's first and last name (or use NPI lookup).");
      return;
    }
    if (form.emailId.trim() && !EMAIL_RE.test(form.emailId.trim())) {
      setError("Enter a valid physician email.");
      return;
    }
    setBusy(true);
    try {
      const created = await userApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        roleCode: "physician",
        ...(form.middleName ? { middleName: form.middleName.trim() } : {}),
        ...(form.emailId ? { emailId: form.emailId.trim() } : {}),
        ...(form.mobileNumber ? { mobileNumber: form.mobileNumber } : {}),
        ...(form.faxNumber ? { faxNumber: form.faxNumber } : {}),
        ...(form.npiNumber ? { npiNumber: form.npiNumber } : {}),
        loginUserId: user?.id ?? 1,
      });
      await facilityApi.addPhysicians(facility.id, [created.id]);
      invalidate();
      toast.success("Physician added.");
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not add the physician.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="space-y-1.5">
        <Label>NPI Number</Label>
        <div className="flex gap-2">
          <Input inputMode="numeric" value={form.npiNumber} onChange={(e) => set("npiNumber")(onlyDigits(e.target.value).slice(0, 10))} placeholder="10-digit NPI" />
          <Button variant="outline" className="gap-1.5" onClick={lookupNpi} disabled={npiLooking}>
            {npiLooking ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />} Lookup
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First Name *" value={form.firstName} onChange={set("firstName")} />
        <Field label="Middle Name" value={form.middleName} onChange={set("middleName")} />
        <Field label="Last Name *" value={form.lastName} onChange={set("lastName")} />
        <Field label="Email ID" value={form.emailId} onChange={set("emailId")} type="email" />
        <Field label="Mobile Number" value={form.mobileNumber} onChange={(v) => set("mobileNumber")(onlyDigits(v).slice(0, 10))} />
        <Field label="Fax Number" value={form.faxNumber} onChange={(v) => set("faxNumber")(onlyDigits(v).slice(0, 10))} />
      </div>
      <Actions busy={busy} onCancel={onDone} onSave={save} saveLabel="Add Physician" saveIcon={<Plus className="h-4 w-4" />} />
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

function Actions({
  busy, onCancel, onSave, saveLabel = "Save", saveIcon,
}: {
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveIcon?: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex justify-center gap-3">
      <Button variant="outline" onClick={onCancel} disabled={busy} className="min-w-[160px]">Cancel</Button>
      <Button onClick={onSave} disabled={busy} className="min-w-[160px] gap-1.5">
        {busy ? <Spinner className="h-4 w-4" /> : saveIcon}
        {saveLabel}
      </Button>
    </div>
  );
}
