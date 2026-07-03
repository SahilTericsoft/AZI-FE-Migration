"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DetailField } from "@/components/ui/detail";
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
import { formatDateTime } from "@/lib/datetime";

import { useUpdateWorklist, useWorklist } from "@/features/lab-os/lab-os.queries";
import type { WorklistSample, WorklistSublist } from "@/features/lab-os/lab-os.types";

export default function WorklistDetail({ worklistId }: { worklistId: number }) {
  const { data: w, isLoading, isError } = useWorklist(worklistId);
  const update = useUpdateWorklist();
  const [sublistOpen, setSublistOpen] = useState(false);

  if (isLoading) {
    return <div className="shadcn-scope grid min-h-[50dvh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  }
  if (isError || !w) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/worklist" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}><ArrowLeft className="h-4 w-4" /> Back</Link>
        <p className="text-muted-foreground">Worklist not found.</p>
      </div>
    );
  }

  const cfg = w.sample_config ?? {};
  const samples: WorklistSample[] = cfg.samples ?? [];
  const sublists: WorklistSublist[] = cfg.sublists ?? [];
  const name = cfg.name || w.rack_number || `Worklist #${w.id}`;

  const saveConfig = (samples: WorklistSample[], sublists: WorklistSublist[], extra: Record<string, unknown> = {}) =>
    update.mutate({
      id: w.id,
      body: { sample_count: samples.length, sample_config: { ...cfg, samples, sampleIds: samples.map((s) => s.id), sublists }, ...extra },
    });

  const removeSample = (id: number) => {
    const nextSamples = samples.filter((s) => s.id !== id);
    const nextSublists = sublists.map((sl) => ({ ...sl, sampleIds: sl.sampleIds.filter((x) => x !== id) }));
    saveConfig(nextSamples, nextSublists);
    toast.success("Sample removed from worklist.");
  };

  const markProcessed = () =>
    update.mutate(
      { id: w.id, body: { is_processed: true, status: "completed" } },
      { onSuccess: () => toast.success("Worklist marked as processed.") },
    );

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link href="/worklist" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{name}</h2>
              <Badge variant={w.is_processed ? "success" : "outline"}>{w.is_processed ? "Processed" : w.status ?? "Open"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Protocol" value={w.protocol_type} />
              <DetailField label="Rack" value={w.rack_number} />
              <DetailField label="Samples" value={samples.length} />
              <DetailField label="Created on" value={w.createdAt ? formatDateTime(w.createdAt) : undefined} />
            </div>
          </div>
          {!w.is_processed && (
            <Button className="gap-2 self-start" onClick={markProcessed} disabled={update.isPending}>
              <CheckCircle2 className="h-4 w-4" /> Mark Processed
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-3 text-base font-bold">Assigned Samples</h3>
        {samples.length === 0 ? (
          <p className="py-4 text-muted-foreground">No samples assigned.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample Code</TableHead>
                <TableHead>Panel</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.sampleCode ?? `#${s.id}`}</TableCell>
                  <TableCell>{s.panel ?? "—"}</TableCell>
                  <TableCell className="capitalize">{s.patient ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{s.status ?? "—"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSample(s.id)} disabled={update.isPending} aria-label="remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">Sublists</h3>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSublistOpen(true)} disabled={samples.length === 0}>
            <Plus className="h-4 w-4" /> Add Sublist
          </Button>
        </div>
        {sublists.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">No sublists. A sublist is a subgroup of this worklist&apos;s samples.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {sublists.map((sl, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium">{sl.name}</span>
                <span className="text-muted-foreground">{sl.sampleIds.length} sample(s)</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {sublistOpen && (
        <AddSublistDialog
          samples={samples}
          onClose={() => setSublistOpen(false)}
          onSave={(sublist) => { saveConfig(samples, [...sublists, sublist]); setSublistOpen(false); toast.success("Sublist added."); }}
        />
      )}
    </div>
  );
}

function AddSublistDialog({
  samples, onClose, onSave,
}: {
  samples: WorklistSample[];
  onClose: () => void;
  onSave: (sublist: WorklistSublist) => void;
}) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const ids = Object.entries(picked).filter(([, v]) => v).map(([k]) => Number(k));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Add Sublist</DialogTitle></DialogHeader>
        <div className="space-y-1.5">
          <Label>Sublist Name <span className="text-destructive">*</span></Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="mt-2 space-y-2">
          <Label>Select Samples ({ids.length})</Label>
          <div className="max-h-56 overflow-auto rounded-lg border border-border">
            {samples.map((s) => (
              <label key={s.id} className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0">
                <Checkbox checked={Boolean(picked[s.id])} onCheckedChange={(c) => setPicked((m) => ({ ...m, [s.id]: Boolean(c) }))} />
                <span className="font-medium">{s.sampleCode ?? `#${s.id}`}</span>
                <span className="text-muted-foreground">{s.panel ?? "—"}</span>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ name: name.trim(), sampleIds: ids })} disabled={name.trim() === "" || ids.length === 0}>
            Add Sublist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
