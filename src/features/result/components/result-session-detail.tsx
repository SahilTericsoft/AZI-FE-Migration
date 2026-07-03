"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ArrowLeft, Download, Eye, RefreshCw, Repeat, Trash2, XCircle } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { resultApi } from "../result.api";
import { useResultControls, useResultSamples, useResultSession } from "../result.queries";
import { buildBulkReport, buildReport, download, previewUrl } from "../result-pdf";
import type { ResultSample, ResultSession } from "../result.types";

function resultBadge(v: string | null | undefined) {
  const s = (v ?? "").toLowerCase();
  if (s.includes("detect") && !s.includes("not")) return <Badge variant="destructive">{v}</Badge>;
  if (s === "pass") return <Badge variant="success">PASS</Badge>;
  if (s.startsWith("fail")) return <Badge variant="destructive">{v}</Badge>;
  return <Badge variant="outline">{v ?? "—"}</Badge>;
}

export default function ResultSessionDetail({ sessionId }: { sessionId: number }) {
  const sessionQ = useResultSession(sessionId);
  const samplesQ = useResultSamples(sessionId);
  const controlsQ = useResultControls(sessionId);

  const [cutoff, setCutoff] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const session = sessionQ.data;
  const samples = samplesQ.data ?? [];
  const controls = controlsQ.data ?? [];

  const accessions = useMemo(() => {
    const set: string[] = [];
    for (const s of samples) if (s.accessionId && !set.includes(s.accessionId)) set.push(s.accessionId);
    return set;
  }, [samples]);

  const finalized = (session?.status ?? "").toLowerCase() === "completed" || Boolean(session?.isDiscarded);
  const refresh = () => { samplesQ.refetch(); controlsQ.refetch(); sessionQ.refetch(); };

  if (sessionQ.isLoading) return <div className="shadcn-scope grid min-h-[50dvh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  if (sessionQ.isError || !session) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/result" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}><ArrowLeft className="h-4 w-4" /> Back</Link>
        <p className="text-muted-foreground">Result session not found.</p>
      </div>
    );
  }

  const recalc = async () => {
    setBusy(true);
    try {
      await resultApi.recalculateControls(sessionId, Number(cutoff) || session.cqCutoff || 40);
      toast.success("Controls recalculated.");
      refresh();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Recalculation failed.");
    } finally { setBusy(false); }
  };

  const rejectSample = async (reason: string) => {
    if (!rejectFor) return;
    setBusy(true);
    try {
      await resultApi.rejectSample(sessionId, rejectFor, reason);
      toast.success(`Sample ${rejectFor} rejected.`);
      setRejectFor(null);
      refresh();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Reject failed.");
    } finally { setBusy(false); }
  };

  const markRerun = async (accession: string) => {
    setBusy(true);
    try {
      await resultApi.markRerun(sessionId, [accession]);
      toast.success(`Sample ${accession} marked for rerun.`);
      refresh();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Failed.");
    } finally { setBusy(false); }
  };

  const generateAll = async () => {
    setBusy(true);
    try {
      await resultApi.generateReport(sessionId);
      toast.success("Reports generated.");
      refresh();
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Generation failed.");
    } finally { setBusy(false); }
  };

  const previewReport = (accession: string) => setPreview(previewUrl(buildReport(session, accession, samples)));
  const downloadReport = (accession: string) => download(buildReport(session, accession, samples), `report-${accession}.pdf`);
  const downloadAll = () => {
    const active = accessions.filter((a) => samples.some((s) => s.accessionId === a && !s.isRejected));
    download(buildBulkReport(session, active, samples), `reports-session-${session.id}.pdf`);
  };

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link href="/result" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Result Session #{session.id}</h2>
              <Badge variant={finalized ? "success" : "secondary"}>{session.status ?? "—"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Source" value={session.isManual ? "Manual Entry" : session.fileName ?? "Run File"} />
              <DetailField label="Worklist" value={session.worklistId ? `#${session.worklistId}` : undefined} />
              <DetailField label="Samples" value={accessions.length} />
              <DetailField label="Cq Cutoff" value={session.cqCutoff ?? undefined} />
              <DetailField label="Created On" value={session.createdAt ? formatDateTime(session.createdAt) : undefined} />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2 self-start">
            {!session.isManual && (
              <div className="flex items-end gap-1.5">
                <div className="space-y-1"><Label className="text-xs">Cq</Label><Input className="h-9 w-20" value={cutoff} onChange={(e) => setCutoff(e.target.value.replace(/[^\d.]/g, ""))} placeholder={String(session.cqCutoff ?? 40)} /></div>
                <Button variant="outline" className="gap-1.5" onClick={recalc} disabled={busy || finalized}><RefreshCw className="h-4 w-4" /> Recalculate</Button>
              </div>
            )}
            <Button variant="outline" className="gap-1.5" onClick={downloadAll}><Download className="h-4 w-4" /> Download All</Button>
            <Button className="gap-1.5" onClick={generateAll} disabled={busy || finalized}><Eye className="h-4 w-4" /> Generate Reports</Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Tabs defaultValue="samples">
          <TabsList className="w-full px-2">
            <TabsTrigger value="samples">Samples ({accessions.length})</TabsTrigger>
            <TabsTrigger value="controls">Controls ({controls.length})</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="samples" className="mt-0 flex flex-col gap-5">
              {accessions.length === 0 ? (
                <p className="py-4 text-muted-foreground">No sample results.</p>
              ) : (
                accessions.map((acc) => {
                  const rows = samples.filter((s) => s.accessionId === acc);
                  const rejected = rows.some((r) => r.isRejected);
                  return (
                    <div key={acc} className="rounded-lg border border-border">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{acc}</span>
                          {rejected && <Badge variant="destructive">Rejected</Badge>}
                          {rows.some((r) => r.isRerun) && <Badge variant="outline">Rerun</Badge>}
                          {rows.some((r) => r.isGenerated) && <Badge variant="success">Report Generated</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => previewReport(acc)}><Eye className="h-4 w-4" /> Preview</Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => downloadReport(acc)}><Download className="h-4 w-4" /> PDF</Button>
                          {!finalized && !rejected && (
                            <>
                              <Button variant="ghost" size="sm" className="gap-1" onClick={() => markRerun(acc)} disabled={busy}><Repeat className="h-4 w-4" /> Rerun</Button>
                              <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={() => setRejectFor(acc)} disabled={busy}><XCircle className="h-4 w-4" /> Reject</Button>
                            </>
                          )}
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Target / Biomarker</TableHead>
                            {!session.isManual && <TableHead>Fluor</TableHead>}
                            {!session.isManual && <TableHead>Well</TableHead>}
                            {!session.isManual && <TableHead>Cq</TableHead>}
                            <TableHead>Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((r: ResultSample) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.targetName ?? r.biomarkerName ?? r.biomarkerCode ?? "—"}</TableCell>
                              {!session.isManual && <TableCell>{r.fluorophore ?? "—"}</TableCell>}
                              {!session.isManual && <TableCell>{r.wellPosition ?? "—"}</TableCell>}
                              {!session.isManual && <TableCell>{r.cqValue != null ? r.cqValue.toFixed(2) : "—"}</TableCell>}
                              <TableCell>{resultBadge(r.result ?? r.value)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="controls" className="mt-0">
              {controls.length === 0 ? (
                <p className="py-4 text-muted-foreground">No controls in this session.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Well</TableHead>
                      <TableHead>Control</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Fluor</TableHead>
                      <TableHead>Cq</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Validity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {controls.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.wellPosition ?? "—"}</TableCell>
                        <TableCell>{c.control ?? "—"}</TableCell>
                        <TableCell>{c.targetName ?? "—"}</TableCell>
                        <TableCell>{c.fluorophore ?? "—"}</TableCell>
                        <TableCell>{c.ctValue != null ? c.ctValue.toFixed(2) : "—"}</TableCell>
                        <TableCell>{resultBadge(c.result)}</TableCell>
                        <TableCell>{c.comments ? resultBadge(c.comments) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {rejectFor && (
        <RejectDialog accession={rejectFor} busy={busy} onClose={() => setRejectFor(null)} onConfirm={rejectSample} />
      )}

      {preview && (
        <Dialog open onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Report Preview</DialogTitle></DialogHeader>
            <iframe title="report" src={preview} className="h-[70vh] w-full rounded border border-border" />
            <DialogFooter><Button variant="outline" onClick={() => setPreview(null)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function RejectDialog({ accession, busy, onClose, onConfirm }: { accession: string; busy: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reject sample {accession}</DialogTitle></DialogHeader>
        <div className="space-y-1.5">
          <Label>Reason for rejection <span className="text-destructive">*</span></Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Control failure, insufficient sample…" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(reason.trim())} disabled={busy || reason.trim() === ""} className="gap-1.5">
            {busy && <Spinner className="h-4 w-4" />} Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ResultSession };
