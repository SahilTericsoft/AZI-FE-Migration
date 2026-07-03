"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ChevronRight, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatDate } from "@/lib/datetime";
import { useAuth } from "@/features/auth/auth-context";
import { useLabLiteList } from "@/features/lab/lab.queries";
import { useSampleList } from "@/features/sample/sample.queries";
import type { Sample } from "@/features/sample/sample.types";

import { useCreateWorklist, useWorklists } from "@/features/lab-os/lab-os.queries";
import type { LabSession, WorklistSample } from "@/features/lab-os/lab-os.types";

function worklistName(s: LabSession): string {
  return s.sample_config?.name || s.rack_number || `Worklist #${s.id}`;
}
function rec(v: unknown): Record<string, unknown> {
  return (v ?? {}) as Record<string, unknown>;
}
function sampleSnapshot(s: Sample): WorklistSample {
  const panel = rec(s.panelDetails).name as string | undefined;
  const pat = rec(rec(s.orderDetails).patientDetails);
  const patient = [pat.firstName, pat.lastName].filter(Boolean).join(" ").trim() || undefined;
  return { id: s.id, sampleCode: s.sampleCode ?? s.barcode, panel: panel ?? null, patient: patient ?? null, status: s.status };
}

export default function WorklistSessionsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, error } = useWorklists();
  const worklists = data ?? [];

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Worklist</h2>
        <Button className="h-9 gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Worklist
        </Button>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load worklists."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worklist</TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead>Rack</TableHead>
              <TableHead>Samples</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : worklists.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No worklists yet.</TableCell></TableRow>
            ) : (
              worklists.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{worklistName(w)}</TableCell>
                  <TableCell>{w.protocol_type ?? "—"}</TableCell>
                  <TableCell>{w.rack_number ?? "—"}</TableCell>
                  <TableCell>{w.sample_count ?? w.sample_config?.sampleIds?.length ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={w.is_processed ? "success" : "outline"}>
                      {w.is_processed ? "Processed" : w.status ?? "Open"}
                    </Badge>
                  </TableCell>
                  <TableCell>{w.createdAt ? formatDate(w.createdAt) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/worklist/${w.id}`} aria-label="view" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {createOpen && <CreateWorklistDialog onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function CreateWorklistDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const create = useCreateWorklist();
  const labs = useLabLiteList();

  const [name, setName] = useState("");
  const [protocol, setProtocol] = useState("");
  const [rack, setRack] = useState("");
  const [labId, setLabId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, Sample>>({});

  // Candidate samples to assign: accessioned, not yet resulted.
  const { data: sampleData, isLoading } = useSampleList({ page: 1, limit: 50, search: search.trim() || undefined });
  const samples = sampleData?.docs ?? [];
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const toggle = (s: Sample) =>
    setSelected((m) => {
      const next = { ...m };
      if (next[s.id]) delete next[s.id];
      else next[s.id] = s;
      return next;
    });

  const valid = name.trim() !== "" && selectedList.length > 0;

  const submit = () => {
    const snapshots = selectedList.map(sampleSnapshot);
    create.mutate(
      {
        rack_number: rack.trim() || undefined,
        protocol_type: protocol.trim() || undefined,
        lab_id: labId ? Number(labId) : undefined,
        status: "open",
        is_processed: false,
        sample_count: snapshots.length,
        sample_config: { name: name.trim(), sampleIds: snapshots.map((s) => s.id), samples: snapshots, sublists: [] },
        created_by: user?.id,
      },
      {
        onSuccess: () => { toast.success("Worklist created."); onClose(); },
        onError: (e) => toast.error(e?.message ?? "Could not create the worklist."),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>New Worklist</DialogTitle></DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Worklist Name <span className="text-destructive">*</span></Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Protocol Type</Label><Input value={protocol} onChange={(e) => setProtocol(e.target.value)} placeholder="e.g. PCR" /></div>
          <div className="space-y-1.5"><Label>Rack Number</Label><Input value={rack} onChange={(e) => setRack(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Lab</Label>
            <Select value={labId} onValueChange={setLabId} disabled={labs.isLoading}>
              <SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger>
              <SelectContent>
                {(labs.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.code ?? l.name ?? `#${l.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label>Assign Samples <span className="text-destructive">*</span></Label>
            <span className="text-xs text-muted-foreground">{selectedList.length} selected</span>
          </div>
          <Input placeholder="Search samples…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
          <div className="max-h-56 overflow-auto rounded-lg border border-border">
            {isLoading ? (
              <div className="py-8 text-center"><Spinner className="mx-auto" /></div>
            ) : samples.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No samples found.</p>
            ) : (
              samples.map((s) => (
                <label key={s.id} className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0">
                  <Checkbox checked={Boolean(selected[s.id])} onCheckedChange={() => toggle(s)} />
                  <span className="font-medium">{s.sampleCode ?? s.barcode ?? `#${s.id}`}</span>
                  <span className="text-muted-foreground">{(rec(s.panelDetails).name as string) ?? "—"}</span>
                  <span className="ml-auto"><Badge variant="outline">{s.status ?? "—"}</Badge></span>
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || create.isPending} className="gap-1.5">
            {create.isPending && <Spinner className="h-4 w-4" />}Create Worklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
