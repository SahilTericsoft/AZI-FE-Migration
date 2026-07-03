"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";

import { useCreatePatient } from "../patient.queries";

const EMPTY = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  mobileNumber: "",
  emailId: "",
};

const GENDERS = ["male", "female", "other"];

export default function PatientFormDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const createPatient = useCreatePatient();
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleClose = () => {
    if (createPatient.isPending) return;
    setForm({ ...EMPTY });
    setError(null);
    onClose();
  };

  const submit = async () => {
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) {
      setError("First name, last name and date of birth are required.");
      return;
    }
    try {
      await createPatient.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        ...(form.gender ? { gender: form.gender } : {}),
        ...(form.mobileNumber.trim() ? { mobileNumber: form.mobileNumber.trim() } : {}),
        ...(form.emailId.trim() ? { emailId: form.emailId.trim() } : {}),
        ...(user?.id ? { loginUserId: user.id } : {}),
      });
      handleClose();
    } catch (err) {
      setError((err as ApiError)?.message ?? "Could not create patient.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New patient</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          {error && <Alert variant="destructive">{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-first">First name *</Label>
              <Input id="p-first" autoFocus value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-last">Last name *</Label>
              <Input id="p-last" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date of birth *</Label>
              <DatePicker value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unspecified" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" value={form.mobileNumber} onChange={(e) => set("mobileNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" type="email" value={form.emailId} onChange={(e) => set("emailId", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createPatient.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createPatient.isPending}>
            {createPatient.isPending ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
