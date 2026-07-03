"use client";

import { useState } from "react";
import Link from "next/link";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Pencil, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailField, DetailSection } from "@/components/ui/detail";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime } from "@/lib/datetime";

import { instrumentApi } from "../instrument.api";
import { instrumentKeys, useInstrument, useUpdateInstrument } from "../instrument.queries";
import type { Instrument } from "../instrument.types";
import InstrumentCreateWizard from "./instrument-create-wizard";

const TABS = [
  { value: "details", label: "Instrument Details" },
  { value: "calibration", label: "Calibration Details" },
  { value: "maintenance", label: "Preventative Maintenance Log" },
  { value: "attachments", label: "Attachments" },
];

export default function InstrumentDetail({ instrumentId }: { instrumentId: number }) {
  const { data: inst, isLoading, isError } = useInstrument(instrumentId);
  const [tab, setTab] = useState("details");
  const [editing, setEditing] = useState(false);

  if (isLoading) return <div className="shadcn-scope grid min-h-[50dvh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  if (isError || !inst) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/instrument" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}><ArrowLeft className="h-4 w-4" /> Back</Link>
        <p className="text-muted-foreground">Instrument not found.</p>
      </div>
    );
  }
  // A draft instrument resumes onboarding at the calibration step.
  if ((inst.status ?? "") === "draft") {
    return <InstrumentCreateWizard instrumentId={instrumentId} />;
  }

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link href="/instrument" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{inst.instrument}</h2>
              <Badge variant={inst.status === "completed" ? "success" : "outline"}>{inst.status ?? "—"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Category" value={inst.category} />
              <DetailField label="Serial Number" value={inst.serial_number} />
              <DetailField label="Manufacturer" value={inst.manufacturer} />
              <DetailField label="Created On" value={inst.createdAt ? formatDateTime(inst.createdAt) : undefined} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setEditing(false); }}>
          <TabsList className="w-full overflow-x-auto px-2">
            {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
          </TabsList>
          <div className="p-6">
            {(tab === "details" || tab === "calibration") && !editing && (
              <div className="mb-2 flex justify-end">
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit Details</Button>
              </div>
            )}

            <TabsContent value="details" className="mt-0">
              {editing ? <DetailsEdit inst={inst} onDone={() => setEditing(false)} /> : <DetailsView inst={inst} />}
            </TabsContent>
            <TabsContent value="calibration" className="mt-0">
              {editing ? <CalibrationEdit inst={inst} onDone={() => setEditing(false)} /> : <CalibrationView inst={inst} />}
            </TabsContent>
            <TabsContent value="maintenance" className="mt-0"><MaintenanceTab /></TabsContent>
            <TabsContent value="attachments" className="mt-0"><AttachmentsTab inst={inst} /></TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}

function DetailsView({ inst }: { inst: Instrument }) {
  return (
    <DetailSection title="Instrument Details">
      <DetailField label="Instrument Name" value={inst.instrument} />
      <DetailField label="Model" value={inst.model} />
      <DetailField label="Asset Number" value={inst.asset_number} />
      <DetailField label="Serial Number" value={inst.serial_number} />
      <DetailField label="Location" value={inst.location} />
      <DetailField label="Purchase Date" value={inst.purchase_date ? formatDate(inst.purchase_date) : undefined} />
      <DetailField label="Manufacturer" value={inst.manufacturer} />
      <DetailField label="Category" value={inst.category} />
      <DetailField label="Linked to Plate Map" value={inst.isLinked ? "Yes" : "No"} />
      {inst.isLinked && <DetailField label="Plate Map Type" value={inst.plateType} />}
    </DetailSection>
  );
}

function CalibrationView({ inst }: { inst: Instrument }) {
  return (
    <DetailSection title="Calibration Details">
      <DetailField label="Last Calibration Date" value={inst.last_calibration_date ? formatDate(inst.last_calibration_date) : undefined} />
      <DetailField label="Next Calibration Date" value={inst.next_calibration_date ? formatDate(inst.next_calibration_date) : undefined} />
      <DetailField label="Calibration Frequency" value={inst.calibration_frequency} />
      <DetailField label="Calibration Type" value={inst.calibration_type} />
      <DetailField label="Vendor Name" value={inst.vendor_name} />
      <DetailField label="Vendor Phone Number" value={inst.vendor_phone_number} />
      <DetailField label="Vendor Email Address" value={inst.vendor_email_address} />
    </DetailSection>
  );
}

function useEdit(inst: Instrument, keys: string[], onDone: () => void) {
  const update = useUpdateInstrument();
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(keys.map((k) => [k, ((inst as unknown as Record<string, unknown>)[k] as string) ?? ""])),
  );
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setError(null);
    try {
      await update.mutateAsync({ id: inst.id, body: form });
      toast.success("Saved.");
      onDone();
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Could not save.");
    }
  };
  return { form, setForm, save, busy: update.isPending, error };
}

function DetailsEdit({ inst, onDone }: { inst: Instrument; onDone: () => void }) {
  const { form, setForm, save, busy, error } = useEdit(inst, ["instrument", "model", "asset_number", "serial_number", "location", "purchase_date", "manufacturer", "category"], onDone);
  return <EditGrid form={form} setForm={setForm} fields={[["instrument","Instrument Name"],["model","Model"],["asset_number","Asset Number"],["serial_number","Serial Number"],["location","Location"],["purchase_date","Purchase Date","date"],["manufacturer","Manufacturer"],["category","Category"]]} save={save} busy={busy} error={error} onDone={onDone} />;
}

function CalibrationEdit({ inst, onDone }: { inst: Instrument; onDone: () => void }) {
  const { form, setForm, save, busy, error } = useEdit(inst, ["last_calibration_date", "next_calibration_date", "calibration_frequency", "calibration_type", "vendor_name", "vendor_phone_number", "vendor_email_address"], onDone);
  return <EditGrid form={form} setForm={setForm} fields={[["last_calibration_date","Last Calibration Date","date"],["next_calibration_date","Next Calibration Date","date"],["calibration_frequency","Calibration Frequency"],["calibration_type","Calibration Type"],["vendor_name","Vendor Name"],["vendor_phone_number","Vendor Phone Number"],["vendor_email_address","Vendor Email Address"]]} save={save} busy={busy} error={error} onDone={onDone} />;
}

function EditGrid({
  form, setForm, fields, save, busy, error, onDone,
}: {
  form: Record<string, string>;
  setForm: (fn: (f: Record<string, string>) => Record<string, string>) => void;
  fields: [string, string, string?][];
  save: () => void; busy: boolean; error: string | null; onDone: () => void;
}) {
  return (
    <div>
      {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {fields.map(([k, label, type]) => (
          <div key={k} className="space-y-1.5">
            <Label>{label}</Label>
            <Input type={type} value={form[k] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" onClick={onDone} disabled={busy} className="min-w-[200px]">Cancel</Button>
        <Button onClick={save} disabled={busy} className="min-w-[200px] gap-1.5">{busy && <Spinner className="h-4 w-4" />}Save</Button>
      </div>
    </div>
  );
}

function MaintenanceTab() {
  // Mirrors the legacy app: the Preventative Maintenance Log lives in the
  // Compliance Hub module; this tab links across to it.
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="text-muted-foreground">To view the Preventative Maintenance Log module, click below.</p>
      <Link href="/compliance-hub" className={cn(buttonVariants(), "gap-1.5")}>
        Preventative Maintenance Log
      </Link>
    </div>
  );
}

function AttachmentsTab({ inst }: { inst: Instrument }) {
  const qc = useQueryClient();
  const attachments = inst.attachments ?? [];
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!name.trim() || !file) return;
    setBusy(true);
    try {
      await instrumentApi.addAttachment(inst.id, name.trim(), file);
      toast.success("Attachment uploaded.");
      qc.invalidateQueries({ queryKey: instrumentKeys.detail(inst.id) });
      setName(""); setFile(null);
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Upload failed.");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5"><Label>Attachment Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calibration Certificate" /></div>
        <div className="space-y-1.5"><Label>File</Label><Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        <Button onClick={upload} disabled={busy || !name.trim() || !file} className="gap-1.5">{busy && <Spinner className="h-4 w-4" />}Upload</Button>
      </div>
      {attachments.length === 0 ? (
        <p className="py-4 text-muted-foreground">No attachments uploaded.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {attachments.map((a, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{a.attachmentName}</span>
              <a href={a.secureUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline"><Download className="h-4 w-4" /> View</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
