"use client";

import { useMemo, useState } from "react";
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
import type { Lab } from "@/features/lab/lab.types";
import { useSampleList } from "@/features/sample/sample.queries";
import type { Sample } from "@/features/sample/sample.types";

import { useCreateSendoutBatch, useSendoutList } from "../sendout.queries";

const PAGE_SIZE = 10;

function labLabel(lab?: Lab): string {
  if (!lab) return "—";
  return lab.name ?? lab.code ?? `Lab #${lab.id}`;
}
function rec(v: unknown): Record<string, unknown> {
  return (v ?? {}) as Record<string, unknown>;
}

export default function SendoutList() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error } = useSendoutList({ page, limit: PAGE_SIZE });
  const labs = useLabLiteList();

  const batches = data?.docs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const labById = useMemo(() => {
    const map = new Map<number, Lab>();
    for (const l of labs.data ?? []) map.set(l.id, l);
    return map;
  }, [labs.data]);

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Sendout</h2>
        <Button className="h-9 gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Sendout
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load sendout batches."}</Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead>Sendout Lab</TableHead>
              <TableHead>Samples</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No sendout batches yet.
                </TableCell>
              </TableRow>
            ) : (
              batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">Batch #{b.id}</TableCell>
                  <TableCell>
                    {b.sendoutLabId ? labLabel(labById.get(b.sendoutLabId)) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {b.sampleCount ?? b.sampleIds?.length ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>{b.createdAt ? formatDate(b.createdAt) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/sendout/${b.id}`}
                      aria-label="view"
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} batch{total === 1 ? "" : "es"} · page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {createOpen && <CreateSendoutDialog onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function CreateSendoutDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const create = useCreateSendoutBatch();
  const labs = useLabLiteList();

  const [labId, setLabId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, Sample>>({});

  const { data: sampleData, isLoading } = useSampleList({
    page: 1,
    limit: 50,
    search: search.trim() || undefined,
  });
  const samples = sampleData?.docs ?? [];
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const toggle = (s: Sample) =>
    setSelected((m) => {
      const next = { ...m };
      if (next[s.id]) delete next[s.id];
      else next[s.id] = s;
      return next;
    });

  const valid = labId !== "" && selectedList.length > 0;

  const submit = () => {
    const sampleIds = selectedList.map((s) => s.id);
    create.mutate(
      {
        sendoutLabId: Number(labId),
        sampleIds,
        sampleCount: sampleIds.length,
        createdBy: user?.id,
      },
      {
        onSuccess: () => {
          toast.success("Sendout batch created.");
          onClose();
        },
        onError: (e) => toast.error(e?.message ?? "Could not create the sendout batch."),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Sendout</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>
            Sendout Lab <span className="text-destructive">*</span>
          </Label>
          <Select value={labId} onValueChange={setLabId} disabled={labs.isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select lab" />
            </SelectTrigger>
            <SelectContent>
              {(labs.data ?? []).map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {labLabel(l)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Select Samples <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">{selectedList.length} selected</span>
          </div>
          <Input
            placeholder="Search samples…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
          <div className="max-h-56 overflow-auto rounded-lg border border-border">
            {isLoading ? (
              <div className="py-8 text-center">
                <Spinner className="mx-auto" />
              </div>
            ) : samples.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No samples found.</p>
            ) : (
              samples.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0"
                >
                  <Checkbox
                    checked={Boolean(selected[s.id])}
                    onCheckedChange={() => toggle(s)}
                  />
                  <span className="font-medium">{s.sampleCode ?? s.barcode ?? `#${s.id}`}</span>
                  <span className="text-muted-foreground">
                    {(rec(s.panelDetails).name as string) ?? "—"}
                  </span>
                  <span className="ml-auto">
                    <Badge variant="outline">{s.status ?? "—"}</Badge>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || create.isPending} className="gap-1.5">
            {create.isPending && <Spinner className="h-4 w-4" />}Create Sendout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
