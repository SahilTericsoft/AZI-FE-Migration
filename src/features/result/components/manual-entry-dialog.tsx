"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
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
import type { ApiError } from "@/core/api/types";
import { usePanelOptions, useBiomarkerOptions } from "@/features/test-config/test-config.queries";

import { resultApi } from "../result.api";
import type { BiomarkerDetail, ManualTemplate, WorklistOption } from "../result.types";

export default function ManualEntryDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const panelsQ = usePanelOptions();
  const biomarkersQ = useBiomarkerOptions();

  const [selection, setSelection] = useState<string | null>(null); // "panel:ID" | "biomarker:ID"
  const [worklistId, setWorklistId] = useState<string | null>(null);
  const [worklists, setWorklists] = useState<WorklistOption[]>([]);
  const [template, setTemplate] = useState<ManualTemplate | null>(null);
  const [results, setResults] = useState<Record<string, Record<string, string>>>({});
  const [loadingWl, setLoadingWl] = useState(false);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () => [
      ...(panelsQ.data ?? []).map((p) => ({ value: `panel:${p.id}`, label: `Panel: ${p.name ?? p.id}` })),
      ...(biomarkersQ.data ?? []).map((b) => ({ value: `biomarker:${b.id}`, label: `Test: ${b.name ?? b.id}` })),
    ],
    [panelsQ.data, biomarkersQ.data],
  );

  const parsedSel = selection ? { kind: selection.split(":")[0], id: Number(selection.split(":")[1]) } : null;

  const loadWorklists = async () => {
    if (!parsedSel) return;
    setLoadingWl(true);
    setError(null);
    try {
      const wl = await resultApi.worklistByTestPanel(
        parsedSel.kind === "panel" ? { testId: parsedSel.id } : { biomarkerId: parsedSel.id },
      );
      setWorklists(wl);
      setWorklistId(null);
      setTemplate(null);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not load worklists.");
    } finally {
      setLoadingWl(false);
    }
  };

  const loadTemplate = async () => {
    if (!parsedSel || !worklistId) return;
    setLoadingTpl(true);
    setError(null);
    try {
      const t = await resultApi.manualTemplate({
        worklistId: Number(worklistId),
        ...(parsedSel.kind === "panel" ? { testId: parsedSel.id } : { biomarkerId: parsedSel.id }),
      });
      setTemplate(t);
      setResults({});
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not load the template.");
    } finally {
      setLoadingTpl(false);
    }
  };

  const setCell = (accession: string, bioId: string, value: string) =>
    setResults((r) => ({ ...r, [accession]: { ...(r[accession] ?? {}), [bioId]: value } }));

  const biomarkers: BiomarkerDetail[] = template?.biomarkerDetails ?? [];
  const allFilled =
    template != null &&
    template.accessionIds.length > 0 &&
    template.accessionIds.every((a) => biomarkers.every((b) => (results[a]?.[String(b.id)] ?? "").trim() !== ""));

  const submit = async () => {
    if (!template || !parsedSel) return;
    setSubmitting(true);
    setError(null);
    try {
      const session = await resultApi.manualSubmit({
        worklistId: Number(worklistId),
        ...(parsedSel.kind === "panel" ? { testId: parsedSel.id } : { biomarkerId: parsedSel.id }),
        biomarkerDetails: biomarkers,
        accessionIds: template.accessionIds,
        results,
      });
      toast.success("Manual results submitted.");
      onClose();
      router.push(`/result/${session.id}`);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not submit results.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Manual Result Entry</DialogTitle></DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Test / Panel</Label>
            <Combobox options={options} value={selection} onChange={(v) => { setSelection(v); setWorklists([]); setTemplate(null); }} placeholder="Select test or panel" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={loadWorklists} disabled={!selection || loadingWl} className="gap-1.5">
              {loadingWl && <Spinner className="h-4 w-4" />} Load Worklists
            </Button>
          </div>
          {worklists.length > 0 && (
            <>
              <div className="space-y-1.5">
                <Label>Worklist</Label>
                <Combobox
                  options={worklists.map((w) => ({ value: String(w.worklistId), label: `${w.batchName} (${w.accessionCount})` }))}
                  value={worklistId}
                  onChange={setWorklistId}
                  placeholder="Select worklist"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={loadTemplate} disabled={!worklistId || loadingTpl} className="gap-1.5">
                  {loadingTpl && <Spinner className="h-4 w-4" />} Load Template
                </Button>
              </div>
            </>
          )}
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}

        {template && (
          biomarkers.length === 0 ? (
            <Alert>No biomarkers found for this selection.</Alert>
          ) : template.accessionIds.length === 0 ? (
            <Alert>No samples in the selected worklist.</Alert>
          ) : (
            <div className="overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accession</TableHead>
                    {biomarkers.map((b) => <TableHead key={String(b.id)}>{b.name}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.accessionIds.map((acc) => (
                    <TableRow key={acc}>
                      <TableCell className="font-medium">{acc}</TableCell>
                      {biomarkers.map((b) => (
                        <TableCell key={String(b.id)}>
                          <Input
                            className="h-8 w-32"
                            placeholder="value"
                            value={results[acc]?.[String(b.id)] ?? ""}
                            onChange={(e) => setCell(acc, String(b.id), e.target.value)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={!allFilled || submitting} className="gap-1.5">
            {submitting && <Spinner className="h-4 w-4" />} Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
