"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Plus, Search } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ZipField } from "@/features/geo/zip-field";
import { userApi } from "@/features/user/user.api";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { facilityApi } from "../facility.api";
import { FACILITY_TYPES } from "../facility.constants";
import { useCreateFacility, useFacilityView, useUpdateFacility } from "../facility.queries";
import type { Facility } from "../facility.types";

const STEPS = ["Facility Details", "Admin Details", "User Details", "Primary Contact", "Provider/Physician"];
type StepId = "details" | "admin" | "users" | "contact" | "physician";
const STEP_IDS: StepId[] = ["details", "admin", "users", "contact", "physician"];

const EMPTY = { type: "", name: "", addressLine1: "", addressLine2: "", zipcode: "", city: "", state: "" };
type FormState = typeof EMPTY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const onlyDigits = (s: string) => s.replace(/\D/g, "");

function validate(
  form: FormState,
  insuranceRequired: boolean | null,
  zipMode: "select" | "other",
): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.type.trim()) e.type = "Facility Type is required";
  if (!form.name.trim()) e.name = "Facility Name is required";
  if (!form.addressLine1.trim()) e.addressLine1 = "Address Line 1 is required";
  if (!form.zipcode.trim()) e.zipcode = "ZIP Code is required";
  else if (zipMode === "other" && !/^\d{5}$/.test(form.zipcode.trim())) e.zipcode = "Enter a valid 5-digit ZIP Code";
  if (!form.city.trim()) e.city = "City is required";
  if (!form.state.trim()) e.state = "State is required";
  if (insuranceRequired === null) e.insurance = "Select an insurance preference";
  return e;
}

export default function FacilityCreateWizard({ facilityId: existingId }: { facilityId?: number } = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility();

  const continuing = existingId != null;
  const facilityQ = useFacilityView(existingId ?? 0, continuing);

  // Role-scoped option lists (the dropdowns must show only the right role).
  const { data: adminUsers } = useUserOptions({ roleCodes: ["facilityAdmin"] });
  const { data: accountExecs } = useUserOptions({ roleCodes: ["accountExecutive"] });
  const { data: allUsers } = useUserOptions();

  const adminOptions = useMemo(
    () => (adminUsers?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [adminUsers],
  );
  const accountExecOptions = useMemo(
    () => (accountExecs?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [accountExecs],
  );
  const userOptions = useMemo(
    () => (allUsers?.docs ?? []).map((u) => ({ value: String(u.id), label: userFullName(u) })),
    [allUsers],
  );

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [insuranceRequired, setInsuranceRequired] = useState<boolean | null>(null);
  const [zipMode, setZipMode] = useState<"select" | "other">("select");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [facilityId, setFacilityId] = useState<number | null>(existingId ?? null);

  // Admin step
  const [adminMode, setAdminMode] = useState<"select" | "create">("select");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({ firstName: "", lastName: "", emailId: "", mobileNumber: "", npiNumber: "" });

  // User step
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);
  const [userMode, setUserMode] = useState<"select" | "create">("select");
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", emailId: "", mobileNumber: "" });
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  // Primary contact step
  const [contact, setContact] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    emailId: "",
    mobileNumber: "",
    secondaryMobileNumber: "",
    faxNumber: "",
    accountExecutiveId: "" as string,
  });

  // Physician step
  const [physician, setPhysician] = useState({
    npiNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    emailId: "",
    mobileNumber: "",
    faxNumber: "",
  });
  const [addedPhysicians, setAddedPhysicians] = useState<string[]>([]);
  const [npiLooking, setNpiLooking] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showContinueConfirm, setShowContinueConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentId = STEP_IDS[step];
  const isLastStep = step === STEP_IDS.length - 1;

  // Prefill when continuing a draft.
  useEffect(() => {
    const f = facilityQ.data as Facility | undefined;
    if (!continuing || !f) return;
    const addr = (f.addressDetails ?? {}) as Record<string, unknown>;
    setForm({
      type: f.type ?? "",
      name: f.code ?? f.name ?? "",
      addressLine1: (addr.addressLine1 as string) ?? "",
      addressLine2: (addr.addressLine2 as string) ?? "",
      zipcode: (addr.zipcode as string) ?? "",
      city: (addr.city as string) ?? "",
      state: (addr.state as string) ?? "",
    });
    if (typeof f.isInsuranceImageRequired === "boolean") setInsuranceRequired(f.isInsuranceImageRequired);
    if (f.adminId != null) setAdminId(String(f.adminId));
    const pc = (f.primaryContactDetails ?? null) as Record<string, unknown> | null;
    if (pc) {
      setContact((c) => ({
        ...c,
        firstName: (pc.firstName as string) ?? "",
        middleName: (pc.middleName as string) ?? "",
        lastName: (pc.lastName as string) ?? "",
        emailId: (pc.emailId as string) ?? "",
        mobileNumber: onlyDigits((pc.mobileNumber as string) ?? ""),
        secondaryMobileNumber: onlyDigits((pc.secondaryMobileNumber as string) ?? ""),
        faxNumber: onlyDigits((pc.faxNumber as string) ?? ""),
        accountExecutiveId: pc.accountExecutiveId != null ? String(pc.accountExecutiveId) : "",
      }));
    }
  }, [continuing, facilityQ.data]);

  const errors = useMemo(() => validate(form, insuranceRequired, zipMode), [form, insuranceRequired, zipMode]);
  const showErr = (k: string) => (touched[k] ? errors[k] : undefined);
  const setField = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));
  const step0Valid = Object.keys(errors).length === 0;

  const facilityPayload = () => ({
    name: form.name.trim(),
    type: form.type.trim(),
    addressDetails: {
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      zipcode: form.zipcode.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
    },
    isInsuranceImageRequired: insuranceRequired,
  });

  // Step 0: create (or update) the facility as a DRAFT, then advance.
  const saveDetails = async () => {
    setError(null);
    setBusy(true);
    try {
      if (facilityId) {
        await updateFacility.mutateAsync({ id: facilityId, body: facilityPayload() });
      } else {
        const created = await createFacility.mutateAsync({
          ...facilityPayload(),
          loginUserId: user?.id ?? 1,
        });
        setFacilityId(created.id);
      }
      setStep(1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the facility.");
    } finally {
      setBusy(false);
    }
  };

  const saveAdmin = async () => {
    setError(null);
    if (!facilityId) return setStep((s) => s + 1);
    setBusy(true);
    try {
      let resolvedAdminId = adminId ? Number(adminId) : null;
      if (adminMode === "create") {
        if (!newAdmin.firstName.trim() || !newAdmin.lastName.trim() || !EMAIL_RE.test(newAdmin.emailId.trim())) {
          setError("Enter the new admin's first name, last name and a valid email.");
          setBusy(false);
          return;
        }
        const createdUser = await userApi.create({
          firstName: newAdmin.firstName.trim(),
          lastName: newAdmin.lastName.trim(),
          emailId: newAdmin.emailId.trim(),
          roleCode: "facilityAdmin",
          ...(newAdmin.mobileNumber ? { mobileNumber: newAdmin.mobileNumber } : {}),
          ...(newAdmin.npiNumber ? { npiNumber: newAdmin.npiNumber } : {}),
          loginUserId: user?.id ?? 1,
        });
        resolvedAdminId = createdUser.id;
      }
      if (resolvedAdminId) await facilityApi.setAdmin(facilityId, resolvedAdminId);
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the admin.");
    } finally {
      setBusy(false);
    }
  };

  const createAndAddUser = async () => {
    setError(null);
    if (!facilityId) return;
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !EMAIL_RE.test(newUser.emailId.trim())) {
      setError("Enter the new user's first name, last name and a valid email.");
      return;
    }
    setBusy(true);
    try {
      const created = await userApi.create({
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        emailId: newUser.emailId.trim(),
        roleCode: "facilityUser",
        ...(newUser.mobileNumber ? { mobileNumber: newUser.mobileNumber } : {}),
        loginUserId: user?.id ?? 1,
      });
      await facilityApi.addUser(facilityId, created.id);
      setCreatedUsers((list) => [...list, `${newUser.firstName} ${newUser.lastName}`.trim()]);
      setNewUser({ firstName: "", lastName: "", emailId: "", mobileNumber: "" });
      toast.success("User created and assigned.");
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not create the user.");
    } finally {
      setBusy(false);
    }
  };

  const saveUsers = async () => {
    setError(null);
    if (!facilityId) return setStep((s) => s + 1);
    setBusy(true);
    try {
      for (const id of assignUserIds) {
        await facilityApi.addUser(facilityId, Number(id));
      }
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not assign the users.");
    } finally {
      setBusy(false);
    }
  };

  const populateContactFromAdmin = () => {
    const admin = (facilityQ.data?.adminDetails ?? {}) as Record<string, unknown>;
    if (!facilityQ.data?.adminId) {
      toast.warning("No admin is assigned to this facility yet.");
      return;
    }
    setContact((c) => ({
      ...c,
      firstName: (admin.firstName as string) ?? "",
      middleName: (admin.middleName as string) ?? "",
      lastName: (admin.lastName as string) ?? "",
      emailId: (admin.emailId as string) ?? "",
      mobileNumber: onlyDigits((admin.mobileNumber as string) ?? ""),
      secondaryMobileNumber: onlyDigits((admin.secondaryMobileNumber as string) ?? ""),
      faxNumber: onlyDigits((admin.faxNumber as string) ?? ""),
    }));
  };

  const saveContact = async () => {
    setError(null);
    if (!facilityId) return setStep((s) => s + 1);
    if (!contact.firstName.trim()) {
      setError("Primary Contact first name is required.");
      return;
    }
    if (contact.emailId.trim() && !EMAIL_RE.test(contact.emailId.trim())) {
      setError("Enter a valid Primary Contact email.");
      return;
    }
    setBusy(true);
    try {
      await updateFacility.mutateAsync({
        id: facilityId,
        body: {
          primaryContactDetails: {
            ...contact,
            accountExecutiveId: contact.accountExecutiveId ? Number(contact.accountExecutiveId) : null,
          },
        },
      });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the primary contact.");
    } finally {
      setBusy(false);
    }
  };

  const lookupNpi = async () => {
    if (!/^\d{10}$/.test(physician.npiNumber)) {
      setError("NPI Number should be 10 digits.");
      return;
    }
    setError(null);
    setNpiLooking(true);
    try {
      const d = await facilityApi.npiLookup(physician.npiNumber);
      setPhysician((p) => ({
        ...p,
        firstName: d.firstName || p.firstName,
        middleName: d.middleName || p.middleName,
        lastName: d.lastName || p.lastName,
        mobileNumber: onlyDigits(d.mobileNumber || ""),
        faxNumber: onlyDigits(d.faxNumber || ""),
      }));
      toast.success("Provider details fetched from NPI registry.");
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "NPI lookup failed.");
    } finally {
      setNpiLooking(false);
    }
  };

  const addPhysician = async () => {
    setError(null);
    if (!facilityId) return;
    if (!physician.firstName.trim() || !physician.lastName.trim()) {
      setError("Enter the physician's first and last name (or use NPI lookup).");
      return;
    }
    if (physician.emailId.trim() && !EMAIL_RE.test(physician.emailId.trim())) {
      setError("Enter a valid physician email.");
      return;
    }
    setBusy(true);
    try {
      const created = await userApi.create({
        firstName: physician.firstName.trim(),
        lastName: physician.lastName.trim(),
        roleCode: "physician",
        ...(physician.middleName ? { middleName: physician.middleName.trim() } : {}),
        ...(physician.emailId ? { emailId: physician.emailId.trim() } : {}),
        ...(physician.mobileNumber ? { mobileNumber: physician.mobileNumber } : {}),
        ...(physician.faxNumber ? { faxNumber: physician.faxNumber } : {}),
        ...(physician.npiNumber ? { npiNumber: physician.npiNumber } : {}),
        loginUserId: user?.id ?? 1,
      });
      await facilityApi.addPhysicians(facilityId, [created.id]);
      setAddedPhysicians((list) => [...list, `${physician.firstName} ${physician.lastName}`.trim()]);
      setPhysician({ npiNumber: "", firstName: "", middleName: "", lastName: "", emailId: "", mobileNumber: "", faxNumber: "" });
      toast.success("Physician added.");
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not add the physician.");
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    setError(null);
    if (!facilityId) return;
    setBusy(true);
    try {
      await updateFacility.mutateAsync({ id: facilityId, body: { status: "completed", isActive: true } });
      setShowSuccess(true);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not finish.");
    } finally {
      setBusy(false);
    }
  };

  const handleNext = () => {
    if (currentId === "details") {
      if (!step0Valid) {
        setTouched({ type: true, name: true, addressLine1: true, zipcode: true, city: true, state: true, insurance: true });
        setError("Please fix the highlighted fields before continuing.");
        return;
      }
      setShowContinueConfirm(true); // confirm before creating the facility
      return;
    }
    if (isLastStep) return handleFinish();
    if (currentId === "admin") return saveAdmin();
    if (currentId === "users") return saveUsers();
    if (currentId === "contact") return saveContact();
    setStep((s) => s + 1);
  };

  // --- render ---
  if (continuing && facilityQ.isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[40dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">{continuing ? "Continue Facility" : "Adding Facility"}</h2>

      <Stepper steps={STEPS} activeStep={step} />

      <Card className="p-6">
        {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}

        {currentId === "details" && (
          <>
            <Section title="Facility Details">
              <div className="space-y-1.5">
                <Label>Facility Type <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={(v) => { setField("type", v); blur("type"); }}>
                  <SelectTrigger aria-invalid={Boolean(showErr("type"))}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={showErr("type")} />
              </div>
              <TextField
                label="Facility Name"
                required
                value={form.name}
                onChange={(v) => setField("name", v)}
                onBlur={() => blur("name")}
                error={showErr("name")}
                readOnly={!form.type}
                hint={!form.type ? "Select a Facility Type first" : undefined}
              />
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

            <div className="space-y-2">
              <Label>Is uploading insurance images mandatory for this facility? <span className="text-destructive">*</span></Label>
              <RadioGroup
                className="flex gap-6"
                value={insuranceRequired === null ? "" : insuranceRequired ? "yes" : "no"}
                onValueChange={(v) => { setInsuranceRequired(v === "yes"); blur("insurance"); }}
              >
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> No</label>
              </RadioGroup>
              <FieldError error={showErr("insurance")} />
            </div>
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
                <Label>Facility Admin</Label>
                <Combobox options={adminOptions} value={adminId} onChange={setAdminId} placeholder="Select Facility Admin" />
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

        {currentId === "users" && (
          <div className="max-w-xl space-y-4">
            <div className="inline-flex rounded-md border border-border p-0.5">
              {(["select", "create"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setUserMode(m)} className={cn("rounded px-3 py-1.5 text-sm font-medium", userMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {m === "select" ? "Assign existing" : "Create new"}
                </button>
              ))}
            </div>
            {userMode === "select" ? (
              <div className="space-y-1.5">
                <Label>Assign Facility Users</Label>
                <MultiCombobox options={userOptions} value={assignUserIds} onChange={setAssignUserIds} placeholder="Select users to assign" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextField label="First Name" required value={newUser.firstName} onChange={(v) => setNewUser((u) => ({ ...u, firstName: v }))} />
                  <TextField label="Last Name" required value={newUser.lastName} onChange={(v) => setNewUser((u) => ({ ...u, lastName: v }))} />
                  <TextField label="Email ID" required type="email" value={newUser.emailId} onChange={(v) => setNewUser((u) => ({ ...u, emailId: v }))} />
                  <PhoneField label="Mobile Number" value={newUser.mobileNumber} onChange={(v) => setNewUser((u) => ({ ...u, mobileNumber: v }))} />
                </div>
                <Button variant="outline" className="gap-1.5" onClick={createAndAddUser} disabled={busy}>
                  <Plus className="h-4 w-4" /> Create &amp; Assign User
                </Button>
              </>
            )}
            {createdUsers.length > 0 && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-1 font-medium">Created &amp; assigned</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {createdUsers.map((u, i) => (
                    <li key={`${u}-${i}`}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
            <Alert>Assign existing users or create new ones for this facility. This step is optional.</Alert>
          </div>
        )}

        {currentId === "contact" && (
          <div className="space-y-4">
            {facilityQ.data?.adminId != null && (
              <Button variant="outline" size="sm" onClick={populateContactFromAdmin}>
                Fetch from Admin
              </Button>
            )}
            <Section title="Primary Contact">
              <TextField label="First Name" required value={contact.firstName} onChange={(v) => setContact((c) => ({ ...c, firstName: v }))} />
              <TextField label="Middle Name" value={contact.middleName} onChange={(v) => setContact((c) => ({ ...c, middleName: v }))} />
              <TextField label="Last Name" value={contact.lastName} onChange={(v) => setContact((c) => ({ ...c, lastName: v }))} />
              <TextField label="Email ID" type="email" value={contact.emailId} onChange={(v) => setContact((c) => ({ ...c, emailId: v }))} />
              <PhoneField label="Mobile Number" value={contact.mobileNumber} onChange={(v) => setContact((c) => ({ ...c, mobileNumber: v }))} />
              <PhoneField label="Secondary Mobile Number" value={contact.secondaryMobileNumber} onChange={(v) => setContact((c) => ({ ...c, secondaryMobileNumber: v }))} />
              <PhoneField label="Fax Number" value={contact.faxNumber} onChange={(v) => setContact((c) => ({ ...c, faxNumber: v }))} />
              <div className="space-y-1.5">
                <Label>Account Executive</Label>
                <Combobox
                  options={accountExecOptions}
                  value={contact.accountExecutiveId || null}
                  onChange={(v) => setContact((c) => ({ ...c, accountExecutiveId: v ?? "" }))}
                  placeholder="Select Account Executive"
                />
              </div>
            </Section>
          </div>
        )}

        {currentId === "physician" && (
          <div className="space-y-4">
            <Section title="Add Provider / Physician">
              <div className="space-y-1.5">
                <Label>NPI Number</Label>
                <div className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    value={physician.npiNumber}
                    onChange={(e) => setPhysician((p) => ({ ...p, npiNumber: onlyDigits(e.target.value).slice(0, 10) }))}
                    placeholder="10-digit NPI"
                  />
                  <Button variant="outline" className="gap-1.5" onClick={lookupNpi} disabled={npiLooking}>
                    {npiLooking ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                    Lookup
                  </Button>
                </div>
              </div>
              <TextField label="First Name" required value={physician.firstName} onChange={(v) => setPhysician((p) => ({ ...p, firstName: v }))} />
              <TextField label="Middle Name" value={physician.middleName} onChange={(v) => setPhysician((p) => ({ ...p, middleName: v }))} />
              <TextField label="Last Name" required value={physician.lastName} onChange={(v) => setPhysician((p) => ({ ...p, lastName: v }))} />
              <TextField label="Email ID" type="email" value={physician.emailId} onChange={(v) => setPhysician((p) => ({ ...p, emailId: v }))} />
              <PhoneField label="Mobile Number" value={physician.mobileNumber} onChange={(v) => setPhysician((p) => ({ ...p, mobileNumber: v }))} />
              <PhoneField label="Fax Number" value={physician.faxNumber} onChange={(v) => setPhysician((p) => ({ ...p, faxNumber: v }))} />
            </Section>
            <Button variant="outline" className="gap-1.5" onClick={addPhysician} disabled={busy}>
              <Plus className="h-4 w-4" /> Add Physician
            </Button>
            {addedPhysicians.length > 0 && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-1 font-medium">Added physicians</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {addedPhysicians.map((p, i) => (
                    <li key={`${p}-${i}`}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-1.5" onClick={() => setShowExitConfirm(true)}>
          <ArrowLeft className="h-4 w-4" /> {step === 0 && !facilityId ? "Cancel" : "Save & Exit"}
        </Button>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={busy} className="min-w-[110px]">Back</Button>
          )}
          <Button
            onClick={handleNext}
            disabled={busy || (currentId === "details" && !step0Valid)}
            className="min-w-[140px] gap-1.5"
          >
            {busy && <Spinner className="h-4 w-4" />}
            {busy ? "Saving…" : isLastStep ? "Create Facility" : "Next"}
          </Button>
        </div>
      </div>

      {/* Step-1 continue confirmation */}
      <Dialog open={showContinueConfirm} onOpenChange={(o) => !busy && setShowContinueConfirm(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue adding this facility?</DialogTitle>
            <DialogDescription>The facility will be saved as a draft so you can continue onboarding.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContinueConfirm(false)} disabled={busy}>Cancel</Button>
            <Button onClick={async () => { setShowContinueConfirm(false); await saveDetails(); }} disabled={busy} className="gap-1.5">
              {busy && <Spinner className="h-4 w-4" />}Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit confirmation */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit without adding this facility?</DialogTitle>
            <DialogDescription>
              {facilityId
                ? "Your progress is saved as a draft and can be resumed from the facility list."
                : "Any details entered will be discarded."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitConfirm(false)}>Stay</Button>
            <Button onClick={() => router.push("/facility")}>Exit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success confirmation */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
            <DialogDescription>Facility has been created successfully.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push("/facility")}>Proceed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  label, value, onChange, onBlur, error, required, type, hint, inputMode, readOnly,
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
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground">
          +1
        </span>
        <Input
          inputMode="numeric"
          value={value}
          placeholder="10-digit number"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className="rounded-l-none"
        />
      </div>
    </div>
  );
}
