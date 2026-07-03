"use client";

import { useState, type ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";
import { ZipField } from "@/features/geo/zip-field";
import { useRoles } from "@/features/access-control/access-control.queries";
import type { Role } from "@/features/access-control/access-control.types";

import { useCreateUser, useUpdateUser } from "../user.queries";
import type { User } from "../user.types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const GENDERS = ["Male", "Female", "Other"];

function asRoles(data: Role[] | { docs: Role[] } | undefined): Role[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.docs;
}

const EMPTY = {
  firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "",
  emailId: "", mobileNumber: "", secondaryMobileNumber: "", faxNumber: "",
  addressLine1: "", addressLine2: "", zipcode: "", city: "", state: "",
  npiNumber: "", designation: "", roleId: "",
};
type FormState = typeof EMPTY;

export default function UserFormDialog({
  user,
  onClose,
}: {
  user?: User | null; // present = edit
  onClose: () => void;
}) {
  const { user: me } = useAuth();
  const create = useCreateUser();
  const update = useUpdateUser();
  const rolesQ = useRoles();
  const roles = asRoles(rolesQ.data);
  const editing = Boolean(user);

  const [form, setForm] = useState<FormState>(() =>
    user
      ? {
          firstName: user.firstName ?? "",
          middleName: user.middleName ?? "",
          lastName: user.lastName ?? "",
          dateOfBirth: user.dateOfBirth ?? "",
          gender: user.gender ?? "",
          emailId: user.emailId ?? "",
          mobileNumber: onlyDigits(user.mobileNumber ?? ""),
          secondaryMobileNumber: onlyDigits(user.secondaryMobileNumber ?? ""),
          faxNumber: onlyDigits(user.faxNumber ?? ""),
          addressLine1: user.addressLine1 ?? "",
          addressLine2: user.addressLine2 ?? "",
          zipcode: user.zipcode ?? "",
          city: user.city ?? "",
          state: user.state ?? "",
          npiNumber: user.npiNumber ?? "",
          designation: user.designation ?? "",
          roleId: user.roleId != null ? String(user.roleId) : "",
        }
      : { ...EMPTY },
  );
  const [zipMode, setZipMode] = useState<"select" | "other">(user?.zipcode ? "other" : "select");
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const busy = create.isPending || update.isPending;

  const save = async () => {
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (form.emailId.trim() && !EMAIL_RE.test(form.emailId.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.mobileNumber && form.mobileNumber.length !== 10) {
      setError("Mobile number should be 10 digits.");
      return;
    }
    const body: Record<string, unknown> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      emailId: form.emailId.trim() || undefined,
      mobileNumber: form.mobileNumber || undefined,
      secondaryMobileNumber: form.secondaryMobileNumber || undefined,
      faxNumber: form.faxNumber || undefined,
      addressLine1: form.addressLine1.trim() || undefined,
      addressLine2: form.addressLine2.trim() || undefined,
      zipcode: form.zipcode.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      npiNumber: form.npiNumber.trim() || undefined,
      designation: form.designation.trim() || undefined,
      roleId: form.roleId ? Number(form.roleId) : undefined,
    };
    try {
      if (editing && user) {
        await update.mutateAsync({ userId: user.id, ...body });
        toast.success("User updated.");
      } else {
        await create.mutateAsync({ ...body, loginUserId: me?.id ?? 1 } as never);
        toast.success("User created.");
      }
      onClose();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the user.");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit User" : "New User"}</DialogTitle>
        </DialogHeader>

        {error && <Alert variant="destructive">{error}</Alert>}

        <Section title="Basic Details">
          <Field label="First Name" required value={form.firstName} onChange={(v) => set("firstName", v)} />
          <Field label="Middle Name" value={form.middleName} onChange={(v) => set("middleName", v)} />
          <Field label="Last Name" required value={form.lastName} onChange={(v) => set("lastName", v)} />
          <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
          <SelectField label="Gender" value={form.gender} onChange={(v) => set("gender", v)} options={GENDERS} placeholder="Select gender" />
          <SelectField
            label="Role"
            value={form.roleId}
            onChange={(v) => set("roleId", v)}
            options={roles.map((r) => ({ value: String(r.id), label: r.title ?? r.code ?? `Role #${r.id}` }))}
            placeholder={rolesQ.isLoading ? "Loading roles…" : "Select role"}
          />
        </Section>

        <Section title="Contact Details">
          <Field label="Email ID" type="email" value={form.emailId} onChange={(v) => set("emailId", v)} />
          <PhoneField label="Mobile Number" value={form.mobileNumber} onChange={(v) => set("mobileNumber", v)} />
          <PhoneField label="Secondary Mobile Number" value={form.secondaryMobileNumber} onChange={(v) => set("secondaryMobileNumber", v)} />
          <PhoneField label="Fax Number" value={form.faxNumber} onChange={(v) => set("faxNumber", v)} />
        </Section>

        <Section title="Address Details">
          <Field label="Address Line 1" value={form.addressLine1} onChange={(v) => set("addressLine1", v)} />
          <Field label="Address Line 2" value={form.addressLine2} onChange={(v) => set("addressLine2", v)} />
          <div className="space-y-1.5">
            <Label>ZIP Code</Label>
            {zipMode === "other" ? (
              <Input inputMode="numeric" placeholder="Enter ZIP" value={form.zipcode}
                onChange={(e) => set("zipcode", onlyDigits(e.target.value).slice(0, 5))} />
            ) : (
              <ZipField value={form.zipcode} onPick={(row) => {
                if (row === "other") { setZipMode("other"); setForm((f) => ({ ...f, zipcode: "", city: "", state: "" })); }
                else if (row) setForm((f) => ({ ...f, zipcode: row.zipcode, city: row.city ?? "", state: row.state ?? "" }));
              }} />
            )}
            {zipMode === "other" && (
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setZipMode("select"); set("zipcode", ""); }}>← Back to ZIP search</button>
            )}
          </div>
          <Field label="City" value={form.city} onChange={(v) => set("city", v)} readOnly={zipMode === "select"} />
          <Field label="State" value={form.state} onChange={(v) => set("state", v)} readOnly={zipMode === "select"} />
        </Section>

        <Section title="Professional Details">
          <Field label="NPI Number" inputMode="numeric" value={form.npiNumber} onChange={(v) => set("npiNumber", onlyDigits(v).slice(0, 10))} />
          <Field label="Designation" value={form.designation} onChange={(v) => set("designation", v)} />
        </Section>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="gap-1.5">
            {busy && <Spinner className="h-4 w-4" />}{editing ? "Save Changes" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, required, type, inputMode, readOnly,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; inputMode?: "numeric" | "text"; readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input type={type} inputMode={inputMode} value={value} readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)} className={cn(readOnly && "bg-muted")} />
    </div>
  );
}

function PhoneField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground">+1</span>
        <Input inputMode="numeric" value={value} placeholder="10-digit number"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))} className="rounded-l-none" />
      </div>
    </div>
  );
}

function SelectField({
  label, value, onChange, options, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[]; placeholder?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
