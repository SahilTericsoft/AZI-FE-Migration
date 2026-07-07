"use client";

import { useMemo, useState } from "react";

import { Eye, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MultiCombobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";

/** Report layout options (legacy layout1..layout6; layout5 is not offered). */
export const REPORT_LAYOUTS = [
  { title: "Layout 1", code: "layout1" },
  { title: "Layout 2", code: "layout2" },
  { title: "Layout 3", code: "layout3" },
  { title: "Layout 4", code: "layout4" },
  { title: "Layout 6", code: "layout6" },
];

export interface ReportBlock {
  title: string;
  biomarkerIds: number[];
}

export interface ReportLayoutValue {
  layout: string;
  blocks: ReportBlock[];
  disclaimer: string;
  footNote: string;
}

export const emptyReportLayout = (): ReportLayoutValue => ({
  layout: "layout1",
  blocks: [{ title: "", biomarkerIds: [] }],
  disclaimer: "",
  footNote: "",
});

/** Parse the persisted `testLayoutDetails[0]` back into designer state. */
export function reportLayoutFromDetails(
  details: Array<Record<string, unknown>> | null | undefined,
): ReportLayoutValue {
  const d = details?.[0] as Record<string, unknown> | undefined;
  if (!d) return emptyReportLayout();
  const rawBlocks = Array.isArray(d.blocks) ? (d.blocks as Record<string, unknown>[]) : [];
  return {
    layout: (d.layout as string) ?? "layout1",
    blocks:
      rawBlocks.length > 0
        ? rawBlocks.map((b) => ({
            title: (b.title as string) ?? "",
            biomarkerIds: Array.isArray(b.biomarkerIds) ? (b.biomarkerIds as number[]) : [],
          }))
        : [{ title: "", biomarkerIds: [] }],
    disclaimer: (d.disclaimer as string) ?? "",
    footNote: (d.footNote as string) ?? "",
  };
}

/** Designer for a test/panel report layout. `testOptions` are the panel's tests. */
export default function ReportTypeDesigner({
  value,
  onChange,
  testOptions,
}: {
  value: ReportLayoutValue;
  onChange: (next: ReportLayoutValue) => void;
  testOptions: { id: number; label: string }[];
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const nameOf = useMemo(() => {
    const m = new Map<number, string>();
    testOptions.forEach((o) => m.set(o.id, o.label));
    return m;
  }, [testOptions]);

  const comboOptions = testOptions.map((o) => ({ value: String(o.id), label: o.label }));

  const setBlock = (idx: number, patch: Partial<ReportBlock>) =>
    onChange({
      ...value,
      blocks: value.blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    });

  const isLayout6 = value.layout === "layout6";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full space-y-1.5 sm:max-w-sm">
          <Label>
            Select Report Type <span className="text-destructive">*</span>
          </Label>
          <Select value={value.layout} onValueChange={(layout) => onChange({ ...value, layout })}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_LAYOUTS.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="secondary" className="gap-1.5" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4" /> View
        </Button>
      </div>

      {isLayout6 ? (
        <Alert>
          <strong>Layout 6 (Pathogen / Resistance Gene)</strong> uses a specialised
          grouped-table designer. It isn&apos;t built yet — pick Layout 1–4 to configure report
          blocks here.
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          <Label>Report Blocks</Label>
          {value.blocks.map((block, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1.5">
                <Label>
                  Title name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={block.title}
                  onChange={(e) => setBlock(idx, { title: e.target.value })}
                  placeholder="e.g. Pathogens"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Test(s) <span className="text-destructive">*</span>
                </Label>
                <MultiCombobox
                  options={comboOptions}
                  value={block.biomarkerIds.map(String)}
                  onChange={(v) => setBlock(idx, { biomarkerIds: v.map(Number) })}
                  placeholder={comboOptions.length === 0 ? "No tests available" : "Select tests"}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={value.blocks.length === 1}
                  onClick={() => onChange({ ...value, blocks: value.blocks.filter((_, i) => i !== idx) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit gap-1.5"
            onClick={() => onChange({ ...value, blocks: [...value.blocks, { title: "", biomarkerIds: [] }] })}
          >
            <Plus className="h-4 w-4" /> Add Block
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Disclaimer</Label>
          <Textarea value={value.disclaimer} onChange={(e) => onChange({ ...value, disclaimer: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Foot Note</Label>
          <Textarea value={value.footNote} onChange={(e) => onChange({ ...value, footNote: e.target.value })} />
        </div>
      </div>

      {previewOpen && (
        <ReportPreviewDialog value={value} nameOf={nameOf} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}

function ReportPreviewDialog({
  value,
  nameOf,
  onClose,
}: {
  value: ReportLayoutValue;
  nameOf: Map<number, string>;
  onClose: () => void;
}) {
  const layoutTitle = REPORT_LAYOUTS.find((l) => l.code === value.layout)?.title ?? value.layout;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Preview — {layoutTitle}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto rounded-md border border-border bg-white p-6 text-black">
          <div className="mb-4 border-b pb-3 text-center">
            <p className="text-lg font-bold">Laboratory Report</p>
            <p className="text-xs text-gray-500">Preview · {layoutTitle}</p>
          </div>
          {value.blocks.filter((b) => b.title || b.biomarkerIds.length > 0).length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Add a block with a title and test(s) to preview the report.
            </p>
          ) : (
            value.blocks.map((block, i) => (
              <div key={i} className="mb-4">
                <p className="mb-1 bg-gray-100 px-2 py-1 text-sm font-semibold">
                  {block.title || `Section ${i + 1}`}
                </p>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500">
                      <th className="py-1 pr-2">Test</th>
                      <th className="py-1 pr-2">Result</th>
                      <th className="py-1">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.biomarkerIds.length === 0 ? (
                      <tr><td colSpan={3} className="py-1 text-gray-400">No tests selected</td></tr>
                    ) : (
                      block.biomarkerIds.map((id) => (
                        <tr key={id} className="border-b border-gray-100">
                          <td className="py-1 pr-2">{nameOf.get(id) ?? `#${id}`}</td>
                          <td className="py-1 pr-2 text-gray-400">—</td>
                          <td className="py-1 text-gray-400">—</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ))
          )}
          {value.disclaimer && (
            <p className="mt-4 border-t pt-2 text-xs text-gray-600"><strong>Disclaimer:</strong> {value.disclaimer}</p>
          )}
          {value.footNote && (
            <p className="mt-1 text-xs text-gray-500">{value.footNote}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
