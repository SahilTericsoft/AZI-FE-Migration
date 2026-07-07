"use client";

import { useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import type { ApiError } from "@/core/api/types";

import { testConfigApi } from "../test-config.api";
import { testConfigKeys } from "../test-config.queries";
import type { Attachment } from "../test-config.types";

/** Uploaded-document manager for a FE "Panel" (BE test). */
export default function TestAttachments({
  testId,
  attachments,
}: {
  testId: number;
  attachments: Attachment[];
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: testConfigKeys.testDetail(testId) });
    qc.invalidateQueries({ queryKey: testConfigKeys.tests });
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      await testConfigApi.testAttachments.upload(testId, name.trim() || file.name, file);
      setName("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Attachment uploaded.");
      refresh();
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Attachment upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (index: number) => {
    if (!window.confirm("Remove this attachment?")) return;
    try {
      await testConfigApi.testAttachments.remove(testId, index);
      refresh();
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not remove attachment.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label>Attachment Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Method sheet" />
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
        <Button type="button" variant="outline" className="gap-1.5" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />} Upload
        </Button>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments have been uploaded.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <a href={a.secureUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                <Paperclip className="h-4 w-4" /> {a.attachmentName}
                {a.mimeType && <Badge variant="secondary">{a.mimeType}</Badge>}
              </a>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
