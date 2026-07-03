"use client";

import { useState } from "react";
import Link from "next/link";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { inventoryApi } from "../inventory.api";
import {
  inventoryKeys,
  useInventoryItem,
  useQuantities,
  useSubItems,
  useToggleItem,
} from "../inventory.queries";
import type { InventoryItem, InventorySubItem } from "../inventory.types";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export default function InventoryDetail({ itemId }: { itemId: number }) {
  const { data: item, isLoading, isError } = useInventoryItem(itemId);
  const toggle = useToggleItem();
  const [tab, setTab] = useState("details");

  if (isLoading) return <div className="shadcn-scope grid min-h-[50dvh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  if (isError || !item) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/inventory" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}><ArrowLeft className="h-4 w-4" /> Back</Link>
        <p className="text-muted-foreground">Inventory item not found.</p>
      </div>
    );
  }
  const lowStock = item.isLowStock || (item.quantity != null && item.alertQuantity != null && item.quantity <= item.alertQuantity);

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link href="/inventory" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{item.name}</h2>
              {lowStock && <Badge variant="destructive">Low Stock</Badge>}
              <Badge variant={item.isActive ? "success" : "outline"}>{item.isActive ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Quantity Available" value={item.quantity ?? 0} />
              <DetailField label="Alert Quantity" value={item.alertQuantity ?? undefined} />
              <DetailField label="Category" value={item.category} />
              <DetailField label="Units" value={item.units} />
            </div>
          </div>
          <label className="flex items-center gap-2 self-start text-sm">
            <Switch checked={Boolean(item.isActive)} onCheckedChange={() => toggle.mutate(item.id)} disabled={toggle.isPending} /> Active
          </label>
        </div>
      </Card>

      <Card className="p-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-2">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            {item.isSubItems && <TabsTrigger value="subitems">Sub-Items</TabsTrigger>}
            <TabsTrigger value="quantity">Quantity Management</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="details" className="mt-0"><BasicDetails item={item} /></TabsContent>
            {item.isSubItems && <TabsContent value="subitems" className="mt-0"><SubItemsTab item={item} /></TabsContent>}
            <TabsContent value="quantity" className="mt-0"><QuantityTab item={item} /></TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}

function BasicDetails({ item }: { item: InventoryItem }) {
  return (
    <DetailSection title="Basic Details">
      <DetailField label="Item Name" value={item.name} />
      <DetailField label="Item Type" value={item.type} />
      <DetailField label="Inventory Category" value={item.category} />
      <DetailField label="Item Units" value={item.units} />
      <DetailField label="Storage Location" value={item.storageLocation} />
      <DetailField label="Alert Quantity" value={item.alertQuantity ?? undefined} />
      <DetailField label="Quantity Available" value={item.quantity ?? 0} />
      <DetailField label="Description" value={item.description} />
    </DetailSection>
  );
}

function SubItemsTab({ item }: { item: InventoryItem }) {
  const qc = useQueryClient();
  const { data: subs, isLoading } = useSubItems(item.id);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", units: "", alertQuantity: "", description: "" });

  const add = async () => {
    setBusy(true);
    try {
      await inventoryApi.addSubItem({
        inventoryItemId: item.id, name: form.name.trim(), units: form.units.trim() || undefined,
        alertQuantity: form.alertQuantity ? Number(form.alertQuantity) : undefined, description: form.description.trim() || undefined,
      });
      toast.success("Sub-item added.");
      qc.invalidateQueries({ queryKey: inventoryKeys.subItems(item.id) });
      setForm({ name: "", units: "", alertQuantity: "", description: "" });
      setOpen(false);
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Failed.");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end"><Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Sub-Item</Button></div>
      {isLoading ? <Spinner className="mx-auto h-5 w-5" /> : (subs?.length ?? 0) === 0 ? (
        <p className="py-4 text-muted-foreground">No sub-items.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Units</TableHead><TableHead>Alert Qty</TableHead><TableHead>Qty Avail.</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
          <TableBody>
            {(subs ?? []).map((s: InventorySubItem) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">#{s.id}</TableCell>
                <TableCell>{s.name ?? "—"}</TableCell>
                <TableCell>{s.units ?? "—"}</TableCell>
                <TableCell>{s.alertQuantity ?? "—"}</TableCell>
                <TableCell>{s.quantity ?? 0}</TableCell>
                <TableCell>{s.description ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {open && (
        <Dialog open onOpenChange={(o) => !o && !busy && setOpen(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Sub-Item</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Units</Label><Input value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Alert Quantity</Label><Input value={form.alertQuantity} onChange={(e) => setForm((f) => ({ ...f, alertQuantity: onlyDigits(e.target.value) }))} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button onClick={add} disabled={busy || !form.name.trim()} className="gap-1.5">{busy && <Spinner className="h-4 w-4" />}Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function QuantityTab({ item }: { item: InventoryItem }) {
  const qc = useQueryClient();
  const { data: logs, isLoading } = useQuantities(item.id);
  const { data: subs } = useSubItems(item.isSubItems ? item.id : "");
  const [mode, setMode] = useState<"add" | "remove" | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: inventoryKeys.quantities(item.id) });
    qc.invalidateQueries({ queryKey: inventoryKeys.item(item.id) });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMode("add")}><Plus className="h-4 w-4" /> Add Quantity</Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMode("remove")}><Minus className="h-4 w-4" /> Remove / Usage</Button>
      </div>
      {isLoading ? <Spinner className="mx-auto h-5 w-5" /> : (logs?.length ?? 0) === 0 ? (
        <p className="py-4 text-muted-foreground">No quantity history.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Lot #</TableHead><TableHead>Qty</TableHead><TableHead>Manufacturer</TableHead><TableHead>Expiry</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {(logs ?? []).map((q) => (
              <TableRow key={q.id}>
                <TableCell><Badge variant={q.event === "add" ? "success" : "outline"} className="capitalize">{q.event ?? "—"}</Badge></TableCell>
                <TableCell>{q.lotNumber ?? "—"}</TableCell>
                <TableCell>{q.quantity ?? "—"}</TableCell>
                <TableCell>{q.manufacturer ?? "—"}</TableCell>
                <TableCell>{q.expiaryDate ? formatDate(q.expiaryDate) : "—"}</TableCell>
                <TableCell>{q.reason ?? "—"}</TableCell>
                <TableCell>{q.createdAt ? formatDateTime(q.createdAt) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {mode && (
        <QuantityDialog item={item} subs={subs ?? []} mode={mode} onClose={() => setMode(null)} onDone={() => { refresh(); setMode(null); }} />
      )}
    </div>
  );
}

function QuantityDialog({
  item, subs, mode, onClose, onDone,
}: {
  item: InventoryItem;
  subs: InventorySubItem[];
  mode: "add" | "remove";
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    subItemId: "", lotNumber: "", quantity: "", expiaryDate: "", manufacturer: "",
    batch: "", catalog: "", price: "", event: "remove", reason: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!form.quantity) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        itemId: item.id,
        subItemId: form.subItemId ? Number(form.subItemId) : undefined,
        lotNumber: form.lotNumber.trim() || undefined,
        quantity: Number(form.quantity),
      };
      if (mode === "add") {
        Object.assign(body, {
          expiaryDate: form.expiaryDate || undefined, manufacturer: form.manufacturer.trim() || undefined,
          batch: form.batch.trim() || undefined, catalog: form.catalog.trim() || undefined, price: form.price.trim() || undefined,
        });
        await inventoryApi.addQuantity(body);
      } else {
        Object.assign(body, { event: form.event, reason: form.reason.trim() || undefined });
        await inventoryApi.removeQuantity(body);
      }
      toast.success(mode === "add" ? "Quantity added." : "Quantity updated.");
      onDone();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Failed.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{mode === "add" ? "Add Quantity" : "Remove / Usage"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {item.isSubItems && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Sub-Item</Label>
              <Select value={form.subItemId} onValueChange={(v) => set("subItemId", v)}>
                <SelectTrigger><SelectValue placeholder="Select sub-item" /></SelectTrigger>
                <SelectContent>{subs.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name ?? `#${s.id}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5"><Label>Lot Number</Label><Input value={form.lotNumber} onChange={(e) => set("lotNumber", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Quantity *</Label><Input inputMode="numeric" value={form.quantity} onChange={(e) => set("quantity", onlyDigits(e.target.value))} /></div>
          {mode === "add" ? (
            <>
              <div className="space-y-1.5"><Label>Expiry Date</Label><Input type="date" value={form.expiaryDate} onChange={(e) => set("expiaryDate", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Batch Number</Label><Input value={form.batch} onChange={(e) => set("batch", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Catalog Number</Label><Input value={form.catalog} onChange={(e) => set("catalog", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Unit Price</Label><Input value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Event</Label>
                <Select value={form.event} onValueChange={(v) => set("event", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="remove">Remove</SelectItem><SelectItem value="usage">Usage</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => set("reason", e.target.value)} /></div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !form.quantity} className="gap-1.5">{busy && <Spinner className="h-4 w-4" />}{mode === "add" ? "Add" : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
