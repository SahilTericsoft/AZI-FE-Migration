"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailField } from "@/components/ui/detail";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

import { useDeletePatient, usePatient } from "../patient.queries";
import AdditionalDetailsTab from "./tabs/additional-details-tab";
import ActivityLogsTab from "./tabs/activity-logs-tab";
import BasicDetailsTab from "./tabs/basic-details-tab";
import InsuranceTab from "./tabs/insurance-tab";
import OrderHistoryTab from "./tabs/order-history-tab";

const TABS = [
  { value: "basic", label: "Basic Details" },
  { value: "additional", label: "Additional Details" },
  { value: "insurance", label: "Insurance" },
  { value: "orders", label: "Order History" },
  { value: "logs", label: "Activity Logs" },
];

export default function PatientDetail({ patientId }: { patientId: number }) {
  const router = useRouter();
  const { data: patient, isLoading, isError } = usePatient(patientId);
  const deletePatient = useDeletePatient();
  const [tab, setTab] = useState("basic");

  if (isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[50dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/patient" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-muted-foreground">Patient not found.</p>
      </div>
    );
  }

  const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(" ");
  const created = patient.createdAt ? new Date(patient.createdAt).toLocaleString() : "—";

  const handleDelete = async () => {
    if (!window.confirm(`Delete patient "${fullName}"?`)) return;
    try {
      await deletePatient.mutateAsync(patientId);
      router.push("/patient");
    } catch {
      /* error toast handled by the client interceptor */
    }
  };

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <Link
        href="/patient"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs text-muted-foreground">Patient Overview</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold capitalize">{fullName}</h2>
              <Badge variant={patient.isActive ? "success" : "outline"}>
                {patient.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Patient ID" value={patient.id} />
              <DetailField label="Created By" value={patient.createdBy ?? undefined} />
              <DetailField label="Created Timestamp" value={created} />
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2 self-start border-destructive/40 text-destructive hover:bg-destructive/5"
            onClick={handleDelete}
            disabled={deletePatient.isPending}
          >
            <Trash2 className="h-4 w-4" /> Delete Patient
          </Button>
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
            <TabsContent value="basic" className="mt-0">
              <BasicDetailsTab patient={patient} />
            </TabsContent>
            <TabsContent value="additional" className="mt-0">
              <AdditionalDetailsTab patient={patient} />
            </TabsContent>
            <TabsContent value="insurance" className="mt-0">
              <InsuranceTab patientId={patientId} />
            </TabsContent>
            <TabsContent value="orders" className="mt-0">
              <OrderHistoryTab patientId={patientId} />
            </TabsContent>
            <TabsContent value="logs" className="mt-0">
              <ActivityLogsTab patientId={patientId} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
