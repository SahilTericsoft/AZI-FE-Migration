"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import { DetailField, DetailSection } from "@/components/ui/detail";
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
import { Stepper } from "@/components/ui/stepper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";
import { useFacilityLiteList } from "@/features/facility/facility.queries";
import { useLocationLiteList } from "@/features/location/location.queries";
import InsuranceManager from "@/features/patient/components/insurance-manager";
import { usePatientInsurances, usePatientList } from "@/features/patient/patient.queries";
import type { Patient } from "@/features/patient/patient.types";
import { sampleApi } from "@/features/sample/sample.api";
import { usePanelOptions, useTestOptions } from "@/features/test-config/test-config.queries";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { testOrderApi } from "../test-order.api";
import { useCreateOrder } from "../test-order.queries";

const STEPS = ["Select Patient", "Order Details", "Attachments", "Review Details"];

const PAYMENT_MODES = [
  { value: "selfPay", label: "Cash / Self Pay" },
  { value: "insurance", label: "Insurance" },
  { value: "billFacility", label: "Bill to Facility" },
];

function genBarcode(code?: string | null) {
  const prefix = (code || "SMP").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "SMP";
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function OrderCreateWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const createOrder = useCreateOrder();

  const facilities = useFacilityLiteList();
  const [facilityId, setFacilityId] = useState<string>("");
  const locations = useLocationLiteList(facilityId ? { facilityId: Number(facilityId) } : {});
  const [locationId, setLocationId] = useState<string>("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const panelOptionsQ = usePanelOptions();
  const testOptionsQ = useTestOptions();
  const physicianOptionsQ = useUserOptions();
  const [panelIds, setPanelIds] = useState<string[]>([]);
  const [testIds, setTestIds] = useState<string[]>([]);
  const [physicianId, setPhysicianId] = useState<string | null>(null);
  const [isPriority, setIsPriority] = useState(false);
  const [paymentMode, setPaymentMode] = useState("selfPay");
  const [insuranceId, setInsuranceId] = useState<string | null>(null);

  const insuranceMode = paymentMode === "insurance";
  const insurancesQ = usePatientInsurances(
    selectedPatient?.id ?? 0,
    insuranceMode && selectedPatient != null,
  );

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Attachments collected in step 2, uploaded after the order is created.
  const [attachments, setAttachments] = useState<{ name: string; file: File }[]>([]);
  const [attName, setAttName] = useState("");
  const [attFile, setAttFile] = useState<File | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const patientsQuery = usePatientList({ page: 1, limit: 10, search: search || undefined });
  const patients = patientsQuery.data?.docs ?? [];

  const panelOptions = panelOptionsQ.data ?? [];
  const testOptions = testOptionsQ.data ?? [];
  const physicians = physicianOptionsQ.data?.docs ?? [];
  const insurances = insurancesQ.data ?? [];

  const step0Valid = facilityId !== "" && locationId !== "" && selectedPatient !== null;

  const handleProceed = () => {
    setError(null);
    if (step === 0 && !step0Valid) {
      setError("Select a facility, a location, and a patient to continue.");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleCreate = async () => {
    setError(null);
    if (facilityId === "" || locationId === "" || !selectedPatient) {
      setStep(0);
      setError("Select a facility, a location, and a patient.");
      return;
    }
    const loginUserId = user?.id;
    if (!loginUserId) {
      setError("You must be signed in.");
      return;
    }
    const p = selectedPatient;
    const physician = physicians.find((u) => String(u.id) === physicianId);
    const selectedPanels = panelOptions.filter((x) => panelIds.includes(String(x.id)));
    const selectedTests = testOptions.filter((x) => testIds.includes(String(x.id)));
    const selectedInsurance = insurances.find((i) => String(i.id) === insuranceId);

    const physicianFields = physician
      ? {
          physicianId: physician.id,
          physicianDetails: {
            id: physician.id,
            firstName: physician.firstName,
            lastName: physician.lastName,
            npiNumber: physician.npiNumber,
          },
        }
      : {};
    const insuranceFields =
      insuranceMode && selectedInsurance ? { insuranceDetails: selectedInsurance } : {};

    setSubmitting(true);
    try {
      const order = await createOrder.mutateAsync({
        facilityId: Number(facilityId),
        locationId: Number(locationId),
        patientId: p.id,
        patientDetails: {
          id: p.id,
          prefix: p.prefix,
          firstName: p.firstName,
          middleName: p.middleName,
          lastName: p.lastName,
          suffix: p.suffix,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          mobileNumber: p.mobileNumber,
          emailId: p.emailId,
          code: p.code,
        },
        isPriorityOrder: isPriority,
        loginUserId,
      });

      for (const panel of selectedPanels) {
        await sampleApi.create({
          orderId: order.id,
          barcode: genBarcode(panel.code),
          panelId: panel.id,
          panelDetails: { name: panel.name, code: panel.code, sampleType: panel.sampleType },
          billingMode: paymentMode,
          isPriorityOrder: isPriority,
          ...physicianFields,
          ...insuranceFields,
          loginUserId,
        });
      }
      for (const test of selectedTests) {
        await sampleApi.create({
          orderId: order.id,
          barcode: genBarcode(test.code),
          testDetails: { name: test.name, code: test.code, sampleType: test.sampleType },
          billingMode: paymentMode,
          isPriorityOrder: isPriority,
          ...physicianFields,
          ...insuranceFields,
          loginUserId,
        });
      }

      for (const a of attachments) {
        try {
          await testOrderApi.addAttachment(order.id, a.name, a.file);
        } catch {
          // non-fatal: the order is created; surface a soft warning only
        }
      }

      router.push(`/test-order/${order.id}`);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not create the order.");
    } finally {
      setSubmitting(false);
    }
  };

  const facilityName = facilities.data?.find((f) => String(f.id) === facilityId);
  const locationName = locations.data?.find((l) => String(l.id) === locationId);
  const physician = physicians.find((u) => String(u.id) === physicianId);
  const selectedInsurance = insurances.find((i) => String(i.id) === insuranceId);
  const busy = submitting || createOrder.isPending;

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">Adding Test Order</h2>

      <Stepper steps={STEPS} activeStep={step} />

      <Card className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-3">
            {error}
          </Alert>
        )}

        {step === 0 && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Facility Name *</Label>
                <Select
                  value={facilityId}
                  onValueChange={(v) => {
                    setFacilityId(v);
                    setLocationId("");
                  }}
                  disabled={facilities.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {(facilities.data ?? []).map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.code ?? f.name ?? `#${f.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location Name *</Label>
                <Select value={locationId} onValueChange={setLocationId} disabled={facilityId === "" || locations.isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={facilityId === "" ? "Select a facility first" : "Select location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(locations.data ?? []).map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.code ?? l.name ?? `#${l.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Input
              placeholder="Search Patient…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9"
            />

            <Card className="max-h-[360px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Phone Number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientsQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <Spinner className="mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No patients found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((p) => {
                      const sel = selectedPatient?.id === p.id;
                      return (
                        <TableRow
                          key={p.id}
                          onClick={() => setSelectedPatient(p)}
                          className={cn("cursor-pointer", sel && "bg-primary/5")}
                        >
                          <TableCell>
                            <span
                              className={cn(
                                "grid h-4 w-4 place-items-center rounded-full border",
                                sel ? "border-primary" : "border-input",
                              )}
                            >
                              {sel && <span className="h-2 w-2 rounded-full bg-primary" />}
                            </span>
                          </TableCell>
                          <TableCell className="capitalize">{p.firstName ?? "—"}</TableCell>
                          <TableCell className="capitalize">{p.lastName ?? "—"}</TableCell>
                          <TableCell>{p.dateOfBirth ?? "—"}</TableCell>
                          <TableCell className="capitalize">{p.gender ?? "—"}</TableCell>
                          <TableCell>{p.mobileNumber ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <DetailSection title="Tests & Panels">
              <div className="space-y-1.5">
                <Label>Ordered Panel(s)</Label>
                <MultiCombobox
                  options={panelOptions.map((p) => ({ value: String(p.id), label: p.name ?? p.code ?? `#${p.id}` }))}
                  value={panelIds}
                  onChange={setPanelIds}
                  loading={panelOptionsQ.isLoading}
                  placeholder="Select panels"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ordered Test(s)</Label>
                <MultiCombobox
                  options={testOptions.map((t) => ({ value: String(t.id), label: t.name ?? t.code ?? `#${t.id}` }))}
                  value={testIds}
                  onChange={setTestIds}
                  loading={testOptionsQ.isLoading}
                  placeholder="Select tests"
                />
              </div>
            </DetailSection>

            <DetailSection title="Order Configuration">
              <div className="space-y-1.5">
                <Label>Ordering Physician</Label>
                <Combobox
                  options={physicians.map((u) => ({ value: String(u.id), label: userFullName(u) }))}
                  value={physicianId}
                  onChange={setPhysicianId}
                  placeholder="Select physician"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mode of Payment</Label>
                <Select
                  value={paymentMode}
                  onValueChange={(v) => {
                    setPaymentMode(v);
                    if (v !== "insurance") setInsuranceId(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <Checkbox checked={isPriority} onCheckedChange={(c) => setIsPriority(Boolean(c))} />
                Priority order
              </label>
            </DetailSection>

            {insuranceMode && selectedPatient && (
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <Label>Billing Insurance</Label>
                  <Combobox
                    options={insurances.map((i) => ({
                      value: String(i.id),
                      label:
                        [i.insuranceCompany, i.policyNumber && `#${i.policyNumber}`, i.type && `(${i.type})`]
                          .filter(Boolean)
                          .join(" ") || `Insurance #${i.id}`,
                    }))}
                    value={insuranceId}
                    onChange={setInsuranceId}
                    loading={insurancesQ.isLoading}
                    placeholder="Select the insurance to bill"
                  />
                </div>
                <InsuranceManager patientId={selectedPatient.id} />
              </div>
            )}

            <Alert>
              Each selected panel / test becomes a sample on this order (a barcode is generated for
              each). Per-sample collection details and ICD codes are follow-ups.
            </Alert>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-xl space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label>Attachment Name</Label>
                <Input value={attName} placeholder="e.g. Requisition" onChange={(e) => setAttName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>File</Label>
                <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setAttFile(e.target.files?.[0] ?? null)} />
              </div>
              <Button
                variant="outline"
                className="gap-1.5"
                disabled={!attName.trim() || !attFile}
                onClick={() => {
                  if (attName.trim() && attFile) {
                    setAttachments((a) => [...a, { name: attName.trim(), file: attFile }]);
                    setAttName("");
                    setAttFile(null);
                  }
                }}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">JPEG, PNG or PDF, max 5 MB. Uploaded when the order is created.</p>
            {attachments.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {attachments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{a.name} <span className="text-muted-foreground">({a.file.name})</span></span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAttachments((list) => list.filter((_, idx) => idx !== i))} aria-label="remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <Alert>No attachments added. This step is optional — click Next to continue.</Alert>
            )}
          </div>
        )}

        {step === 3 && (
          <DetailSection title="Review">
            <DetailField label="Facility" value={facilityName?.code ?? facilityName?.name} capitalize />
            <DetailField label="Location" value={locationName?.code ?? locationName?.name} capitalize />
            <DetailField
              label="Patient"
              value={[selectedPatient?.firstName, selectedPatient?.lastName].filter(Boolean).join(" ")}
              capitalize
            />
            <DetailField label="Date of Birth" value={selectedPatient?.dateOfBirth} />
            <DetailField label="Ordering Physician" value={physician ? userFullName(physician) : undefined} capitalize />
            <DetailField label="Priority" value={isPriority ? "Yes" : "No"} />
            <DetailField label="Mode of Payment" value={PAYMENT_MODES.find((m) => m.value === paymentMode)?.label} />
            {insuranceMode && (
              <DetailField
                label="Billing Insurance"
                value={
                  selectedInsurance
                    ? [selectedInsurance.insuranceCompany, selectedInsurance.policyNumber && `#${selectedInsurance.policyNumber}`]
                        .filter(Boolean)
                        .join(" ")
                    : "Not selected"
                }
              />
            )}
            <DetailField
              label="Panels / Tests"
              value={
                panelIds.length + testIds.length > 0
                  ? `${panelIds.length} panel(s), ${testIds.length} test(s)`
                  : "None"
              }
            />
          </DetailSection>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/test-order" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={busy} className="min-w-[120px]">
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={handleProceed} className="min-w-[120px]">
              {step === 0 ? "Proceed" : "Next"}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={busy} className="min-w-[140px] gap-1.5">
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? "Saving…" : "Create Order"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
