"use client";

import Link from "next/link";

import { ArrowLeft, RotateCcw } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";

import { useUpdateWorklist, useWorklists } from "@/features/lab-os/lab-os.queries";
import type { LabSession } from "@/features/lab-os/lab-os.types";
import type { ProcessingConfig } from "../sample-processing.types";

function cfg(s: LabSession): ProcessingConfig {
  return (s.sample_config ?? {}) as ProcessingConfig;
}

export default function SampleProcessingRecycleBin() {
  const { data, isLoading, isError, error } = useWorklists();
  const update = useUpdateWorklist();
  const discarded = (data ?? []).filter(
    (s) => cfg(s).kind === "processing" && (s.status ?? "").toLowerCase() === "discarded",
  );

  const restore = (id: number) =>
    update.mutate(
      { id, body: { status: "open" } },
      { onSuccess: () => toast.success("Session restored."), onError: (e) => toast.error(e?.message ?? "Failed to restore.") },
    );

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link href="/sample-processing" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h2 className="text-2xl font-bold">Recycle Bin</h2>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load discarded sessions."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Configuration</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Discarded On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : discarded.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Recycle bin is empty.</TableCell></TableRow>
            ) : (
              discarded.map((s) => {
                const c = cfg(s);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.id}</TableCell>
                    <TableCell className="capitalize">{c.department ?? "—"}</TableCell>
                    <TableCell>{c.processingType ?? "—"}</TableCell>
                    <TableCell>{c.plateId ?? "—"}</TableCell>
                    <TableCell>{s.updatedAt ? formatDateTime(s.updatedAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => restore(s.id)} disabled={update.isPending}>
                        <RotateCcw className="h-4 w-4" /> Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
