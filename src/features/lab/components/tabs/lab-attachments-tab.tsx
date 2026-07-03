"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { http } from "@/core/api/client";
import type { ApiError } from "@/core/api/types";

import { labKeys } from "../../lab.queries";
import type { Lab } from "../../lab.types";

export default function LabAttachmentsTab({ lab }: { lab: Lab }) {
  const qc = useQueryClient();
  const attachments = lab.attachments ?? [];

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setName("");
    setFile(null);
    setAdding(false);
  };

  const upload = async () => {
    if (!name.trim() || !file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("attachmentName", name.trim());
    fd.append("file", file);
    try {
      await http.post(`/lab/labs/${lab.id}/attachments`, fd);
      toast.success("Attachment uploaded.");
      reset();
      qc.invalidateQueries({ queryKey: labKeys.view(lab.id) });
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Attachment upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Attachments</p>
        {!adding && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setAdding(true)}>
            <Upload className="h-4 w-4" /> Add Attachment
          </Button>
        )}
      </div>

      {adding && (
        <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Attachment Name</Label>
            <Input
              value={name}
              placeholder="Enter Attachment Name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={reset} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={upload} disabled={uploading || !name.trim() || !file} className="gap-1.5">
              {uploading && <Spinner className="h-4 w-4" />}
              Upload
            </Button>
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="py-4 text-center text-muted-foreground">No attachments have been uploaded.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {attachments.map((a, i) => (
            <li key={`${a.secureUrl}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate font-medium">{a.attachmentName}</span>
                {a.size != null && (
                  <span className="text-xs text-muted-foreground">
                    {(a.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </span>
              <a
                href={a.secureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" /> View
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
