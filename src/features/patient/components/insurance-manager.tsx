"use client";

import { useMemo, useState } from "react";

import { Pencil, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useCreateInsurance,
  useDeleteInsurance,
  usePatientInsurances,
  useUpdateInsurance,
} from "../patient.queries";
import type { PatientInsurance } from "../patient.types";

const INSURANCE_TYPES = ["Primary", "Secondary", "Tertiary"];
const RELATIONSHIPS = ["Self", "Spouse", "Child", "Other"];

/** Complete CRUD for a patient's insurances. */
export default function InsuranceManager({ patientId }: { patientId: number }) {
  const { data: insurances = [], isLoading, isError, error } = usePatientInsurances(patientId);
  const del = useDeleteInsurance(patientId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PatientInsurance | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Insurances</h4>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add Insurance
        </Button>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load insurances."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Insurance Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Policy #</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : insurances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No insurances on file. Add one to bill this order to insurance.
                </TableCell>
              </TableRow>
            ) : (
              insurances.map((ins) => (
                <TableRow key={ins.id}>
                  <TableCell>{ins.type ? <Badge variant="secondary">{ins.type}</Badge> : "—"}</TableCell>
                  <TableCell>{ins.insuranceCompany ?? "—"}</TableCell>
                  <TableCell>{ins.insurancePlan ?? "—"}</TableCell>
                  <TableCell>{ins.policyNumber ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="edit"
                      onClick={() => {
                        setEditing(ins);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="delete"
                      disabled={del.isPending}
                      onClick={() => {
                        if (window.confirm("Delete this insurance?")) del.mutate(ins.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {formOpen && (
        <InsuranceFormDialog
          patientId={patientId}
          insurance={editing}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}

type FormState = Record<string, string>;

const TEXT_FIELDS: { key: keyof PatientInsurance; label: string }[] = [
  { key: "insuranceCompany", label: "Insurance Company" },
  { key: "insurancePlan", label: "Insurance Plan" },
  { key: "policyNumber", label: "Policy Number" },
  { key: "payerId", label: "Payer ID" },
  { key: "groupName", label: "Group Name" },
  { key: "groupId", label: "Group ID" },
  { key: "groupNetwork", label: "Group Network" },
  { key: "networkPlanName", label: "Network Plan Name" },
  { key: "ipaMedicalGroupName", label: "IPA / Medical Group" },
  { key: "firstName", label: "Subscriber First Name" },
  { key: "middleName", label: "Subscriber Middle Name" },
  { key: "lastName", label: "Subscriber Last Name" },
];

function InsuranceFormDialog({
  patientId,
  insurance,
  onClose,
}: {
  patientId: number;
  insurance: PatientInsurance | null;
  onClose: () => void;
}) {
  const isEdit = insurance != null;
  const create = useCreateInsurance();
  const update = useUpdateInsurance(patientId);
  const pending = create.isPending || update.isPending;

  const [form, setForm] = useState<FormState>(() => {
    const init: FormState = {};
    TEXT_FIELDS.forEach(({ key }) => {
      init[key as string] = (insurance?.[key] as string | null) ?? "";
    });
    init.type = insurance?.type ?? "Primary";
    init.relationship = insurance?.relationship ?? "Self";
    init.dateOfBirth = insurance?.dateOfBirth ?? "";
    init.effectiveDate = insurance?.effectiveDate ?? "";
    return init;
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const valid = useMemo(
    () => form.insuranceCompany.trim() !== "" && form.policyNumber.trim() !== "",
    [form.insuranceCompany, form.policyNumber],
  );

  const handleSubmit = () => {
    const body: Record<string, unknown> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v.trim() !== "") body[k] = v.trim();
    });
    if (isEdit) update.mutate({ id: insurance!.id, body }, { onSuccess: onClose });
    else create.mutate({ patientId, ...body }, { onSuccess: onClose });
  };

  const err = (create.error ?? update.error)?.message;

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Insurance" : "Add Insurance"}</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto py-1 pr-1 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSURANCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Relationship to Patient</Label>
            <Select value={form.relationship} onValueChange={(v) => set("relationship", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {TEXT_FIELDS.map(({ key, label }) => (
            <div key={key as string} className="space-y-1.5">
              <Label htmlFor={`ins-${key}`}>
                {label}
                {(key === "insuranceCompany" || key === "policyNumber") && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              <Input
                id={`ins-${key}`}
                value={form[key as string]}
                onChange={(e) => set(key as string, e.target.value)}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label>Subscriber Date of Birth</Label>
            <DatePicker value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
          </div>
          <div className="space-y-1.5">
            <Label>Effective Date</Label>
            <DatePicker value={form.effectiveDate} onChange={(v) => set("effectiveDate", v)} />
          </div>
        </div>
        {err && <Alert variant="destructive">{err}</Alert>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || pending} className="gap-1.5">
            {pending && <Spinner className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Add Insurance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
