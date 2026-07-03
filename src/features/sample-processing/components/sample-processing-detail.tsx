"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, MinusCircle, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailField } from "@/components/ui/detail";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";

import { useUpdateWorklist, useWorklist } from "@/features/lab-os/lab-os.queries";

import PlateMapper from "./plate-mapper";
import type { CellData, ProcessingConfig } from "../sample-processing.types";

export default function SampleProcessingDetail({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const { data: session, isLoading, isError } = useWorklist(sessionId);
  const update = useUpdateWorklist();
  const [config, setConfig] = useState<ProcessingConfig | null>(null);

  useEffect(() => {
    if (session?.sample_config) setConfig(session.sample_config as ProcessingConfig);
  }, [session]);

  const finalized = useMemo(() => {
    const st = (session?.status ?? "").toLowerCase();
    return Boolean(session?.is_processed) || st === "completed" || st === "discarded";
  }, [session]);

  const unassigned = useMemo(() => {
    if (!config) return 0;
    const placed = new Set<string>();
    for (const v of Object.values((config.cells ?? {}) as CellData)) if (v.type === "samples") placed.add(v.value);
    return (config.samples ?? []).filter((s) => !placed.has(s.barcode)).length;
  }, [config]);

  if (isLoading) return <div className="shadcn-scope grid min-h-[50dvh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  if (isError || !session || !config) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/sample-processing" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}><ArrowLeft className="h-4 w-4" /> Back</Link>
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const persistPlate = (partial: Partial<ProcessingConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    update.mutate({ id: sessionId, body: { sample_config: next } });
  };

  const isExtraction = config.processingType === "Extraction" || config.processingType === "Extractionless";
  const submitLabel = isExtraction ? "Save and Exit" : "Proceed To Analyser";

  const discard = () =>
    update.mutate(
      { id: sessionId, body: { status: "discarded" } },
      { onSuccess: () => { toast.success("Session discarded."); router.push("/sample-processing"); } },
    );

  const submit = () =>
    update.mutate(
      { id: sessionId, body: { status: "completed", is_processed: true } },
      { onSuccess: () => { toast.success("Session submitted."); router.push("/sample-processing"); } },
    );

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link href="/sample-processing" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold capitalize">{config.department} - {config.processingType}</h2>
              <Badge variant={finalized ? "success" : "outline"}>{session.is_processed ? "Completed" : session.status ?? "Open"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="ID" value={config.plateId} />
              <DetailField label="Available Sample(s)" value={config.samples?.length ?? 0} />
              <DetailField label="Test/Panel Codes" value={(config.testPanelCodes ?? []).join(", ") || "N/A"} />
              <DetailField label="Created On" value={session.createdAt ? formatDateTime(session.createdAt) : undefined} />
            </div>
          </div>
          <div className="flex gap-2 self-start">
            <Button variant="outline" className="gap-1.5 text-destructive" onClick={discard} disabled={finalized || update.isPending}>
              <MinusCircle className="h-4 w-4" /> Discard
            </Button>
            <Button className="gap-1.5" onClick={submit} disabled={finalized || update.isPending || unassigned > 0} title={unassigned > 0 ? `${unassigned} sample(s) unassigned` : undefined}>
              <Send className="h-4 w-4" /> {submitLabel}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <PlateMapper config={config} finalized={finalized} onChange={persistPlate} />
      </Card>
    </div>
  );
}
