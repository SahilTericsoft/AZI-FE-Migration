"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { facilityApi } from "@/features/facility/facility.api";
import { FACILITY_TYPES } from "@/features/facility/facility.constants";
import { useFacilityLiteList } from "@/features/facility/facility.queries";
import { ZipField } from "@/features/geo/zip-field";
import { useLabLiteList } from "@/features/lab/lab.queries";
import { usePanelOptions, useTestOptions } from "@/features/test-config/test-config.queries";
import { userApi } from "@/features/user/user.api";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { locationApi } from "../location.api";
import { useCreateLocation, useLocationView, useUpdateLocation } from "../location.queries";
import type { Location } from "../location.types";

const STEPS = [
  "Location Details", "Admin Details", "User Details", "Primary Contact", "Provider/Physician",
  "Location Offerings", "Critical Details", "Billing Details", "Account Preferences", "Blood Draw Information",
];
type StepId =
  | "details" | "admin" | "users" | "contact" | "physician"
  | "offerings" | "critical" | "billing" | "account" | "blood";
const STEP_IDS: StepId[] = [
  "details", "admin", "users", "contact", "physician",
  "offerings", "critical", "billing", "account", "blood",
];

const PAYOR_MIX = [
  { key: "medicare", label: "Medicare" },
  { key: "medicaid", label: "Medicaid" },
  { key: "private", label: "Private" },
  { key: "clientBill", label: "Client Bill" },
  { key: "selfPay", label: "Self Pay" },
  { key: "workerComp", label: "Worker Comp" },
  { key: "card", label: "Card" },
  { key: "creditCard", label: "Credit Card" },
];
const DELIVERY_REPORT = ["Portal", "Auto Fax", "EMR/EMS Interface", "Email", "Parcel", "Amazon"];
const PICKUP_DELIVERY = ["FedEx", "Shipping", "Airship", "Wrap"];
const PICKUP_SCHEDULE = ["Call Lab", "Recurring", "Self Pick Up", "Delivery"];
const DRAW_OPTIONS = [
  { value: "inhouseLab", label: "In-house Lab" },
  { value: "externalLab", label: "External Lab" },
];

const EMPTY = { type: "", name: "", addressLine1: "", addressLine2: "", zipcode: "", city: "", state: "" };
type FormState = typeof EMPTY;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const emptyContact = () => ({ emailId: "", mobileNumber: "", secondaryMobileNumber: "", faxNumber: "" });

export default function LocationCreateWizard({ locationId: existingId }: { locationId?: number } = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const facilities = useFacilityLiteList();
  const labs = useLabLiteList();

  const continuing = existingId != null;
  const locationQ = useLocationView(existingId ?? 0, continuing);

  const { data: adminUsers } = useUserOptions({ roleCodes: ["locationAdmin"] });
  const { data: userUsers } = useUserOptions({ roleCodes: ["locationUser"] });
  const { data: physicianUsers } = useUserOptions({ roleCodes: ["physician"] });
  const panelsQ = usePanelOptions();
  const testsQ = useTestOptions();

  const opt = (docs: { id: number }[] | undefined, label: (u: never) => string) =>
    (docs ?? []).map((u) => ({ value: String(u.id), label: label(u as never) }));
  const adminOptions = useMemo(() => opt(adminUsers?.docs, (u) => userFullName(u)), [adminUsers]);
  const userOptions = useMemo(() => opt(userUsers?.docs, (u) => userFullName(u)), [userUsers]);
  const physicianOptions = useMemo(() => opt(physicianUsers?.docs, (u) => userFullName(u)), [physicianUsers]);
  const offeringOptions = useMemo(
    () => [
      ...(panelsQ.data ?? []).map((p) => ({ value: `panel-${p.id}`, label: `Panel: ${p.name ?? p.id}` })),
      ...(testsQ.data ?? []).map((t) => ({ value: `test-${t.id}`, label: `Test: ${t.name ?? t.id}` })),
    ],
    [panelsQ.data, testsQ.data],
  );

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [facilityId, setFacilityId] = useState<string>("");
  const [labId, setLabId] = useState<string>("");
  const [zipMode, setZipMode] = useState<"select" | "other">("select");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [locationId, setLocationId] = useState<number | null>(existingId ?? null);
  const [contacts, setContacts] = useState([emptyContact()]);

  // Admin / users
  const [adminMode, setAdminMode] = useState<"select" | "create">("select");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({ firstName: "", lastName: "", emailId: "", mobileNumber: "" });
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);
  const [userMode, setUserMode] = useState<"select" | "create">("select");
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", emailId: "", mobileNumber: "" });
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  // Primary contact
  const [contact, setContact] = useState({
    firstName: "", middleName: "", lastName: "", emailId: "", mobileNumber: "", secondaryMobileNumber: "", faxNumber: "",
  });

  // Physician
  const [physicianId, setPhysicianId] = useState<string | null>(null);
  const [physForm, setPhysForm] = useState({ npiNumber: "", firstName: "", middleName: "", lastName: "", emailId: "", mobileNumber: "", faxNumber: "" });
  const [npiLooking, setNpiLooking] = useState(false);
  const [addedPhysicians, setAddedPhysicians] = useState<string[]>([]);

  // Offerings
  const [offerings, setOfferings] = useState<string[]>([]);

  // Critical / billing
  const [critical, setCritical] = useState({ afterHoursContactNumber: "", emailId: "", faxNumber: "" });
  const [billing, setBilling] = useState({
    firstName: "", lastName: "", middleName: "", emailId: "", mobileNumber: "", secondaryMobileNumber: "", faxNumber: "",
  });

  // Account preferences
  const [payorChecked, setPayorChecked] = useState<Record<string, boolean>>({});
  const [payorPct, setPayorPct] = useState<Record<string, string>>({});
  const [preferredDeliveryReport, setPreferredDeliveryReport] = useState("");
  const [pickupDeliveryMethod, setPickupDeliveryMethod] = useState("");
  const [pickupSchedule, setPickupSchedule] = useState("");

  // Blood draw
  const [bloodDraw, setBloodDraw] = useState<"yes" | "no" | "">("");
  const [bloodForm, setBloodForm] = useState({ phlebName: "", phlebContactNumber: "", draw: "", phlebContractNeeded: "", phlebAddress: "", phlebZip: "" });
  const [pickups, setPickups] = useState<{ date: string; time: string }[]>([]);
  const [pickupDraft, setPickupDraft] = useState({ date: "", time: "" });

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showContinueConfirm, setShowContinueConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentId = STEP_IDS[step];
  const isLastStep = step === STEP_IDS.length - 1;

  // Prefill on continue.
  useEffect(() => {
    const l = locationQ.data as Location | undefined;
    if (!continuing || !l) return;
    const addr = (l.addressDetails ?? {}) as Record<string, unknown>;
    setForm({
      type: l.type ?? "",
      name: l.code ?? l.name ?? "",
      addressLine1: (addr.addressLine1 as string) ?? "",
      addressLine2: (addr.addressLine2 as string) ?? "",
      zipcode: (addr.zipcode as string) ?? "",
      city: (addr.city as string) ?? "",
      state: (addr.state as string) ?? "",
    });
    if (l.facilityId != null) setFacilityId(String(l.facilityId));
    if (l.labId != null) setLabId(String(l.labId));
    if (l.adminId != null) setAdminId(String(l.adminId));
    const ec = (l.emergencyContactDetails ?? null) as Record<string, unknown>[] | null;
    if (ec && ec.length) {
      setContacts(ec.slice(0, 2).map((c) => ({
        emailId: (c.emailId as string) ?? "",
        mobileNumber: onlyDigits((c.mobileNumber as string) ?? ""),
        secondaryMobileNumber: onlyDigits((c.secondaryMobileNumber as string) ?? ""),
        faxNumber: onlyDigits((c.faxNumber as string) ?? ""),
      })));
    }
  }, [continuing, locationQ.data]);

  const detailsErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!facilityId) e.facilityId = "Facility is required";
    if (!form.type.trim()) e.type = "Location Type is required";
    if (!form.name.trim()) e.name = "Location Name is required";
    if (!labId) e.labId = "Assigned Lab is required";
    if (!form.addressLine1.trim()) e.addressLine1 = "Address Line 1 is required";
    if (!form.zipcode.trim()) e.zipcode = "ZIP Code is required";
    else if (zipMode === "other" && !/^\d{5}$/.test(form.zipcode.trim())) e.zipcode = "Enter a valid 5-digit ZIP Code";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    return e;
  }, [facilityId, labId, form, zipMode]);
  const detailsValid = Object.keys(detailsErrors).length === 0;
  const showErr = (k: string) => (touched[k] ? detailsErrors[k] : undefined);
  const setField = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));
  const nameLocked = !facilityId || !form.type;

  const setContactAt = (i: number, k: string, v: string) =>
    setContacts((cs) => cs.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));

  // ---- save handlers ----
  const saveDetails = async () => {
    setError(null);
    setBusy(true);
    try {
      const body = {
        name: form.name.trim(),
        type: form.type.trim(),
        addressDetails: {
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim(),
          zipcode: form.zipcode.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
        },
        emergencyContactDetails: contacts.filter((c) => c.emailId || c.mobileNumber),
      };
      if (locationId) {
        await updateLocation.mutateAsync({ id: locationId, body });
      } else {
        const created = await createLocation.mutateAsync({
          ...body,
          facilityId: Number(facilityId),
          labId: Number(labId),
          loginUserId: user?.id ?? 1,
        });
        setLocationId(created.id);
      }
      setStep(1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the location.");
    } finally {
      setBusy(false);
    }
  };

  const saveAdmin = async () => {
    setError(null);
    if (!locationId) return setStep((s) => s + 1);
    setBusy(true);
    try {
      let resolved = adminId ? Number(adminId) : null;
      if (adminMode === "create") {
        if (!newAdmin.firstName.trim() || !newAdmin.lastName.trim() || !EMAIL_RE.test(newAdmin.emailId.trim())) {
          setError("Enter the new admin's first name, last name and a valid email.");
          setBusy(false);
          return;
        }
        const created = await userApi.create({
          firstName: newAdmin.firstName.trim(), lastName: newAdmin.lastName.trim(), emailId: newAdmin.emailId.trim(),
          roleCode: "locationAdmin", ...(newAdmin.mobileNumber ? { mobileNumber: newAdmin.mobileNumber } : {}), loginUserId: user?.id ?? 1,
        });
        resolved = created.id;
      }
      if (resolved) await updateLocation.mutateAsync({ id: locationId, body: { adminId: resolved } });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the admin.");
    } finally {
      setBusy(false);
    }
  };

  const createAndAddUser = async () => {
    setError(null);
    if (!locationId) return;
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !EMAIL_RE.test(newUser.emailId.trim())) {
      setError("Enter the new user's first name, last name and a valid email.");
      return;
    }
    setBusy(true);
    try {
      const created = await userApi.create({
        firstName: newUser.firstName.trim(), lastName: newUser.lastName.trim(), emailId: newUser.emailId.trim(),
        roleCode: "locationUser", ...(newUser.mobileNumber ? { mobileNumber: newUser.mobileNumber } : {}), loginUserId: user?.id ?? 1,
      });
      await locationApi.users.create({ locationId, userId: created.id });
      setCreatedUsers((l) => [...l, `${newUser.firstName} ${newUser.lastName}`.trim()]);
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
    if (!locationId) return setStep((s) => s + 1);
    setBusy(true);
    try {
      for (const id of assignUserIds) await locationApi.users.create({ locationId, userId: Number(id) });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not assign users.");
    } finally {
      setBusy(false);
    }
  };

  const populateContactFromAdmin = () => {
    const admin = (locationQ.data?.adminDetails ?? {}) as Record<string, unknown>;
    if (!locationQ.data?.adminId) {
      toast.warning("No admin is assigned to this location yet.");
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
    if (!locationId) return setStep((s) => s + 1);
    if (!contact.firstName.trim() || !contact.lastName.trim() || !EMAIL_RE.test(contact.emailId.trim()) || contact.mobileNumber.length !== 10) {
      setError("First name, last name, a valid email and a 10-digit mobile number are required.");
      return;
    }
    setBusy(true);
    try {
      await updateLocation.mutateAsync({ id: locationId, body: { primaryContactDetails: { ...contact } } });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the primary contact.");
    } finally {
      setBusy(false);
    }
  };

  const linkExistingPhysician = async () => {
    if (!locationId || !physicianId) {
      setError("Select a physician to link.");
      return;
    }
    setBusy(true);
    try {
      await locationApi.addPhysician(locationId, Number(physicianId));
      const label = physicianOptions.find((o) => o.value === physicianId)?.label ?? "Physician";
      setAddedPhysicians((l) => [...l, label]);
      setPhysicianId(null);
      toast.success("Physician linked to location.");
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not link physician.");
    } finally {
      setBusy(false);
    }
  };

  const lookupNpi = async () => {
    if (!/^\d{10}$/.test(physForm.npiNumber)) {
      setError("NPI Number should be 10 digits.");
      return;
    }
    setError(null);
    setNpiLooking(true);
    try {
      const d = await facilityApi.npiLookup(physForm.npiNumber);
      setPhysForm((p) => ({
        ...p, firstName: d.firstName || p.firstName, middleName: d.middleName || p.middleName,
        lastName: d.lastName || p.lastName, mobileNumber: onlyDigits(d.mobileNumber || ""), faxNumber: onlyDigits(d.faxNumber || ""),
      }));
      toast.success("Provider details fetched.");
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "NPI lookup failed.");
    } finally {
      setNpiLooking(false);
    }
  };

  const addManualPhysician = async () => {
    setError(null);
    if (!locationId) return;
    if (!physForm.firstName.trim() || !physForm.lastName.trim()) {
      setError("Enter the physician's first and last name (or use NPI lookup).");
      return;
    }
    setBusy(true);
    try {
      const created = await userApi.create({
        firstName: physForm.firstName.trim(), lastName: physForm.lastName.trim(), roleCode: "physician",
        ...(physForm.middleName ? { middleName: physForm.middleName.trim() } : {}),
        ...(physForm.emailId ? { emailId: physForm.emailId.trim() } : {}),
        ...(physForm.mobileNumber ? { mobileNumber: physForm.mobileNumber } : {}),
        ...(physForm.npiNumber ? { npiNumber: physForm.npiNumber } : {}),
        loginUserId: user?.id ?? 1,
      });
      await locationApi.addPhysician(locationId, created.id);
      setAddedPhysicians((l) => [...l, `${physForm.firstName} ${physForm.lastName}`.trim()]);
      setPhysForm({ npiNumber: "", firstName: "", middleName: "", lastName: "", emailId: "", mobileNumber: "", faxNumber: "" });
      toast.success("Physician added and linked.");
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not add the physician.");
    } finally {
      setBusy(false);
    }
  };

  const saveOfferings = async () => {
    if (!locationId) return setStep((s) => s + 1);
    setBusy(true);
    try {
      const panelIds = offerings.filter((o) => o.startsWith("panel-")).map((o) => Number(o.slice(6)));
      await updateLocation.mutateAsync({ id: locationId, body: { panels: panelIds } });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save offerings.");
    } finally {
      setBusy(false);
    }
  };

  const saveCritical = async () => {
    if (!locationId) return setStep((s) => s + 1);
    if (critical.emailId.trim() && !EMAIL_RE.test(critical.emailId.trim())) {
      setError("Enter a valid critical-contact email.");
      return;
    }
    setBusy(true);
    try {
      await updateLocation.mutateAsync({ id: locationId, body: { criticalDetails: { ...critical } } });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save critical details.");
    } finally {
      setBusy(false);
    }
  };

  const saveBilling = async () => {
    setError(null);
    if (!locationId) return setStep((s) => s + 1);
    if (!billing.firstName.trim() || !billing.lastName.trim() || !EMAIL_RE.test(billing.emailId.trim()) || billing.mobileNumber.length !== 10) {
      setError("Billing first name, last name, a valid email and a 10-digit mobile number are required.");
      return;
    }
    setBusy(true);
    try {
      await updateLocation.mutateAsync({ id: locationId, body: { billingDetails: { ...billing } } });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save billing details.");
    } finally {
      setBusy(false);
    }
  };

  const saveAccount = async () => {
    setError(null);
    if (!locationId) return setStep((s) => s + 1);
    // Each checked payor needs a percentage; each section needs one choice.
    for (const p of PAYOR_MIX) {
      if (payorChecked[p.key] && !payorPct[p.key]?.trim()) {
        setError(`Enter an estimated % for ${p.label}.`);
        return;
      }
    }
    if (!preferredDeliveryReport || !pickupDeliveryMethod || !pickupSchedule) {
      setError("Choose one option in each Account Preference section.");
      return;
    }
    const payorMix: Record<string, number> = {};
    for (const p of PAYOR_MIX) if (payorChecked[p.key]) payorMix[p.key] = Number(payorPct[p.key]);
    setBusy(true);
    try {
      await updateLocation.mutateAsync({
        id: locationId,
        body: { accountPreferences: { payorMix, preferredDeliveryReport, pickupDeliveryMethod, pickupSchedule } },
      });
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save account preferences.");
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    setError(null);
    if (!locationId) return;
    if (bloodDraw === "") {
      setError("Select whether blood draw is required.");
      return;
    }
    setBusy(true);
    try {
      const bloodDrawInformation =
        bloodDraw === "yes" ? { required: true, ...bloodForm, pickups } : { required: false };
      await updateLocation.mutateAsync({
        id: locationId,
        body: { bloodDrawInformation, status: "completed", isActive: true },
      });
      setShowSuccess(true);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not finish.");
    } finally {
      setBusy(false);
    }
  };

  const handleNext = () => {
    setError(null);
    switch (currentId) {
      case "details":
        if (!detailsValid) {
          setTouched({ facilityId: true, type: true, name: true, labId: true, addressLine1: true, zipcode: true, city: true, state: true });
          setError("Please fix the highlighted fields before continuing.");
          return;
        }
        setShowContinueConfirm(true);
        return;
      case "admin": return saveAdmin();
      case "users": return saveUsers();
      case "contact": return saveContact();
      case "physician": return setStep((s) => s + 1);
      case "offerings": return saveOfferings();
      case "critical": return saveCritical();
      case "billing": return saveBilling();
      case "account": return saveAccount();
      case "blood": return handleFinish();
    }
  };

  if (continuing && locationQ.isLoading) {
    return <div className="shadcn-scope grid min-h-[40dvh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  }

  const facilityOptions = facilities.data ?? [];
  const labOptions = labs.data ?? [];

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">{continuing ? "Continue Location" : "Adding Location"}</h2>
      <Stepper steps={STEPS} activeStep={step} />

      <Card className="p-6">
        {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}

        {currentId === "details" && (
          <>
            <Section title="Location Details">
              <SelectField label="Facility" required value={facilityId} onChange={(v) => { setFacilityId(v); blur("facilityId"); }} error={showErr("facilityId")} placeholder="Select facility" disabled={facilities.isLoading}
                options={facilityOptions.map((f) => ({ value: String(f.id), label: f.code ?? f.name ?? `#${f.id}` }))} />
              <SelectField label="Location Type" required value={form.type} onChange={(v) => { setField("type", v); blur("type"); }} error={showErr("type")} placeholder="Select type"
                options={FACILITY_TYPES.map((t) => ({ value: t, label: t }))} />
              <TextField label="Location Name" required value={form.name} onChange={(v) => setField("name", v)} onBlur={() => blur("name")} error={showErr("name")} readOnly={nameLocked} hint={nameLocked ? "Select Facility and Location Type first" : undefined} />
              <SelectField label="Assigned Lab" required value={labId} onChange={(v) => { setLabId(v); blur("labId"); }} error={showErr("labId")} placeholder="Select lab" disabled={labs.isLoading}
                options={labOptions.map((l) => ({ value: String(l.id), label: l.code ?? l.name ?? `#${l.id}` }))} />
            </Section>

            <Section title="Address Details">
              <TextField label="Address Line 1" required value={form.addressLine1} onChange={(v) => setField("addressLine1", v)} onBlur={() => blur("addressLine1")} error={showErr("addressLine1")} />
              <TextField label="Address Line 2" value={form.addressLine2} onChange={(v) => setField("addressLine2", v)} />
              <div className="space-y-1.5">
                <Label>ZIP Code <span className="text-destructive">*</span></Label>
                {zipMode === "other" ? (
                  <Input inputMode="numeric" placeholder="Enter 5-digit ZIP" value={form.zipcode}
                    onChange={(e) => setField("zipcode", onlyDigits(e.target.value).slice(0, 5))} onBlur={() => blur("zipcode")} aria-invalid={Boolean(showErr("zipcode"))} />
                ) : (
                  <ZipField value={form.zipcode} invalid={Boolean(showErr("zipcode"))} onPick={(row) => {
                    blur("zipcode");
                    if (row === "other") { setZipMode("other"); setForm((f) => ({ ...f, zipcode: "", city: "", state: "" })); }
                    else if (row) setForm((f) => ({ ...f, zipcode: row.zipcode, city: row.city ?? "", state: row.state ?? "" }));
                  }} />
                )}
                {zipMode === "other" && (
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setZipMode("select"); setField("zipcode", ""); }}>← Back to ZIP search</button>
                )}
                <FieldError error={showErr("zipcode")} />
              </div>
              <TextField label="City" required value={form.city} onChange={(v) => setField("city", v)} onBlur={() => blur("city")} error={showErr("city")} readOnly={zipMode === "select"} />
              <TextField label="State" required value={form.state} onChange={(v) => setField("state", v)} onBlur={() => blur("state")} error={showErr("state")} readOnly={zipMode === "select"} />
            </Section>

            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold">Contact Numbers</h3>
              {contacts.length < 2 && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setContacts((c) => [...c, emptyContact()])}>
                  <Plus className="h-4 w-4" /> Add another contact
                </Button>
              )}
            </div>
            {contacts.map((c, i) => (
              <div key={i} className="mb-4 rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Contact {i + 1}</span>
                  {contacts.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setContacts((cs) => cs.filter((_, idx) => idx !== i))} aria-label="remove contact">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                  <TextField label="Email ID" type="email" value={c.emailId} onChange={(v) => setContactAt(i, "emailId", v)} />
                  <PhoneField label="Mobile Number" value={c.mobileNumber} onChange={(v) => setContactAt(i, "mobileNumber", v)} />
                  <PhoneField label="Secondary Mobile Number" value={c.secondaryMobileNumber} onChange={(v) => setContactAt(i, "secondaryMobileNumber", v)} />
                  <PhoneField label="Fax Number" value={c.faxNumber} onChange={(v) => setContactAt(i, "faxNumber", v)} />
                </div>
              </div>
            ))}
          </>
        )}

        {currentId === "admin" && (
          <RoleStep
            mode={adminMode} setMode={setAdminMode} label="Location Admin"
            options={adminOptions} selected={adminId} onSelect={setAdminId}
            newPerson={newAdmin} setNewPerson={setNewAdmin}
          />
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
                <Label>Assign Location Users</Label>
                <MultiCombobox options={userOptions} value={assignUserIds} onChange={setAssignUserIds} placeholder="Select location users" />
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
                <ul className="list-disc pl-5 text-muted-foreground">{createdUsers.map((u, i) => <li key={`${u}-${i}`}>{u}</li>)}</ul>
              </div>
            )}
            <Alert>Only users with the Location User role are shown. This step is optional.</Alert>
          </div>
        )}

        {currentId === "contact" && (
          <div className="space-y-4">
            {locationQ.data?.adminId != null && (
              <Button variant="outline" size="sm" onClick={populateContactFromAdmin}>Fetch from Admin</Button>
            )}
            <Section title="Primary Contact">
              <TextField label="First Name" required value={contact.firstName} onChange={(v) => setContact((c) => ({ ...c, firstName: v }))} />
              <TextField label="Middle Name" value={contact.middleName} onChange={(v) => setContact((c) => ({ ...c, middleName: v }))} />
              <TextField label="Last Name" required value={contact.lastName} onChange={(v) => setContact((c) => ({ ...c, lastName: v }))} />
              <TextField label="Email ID" required type="email" value={contact.emailId} onChange={(v) => setContact((c) => ({ ...c, emailId: v }))} />
              <PhoneField label="Mobile Number" value={contact.mobileNumber} onChange={(v) => setContact((c) => ({ ...c, mobileNumber: v }))} />
              <PhoneField label="Secondary Mobile Number" value={contact.secondaryMobileNumber} onChange={(v) => setContact((c) => ({ ...c, secondaryMobileNumber: v }))} />
              <PhoneField label="Fax Number" value={contact.faxNumber} onChange={(v) => setContact((c) => ({ ...c, faxNumber: v }))} />
            </Section>
          </div>
        )}

        {currentId === "physician" && (
          <div className="space-y-5">
            <div className="max-w-xl space-y-2">
              <Label>Link an existing Provider/Physician</Label>
              <div className="flex gap-2">
                <div className="flex-1"><Combobox options={physicianOptions} value={physicianId} onChange={setPhysicianId} placeholder="Select physician" /></div>
                <Button variant="outline" onClick={linkExistingPhysician} disabled={busy || !physicianId}>Link to Location</Button>
              </div>
            </div>
            <Section title="Or add a new physician">
              <div className="space-y-1.5">
                <Label>NPI Number</Label>
                <div className="flex gap-2">
                  <Input inputMode="numeric" value={physForm.npiNumber} onChange={(e) => setPhysForm((p) => ({ ...p, npiNumber: onlyDigits(e.target.value).slice(0, 10) }))} placeholder="10-digit NPI" />
                  <Button variant="outline" className="gap-1.5" onClick={lookupNpi} disabled={npiLooking}>{npiLooking ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />} Lookup</Button>
                </div>
              </div>
              <TextField label="First Name" value={physForm.firstName} onChange={(v) => setPhysForm((p) => ({ ...p, firstName: v }))} />
              <TextField label="Middle Name" value={physForm.middleName} onChange={(v) => setPhysForm((p) => ({ ...p, middleName: v }))} />
              <TextField label="Last Name" value={physForm.lastName} onChange={(v) => setPhysForm((p) => ({ ...p, lastName: v }))} />
              <TextField label="Email ID" type="email" value={physForm.emailId} onChange={(v) => setPhysForm((p) => ({ ...p, emailId: v }))} />
              <PhoneField label="Mobile Number" value={physForm.mobileNumber} onChange={(v) => setPhysForm((p) => ({ ...p, mobileNumber: v }))} />
            </Section>
            <Button variant="outline" className="gap-1.5" onClick={addManualPhysician} disabled={busy}><Plus className="h-4 w-4" /> Add Physician</Button>
            {addedPhysicians.length > 0 && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-1 font-medium">Linked physicians</p>
                <ul className="list-disc pl-5 text-muted-foreground">{addedPhysicians.map((p, i) => <li key={`${p}-${i}`}>{p}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {currentId === "offerings" && (
          <div className="max-w-xl space-y-3">
            <Label>Test Panels &amp; Profiles</Label>
            <MultiCombobox options={offeringOptions} value={offerings} onChange={setOfferings} placeholder="Select test panels and profiles" loading={panelsQ.isLoading || testsQ.isLoading} />
            <Alert>Choose the panels and profiles this location offers.</Alert>
          </div>
        )}

        {currentId === "critical" && (
          <Section title="Critical Details">
            <PhoneField label="After Hours Contact Number" value={critical.afterHoursContactNumber} onChange={(v) => setCritical((c) => ({ ...c, afterHoursContactNumber: v }))} />
            <TextField label="Email ID" type="email" value={critical.emailId} onChange={(v) => setCritical((c) => ({ ...c, emailId: v }))} />
            <PhoneField label="Fax Number" value={critical.faxNumber} onChange={(v) => setCritical((c) => ({ ...c, faxNumber: v }))} />
          </Section>
        )}

        {currentId === "billing" && (
          <Section title="Billing Details">
            <TextField label="First Name" required value={billing.firstName} onChange={(v) => setBilling((b) => ({ ...b, firstName: v }))} />
            <TextField label="Middle Name" value={billing.middleName} onChange={(v) => setBilling((b) => ({ ...b, middleName: v }))} />
            <TextField label="Last Name" required value={billing.lastName} onChange={(v) => setBilling((b) => ({ ...b, lastName: v }))} />
            <TextField label="Email ID" required type="email" value={billing.emailId} onChange={(v) => setBilling((b) => ({ ...b, emailId: v }))} />
            <PhoneField label="Mobile Number" value={billing.mobileNumber} onChange={(v) => setBilling((b) => ({ ...b, mobileNumber: v }))} />
            <PhoneField label="Secondary Mobile Number" value={billing.secondaryMobileNumber} onChange={(v) => setBilling((b) => ({ ...b, secondaryMobileNumber: v }))} />
            <PhoneField label="Fax Number" value={billing.faxNumber} onChange={(v) => setBilling((b) => ({ ...b, faxNumber: v }))} />
          </Section>
        )}

        {currentId === "account" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-bold">Payor Mix</h3>
              <p className="mb-2 text-xs text-muted-foreground">Check the payors that apply and enter an estimated %.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PAYOR_MIX.map((p) => (
                  <div key={p.key} className="flex items-center gap-3">
                    <label className="flex flex-1 items-center gap-2 text-sm">
                      <Checkbox checked={Boolean(payorChecked[p.key])} onCheckedChange={(c) => setPayorChecked((s) => ({ ...s, [p.key]: Boolean(c) }))} />
                      {p.label}
                    </label>
                    {payorChecked[p.key] && (
                      <div className="flex items-center gap-1">
                        <Input className="h-8 w-20" inputMode="numeric" value={payorPct[p.key] ?? ""} onChange={(e) => setPayorPct((s) => ({ ...s, [p.key]: onlyDigits(e.target.value).slice(0, 3) }))} placeholder="%" />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <RadioField label="Preferred Delivery Report" required options={DELIVERY_REPORT} value={preferredDeliveryReport} onChange={setPreferredDeliveryReport} />
            <RadioField label="Specimen Pickup Delivery Method" required options={PICKUP_DELIVERY} value={pickupDeliveryMethod} onChange={setPickupDeliveryMethod} />
            <RadioField label="Specimen Pickup Schedule" required options={PICKUP_SCHEDULE} value={pickupSchedule} onChange={setPickupSchedule} />
          </div>
        )}

        {currentId === "blood" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Is blood draw required? <span className="text-destructive">*</span></Label>
              <RadioGroup className="flex gap-6" value={bloodDraw} onValueChange={(v) => setBloodDraw(v as "yes" | "no")}>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> No</label>
              </RadioGroup>
            </div>
            {bloodDraw === "yes" && (
              <>
                <Section title="Phlebotomist Details">
                  <TextField label="Phleb Name" value={bloodForm.phlebName} onChange={(v) => setBloodForm((b) => ({ ...b, phlebName: v }))} />
                  <PhoneField label="Phleb Contact Number" value={bloodForm.phlebContactNumber} onChange={(v) => setBloodForm((b) => ({ ...b, phlebContactNumber: v }))} />
                  <SelectField label="Draw" value={bloodForm.draw} onChange={(v) => setBloodForm((b) => ({ ...b, draw: v }))} placeholder="Select draw" options={DRAW_OPTIONS} />
                  <SelectField label="Phleb Contract Needed" value={bloodForm.phlebContractNeeded} onChange={(v) => setBloodForm((b) => ({ ...b, phlebContractNeeded: v }))} placeholder="Select" options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
                  <TextField label="Phleb Address" value={bloodForm.phlebAddress} onChange={(v) => setBloodForm((b) => ({ ...b, phlebAddress: v }))} />
                  <TextField label="Phleb ZIP Code" inputMode="numeric" value={bloodForm.phlebZip} onChange={(v) => setBloodForm((b) => ({ ...b, phlebZip: onlyDigits(v).slice(0, 5) }))} />
                </Section>
                <div>
                  <h3 className="mb-2 text-sm font-bold">Pickup Schedule</h3>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5"><Label>Pick Up Date</Label><Input type="date" value={pickupDraft.date} onChange={(e) => setPickupDraft((d) => ({ ...d, date: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>Pick Up Time</Label><Input type="time" value={pickupDraft.time} onChange={(e) => setPickupDraft((d) => ({ ...d, time: e.target.value }))} /></div>
                    <Button variant="outline" className="gap-1.5" onClick={() => { if (pickupDraft.date && pickupDraft.time) { setPickups((p) => [...p, pickupDraft]); setPickupDraft({ date: "", time: "" }); } }}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  {pickups.length > 0 && (
                    <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                      {pickups.map((p, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {p.date} at {p.time}
                          <button type="button" onClick={() => setPickups((ps) => ps.filter((_, idx) => idx !== i))} className="text-destructive hover:underline">remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-1.5" onClick={() => setShowExitConfirm(true)}>
          <ArrowLeft className="h-4 w-4" /> {step === 0 && !locationId ? "Cancel" : "Save & Exit"}
        </Button>
        <div className="flex gap-2">
          {step > 0 && <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={busy} className="min-w-[110px]">Back</Button>}
          <Button onClick={handleNext} disabled={busy || (currentId === "details" && !detailsValid)} className="min-w-[150px] gap-1.5">
            {busy && <Spinner className="h-4 w-4" />}
            {busy ? "Saving…" : isLastStep ? "Create Location" : "Next"}
          </Button>
        </div>
      </div>

      <Dialog open={showContinueConfirm} onOpenChange={(o) => !busy && setShowContinueConfirm(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue adding this location?</DialogTitle>
            <DialogDescription>The location will be saved as a draft so you can continue onboarding.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContinueConfirm(false)} disabled={busy}>Cancel</Button>
            <Button onClick={async () => { setShowContinueConfirm(false); await saveDetails(); }} disabled={busy} className="gap-1.5">{busy && <Spinner className="h-4 w-4" />}Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit without adding this location?</DialogTitle>
            <DialogDescription>{locationId ? "Your progress is saved as a draft and can be resumed from the location list." : "Any details entered will be discarded."}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitConfirm(false)}>Stay</Button>
            <Button onClick={() => router.push("/location")}>Exit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
            <DialogDescription>Location has been created successfully.</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => router.push("/location")}>Proceed</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- module-scope helpers (stable identity, no focus loss) ----
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
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  error?: string; required?: boolean; type?: string; hint?: string; inputMode?: "numeric" | "text"; readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input type={type} inputMode={inputMode} value={value} readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)} onBlur={onBlur} aria-invalid={Boolean(error)} className={cn(readOnly && "bg-muted")} />
      {error ? <FieldError error={error} /> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PhoneField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground">+1</span>
        <Input inputMode="numeric" value={value} placeholder="10-digit number" onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))} className="rounded-l-none" />
      </div>
    </div>
  );
}

function SelectField({
  label, value, onChange, options, placeholder, required, disabled, error,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
  placeholder?: string; required?: boolean; disabled?: boolean; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-invalid={Boolean(error)}><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
      <FieldError error={error} />
    </div>
  );
}

function RadioField({
  label, options, value, onChange, required,
}: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <RadioGroup className="flex flex-wrap gap-x-6 gap-y-2" value={value} onValueChange={onChange}>
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm"><RadioGroupItem value={o} /> {o}</label>
        ))}
      </RadioGroup>
    </div>
  );
}

function RoleStep({
  mode, setMode, label, options, selected, onSelect, newPerson, setNewPerson,
}: {
  mode: "select" | "create"; setMode: (m: "select" | "create") => void; label: string;
  options: { value: string; label: string }[]; selected: string | null; onSelect: (v: string | null) => void;
  newPerson: { firstName: string; lastName: string; emailId: string; mobileNumber: string };
  setNewPerson: (fn: (p: { firstName: string; lastName: string; emailId: string; mobileNumber: string }) => { firstName: string; lastName: string; emailId: string; mobileNumber: string }) => void;
}) {
  return (
    <div className="max-w-xl space-y-4">
      <div className="inline-flex rounded-md border border-border p-0.5">
        {(["select", "create"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={cn("rounded px-3 py-1.5 text-sm font-medium", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {m === "select" ? "Select existing" : "Create new"}
          </button>
        ))}
      </div>
      {mode === "select" ? (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          <Combobox options={options} value={selected} onChange={onSelect} placeholder={`Select ${label}`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="First Name" required value={newPerson.firstName} onChange={(v) => setNewPerson((p) => ({ ...p, firstName: v }))} />
          <TextField label="Last Name" required value={newPerson.lastName} onChange={(v) => setNewPerson((p) => ({ ...p, lastName: v }))} />
          <TextField label="Email ID" required type="email" value={newPerson.emailId} onChange={(v) => setNewPerson((p) => ({ ...p, emailId: v }))} />
          <PhoneField label="Mobile Number" value={newPerson.mobileNumber} onChange={(v) => setNewPerson((p) => ({ ...p, mobileNumber: v }))} />
        </div>
      )}
      <Alert>Only users with the {label} role are shown. This step is optional but recommended.</Alert>
    </div>
  );
}
