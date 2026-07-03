"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import type { ApiError } from "@/core/api/types";

import { resultApi } from "../result.api";

export default function NewResultFileDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [cutoff, setCutoff] = useState("40");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const session = await resultApi.uploadRunfile(file, undefined, Number(cutoff) || undefined);
      toast.success("Run file uploaded and parsed.");
      onClose();
      router.push(`/result/${session.id}`);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not upload the run file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Result File</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Alert>
            Upload the instrument run file (qPCR CSV export). It&apos;s parsed into per-sample
            readings and controls, then opens for review.
          </Alert>
          <div className="space-y-1.5">
            <Label>Run File</Label>
            <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cq Cutoff</Label>
            <Input className="w-28" inputMode="decimal" value={cutoff} onChange={(e) => setCutoff(e.target.value.replace(/[^\d.]/g, ""))} />
            <p className="text-xs text-muted-foreground">Targets amplifying at or under this Cq are called Detected (default 40).</p>
          </div>
          {error && <Alert variant="destructive">{error}</Alert>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={upload} disabled={!file || busy} className="gap-1.5">
            {busy && <Spinner className="h-4 w-4" />} Upload &amp; Parse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
