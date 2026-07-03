"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ChevronRight, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { MultiCombobox, Combobox } from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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
import { formatDateTime } from "@/lib/datetime";
import { useAuth } from "@/features/auth/auth-context";
import { useDepartmentOptions } from "@/features/lab-os/lab-os.queries";
import { useCreateWorklist, useWorklists } from "@/features/lab-os/lab-os.queries";
import type { LabSession, WorklistSample } from "@/features/lab-os/lab-os.types";

import { PROCESSING_TYPES, type ProcessingConfig, type ProcessingSample } from "../sample-processing.types";

function isProcessing(s: LabSession): boolean {
  return (s.sample_config as ProcessingConfig | undefined)?.kind === "processing";
}
function cfg(s: LabSession): ProcessingConfig {
  return (s.sample_config ?? {}) as ProcessingConfig;
}

export default function SampleProcessingList() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, error } = useWorklists();
  const sessions = (data ?? []).filter(isProcessing);

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Sample Processing</h2>
        <div className="flex items-center gap-2">
          <Link href="/sample-processing/recycle-bin" className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5")}>
            <Trash2 className="h-4 w-4" /> Recycle Bin
          </Link>
          <Button className="h-9 gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Session
          </Button>
        </div>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load sessions."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Configuration</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Sample Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : sessions.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No sessions yet.</TableCell></TableRow>
            ) : (
              sessions.map((s) => {
                const c = cfg(s);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.id}</TableCell>
                    <TableCell className="capitalize">{c.department ?? "—"}</TableCell>
                    <TableCell>{c.processingType ?? "—"}</TableCell>
                    <TableCell>{c.plateId ?? "—"}</TableCell>
                    <TableCell>{c.samples?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_processed ? "success" : "outline"}>{s.is_processed ? "Completed" : s.status ?? "Open"}</Badge>
                    </TableCell>
                    <TableCell>{s.createdAt ? formatDateTime(s.createdAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/sample-processing/${s.id}`} aria-label="view" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {createOpen && <NewSessionDialog onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function NewSessionDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const create = useCreateWorklist(); // shared session create
  const departments = useDepartmentOptions();
  const { data: allSessions } = useWorklists();

  const worklists = useMemo(() => (allSessions ?? []).filter((s) => !isProcessing(s)), [allSessions]);

  const [department, setDepartment] = useState("");
  const [processingType, setProcessingType] = useState("");
  const [worklistIds, setWorklistIds] = useState<string[]>([]);
  const [subListIds, setSubListIds] = useState<string[]>([]);
  const [plateId, setPlateId] = useState("");
  const [comments, setComments] = useState("");
  const [isExisting, setIsExisting] = useState(false);
  const [existingIds, setExistingIds] = useState<string[]>([]);

  // PCR-only: existing processing plates available for reuse.
  const existingPlates = useMemo(
    () => (allSessions ?? []).filter((s) => isProcessing(s) && cfg(s).plateId),
    [allSessions],
  );

  const deptOptions = (departments.data ?? []).map((d) => ({ value: d.code ?? String(d.id), label: d.name ?? d.code ?? `#${d.id}` }));
  const isMolecular = (deptOptions.find((d) => d.value === department)?.label ?? "").toLowerCase() === "molecular";

  // Worklist + sublist options derived from the selected worklists.
  const worklistOptions = worklists.map((w) => ({ value: String(w.id), label: cfg(w).name || w.rack_number || `Worklist #${w.id}` }));
  const selectedWorklists = worklists.filter((w) => worklistIds.includes(String(w.id)));
  const sublistOptions = selectedWorklists.flatMap((w) => {
    const sublists = (w.sample_config as { sublists?: { name: string }[] } | undefined)?.sublists ?? [];
    const label = (w.sample_config as { name?: string } | undefined)?.name || w.rack_number || `WL#${w.id}`;
    return sublists.map((sl, i) => ({ value: `${w.id}:${i}`, label: `${label} · ${sl.name}` }));
  });

  const valid = department !== "" && processingType !== "" && worklistIds.length > 0 && plateId.trim() !== "";

  const gatherSamples = (): ProcessingSample[] => {
    const out: ProcessingSample[] = [];
    const seen = new Set<number>();
    for (const w of selectedWorklists) {
      const wc = w.sample_config as { samples?: WorklistSample[] } | undefined;
      for (const s of wc?.samples ?? []) {
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        out.push({ id: s.id, barcode: s.sampleCode ?? `#${s.id}`, code: s.sampleCode, panel: s.panel ?? null, patient: s.patient ?? null });
      }
    }
    return out;
  };

  const submit = () => {
    const samples = gatherSamples();
    const deptLabel = deptOptions.find((d) => d.value === department)?.label ?? department;
    const sampleConfig: ProcessingConfig = {
      kind: "processing",
      name: `${deptLabel} - ${processingType}`,
      department: deptLabel,
      processingType: processingType as ProcessingConfig["processingType"],
      plateId: plateId.trim(),
      comments: comments.trim() || undefined,
      worklistIds: worklistIds.map(Number),
      subListIds: subListIds.map((s) => Number(s.split(":")[1])),
      samples,
      testPanelCodes: [...new Set(samples.map((s) => s.panel).filter(Boolean) as string[])],
      cells: {},
      rows: null,
      columns: null,
      existingPlateDetails:
        isExisting && processingType === "PCR Processing"
          ? existingPlates
              .filter((p) => existingIds.includes(String(p.id)))
              .map((p) => ({ id: p.id, plateId: cfg(p).plateId ?? `#${p.id}`, cells: cfg(p).cells }))
          : undefined,
    };
    create.mutate(
      {
        protocol_type: processingType,
        rack_number: plateId.trim(),
        status: "open",
        is_processed: false,
        comments: comments.trim() || undefined,
        sample_count: samples.length,
        sample_config: sampleConfig,
        created_by: user?.id,
      },
      {
        onSuccess: () => { toast.success("Session created."); onClose(); },
        onError: (e) => toast.error(e?.message ?? "Could not create the session."),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Add Session</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Select Department <span className="text-destructive">*</span></Label>
            <Select value={department} onValueChange={(v) => { setDepartment(v); setProcessingType(""); setWorklistIds([]); setSubListIds([]); }}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>{deptOptions.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Worklist <span className="text-destructive">*</span></Label>
            <MultiCombobox options={worklistOptions} value={worklistIds} onChange={(v) => { setWorklistIds(v); setSubListIds([]); }} placeholder="Select worklist(s)" />
          </div>

          {sublistOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label>List</Label>
              <MultiCombobox options={sublistOptions} value={subListIds} onChange={setSubListIds} placeholder="Select sublist(s)" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Processing Type <span className="text-destructive">*</span></Label>
            <Combobox
              options={(isMolecular ? PROCESSING_TYPES : PROCESSING_TYPES.filter((p) => p.code === "General")).map((p) => ({ value: p.code, label: p.title }))}
              value={processingType || null}
              onChange={(v) => setProcessingType(v ?? "")}
              placeholder="Select processing type"
            />
            {!isMolecular && department && <p className="text-xs text-muted-foreground">Non-molecular departments use the General processing type.</p>}
          </div>

          {processingType === "PCR Processing" && (
            <div className="space-y-1.5">
              <Label>Proceed using existing ID(s)?</Label>
              <RadioGroup value={isExisting ? "yes" : "no"} onValueChange={(v) => setIsExisting(v === "yes")} className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> No</label>
              </RadioGroup>
              {isExisting && (
                <MultiCombobox
                  options={existingPlates.map((p) => ({ value: String(p.id), label: cfg(p).plateId ?? `#${p.id}` }))}
                  value={existingIds}
                  onChange={setExistingIds}
                  placeholder="Select existing ID(s)"
                />
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Enter ID <span className="text-destructive">*</span></Label>
            <Input value={plateId} onChange={(e) => setPlateId(e.target.value)} placeholder="Plate / session ID" />
          </div>

          <div className="space-y-1.5">
            <Label>Comment</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="Enter comment" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || create.isPending} className="gap-1.5">
            {create.isPending && <Spinner className="h-4 w-4" />}Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
