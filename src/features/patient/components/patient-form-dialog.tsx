"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";
import { useZipSearch, type ZipRow } from "@/features/geo/geo.queries";
import { useDropdown } from "@/features/system-settings/system-settings.queries";

import { patientApi } from "../patient.api";
import {
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PREFIX_OPTIONS,
  RACE_OPTIONS,
  SUFFIX_OPTIONS,
  type PatientOption,
} from "../patient.options";
import { useCreatePatient, useUpdatePatient } from "../patient.queries";
import type { Patient } from "../patient.types";

/** Every editable text field the patient service accepts (mirrors the old
 *  4-step Add wizard: Patient Information · Contact Details · Additional
 *  Details). Numbers are held as strings for the inputs and coerced on submit. */
const FIELDS = [
  "prefix", "suffix", "firstName", "middleName", "lastName", "dateOfBirth",
  "gender", "race", "ethnicity", "weight", "heightInFeet", "heightInInches",
  "mobileNumber", "secondaryMobileNumber", "businessMobileNumber", "emailId",
  "businessEmailId", "addressLine1", "addressLine2", "zipcode", "city", "state",
  "county", "country", "aliasName", "patientAccountNumber", "nationality",
  "maritalStatus", "degree", "notes",
] as const;

type FieldKey = (typeof FIELDS)[number];
type FormState = Record<FieldKey, string>;

const EMPTY: FormState = FIELDS.reduce(
  (acc, k) => ({ ...acc, [k]: "" }),
  {} as FormState,
);

const NUMERIC: FieldKey[] = ["weight", "heightInFeet", "heightInInches"];

function fromPatient(p: Patient): FormState {
  const next = { ...EMPTY };
  for (const k of FIELDS) {
    const v = (p as unknown as Record<string, unknown>)[k];
    if (v !== null && v !== undefined) next[k] = String(v);
  }
  return next;
}

export default function PatientFormDialog({
  open,
  onClose,
  patient = null,
}: {
  open: boolean;
  onClose: () => void;
  /** When provided the dialog edits that patient; otherwise it creates one. */
  patient?: Patient | null;
}) {
  const { user } = useAuth();
  const isEdit = Boolean(patient);
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const pending = createPatient.isPending || updatePatient.isPending;

  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  // Create flow starts with an existence check (like the old Add wizard);
  // edit jumps straight to the full form.
  const [phase, setPhase] = useState<"verify" | "details">("details");
  const [checking, setChecking] = useState(false);
  const [existing, setExisting] = useState<Patient | null>(null);

  // (Re)seed the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setForm(patient ? fromPatient(patient) : { ...EMPTY });
      setError(null);
      setExisting(null);
      setPhase(patient ? "details" : "verify");
    }
  }, [open, patient]);

  const set = (key: FieldKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Changing identity invalidates a previous existence check.
    if (["firstName", "lastName", "middleName", "dateOfBirth"].includes(key)) {
      setExisting(null);
    }
  };

  /** Verify step: check for an existing patient before creating a new one. */
  const runVerify = async () => {
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) {
      setError("First name, last name and date of birth are required.");
      return;
    }
    setChecking(true);
    try {
      const match = await patientApi.validate({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
      });
      if (match) setExisting(match);
      else setPhase("details");
    } catch (err) {
      setError((err as ApiError)?.message ?? "Could not verify patient.");
    } finally {
      setChecking(false);
    }
  };

  const onPickZip = (z: ZipRow) =>
    setForm((f) => ({
      ...f,
      zipcode: z.zipcode ?? f.zipcode,
      city: z.city ?? "",
      state: z.state ?? "",
      county: z.county ?? "",
      country: z.country ?? "",
    }));

  const submit = async () => {
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) {
      setError("First name, last name and date of birth are required.");
      return;
    }

    // Build a payload of the filled fields, coercing numerics.
    const payload: Record<string, unknown> = {};
    for (const k of FIELDS) {
      const raw = form[k].trim();
      if (!raw) continue;
      payload[k] = NUMERIC.includes(k) ? Number(raw) : raw;
    }

    try {
      if (isEdit && patient) {
        await updatePatient.mutateAsync({ id: patient.id, body: payload });
      } else {
        await createPatient.mutateAsync({
          ...(payload as { firstName: string; lastName: string; dateOfBirth: string }),
          ...(user?.id ? { loginUserId: user.id } : {}),
        });
      }
      onClose();
    } catch (err) {
      setError((err as ApiError)?.message ?? "Could not save patient.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit patient" : phase === "verify" ? "Verify patient" : "New patient"}
          </DialogTitle>
        </DialogHeader>

        {phase === "verify" ? (
          <div className="flex flex-col gap-4 py-1">
            {error && <Alert variant="destructive">{error}</Alert>}
            <p className="text-sm text-muted-foreground">
              Enter the patient&apos;s name and date of birth. We&apos;ll check whether they
              already exist before creating a new record.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="First name" required value={form.firstName} onChange={(v) => set("firstName", v)} autoFocus />
              <TextField label="Middle name" value={form.middleName} onChange={(v) => set("middleName", v)} />
              <TextField label="Last name" required value={form.lastName} onChange={(v) => set("lastName", v)} />
              <Field label="Date of birth" required>
                <DatePicker value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
              </Field>
            </div>

            {existing && (
              <Alert>
                <div className="flex flex-col gap-2">
                  <p className="text-sm">
                    A patient matching{" "}
                    <span className="font-medium capitalize">
                      {[existing.firstName, existing.lastName].filter(Boolean).join(" ")}
                    </span>{" "}
                    (DOB {existing.dateOfBirth ?? "—"}) already exists.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/patient/${existing.id}`}
                      onClick={onClose}
                      className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
                    >
                      View existing patient
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => setPhase("details")}>
                      Add anyway
                    </Button>
                  </div>
                </div>
              </Alert>
            )}
          </div>
        ) : (
        <div className="flex flex-col gap-6 py-1">
          {error && <Alert variant="destructive">{error}</Alert>}

          <Section title="Patient Information">
            <DropdownField code="prefix" label="Prefix" value={form.prefix} onChange={(v) => set("prefix", v)} fallback={PREFIX_OPTIONS} />
            <DropdownField code="suffix" label="Suffix" value={form.suffix} onChange={(v) => set("suffix", v)} fallback={SUFFIX_OPTIONS} />
            <TextField label="First name" required value={form.firstName} onChange={(v) => set("firstName", v)} autoFocus />
            <TextField label="Middle name" value={form.middleName} onChange={(v) => set("middleName", v)} />
            <TextField label="Last name" required value={form.lastName} onChange={(v) => set("lastName", v)} />
            <Field label="Date of birth" required>
              <DatePicker value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
            </Field>
            <DropdownField code="gender" label="Gender" value={form.gender} onChange={(v) => set("gender", v)} fallback={GENDER_OPTIONS} />
            <DropdownField code="race" label="Race" value={form.race} onChange={(v) => set("race", v)} fallback={RACE_OPTIONS} />
            <DropdownField code="ethnicity" label="Ethnicity" value={form.ethnicity} onChange={(v) => set("ethnicity", v)} fallback={ETHNICITY_OPTIONS} />
            <TextField label="Weight (lbs)" type="number" value={form.weight} onChange={(v) => set("weight", v)} />
            <TextField label="Height (feet)" type="number" value={form.heightInFeet} onChange={(v) => set("heightInFeet", v)} />
            <TextField label="Height (inches)" type="number" value={form.heightInInches} onChange={(v) => set("heightInInches", v)} />
          </Section>

          <Section title="Contact Details">
            <TextField label="Mobile number" value={form.mobileNumber} onChange={(v) => set("mobileNumber", v)} />
            <TextField label="Secondary mobile" value={form.secondaryMobileNumber} onChange={(v) => set("secondaryMobileNumber", v)} />
            <TextField label="Business mobile" value={form.businessMobileNumber} onChange={(v) => set("businessMobileNumber", v)} />
            <TextField label="Email" type="email" value={form.emailId} onChange={(v) => set("emailId", v)} />
            <TextField label="Business email" type="email" value={form.businessEmailId} onChange={(v) => set("businessEmailId", v)} />
          </Section>

          <Section title="Address">
            <TextField label="Address line 1" value={form.addressLine1} onChange={(v) => set("addressLine1", v)} />
            <TextField label="Address line 2" value={form.addressLine2} onChange={(v) => set("addressLine2", v)} />
            <Field label="ZIP code">
              <ZipField value={form.zipcode} onText={(v) => set("zipcode", v)} onPick={onPickZip} />
            </Field>
            <TextField label="City" value={form.city} onChange={(v) => set("city", v)} />
            <TextField label="State" value={form.state} onChange={(v) => set("state", v)} />
            <TextField label="County" value={form.county} onChange={(v) => set("county", v)} />
            <TextField label="Country" value={form.country} onChange={(v) => set("country", v)} />
          </Section>

          <Section title="Additional Details">
            <TextField label="Alias name" value={form.aliasName} onChange={(v) => set("aliasName", v)} />
            <TextField label="Patient account number" value={form.patientAccountNumber} onChange={(v) => set("patientAccountNumber", v)} />
            <TextField label="Nationality" value={form.nationality} onChange={(v) => set("nationality", v)} />
            <DropdownField code="maritalStatus" label="Marital status" value={form.maritalStatus} onChange={(v) => set("maritalStatus", v)} fallback={MARITAL_STATUS_OPTIONS} />
            <TextField label="Degree" value={form.degree} onChange={(v) => set("degree", v)} />
            <Field label="Notes" full>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </Field>
          </Section>
        </div>
        )}

        <DialogFooter>
          {phase === "verify" ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={checking}>
                Cancel
              </Button>
              <Button onClick={runVerify} disabled={checking}>
                {checking ? "Verifying…" : "Verify & Continue"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save changes" : "Create"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- layout helpers ---------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label, required, full, children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>
        {label}
        {required && " *"}
      </Label>
      {children}
    </div>
  );
}

function TextField({
  label, value, onChange, required, type = "text", autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <Field label={label} required={required}>
      <Input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

/** A Select backed by a system-settings dropdown value set (prefix, gender…).
 *  Falls back to the shared static options when the backend dropdown is empty
 *  (they ship unseeded), so the field is always usable. */
function DropdownField({
  code, label, value, onChange, fallback,
}: {
  code: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  fallback: PatientOption[];
}) {
  const { data: options = [] } = useDropdown(code);
  const opts = options.length ? options : fallback;
  return (
    <Field label={label}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
            <SelectItem key={o.code} value={o.code}>
              {o.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/** ZIP lookup: debounced server search; picking a row fills city/state/etc. */
function ZipField({
  value, onText, onPick,
}: {
  value: string;
  onText: (v: string) => void;
  onPick: (z: ZipRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 300);
    return () => clearTimeout(t);
  }, [value]);

  const enabled = debounced.length >= 2;
  const { data: rows = [], isFetching } = useZipSearch(debounced, enabled && open);
  const showMenu = open && enabled;
  const uniqueRows = useMemo(() => rows.slice(0, 25), [rows]);

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder="Search ZIP code"
        onChange={(e) => {
          onText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {showMenu && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {isFetching && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
          )}
          {!isFetching && uniqueRows.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
          )}
          {uniqueRows.map((r) => (
            <button
              type="button"
              key={`${r.zipcode}-${r.city}-${r.state}`}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(r);
                setOpen(false);
              }}
            >
              {r.zipcode} — {r.city}, {r.state}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
