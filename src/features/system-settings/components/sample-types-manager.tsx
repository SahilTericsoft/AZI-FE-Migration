"use client";

import { useState } from "react";

import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/components/ui/sonner";

import {
  useCreateSampleType,
  useDeleteSampleType,
  useSampleTypesWithDevices,
  useUpdateSampleType,
} from "@/features/test-config/test-config.queries";
import type {
  CollectionDevice,
  SampleTypeWithDevices,
} from "@/features/test-config/test-config.types";

const slug = (s: string) => s.trim().toLowerCase();

/** Admin CRUD for sample types + their collection devices (DB-backed). */
export default function SampleTypesManager() {
  const { data = [], isLoading } = useSampleTypesWithDevices();
  const del = useDeleteSampleType();
  const [editing, setEditing] = useState<SampleTypeWithDevices | null>(null);
  const [creating, setCreating] = useState(false);

  const editable = (row: SampleTypeWithDevices) => row.id != null;
  const notSeeded = data.length > 0 && data.every((d) => d.id == null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Sample Types</h3>
          <p className="text-xs text-muted-foreground">
            Manage the sample types and the collection devices allowed for each. Used by the
            Test / Panel wizards.
          </p>
        </div>
        <Button className="h-9 gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Sample Type
        </Button>
      </div>

      {notSeeded && (
        <Alert>
          These are built-in defaults (not yet saved to the database). Add or edit one to persist
          the set — new rows become fully editable.
        </Alert>
      )}

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sample Type</TableHead>
              <TableHead>Collection Devices</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  <Spinner className="mx-auto h-5 w-5" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No sample types yet.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={row.id ?? `default-${i}`}>
                  <TableCell className="font-medium">{row.sampleType}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {row.sampleCollectionDeviceName.length > 0 ? (
                        row.sampleCollectionDeviceName.map((d) => (
                          <Badge key={d.code} variant="secondary">
                            {d.title}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        disabled={!editable(row)}
                        title={editable(row) ? "Edit" : "Seed the table first (add one) to edit"}
                        onClick={() => setEditing(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        disabled={!editable(row) || del.isPending}
                        onClick={() => {
                          if (row.id == null) return;
                          if (!confirm(`Delete sample type "${row.sampleType}"?`)) return;
                          del.mutate(row.id, {
                            onSuccess: () => toast.success("Sample type deleted."),
                            onError: (e) => toast.error(e?.message ?? "Delete failed."),
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {(creating || editing) && (
        <SampleTypeDialog
          row={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function SampleTypeDialog({
  row,
  onClose,
}: {
  row: SampleTypeWithDevices | null;
  onClose: () => void;
}) {
  const isEdit = row?.id != null;
  const [name, setName] = useState(row?.sampleType ?? "");
  const [devices, setDevices] = useState<CollectionDevice[]>(
    row?.sampleCollectionDeviceName ?? [],
  );
  const create = useCreateSampleType();
  const update = useUpdateSampleType();
  const busy = create.isPending || update.isPending;

  const setDevice = (idx: number, patch: Partial<CollectionDevice>) =>
    setDevices((d) => d.map((dev, i) => (i === idx ? { ...dev, ...patch } : dev)));

  const submit = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Sample type name is required.");
      return;
    }
    const cleanDevices = devices
      .map((d) => ({ title: d.title.trim(), code: (d.code || slug(d.title)).trim() }))
      .filter((d) => d.title !== "");

    const onSuccess = () => {
      toast.success(isEdit ? "Sample type updated." : "Sample type added.");
      onClose();
    };
    const onError = (e: { message?: string }) =>
      toast.error(e?.message ?? "Could not save sample type.");

    if (isEdit && row?.id != null) {
      update.mutate(
        { id: row.id, body: { sampleType: cleanName, sampleCollectionDeviceName: cleanDevices } },
        { onSuccess, onError },
      );
    } else {
      create.mutate(
        { sampleType: cleanName, sampleCollectionDeviceName: cleanDevices },
        { onSuccess, onError },
      );
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Sample Type" : "Add Sample Type"}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto py-1">
          <div className="space-y-1.5">
            <Label htmlFor="st-name">Sample Type Name</Label>
            <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Collection Devices</Label>
            {devices.length === 0 && (
              <p className="text-xs text-muted-foreground">No devices — add one below.</p>
            )}
            {devices.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Device name (e.g. Vacutainer (EDTA))"
                  value={d.title}
                  onChange={(e) => setDevice(idx, { title: e.target.value })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 text-destructive"
                  onClick={() => setDevices((arr) => arr.filter((_, i) => i !== idx))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit gap-1.5"
              onClick={() => setDevices((d) => [...d, { title: "", code: "" }])}
            >
              <Plus className="h-4 w-4" /> Add Device
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy} className="gap-1.5">
            {busy && <Spinner className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Add Sample Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
