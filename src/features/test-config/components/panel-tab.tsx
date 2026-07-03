"use client";

import { useEffect, useMemo, useState } from "react";

import { Plus } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { humanizeKey } from "@/lib/format";

import {
  useCreatePanel,
  usePanelList,
  useTestOptions,
  useTogglePanel,
} from "../test-config.queries";
import type { Panel } from "../test-config.types";

const SAMPLE_TYPES = ["Blood", "Serum", "Plasma", "Urine", "Saliva", "Swab", "Tissue", "Stool"];

export default function PanelTab() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error, isFetching } = usePanelList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const toggle = useTogglePanel();
  const panels: Panel[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search Panel…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 w-64"
        />
        <Button className="h-9 gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Panel
        </Button>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load panels."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Panel ID</TableHead>
              <TableHead>Panel Name</TableHead>
              <TableHead>Test(s)</TableHead>
              <TableHead>Sample Type</TableHead>
              <TableHead>Panel Status</TableHead>
              <TableHead className="text-right">Active/Inactive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : panels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No panels found.
                </TableCell>
              </TableRow>
            ) : (
              panels.map((panel) => (
                <TableRow key={panel.id}>
                  <TableCell className="font-medium">{panel.code ?? `#${panel.id}`}</TableCell>
                  <TableCell>{panel.name ?? "—"}</TableCell>
                  <TableCell>
                    {panel.testIds && panel.testIds.length > 0 ? (
                      <Badge variant="secondary">{panel.testIds.length} test(s)</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{panel.sampleType ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{panel.status ? humanizeKey(panel.status) : "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <Badge variant={panel.isActive ? "success" : "outline"}>
                        {panel.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={Boolean(panel.isActive)}
                        disabled={toggle.isPending}
                        onCheckedChange={() => toggle.mutate(panel.id)}
                      />
                    </span>
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
          isFetching={isFetching && !isLoading}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      </Card>

      {dialogOpen && <CreatePanelDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}

function CreatePanelDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [testIds, setTestIds] = useState<string[]>([]);
  const [hasOrderingLimit, setHasOrderingLimit] = useState<"yes" | "no">("no");
  const [alertLimit, setAlertLimit] = useState("");
  const [maxLimit, setMaxLimit] = useState("");
  const [limitError, setLimitError] = useState<string | null>(null);
  const create = useCreatePanel();
  const { data: testOptions = [] } = useTestOptions();

  const limitsValid =
    hasOrderingLimit === "no" ||
    (/^\d+$/.test(alertLimit) &&
      /^\d+$/.test(maxLimit) &&
      Number(maxLimit) >= 1 &&
      Number(maxLimit) <= 10 &&
      Number(alertLimit) >= 1 &&
      Number(alertLimit) <= Number(maxLimit));

  const valid = useMemo(
    () => name.trim() !== "" && code.trim() !== "" && limitsValid,
    [name, code, limitsValid],
  );

  const handleSubmit = () => {
    setLimitError(null);
    if (hasOrderingLimit === "yes" && !limitsValid) {
      setLimitError("Alert & Max limit must be 1–10, and Alert Limit cannot exceed Max Limit.");
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        code: code.trim(),
        sampleType: sampleType || undefined,
        testIds: testIds.length > 0 ? testIds.map(Number) : undefined,
        hasOrderingLimit: hasOrderingLimit === "yes",
        ...(hasOrderingLimit === "yes"
          ? { alertLimit: Number(alertLimit), maxLimit: Number(maxLimit) }
          : { alertLimit: null, maxLimit: null }),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Panel</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <Alert>
            Simplified create — captures the backend-supported fields (name, code, sample
            type, tests). The full lab wizard depends on services not yet migrated.
          </Alert>
          <div className="space-y-1.5">
            <Label htmlFor="panel-name">Panel Name</Label>
            <Input id="panel-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="panel-code">Panel Code</Label>
            <Input id="panel-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sample Type</Label>
            <Select value={sampleType} onValueChange={setSampleType}>
              <SelectTrigger>
                <SelectValue placeholder="Select sample type" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Select Test(s)</Label>
            <MultiCombobox
              options={testOptions.map((t) => ({
                value: String(t.id),
                label: t.name ?? `#${t.id}`,
                sublabel: t.code ?? undefined,
              }))}
              value={testIds}
              onChange={setTestIds}
              placeholder={testOptions.length === 0 ? "No active tests yet" : "Select tests"}
            />
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <Label>Is there any ordering limit?</Label>
            <RadioGroup
              className="flex gap-6"
              value={hasOrderingLimit}
              onValueChange={(v) => setHasOrderingLimit(v as "yes" | "no")}
            >
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Yes</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> No</label>
            </RadioGroup>
            {hasOrderingLimit === "yes" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="alert-limit">Alert Limit <span className="text-destructive">*</span></Label>
                  <Input id="alert-limit" inputMode="numeric" placeholder="Enter Alert Limit" value={alertLimit}
                    onChange={(e) => setAlertLimit(e.target.value.replace(/\D/g, "").slice(0, 2))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-limit">Max Limit <span className="text-destructive">*</span></Label>
                  <Input id="max-limit" inputMode="numeric" placeholder="Enter Max Limit" value={maxLimit}
                    onChange={(e) => setMaxLimit(e.target.value.replace(/\D/g, "").slice(0, 2))} />
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  Per-patient monthly order limit for this panel (1–10). Alert Limit ≤ Max Limit.
                </p>
              </div>
            )}
            {limitError && <Alert variant="destructive">{limitError}</Alert>}
          </div>
          {create.isError && (
            <Alert variant="destructive">{create.error?.message ?? "Failed to create panel."}</Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || create.isPending} className="gap-1.5">
            {create.isPending && <Spinner className="h-4 w-4" />}
            Create Panel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
