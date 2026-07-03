"use client";

import { useRef, useState } from "react";

import { Download, Upload } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import type { ApiError } from "@/core/api/types";

import { patientApi } from "../patient.api";

const TEMPLATE_COLUMNS = [
  "firstName", "middleName", "lastName", "dateOfBirth", "gender",
  "mobileNumber", "emailId", "addressLine1", "addressLine2", "city", "state", "zipcode",
];

type Result = { created: number; skipped: number; errors: { row: number; error: string }[] };

export default function PatientBulkUploadDialog({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = () => {
    const csv = `${TEMPLATE_COLUMNS.join(",")}\nJohn,,Doe,1990-01-31,Male,5551234567,john@example.com,1 Main St,,Austin,TX,73301\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await patientApi.bulkUpload(file);
      setResult(res);
      toast.success(`${res.created} patient(s) imported${res.skipped ? `, ${res.skipped} skipped` : ""}.`);
    } catch (e) {
      setError((e as ApiError)?.message ?? "Bulk upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Upload Patients</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Alert>
            Upload a CSV with these columns: <span className="font-medium">{TEMPLATE_COLUMNS.join(", ")}</span>.
            <br />
            <span className="text-muted-foreground">First name, last name and date of birth are required; duplicates are skipped.</span>
          </Alert>

          <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download template
          </Button>

          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {file ? "Change file" : "Choose CSV"}
            </Button>
            {file && <span className="truncate text-sm text-muted-foreground">{file.name}</span>}
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          {result && (
            <Alert variant={result.errors.length ? "destructive" : "default"}>
              Imported <b>{result.created}</b>, skipped <b>{result.skipped}</b>
              {result.errors.length > 0 && (
                <ul className="mt-1 max-h-32 list-disc overflow-auto pl-5 text-xs">
                  {result.errors.slice(0, 20).map((er, i) => (
                    <li key={i}>Row {er.row}: {er.error}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Close</Button>
          <Button onClick={upload} disabled={!file || busy} className="gap-1.5">
            {busy ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />} Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
