"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Download, Eraser, FileUp, Paperclip, RefreshCw, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/cn";

import {
  PLATE_TYPES,
  cellKey,
  rowLabel,
  type CellData,
  type CellValue,
  type ProcessingConfig,
  type ProcessingSample,
} from "../sample-processing.types";

const isPcr = (c: ProcessingConfig) => c.processingType === "PCR Processing";

export default function PlateMapper({
  config,
  finalized,
  onChange,
}: {
  config: ProcessingConfig;
  finalized: boolean;
  onChange: (partial: Partial<ProcessingConfig>) => void;
}) {
  const samples: ProcessingSample[] = config.samples ?? [];
  const cells: CellData = config.cells ?? {};
  const configured = Boolean(config.rows && config.columns);
  const uploaded = config.uploadFileDetails ?? null;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [controller, setController] = useState<"samples" | "controls">("samples");
  const [configOpen, setConfigOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [viewIdsOpen, setViewIdsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const placedBarcodes = useMemo(() => {
    const set = new Set<string>();
    for (const v of Object.values(cells)) if (v.type === "samples") set.add(v.value);
    return set;
  }, [cells]);
  const availableSamples = useMemo(
    () => samples.filter((s) => !placedBarcodes.has(s.barcode) && (!search.trim() || (s.barcode + (s.patient ?? "")).toLowerCase().includes(search.trim().toLowerCase()))),
    [samples, placedBarcodes, search],
  );
  const unassignedCount = samples.filter((s) => !placedBarcodes.has(s.barcode)).length;

  const toggleCell = (key: string, additive: boolean) => {
    if (finalized) return;
    setSelected((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const assignToKeys = (keys: string[], value: CellValue) => {
    if (finalized || keys.length === 0) return;
    const next = { ...cells };
    const multi = keys.length > 1 && value.type === "controls";
    keys.forEach((k, i) => { next[k] = multi ? { ...value, value: `${value.value} ${i + 1}` } : value; });
    onChange({ cells: next });
    setSelected(new Set());
  };
  const assign = (value: CellValue) => assignToKeys([...selected], value);

  const clearSelected = useCallback(() => {
    if (finalized || selected.size === 0) return;
    const next = { ...cells };
    for (const k of selected) delete next[k];
    onChange({ cells: next });
    setSelected(new Set());
  }, [finalized, selected, cells, onChange]);

  const clearPlate = () => { if (!finalized) { onChange({ cells: {} }); setSelected(new Set()); } };

  // Drag a sample onto a well.
  const onDropSample = (key: string, barcode: string) => {
    if (finalized || !barcode) return;
    onChange({ cells: { ...cells, [key]: { type: "samples", value: barcode } } });
  };

  const downloadPlateMap = () => {
    const rows: string[][] = [["Well", "Type", "Value"]];
    Object.entries(cells).forEach(([k, v]) => {
      const [r, c] = k.split("-").map(Number);
      rows.push([`${rowLabel(r)}${c + 1}`, v.type, v.value]);
    });
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `plate-${config.plateId ?? "map"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected.size === 0) return;
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); clearSelected(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, clearSelected]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold">Plate Mapping</h3>
          <div className="flex flex-wrap gap-2">
            {configured && isPcr(config) && (config.existingPlateDetails?.length ?? 0) > 0 && (
              <Button variant="outline" size="sm" onClick={() => setViewIdsOpen(true)}>View Selected ID(s)</Button>
            )}
            {configured && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={clearPlate} disabled={finalized}>
                <Eraser className="h-4 w-4" /> Clear Plate
              </Button>
            )}
            {(configured || uploaded) && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSetupOpen(true)} disabled={finalized}>
                <RefreshCw className="h-4 w-4" /> Re-Configure
              </Button>
            )}
            {configured && isPcr(config) && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPlateMap}>
                <Download className="h-4 w-4" /> Download
              </Button>
            )}
          </div>
        </div>

        {uploaded ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{uploaded.title}</p>
              <p className="text-xs text-muted-foreground">Plate map provided by file upload.</p>
            </div>
          </div>
        ) : !configured ? (
          <div className="flex flex-col items-start gap-3">
            <Alert>No plate map configured.</Alert>
            <Button className="gap-1.5" onClick={() => setSetupOpen(true)} disabled={finalized}>
              <FileUp className="h-4 w-4" /> Set Up Plate
            </Button>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-8" />
                  {Array.from({ length: config.columns! }).map((_, c) => (
                    <th key={c} className="px-1 text-center text-xs font-medium text-muted-foreground">{c + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: config.rows! }).map((_, r) => (
                  <tr key={r}>
                    <td className="pr-1 text-center text-xs font-medium text-muted-foreground">{rowLabel(r)}</td>
                    {Array.from({ length: config.columns! }).map((_, c) => {
                      const key = cellKey(r, c);
                      const cell = cells[key];
                      const isSel = selected.has(key);
                      return (
                        <td key={c} className="p-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleCell(key, e.metaKey || e.ctrlKey || e.shiftKey)}
                            onDragOver={(e) => { if (!finalized) e.preventDefault(); }}
                            onDrop={(e) => { e.preventDefault(); onDropSample(key, e.dataTransfer.getData("text/barcode")); }}
                            title={cell?.value}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center overflow-hidden rounded border text-[9px] leading-tight",
                              isSel ? "border-primary ring-2 ring-primary/40" : "border-border",
                              cell?.type === "samples" && "bg-primary/15",
                              cell?.type === "controls" && "bg-amber-200/40",
                              !cell && "bg-muted/40 hover:bg-muted",
                            )}
                          >
                            <span className="truncate px-0.5">{cell ? cell.value : ""}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              Click wells to select (Ctrl/Cmd/Shift), then click a sample/control to assign — or drag a sample onto a well.
              Press Delete to clear. <strong>{unassignedCount}</strong> sample(s) unassigned.
            </p>
          </div>
        )}
      </div>

      {!uploaded && (
        <div className="space-y-3">
          <div className="inline-flex w-full rounded-md border border-border p-0.5">
            {(["samples", "controls"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setController(t)} className={cn("flex-1 rounded px-3 py-1.5 text-sm font-medium capitalize", controller === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{t}</button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{selected.size} well(s) selected</p>

          {controller === "samples" ? (
            <>
              <Input placeholder="Search samples…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
              <div className="max-h-[420px] divide-y divide-border overflow-auto rounded-lg border border-border">
                {availableSamples.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No unassigned samples.</p>
                ) : (
                  availableSamples.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      draggable={!finalized && configured}
                      onDragStart={(e) => e.dataTransfer.setData("text/barcode", s.barcode)}
                      disabled={finalized || (selected.size === 0 && !configured)}
                      onClick={() => assign({ type: "samples", value: s.barcode })}
                      className="flex w-full cursor-grab flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent active:cursor-grabbing disabled:opacity-50"
                    >
                      <span className="font-medium">{s.barcode}</span>
                      <span className="text-xs text-muted-foreground">{s.panel ?? "—"}{s.patient ? ` · ${s.patient}` : ""}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <ControlsPanel disabled={finalized || selected.size === 0} options={config.testPanelCodes ?? []} onAssign={(name) => assign({ type: "controls", value: name })} />
          )}
        </div>
      )}

      {configOpen && (
        <PlateConfigDialog
          current={config}
          onClose={() => setConfigOpen(false)}
          onConfirm={(plateType, rows, columns) => { onChange({ plateType, rows, columns, cells: {}, uploadFileDetails: null }); setSelected(new Set()); setConfigOpen(false); }}
        />
      )}

      {setupOpen && (
        <PlateSetupDialog
          onClose={() => setSetupOpen(false)}
          onManual={() => { setSetupOpen(false); setConfigOpen(true); }}
          onUpload={(title) => { onChange({ uploadFileDetails: { title }, rows: null, columns: null, cells: {} }); setSetupOpen(false); }}
        />
      )}

      {viewIdsOpen && (
        <ViewSelectedIdsDialog plates={config.existingPlateDetails ?? []} onClose={() => setViewIdsOpen(false)} />
      )}
    </div>
  );
}

function ControlsPanel({ options, disabled, onAssign }: { options: string[]; disabled: boolean; onAssign: (name: string) => void }) {
  const [custom, setCustom] = useState("");
  const presets = ["Positive Control", "Negative Control", "NTC", ...options];
  return (
    <div className="space-y-2">
      <div className="max-h-64 divide-y divide-border overflow-auto rounded-lg border border-border">
        {presets.map((c) => (
          <button key={c} type="button" disabled={disabled} onClick={() => onAssign(c)} className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50">{c}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Custom control…" value={custom} onChange={(e) => setCustom(e.target.value)} className="h-9" />
        <Button variant="outline" size="sm" disabled={disabled || custom.trim() === ""} onClick={() => { onAssign(custom.trim()); setCustom(""); }}>Add</Button>
      </div>
    </div>
  );
}

function PlateSetupDialog({ onClose, onManual, onUpload }: { onClose: () => void; onManual: () => void; onUpload: (title: string) => void }) {
  const [method, setMethod] = useState<"manual" | "upload">("manual");
  const [file, setFile] = useState<File | null>(null);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Plate Setup Method</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <RadioGroup value={method} onValueChange={(v) => setMethod(v as "manual" | "upload")} className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="manual" /> Configure Manually</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="upload" /> Upload File</label>
          </RadioGroup>
          {method === "upload" && (
            <div className="space-y-1.5">
              <Label>Plate map file</Label>
              <Input type="file" accept=".xlsx,.xls,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">PNG, JPG, XLS or XLSX up to 10 MB.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => (method === "manual" ? onManual() : file && onUpload(file.name))} disabled={method === "upload" && !file}>Proceed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewSelectedIdsDialog({ plates, onClose }: { plates: { id: number; plateId: string; cells?: CellData }[]; onClose: () => void }) {
  const [active, setActive] = useState(String(plates[0]?.id ?? ""));
  const plate = plates.find((p) => String(p.id) === active);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Selected Existing ID(s)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={active} onValueChange={setActive}>
            <SelectTrigger><SelectValue placeholder="Select ID" /></SelectTrigger>
            <SelectContent>{plates.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.plateId}</SelectItem>)}</SelectContent>
          </Select>
          {plate && (
            <ul className="max-h-64 divide-y divide-border overflow-auto rounded-lg border border-border text-sm">
              {Object.entries(plate.cells ?? {}).length === 0 ? (
                <li className="px-3 py-3 text-muted-foreground">No wells on this plate.</li>
              ) : (
                Object.entries(plate.cells ?? {}).map(([k, v]) => {
                  const [r, c] = k.split("-").map(Number);
                  return <li key={k} className="flex justify-between px-3 py-1.5"><span className="font-medium">{rowLabel(r)}{c + 1}</span><span className="text-muted-foreground">{v.value}</span></li>;
                })
              )}
            </ul>
          )}
        </div>
        <DialogFooter><Button onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlateConfigDialog({ current, onClose, onConfirm }: { current: ProcessingConfig; onClose: () => void; onConfirm: (plateType: string, rows: number, columns: number) => void }) {
  const [plateType, setPlateType] = useState(current.plateType ?? "96-well");
  const [rows, setRows] = useState(String(current.rows ?? 8));
  const [columns, setColumns] = useState(String(current.columns ?? 12));
  const isCustom = plateType === "custom";
  const pick = (code: string) => {
    setPlateType(code);
    const preset = PLATE_TYPES.find((p) => p.code === code);
    if (preset && !preset.isCustom) { setRows(String(preset.rows)); setColumns(String(preset.columns)); }
  };
  const r = Number(rows), c = Number(columns);
  const valid = r > 0 && r <= 26 && c > 0 && c <= 48;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Configure Plate</DialogTitle></DialogHeader>
        {Object.keys(current.cells ?? {}).length > 0 && <Alert variant="destructive">Re-configuring will clear all assigned wells.</Alert>}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Plate Type</Label>
            <Select value={plateType} onValueChange={pick}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PLATE_TYPES.map((p) => <SelectItem key={p.code} value={p.code}>{p.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Rows</Label><Input inputMode="numeric" value={rows} onChange={(e) => setRows(e.target.value.replace(/\D/g, ""))} disabled={!isCustom} /></div>
            <div className="space-y-1.5"><Label>Columns</Label><Input inputMode="numeric" value={columns} onChange={(e) => setColumns(e.target.value.replace(/\D/g, ""))} disabled={!isCustom} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(plateType, r, c)} disabled={!valid}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
