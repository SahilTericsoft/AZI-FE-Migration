"use client";

import { useEffect, useMemo, useState } from "react";

import { Eye, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MultiCombobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListPagination } from "@/components/ui/list-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { formatDateTime } from "@/lib/datetime";
import type { ApiError } from "@/core/api/types";

import { settingsApi } from "../system-settings.api";
import { useOrderReports, usePanelsLite, useSettingsInvalidate } from "../system-settings.queries";
import type { OrderReportHeader } from "../system-settings.types";

const TRIGGER_TYPE = "Order Report Heading";
const cap = (s?: string | null) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : "-");
const fullName = (u?: Record<string, unknown> | null) =>
  u ? [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "-" : "-";

export default function AutoTriggers() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [viewRow, setViewRow] = useState<OrderReportHeader | null>(null);
  const invalidate = useSettingsInvalidate();

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useOrderReports({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });
  const rows = data?.docs ?? [];
  const total = data?.total ?? 0;

  const toggle = async (row: OrderReportHeader) => {
    try {
      await settingsApi.toggleOrderReport(row.id!);
      toast.success(row.isActive ? "Trigger deactivated" : "Trigger activated");
      invalidate();
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not toggle");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by Order Name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-60"
          />
          <Select value={TRIGGER_TYPE} disabled>
            <SelectTrigger className="h-9 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TRIGGER_TYPE}>{TRIGGER_TYPE}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> New Trigger
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Trigger ID</TableHead>
              <TableHead>Order Report Name</TableHead>
              <TableHead className="text-center">Active/Inactive</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No triggers found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">#{r.id}</TableCell>
                  <TableCell>{cap(r.name)}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={Boolean(r.isActive)} onCheckedChange={() => toggle(r)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setViewRow(r)}
                    >
                      <Eye className="h-4 w-4" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ListPagination
          page={page}
          rowsPerPage={rowsPerPage}
          total={total}
          rowsPerPageOptions={[10, 25, 100]}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      </Card>

      {addOpen && (
        <AddTriggerDialog
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            invalidate();
          }}
        />
      )}
      {viewRow && <ViewTriggerDialog row={viewRow} onClose={() => setViewRow(null)} />}
    </div>
  );
}

function AddTriggerDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: panels = [], isLoading: panelsLoading } = usePanelsLite();
  const [name, setName] = useState("");
  const [testIds, setTestIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () => panels.map((p) => ({ value: String(p.id), label: p.name })),
    [panels],
  );
  const valid = name.trim() && testIds.length > 0;

  const submit = async () => {
    setError(null);
    if (!valid) {
      setError("Enter a name and select at least one panel.");
      return;
    }
    setBusy(true);
    try {
      await settingsApi.addOrderReport({
        triggerType: TRIGGER_TYPE,
        layout: "layout6",
        name: name.trim(),
        testIds: testIds.map(Number),
      });
      toast.success("Trigger added successfully");
      onSaved();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="shadcn-scope">
        <DialogHeader>
          <DialogTitle>Add Trigger</DialogTitle>
        </DialogHeader>
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label>Trigger Type</Label>
            <Select value={TRIGGER_TYPE} disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TRIGGER_TYPE}>{TRIGGER_TYPE}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Report Layout</Label>
            <Select value="layout6" disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="layout6">Layout 6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>
              Order Report Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Enter order report name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Panel <span className="text-destructive">*</span>
            </Label>
            <MultiCombobox
              options={options}
              value={testIds}
              onChange={setTestIds}
              placeholder="Select panels"
              loading={panelsLoading}
            />
          </div>
          <Alert>
            Note: Based on the order of selection, the first panel selected is used to generate the
            Summary page information, the footnote and the disclaimer.
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !valid}>
            {busy ? <Spinner className="h-4 w-4" /> : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewTriggerDialog({ row, onClose }: { row: OrderReportHeader; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="shadcn-scope">
        <DialogHeader>
          <DialogTitle>View Trigger</DialogTitle>
        </DialogHeader>
        <dl className="flex flex-col divide-y text-sm">
          <Row label="Trigger Type" value={row.triggerType ?? TRIGGER_TYPE} />
          <Row label="Report Layout" value={row.layout ?? "-"} />
          <Row label="Order Report Name" value={cap(row.name)} />
          <div className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">Panel</dt>
            <dd className="flex flex-1 flex-wrap justify-end gap-1">
              {(row.testDetails ?? []).length > 0 ? (
                row.testDetails!.map((p) => (
                  <Badge key={p.id} variant="secondary">
                    {p.name}
                  </Badge>
                ))
              ) : (
                <span>-</span>
              )}
            </dd>
          </div>
          <Row label="Created By" value={fullName(row.createdByDetails)} />
          <Row label="Created Timestamp" value={row.createdAt ? formatDateTime(row.createdAt) : "-"} />
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
