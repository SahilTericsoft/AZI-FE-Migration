"use client";

import { useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import {
  useCreateInstrument,
  useInstrumentOptions,
} from "@/features/lab-os/lab-os.queries";
import type { Instrument } from "@/features/lab-os/lab-os.types";

export default function InstrumentTab() {
  const { data, isLoading } = useInstrumentOptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const rows = (data ?? []).filter((i) =>
    !search.trim() ? true : (i.instrument ?? "").toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search instruments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Button className="h-9 gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Instrument
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instrument</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Asset Number</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No instruments found.</TableCell></TableRow>
            ) : (
              rows.map((i: Instrument) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.instrument ?? "—"}</TableCell>
                  <TableCell>{i.manufacturer ?? "—"}</TableCell>
                  <TableCell>{i.model ?? "—"}</TableCell>
                  <TableCell>{i.serial_number ?? "—"}</TableCell>
                  <TableCell>{i.asset_number ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {dialogOpen && <CreateInstrumentDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}

function CreateInstrumentDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const create = useCreateInstrument();
  const [form, setForm] = useState({
    instrument: "", manufacturer: "", model: "", serial_number: "", asset_number: "", category: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = useMemo(() => form.instrument.trim() !== "", [form.instrument]);

  const submit = () =>
    create.mutate(
      {
        instrument: form.instrument.trim(),
        manufacturer: form.manufacturer.trim() || undefined,
        model: form.model.trim() || undefined,
        serial_number: form.serial_number.trim() || undefined,
        asset_number: form.asset_number.trim() || undefined,
        category: form.category.trim() || undefined,
        loginUserId: user?.id,
      },
      { onSuccess: onClose },
    );

  return (
    <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Instrument</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2">
          <Field label="Instrument Name" required value={form.instrument} onChange={set("instrument")} />
          <Field label="Manufacturer" value={form.manufacturer} onChange={set("manufacturer")} />
          <Field label="Model" value={form.model} onChange={set("model")} />
          <Field label="Serial Number" value={form.serial_number} onChange={set("serial_number")} />
          <Field label="Asset Number" value={form.asset_number} onChange={set("asset_number")} />
          <Field label="Category" value={form.category} onChange={set("category")} />
        </div>
        {create.isError && <Alert variant="destructive">{create.error?.message ?? "Failed to create instrument."}</Alert>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || create.isPending} className="gap-1.5">
            {create.isPending && <Spinner className="h-4 w-4" />}Create Instrument
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
