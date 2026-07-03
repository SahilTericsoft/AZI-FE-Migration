"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/core/api/types";
import { useAuth } from "@/features/auth/auth-context";
import { useDepartmentOptions } from "@/features/lab-os/lab-os.queries";

import { inventoryApi } from "../inventory.api";
import { useCreateItem } from "../inventory.queries";

const STEPS = ["Basic Details", "Sub-Items"];
const onlyDigits = (s: string) => s.replace(/\D/g, "");

interface SubItemDraft { name: string; units: string; alertQuantity: string; description: string }

export default function InventoryCreateWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const create = useCreateItem();
  const departments = useDepartmentOptions();

  const [step, setStep] = useState(0);
  const [itemId, setItemId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    department: "", category: "", name: "", type: "", units: "",
    storageLocation: "", alertQuantity: "", description: "", isSubItems: false,
  });
  const set = (k: keyof typeof form, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }));
  const [subs, setSubs] = useState<SubItemDraft[]>([]);
  const [draft, setDraft] = useState<SubItemDraft>({ name: "", units: "", alertQuantity: "", description: "" });

  const valid = form.department && form.category.trim() && form.name.trim() && form.type.trim() && form.units.trim() && form.storageLocation.trim() && form.alertQuantity;

  const saveBasic = async () => {
    setError(null);
    if (!valid) { setError("Please fill all required (*) fields."); return; }
    setBusy(true);
    try {
      const created = await create.mutateAsync({
        name: form.name.trim(), type: form.type.trim(), department: Number(form.department),
        category: form.category.trim(), units: form.units.trim(), storageLocation: form.storageLocation.trim(),
        alertQuantity: Number(form.alertQuantity), description: form.description.trim() || undefined,
        isSubItems: form.isSubItems, loginUserId: user?.id,
      });
      setItemId(created.id);
      if (form.isSubItems) { setStep(1); }
      else { toast.success("Inventory item created."); router.push(`/inventory/${created.id}`); }
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not create the item.");
    } finally { setBusy(false); }
  };

  const finishSubs = async () => {
    if (!itemId) return;
    setBusy(true);
    setError(null);
    try {
      for (const s of subs) {
        await inventoryApi.addSubItem({
          inventoryItemId: itemId, name: s.name.trim(), units: s.units.trim() || undefined,
          alertQuantity: s.alertQuantity ? Number(s.alertQuantity) : undefined, description: s.description.trim() || undefined,
        });
      }
      toast.success("Inventory item created.");
      router.push(`/inventory/${itemId}`);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save sub-items.");
    } finally { setBusy(false); }
  };

  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">Adding Inventory Item</h2>
      <Stepper steps={form.isSubItems ? STEPS : ["Basic Details"]} activeStep={step} />

      <Card className="p-6">
        {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}

        {step === 0 && (
          <Section>
            <div className="space-y-1.5">
              <Label>Department <span className="text-destructive">*</span></Label>
              <Select value={form.department} onValueChange={(v) => set("department", v)} disabled={departments.isLoading}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{(departments.data ?? []).map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name ?? `#${d.id}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Field label="Inventory Category" required value={form.category} onChange={(v) => set("category", v)} />
            <Field label="Item Name" required value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Item Type" required value={form.type} onChange={(v) => set("type", v)} />
            <Field label="Item Units" required value={form.units} onChange={(v) => set("units", v)} />
            <Field label="Storage Location" required value={form.storageLocation} onChange={(v) => set("storageLocation", v)} />
            <Field label="Alert Quantity" required value={form.alertQuantity} onChange={(v) => set("alertQuantity", onlyDigits(v))} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Does this item have sub-items?</Label>
              <RadioGroup className="flex gap-6" value={form.isSubItems ? "yes" : "no"} onValueChange={(v) => set("isSubItems", v === "yes")}>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> No</label>
              </RadioGroup>
            </div>
          </Section>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
              <div className="space-y-1.5"><Label>Sub-Item Name</Label><Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Units</Label><Input value={draft.units} onChange={(e) => setDraft((d) => ({ ...d, units: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Alert Qty</Label><Input value={draft.alertQuantity} onChange={(e) => setDraft((d) => ({ ...d, alertQuantity: onlyDigits(e.target.value) }))} /></div>
              <Button variant="outline" className="gap-1.5" disabled={!draft.name.trim()} onClick={() => { setSubs((s) => [...s, draft]); setDraft({ name: "", units: "", alertQuantity: "", description: "" }); }}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            {subs.length === 0 ? (
              <Alert>Add at least one sub-item, or go back and set &quot;has sub-items&quot; to No.</Alert>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {subs.map((s, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{s.name} <span className="text-muted-foreground">{s.units ? `· ${s.units}` : ""}{s.alertQuantity ? ` · alert ${s.alertQuantity}` : ""}</span></span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSubs((list) => list.filter((_, idx) => idx !== i))} aria-label="remove"><Trash2 className="h-4 w-4" /></Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/inventory" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}><ArrowLeft className="h-4 w-4" /> Cancel</Link>
        <div className="flex gap-2">
          {step === 0 ? (
            <Button onClick={saveBasic} disabled={busy || !valid} className="min-w-[140px] gap-1.5">{busy && <Spinner className="h-4 w-4" />}{form.isSubItems ? "Next" : "Create Item"}</Button>
          ) : (
            <Button onClick={finishSubs} disabled={busy || subs.length === 0} className="min-w-[140px] gap-1.5">{busy && <Spinner className="h-4 w-4" />}Create Item</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
