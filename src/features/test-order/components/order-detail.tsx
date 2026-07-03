"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailField, DetailSection } from "@/components/ui/detail";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import {
  toLogArray,
  useActivityLogs,
} from "@/features/activity-log/activity-log.queries";
import { useSamplesByOrder } from "@/features/sample/sample.queries";
import { humanizeKey } from "@/lib/format";

import { useOrder, useOrderResults } from "../test-order.queries";
import type { Order } from "../test-order.types";

const TABS = [
  { value: "summary", label: "Summary" },
  { value: "orders", label: "Orders" },
  { value: "attachments", label: "Attachments" },
  { value: "result", label: "Result" },
  { value: "logs", label: "Activity Log" },
];

function rname(rec: Record<string, unknown> | null | undefined): string | undefined {
  if (!rec) return undefined;
  const n = [rec.firstName, rec.lastName].filter(Boolean).join(" ").trim();
  return n || (rec.name as string | undefined) || undefined;
}

function centeredSpinner() {
  return (
    <div className="grid place-items-center py-12">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

function SummaryTab({ order }: { order: Order }) {
  const pd = (order.patientDetails ?? undefined) as Record<string, unknown> | undefined;
  const phys = order.physicianDetails as Record<string, unknown> | undefined;
  const p = (k: string) => pd?.[k] as string | undefined;
  return (
    <>
      <DetailSection title="Order Details">
        <DetailField label="Ordering Physician" value={rname(phys)} capitalize />
        <DetailField label="Priority Type" value={order.isPriorityOrder ? "Priority" : "Routine"} />
        <DetailField label="Source" value={order.source} />
        <DetailField label="Consent Signed" value={order.isConsentSigned ? "Yes" : "No"} />
        <DetailField label="Samples Ordered" value={order.numberOfSamplesOrdered ?? undefined} />
        <DetailField label="Samples Resulted" value={order.numberOfSamplesResulted ?? undefined} />
      </DetailSection>
      <DetailSection title="Patient Details">
        <DetailField label="First Name" value={p("firstName")} capitalize />
        <DetailField label="Last Name" value={p("lastName")} capitalize />
        <DetailField label="Gender" value={p("gender")} capitalize />
        <DetailField label="Date of Birth" value={p("dateOfBirth")} />
        <DetailField label="Mobile Number" value={p("mobileNumber")} />
        <DetailField label="Email ID" value={p("emailId")} />
      </DetailSection>
    </>
  );
}

function ResultTab({ orderId }: { orderId: number }) {
  const { data: results, isLoading } = useOrderResults(orderId);
  if (isLoading) return centeredSpinner();
  if (!results || results.length === 0) {
    return <p className="py-4 text-muted-foreground">No results for this order.</p>;
  }
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sample ID</TableHead>
            <TableHead>Resulted Mode</TableHead>
            <TableHead>PDF Generated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.sampleId ?? "—"}</TableCell>
              <TableCell>{r.resultedMode ?? "—"}</TableCell>
              <TableCell>{r.pdfGeneratedDate ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function OrdersTab({ orderId }: { orderId: number }) {
  const { data: samples, isLoading } = useSamplesByOrder(orderId);
  if (isLoading) return centeredSpinner();
  if (!samples || samples.length === 0) {
    return <p className="py-4 text-muted-foreground">No samples for this order.</p>;
  }
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Accession ID</TableHead>
            <TableHead>Panel / Test</TableHead>
            <TableHead>Sample Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Barcode</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {samples.map((s) => {
            const panel = (s.panelDetails as { name?: string } | undefined)?.name;
            return (
              <TableRow key={s.id}>
                <TableCell>{s.sampleCode ?? "—"}</TableCell>
                <TableCell>{panel ?? "—"}</TableCell>
                <TableCell>{s.sampleType ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "completed" ? "success" : "outline"}>
                    {s.status ? humanizeKey(s.status) : "—"}
                  </Badge>
                </TableCell>
                <TableCell>{s.barcode ?? "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function ActivityLogTab({ orderId }: { orderId: number }) {
  const { data, isLoading } = useActivityLogs({ identityId: orderId, limit: 100 });
  const logs = toLogArray(data);
  if (isLoading) return centeredSpinner();
  if (logs.length === 0) {
    return <p className="py-4 text-muted-foreground">No activity logged for this order.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {logs.map((log) => {
        const line = [humanizeKey(log.module ?? ""), log.field, log.value]
          .filter(Boolean)
          .join(" > ");
        const when = log.logDateTime || log.createdAt;
        return (
          <div
            key={log.id}
            className="flex items-center justify-between rounded-md bg-muted px-3 py-2.5"
          >
            <p className="text-sm">{line || "—"}</p>
            <p className="text-xs text-muted-foreground">
              {when ? new Date(when).toLocaleString() : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetail({ orderId }: { orderId: number }) {
  const { data: order, isLoading, isError } = useOrder(orderId);
  const [tab, setTab] = useState("summary");

  if (isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[50dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !order) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/test-order" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : "—";
  const facility = (order.facilityDetails as { name?: string } | undefined)?.name;
  const location = (order.locationDetails as { name?: string } | undefined)?.name;
  const createdBy = rname(order.createdByDetails);

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link
        href="/test-order"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Test Overview
      </p>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{order.code ?? `#${order.id}`}</h2>
          {order.status && (
            <Badge variant={order.status === "completed" ? "success" : "outline"}>
              {humanizeKey(order.status)}
            </Badge>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
          <DetailField label="Facility Name" value={facility} capitalize />
          <DetailField label="Location Name" value={location} capitalize />
          <DetailField label="Created By" value={createdBy} capitalize />
          <DetailField label="Created Timestamp" value={created} />
        </div>
      </Card>

      <Card className="p-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-2">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="p-6">
            <TabsContent value="summary" className="mt-0">
              <SummaryTab order={order} />
            </TabsContent>
            <TabsContent value="orders" className="mt-0">
              <OrdersTab orderId={orderId} />
            </TabsContent>
            <TabsContent value="attachments" className="mt-0">
              {(order.attachments?.length ?? 0) === 0 ? (
                <p className="py-4 text-muted-foreground">No attachments uploaded.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {(order.attachments ?? []).map((a, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-medium">{a.attachmentName}</span>
                      <a href={a.secureUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="result" className="mt-0">
              <ResultTab orderId={orderId} />
            </TabsContent>
            <TabsContent value="logs" className="mt-0">
              <ActivityLogTab orderId={orderId} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
