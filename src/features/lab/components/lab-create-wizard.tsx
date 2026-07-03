"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Upload } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Stepper } from "@/components/ui/stepper";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import { http } from "@/core/api/client";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";
import { ZipField } from "@/features/geo/zip-field";
import { userApi } from "@/features/user/user.api";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { useCreateLab, useLabList, useLabView, useUpdateLab } from "../lab.queries";
import type { Lab, LabRole } from "../lab.types";

const FUNCTIONALITIES: { label: string; role: LabRole; description: string }[] = [
  { label: "Reference Lab", role: "sendLab", description: "Samples are sent out to this lab for testing." },
  { label: "Client Lab", role: "receiveLab", description: "This lab sends its samples to you for testing." },
  { label: "Reference-Client Lab", role: "sendReceiveLab", description: "This lab both sends and receives samples." },
];

// The onboarding flow is role-aware (mirrors the legacy LabAddComponent):
//   Reference Lab (sendLab)            → Lab Details, Admin, Attachments
//   Client / Reference-Client          → + Director, Physician, Primary Contact,
//   (receiveLab / sendReceiveLab)        Test & Panels, Report Setup
type StepId =
  | "details"
  | "admin"
  | "director"
  | "physician"
  | "contact"
  | "tests"
  | "attachments"
  | "report";

const STEP_TITLES: Record<StepId, string> = {
  details: "Lab Details",
  admin: "Admin Details",
  director: "Director Details",
  physician: "Provider/Physician",
  contact: "Primary Contact",
  tests: "Lab Offerings",
  attachments: "Attachments",
  report: "Report Setup",
};

const SEND_STEPS: StepId[] = ["details", "admin", "attachments"];
const RECEIVE_STEPS: StepId[] = [
  "details",
  "admin",
  "director",
  "physician",
  "contact",
  "tests",
  "attachments",
  "report",
];

const stepsForRole = (role: LabRole | null): StepId[] =>
  role === "receiveLab" || role === "sendReceiveLab" ? RECEIVE_STEPS : SEND_STEPS;

const EMPTY = {
  name: "", labExternalId: "", npiNumber: "", cliaId: "", capId: "", colaId: "",
  emailId: "", mobileNumber: "", secondaryMobileNumber: "", faxNumber: "",
  addressLine1: "", addressLine2: "", zipcode: "", city: "", state: "",
};
type FormState = typeof EMPTY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** Per-field validation messages mirroring the legacy lab rules. */
function validate(form: FormState, zipMode: "select" | "other"): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.name.trim()) e.name = "Lab Name is required";
  if (!form.cliaId.trim()) e.cliaId = "CLIA ID is required";
  else if (!/^[A-Za-z0-9]{10}$/.test(form.cliaId.trim())) e.cliaId = "CLIA ID should be 10 characters";
  if (form.capId.trim() && !/^\d{7}$/.test(form.capId.trim())) e.capId = "CAP ID should be 7 digits";
  if (form.colaId.trim() && !/^\d{5}$/.test(form.colaId.trim())) e.colaId = "COLA ID should be 5 digits";
  if (form.npiNumber.trim() && !/^\d{10}$/.test(form.npiNumber.trim())) e.npiNumber = "NPI Number should be 10 digits";
  if (form.labExternalId.trim().length > 20) e.labExternalId = "Lab ID cannot exceed 20 characters";
  if (!form.emailId.trim()) e.emailId = "Email ID is required";
  else if (!EMAIL_RE.test(form.emailId.trim())) e.emailId = "Enter a valid Email ID";
  if (!form.mobileNumber.trim()) e.mobileNumber = "Mobile Number is required";
  else if (form.mobileNumber.length !== 10) e.mobileNumber = "Mobile Number should be 10 digits";
  if (form.secondaryMobileNumber && form.secondaryMobileNumber.length !== 10) e.secondaryMobileNumber = "Should be 10 digits";
  if (form.faxNumber && form.faxNumber.length !== 10) e.faxNumber = "Fax Number should be 10 digits";
  if (!form.addressLine1.trim()) e.addressLine1 = "Address Line 1 is required";
  if (!form.zipcode.trim()) e.zipcode = "ZIP Code is required";
  else if (zipMode === "other" && !/^\d{5}$/.test(form.zipcode.trim())) e.zipcode = "Enter a valid 5-digit ZIP Code";
  if (!form.city.trim()) e.city = "City is required";
  if (!form.state.trim()) e.state = "State is required";
  return e;
}

export default function LabCreateWizard({ labId: existingId }: { labId?: number } = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const createLab = useCreateLab();
  const updateLab = useUpdateLab();
  const { data: usersData } = useUserOptions();
  const allUsers = usersData?.docs ?? [];

  const continuing = existingId != null;
  const labQ = useLabView(existingId ?? 0, continuing);

  // A user can admin only one lab — hide users already assigned to *another* lab.
  const labsQ = useLabList({ page: 1, limit: 500 });
  const takenAdminIds = useMemo(() => {
    const taken = new Set<number>();
    for (const l of labsQ.data?.docs ?? []) {
      if (l.adminId != null && l.id !== existingId) taken.add(l.adminId);
    }
    return taken;
  }, [labsQ.data, existingId]);
  const users = useMemo(() => allUsers.filter((u) => !takenAdminIds.has(u.id)), [allUsers, takenAdminIds]);

  const [role, setRole] = useState<LabRole | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [zipMode, setZipMode] = useState<"select" | "other">("select");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [labId, setLabId] = useState<number | null>(existingId ?? null);

  // Admin step
  const [adminMode, setAdminMode] = useState<"select" | "create">("select");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({ firstName: "", lastName: "", emailId: "", mobileNumber: "", npiNumber: "" });

  // Director step (Client / Reference-Client labs only)
  const [director, setDirector] = useState({
    isSameAsAdmin: false,
    npiNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    emailId: "",
    mobileNumber: "",
    secondaryMobileNumber: "",
    faxNumber: "",
  });

  // Primary contact step
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    emailId: "",
    mobileNumber: "",
    designation: "",
  });

  // Report setup step
  const [themeColor, setThemeColor] = useState("#f17013");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Attachment step
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);

  const stepIds = useMemo(() => stepsForRole(role), [role]);
  const currentId = stepIds[step] ?? stepIds[0];
  const isLastStep = step === stepIds.length - 1;

  // Prefill when continuing an existing (draft) lab.
  useEffect(() => {
    const lab = labQ.data as Lab | undefined;
    if (!continuing || !lab) return;
    setRole((lab.labRole as LabRole) ?? null);
    setForm({
      name: lab.name ?? "",
      labExternalId: lab.labExternalId ?? "",
      npiNumber: lab.npiNumber ?? "",
      cliaId: lab.cliaId ?? "",
      capId: lab.capId ?? "",
      colaId: lab.colaId ?? "",
      emailId: lab.emailId ?? "",
      mobileNumber: onlyDigits(lab.mobileNumber ?? ""),
      secondaryMobileNumber: onlyDigits(lab.secondaryMobileNumber ?? ""),
      faxNumber: onlyDigits(lab.faxNumber ?? ""),
      addressLine1: lab.addressLine1 ?? "",
      addressLine2: lab.addressLine2 ?? "",
      zipcode: lab.zipcode ?? "",
      city: lab.city ?? "",
      state: lab.state ?? "",
    });
    setAdminId(lab.adminId != null ? String(lab.adminId) : null);
    const d = (lab.directorDetails ?? null) as Record<string, unknown> | null;
    if (d) {
      setDirector({
        isSameAsAdmin: Boolean(d.isSameAsAdmin),
        npiNumber: (d.npiNumber as string) ?? "",
        firstName: (d.firstName as string) ?? "",
        middleName: (d.middleName as string) ?? "",
        lastName: (d.lastName as string) ?? "",
        emailId: (d.emailId as string) ?? "",
        mobileNumber: onlyDigits((d.mobileNumber as string) ?? ""),
        secondaryMobileNumber: onlyDigits((d.secondaryMobileNumber as string) ?? ""),
        faxNumber: onlyDigits((d.faxNumber as string) ?? ""),
      });
    }
    if (lab.themeColor) setThemeColor(lab.themeColor);
  }, [continuing, labQ.data]);

  const errors = useMemo(() => validate(form, zipMode), [form, zipMode]);
  const showErr = (k: keyof FormState) => (touched[k] ? errors[k] : undefined);
  const setField = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const busy = createLab.isPending || updateLab.isPending;

  const labPayload = () => ({
    name: form.name.trim(),
    cliaId: form.cliaId.trim().toUpperCase(),
    emailId: form.emailId.trim(),
    mobileNumber: form.mobileNumber,
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || undefined,
    city: form.city.trim(),
    state: form.state.trim(),
    zipcode: form.zipcode.trim(),
    labRole: role as LabRole,
    labExternalId: form.labExternalId.trim() || undefined,
    npiNumber: form.npiNumber.trim() || undefined,
    capId: form.capId.trim() || undefined,
    colaId: form.colaId.trim() || undefined,
    secondaryMobileNumber: form.secondaryMobileNumber || undefined,
    faxNumber: form.faxNumber || undefined,
  });

  // Step 0 → create (or update) the lab as a DRAFT, then advance.
  const handleStep0 = async () => {
    setError(null);
    if (Object.keys(errors).length > 0) {
      setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])));
      setError("Please fix the highlighted fields before continuing.");
      return;
    }
    try {
      if (labId) {
        await updateLab.mutateAsync({ id: labId, body: labPayload() });
      } else {
        const lab = await createLab.mutateAsync({ ...labPayload(), ...(user?.id ? { loginUserId: user.id } : {}) });
        setLabId(lab.id);
      }
      setStep(1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the lab.");
    }
  };

  const handleStep1 = async () => {
    setError(null);
    if (!labId) return setStep(2);
    try {
      let resolvedAdminId = adminId ? Number(adminId) : null;
      if (adminMode === "create") {
        if (!newAdmin.firstName.trim() || !newAdmin.lastName.trim() || !EMAIL_RE.test(newAdmin.emailId.trim())) {
          setError("Enter the new admin's first name, last name and a valid email.");
          return;
        }
        const created = await userApi.create({
          firstName: newAdmin.firstName.trim(),
          lastName: newAdmin.lastName.trim(),
          emailId: newAdmin.emailId.trim(),
          ...(newAdmin.mobileNumber ? { mobileNumber: newAdmin.mobileNumber } : {}),
          ...(newAdmin.npiNumber ? { npiNumber: newAdmin.npiNumber } : {}),
          ...(user?.id ? { loginUserId: user.id } : { loginUserId: 1 }),
        });
        resolvedAdminId = created.id;
      }
      if (resolvedAdminId) await updateLab.mutateAsync({ id: labId, body: { adminId: resolvedAdminId } });
      setStep(2);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the admin.");
    }
  };

  const saveDirector = async () => {
    setError(null);
    if (!labId) return setStep((s) => s + 1);
    if (!director.isSameAsAdmin) {
      if (
        !director.firstName.trim() ||
        !director.lastName.trim() ||
        !EMAIL_RE.test(director.emailId.trim()) ||
        director.mobileNumber.length !== 10
      ) {
        setError("Enter the director's first name, last name, a valid email and a 10-digit mobile number.");
        return;
      }
      if (director.npiNumber && !/^\d{10}$/.test(director.npiNumber)) {
        setError("Director NPI Number should be 10 digits.");
        return;
      }
    }
    const directorDetails = director.isSameAsAdmin
      ? { isSameAsAdmin: true }
      : { ...director };
    try {
      await updateLab.mutateAsync({ id: labId, body: { directorDetails } });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the director details.");
    }
  };

  const saveContact = async () => {
    setError(null);
    if (!labId) return setStep((s) => s + 1);
    // Primary contact is optional in the legacy flow.
    if (contact.emailId.trim() && !EMAIL_RE.test(contact.emailId.trim())) {
      setError("Enter a valid Primary Contact email.");
      return;
    }
    try {
      await updateLab.mutateAsync({ id: labId, body: { primaryContact: { ...contact } } });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the primary contact.");
    }
  };

  const populateDirectorFromAdmin = () => {
    const admin = (labQ.data?.adminDetails ?? {}) as Record<string, unknown>;
    if (!labQ.data?.adminId) {
      toast.warning("No admin is assigned to this lab yet.");
      return;
    }
    setDirector((d) => ({
      ...d,
      isSameAsAdmin: true,
      firstName: (admin.firstName as string) ?? "",
      middleName: (admin.middleName as string) ?? "",
      lastName: (admin.lastName as string) ?? "",
      emailId: (admin.emailId as string) ?? "",
      mobileNumber: onlyDigits((admin.mobileNumber as string) ?? ""),
      secondaryMobileNumber: onlyDigits((admin.secondaryMobileNumber as string) ?? ""),
      faxNumber: onlyDigits((admin.faxNumber as string) ?? ""),
      npiNumber: "",
    }));
  };

  const uploadAttachment = async () => {
    if (!labId || !attachmentFile || !attachmentName.trim()) return;
    const fd = new FormData();
    fd.append("attachmentName", attachmentName.trim());
    fd.append("file", attachmentFile);
    try {
      await http.post(`/lab/labs/${labId}/attachments`, fd);
      toast.success("Attachment uploaded.");
      setAttachmentName("");
      setAttachmentFile(null);
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Attachment upload failed.");
    }
  };

  const handleFinish = async () => {
    setError(null);
    if (!labId) return;
    try {
      // Report Setup (last step for Client / Reference-Client labs): persist the
      // theme colour, and the logo file if one was chosen.
      if (currentId === "report") {
        await updateLab.mutateAsync({ id: labId, body: { themeColor } });
        if (logoFile) {
          const fd = new FormData();
          fd.append("file", logoFile);
          try {
            await http.post(`/lab/labs/${labId}/logo`, fd);
          } catch (e) {
            toast.error((e as ApiError)?.message ?? "Logo upload failed; saved the rest.");
          }
        }
      }
      // Onboarding done: leave draft and activate the lab.
      await updateLab.mutateAsync({ id: labId, body: { status: "completed", isActive: true } });
      toast.success("Lab created successfully.");
      router.push(`/lab/${labId}`);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not finish.");
    }
  };

  // Single forward action; dispatches on the current step.
  const handleNext = () => {
    if (isLastStep) return handleFinish();
    switch (currentId) {
      case "details":
        return handleStep0();
      case "admin":
        return handleStep1();
      case "director":
        return saveDirector();
      case "contact":
        return saveContact();
      // physician & tests are informational in this pass — advance through them.
      case "physician":
      case "tests":
      case "attachments":
        return setStep((s) => s + 1);
      default:
        return setStep((s) => s + 1);
    }
  };

  // --- functionality selection (skipped when continuing) ---
  if (!role && !continuing) {
    return (
      <div className="shadcn-scope mx-auto flex max-w-2xl flex-col gap-4 py-4 text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Select Lab Functionality</h2>
          <p className="text-muted-foreground">Choose the role of this lab in the system. This determines how it handles samples.</p>
        </div>
        <div className="flex flex-col gap-3">
          {FUNCTIONALITIES.map((f) => (
            <button key={f.role} type="button" onClick={() => setRole(f.role)} className="rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-muted">
              <p className="font-bold text-primary">{f.label}</p>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </button>
          ))}
          <Link href="/lab" className={cn(buttonVariants({ variant: "ghost" }), "self-center")}>Cancel</Link>
        </div>
      </div>
    );
  }

  if (continuing && labQ.isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[40dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">{continuing ? "Continue Lab" : "Adding Lab"}</h2>

      <Stepper steps={stepIds.map((id) => STEP_TITLES[id])} activeStep={step} />

      <Card className="p-6">
        {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}

        {currentId === "details" && (
          <>
            <Section title="Lab Information">
              <TextField label="Lab Name" required value={form.name} onChange={(v) => setField("name", v)} onBlur={() => blur("name")} error={showErr("name")} />
              <TextField label="Lab ID" value={form.labExternalId} onChange={(v) => setField("labExternalId", v)} onBlur={() => blur("labExternalId")} error={showErr("labExternalId")} />
              <TextField label="Lab NPI Number" value={form.npiNumber} onChange={(v) => setField("npiNumber", onlyDigits(v).slice(0, 10))} onBlur={() => blur("npiNumber")} error={showErr("npiNumber")} inputMode="numeric" />
              <TextField label="CLIA ID" required value={form.cliaId} onChange={(v) => setField("cliaId", v.toUpperCase().slice(0, 10))} onBlur={() => blur("cliaId")} error={showErr("cliaId")} hint="10 characters" />
              <TextField label="CAP ID" value={form.capId} onChange={(v) => setField("capId", onlyDigits(v).slice(0, 7))} onBlur={() => blur("capId")} error={showErr("capId")} inputMode="numeric" hint="7 digits" />
              <TextField label="COLA ID" value={form.colaId} onChange={(v) => setField("colaId", onlyDigits(v).slice(0, 5))} onBlur={() => blur("colaId")} error={showErr("colaId")} inputMode="numeric" hint="5 digits" />
            </Section>

            <Section title="Contact Details">
              <TextField label="Email ID" required type="email" value={form.emailId} onChange={(v) => setField("emailId", v)} onBlur={() => blur("emailId")} error={showErr("emailId")} />
              <PhoneField label="Mobile Number" required value={form.mobileNumber} onChange={(v) => setField("mobileNumber", v)} onBlur={() => blur("mobileNumber")} error={showErr("mobileNumber")} />
              <PhoneField label="Secondary Mobile Number" value={form.secondaryMobileNumber} onChange={(v) => setField("secondaryMobileNumber", v)} onBlur={() => blur("secondaryMobileNumber")} error={showErr("secondaryMobileNumber")} />
              <PhoneField label="Fax Number" value={form.faxNumber} onChange={(v) => setField("faxNumber", v)} onBlur={() => blur("faxNumber")} error={showErr("faxNumber")} />
            </Section>

            <Section title="Address Details">
              <TextField label="Address Line 1" required value={form.addressLine1} onChange={(v) => setField("addressLine1", v)} onBlur={() => blur("addressLine1")} error={showErr("addressLine1")} />
              <TextField label="Address Line 2" value={form.addressLine2} onChange={(v) => setField("addressLine2", v)} />
              <div className="space-y-1.5">
                <Label>ZIP Code <span className="text-destructive">*</span></Label>
                {zipMode === "other" ? (
                  <Input
                    inputMode="numeric"
                    placeholder="Enter 5-digit ZIP"
                    value={form.zipcode}
                    onChange={(e) => setField("zipcode", onlyDigits(e.target.value).slice(0, 5))}
                    onBlur={() => blur("zipcode")}
                    aria-invalid={Boolean(showErr("zipcode"))}
                  />
                ) : (
                  <ZipField
                    value={form.zipcode}
                    invalid={Boolean(showErr("zipcode"))}
                    onPick={(row) => {
                      blur("zipcode");
                      if (row === "other") {
                        setZipMode("other");
                        setForm((f) => ({ ...f, zipcode: "", city: "", state: "" }));
                      } else if (row) {
                        setForm((f) => ({ ...f, zipcode: row.zipcode, city: row.city ?? "", state: row.state ?? "" }));
                      }
                    }}
                  />
                )}
                {zipMode === "other" && (
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setZipMode("select"); setField("zipcode", ""); }}>
                    ← Back to ZIP search
                  </button>
                )}
                <FieldError error={showErr("zipcode")} />
              </div>
              <TextField label="City" required value={form.city} onChange={(v) => setField("city", v)} onBlur={() => blur("city")} error={showErr("city")} readOnly={zipMode === "select"} />
              <TextField label="State" required value={form.state} onChange={(v) => setField("state", v)} onBlur={() => blur("state")} error={showErr("state")} readOnly={zipMode === "select"} />
            </Section>
          </>
        )}

        {currentId === "admin" && (
          <div className="max-w-xl space-y-4">
            <div className="inline-flex rounded-md border border-border p-0.5">
              {(["select", "create"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setAdminMode(m)} className={cn("rounded px-3 py-1.5 text-sm font-medium", adminMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {m === "select" ? "Select existing" : "Create new"}
                </button>
              ))}
            </div>

            {adminMode === "select" ? (
              <div className="space-y-1.5">
                <Label>Lab Admin</Label>
                <Combobox options={users.map((u) => ({ value: String(u.id), label: userFullName(u) }))} value={adminId} onChange={setAdminId} placeholder="Select Lab Admin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField label="First Name" required value={newAdmin.firstName} onChange={(v) => setNewAdmin((a) => ({ ...a, firstName: v }))} />
                <TextField label="Last Name" required value={newAdmin.lastName} onChange={(v) => setNewAdmin((a) => ({ ...a, lastName: v }))} />
                <TextField label="Email ID" required type="email" value={newAdmin.emailId} onChange={(v) => setNewAdmin((a) => ({ ...a, emailId: v }))} />
                <PhoneField label="Mobile Number" value={newAdmin.mobileNumber} onChange={(v) => setNewAdmin((a) => ({ ...a, mobileNumber: v }))} />
                <TextField label="NPI Number" value={newAdmin.npiNumber} onChange={(v) => setNewAdmin((a) => ({ ...a, npiNumber: onlyDigits(v).slice(0, 10) }))} inputMode="numeric" />
              </div>
            )}
            <Alert>Adding an admin is recommended, but it can be skipped and added later.</Alert>
          </div>
        )}

        {currentId === "director" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={director.isSameAsAdmin}
                onCheckedChange={(c) => setDirector((d) => ({ ...d, isSameAsAdmin: Boolean(c) }))}
              />
              Director is the same as the Lab Admin
            </label>
            {director.isSameAsAdmin ? (
              <Alert>The Lab Admin&apos;s details will be used as the Director.</Alert>
            ) : (
              <>
                {labQ.data?.adminId != null && (
                  <Button variant="outline" size="sm" onClick={populateDirectorFromAdmin}>
                    Populate from Admin
                  </Button>
                )}
                <Section title="Director Information">
                  <TextField label="NPI Number" value={director.npiNumber} onChange={(v) => setDirector((d) => ({ ...d, npiNumber: onlyDigits(v).slice(0, 10) }))} inputMode="numeric" hint="10 digits" />
                  <TextField label="First Name" required value={director.firstName} onChange={(v) => setDirector((d) => ({ ...d, firstName: v }))} />
                  <TextField label="Middle Name" value={director.middleName} onChange={(v) => setDirector((d) => ({ ...d, middleName: v }))} />
                  <TextField label="Last Name" required value={director.lastName} onChange={(v) => setDirector((d) => ({ ...d, lastName: v }))} />
                  <TextField label="Email ID" required type="email" value={director.emailId} onChange={(v) => setDirector((d) => ({ ...d, emailId: v }))} />
                  <PhoneField label="Mobile Number" required value={director.mobileNumber} onChange={(v) => setDirector((d) => ({ ...d, mobileNumber: v }))} />
                  <PhoneField label="Secondary Mobile Number" value={director.secondaryMobileNumber} onChange={(v) => setDirector((d) => ({ ...d, secondaryMobileNumber: v }))} />
                  <PhoneField label="Fax Number" value={director.faxNumber} onChange={(v) => setDirector((d) => ({ ...d, faxNumber: v }))} />
                </Section>
              </>
            )}
          </div>
        )}

        {currentId === "physician" && (
          <div className="max-w-xl space-y-3">
            <Alert>
              Provider / Physician details are captured against this lab&apos;s reference facility,
              which is set up after onboarding. You can continue for now and add physicians from the
              facility once it exists.
            </Alert>
          </div>
        )}

        {currentId === "contact" && (
          <Section title="Primary Contact (optional)">
            <TextField label="First Name" value={contact.firstName} onChange={(v) => setContact((c) => ({ ...c, firstName: v }))} />
            <TextField label="Last Name" value={contact.lastName} onChange={(v) => setContact((c) => ({ ...c, lastName: v }))} />
            <TextField label="Email ID" type="email" value={contact.emailId} onChange={(v) => setContact((c) => ({ ...c, emailId: v }))} />
            <PhoneField label="Mobile Number" value={contact.mobileNumber} onChange={(v) => setContact((c) => ({ ...c, mobileNumber: v }))} />
            <TextField label="Designation" value={contact.designation} onChange={(v) => setContact((c) => ({ ...c, designation: v }))} />
          </Section>
        )}

        {currentId === "tests" && (
          <div className="max-w-xl space-y-3">
            <Alert>
              Lab Offerings (tests &amp; panels) are configured from the Test Configuration module
              and linked to this lab. You can continue for now and assign offerings after onboarding.
            </Alert>
          </div>
        )}

        {currentId === "attachments" && (
          <div className="max-w-xl space-y-4">
            <TextField label="Attachment Name" value={attachmentName} onChange={setAttachmentName} placeholder="Enter Attachment Name" />
            <div className="space-y-1.5">
              <Label>File</Label>
              <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">JPEG, PNG or PDF, max 5 MB.</p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={uploadAttachment}
              disabled={!attachmentName.trim() || !attachmentFile}
            >
              <Upload className="h-4 w-4" /> Upload Attachment
            </Button>
          </div>
        )}

        {currentId === "report" && (
          <div className="max-w-xl space-y-4">
            <div className="space-y-1.5">
              <Label>Lab Logo</Label>
              <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">JPEG or PNG, max 5 MB. Appears on lab reports.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="themeColor">Report Theme Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="themeColor"
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border border-input bg-background"
                />
                <span className="text-sm text-muted-foreground">{themeColor}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/lab" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> {step === 0 && !labId ? "Cancel" : "Save & Exit"}
        </Link>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={busy} className="min-w-[110px]">Back</Button>
          )}
          <Button onClick={handleNext} disabled={busy} className="min-w-[120px] gap-1.5">
            {busy && <Spinner className="h-4 w-4" />}
            {busy ? "Saving…" : isLastStep ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">{children}</div>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-xs text-destructive">{error}</p> : null;
}

function TextField({
  label, value, onChange, onBlur, error, required, type, hint, inputMode, readOnly, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  inputMode?: "numeric" | "text";
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        type={type}
        inputMode={inputMode}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={cn(readOnly && "bg-muted")}
      />
      {error ? <FieldError error={error} /> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PhoneField({
  label, value, onChange, onBlur, error, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground">
          +1
        </span>
        <Input
          inputMode="numeric"
          value={value}
          placeholder="10-digit number"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          className="rounded-l-none"
        />
      </div>
      <FieldError error={error} />
    </div>
  );
}
