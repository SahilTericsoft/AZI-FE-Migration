"use client";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";
import { useLabLiteList } from "@/features/lab/lab.queries";

import { useSendoutBatch } from "../sendout.queries";

export default function SendoutDetail({ batchId }: { batchId: number }) {
  const { data: batch, isLoading, isError, error } = useSendoutBatch(batchId);
  const labs = useLabLiteList();

  const lab = batch?.sendoutLabId
    ? (labs.data ?? []).find((l) => l.id === batch.sendoutLabId)
    : undefined;
  const labName = lab ? (lab.name ?? lab.code ?? `Lab #${lab.id}`) : batch?.sendoutLabId ?? "—";
  const sampleIds = batch?.sampleIds ?? [];

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex items-center gap-3">
        <Link
          href="/sendout"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}
        >
          <ArrowLeft className="h-4 w-4" /> Sendout
        </Link>
        <h2 className="text-2xl font-bold">
          {isLoading ? "Loading…" : `Batch #${batchId}`}
        </h2>
      </div>

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load the sendout batch."}</Alert>
      )}

      {isLoading ? (
        <Card className="p-12 text-center">
          <Spinner className="mx-auto" />
        </Card>
      ) : batch ? (
        <>
          <Card className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <Field label="Sendout Lab" value={String(labName)} />
            <Field label="Samples" value={String(batch.sampleCount ?? sampleIds.length)} />
            <Field
              label="Created"
              value={batch.createdAt ? formatDateTime(batch.createdAt) : "—"}
            />
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Samples in this batch
            </h3>
            {sampleIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No samples recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sampleIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    Sample #{id}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
