"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowLeft, Pencil, RefreshCw } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";

import { labRoleLabel, labTypeLabel } from "../lab.format";
import { useLabView, useUpdateLab } from "../lab.queries";
import type { Lab, LabRole } from "../lab.types";
import LabCreateWizard from "./lab-create-wizard";
import AdminDetailsEdit from "./tabs/admin-details-edit";
import AdminDetailsTab from "./tabs/admin-details-tab";
import LabAttachmentsTab from "./tabs/lab-attachments-tab";
import LabDetailsEdit from "./tabs/lab-details-edit";
import LabDetailsTab from "./tabs/lab-details-tab";

const TABS = [
  { value: "admin", label: "Admin Details" },
  { value: "lab", label: "Lab Details" },
  { value: "attachments", label: "Lab Attachments" },
];

export default function LabDetail({ labId }: { labId: number }) {
  const { data: lab, isLoading, isError } = useLabView(labId);
  const [tab, setTab] = useState("admin");
  const [editing, setEditing] = useState(false);
  const [funcOpen, setFuncOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[50dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !lab) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/lab" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-muted-foreground">Lab not found.</p>
      </div>
    );
  }

  // A draft lab isn't finished — continue it in the wizard instead of showing
  // the read-only detail view.
  if (lab.status === "draft") {
    return <LabCreateWizard labId={labId} />;
  }

  const created = formatDateTime(lab.createdAt);

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link
        href="/lab"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Lab Details
      </p>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-bold capitalize">{lab.name}</h2>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Lab ID" value={lab.labExternalId} />
              <DetailField label="Lab Type" value={labTypeLabel(lab.labType)} />
              <DetailField label="Lab Role" value={labRoleLabel(lab.labRole)} />
              <DetailField label="Created on" value={created} />
            </div>
          </div>
          <Button variant="outline" className="gap-2 self-start" onClick={() => setFuncOpen(true)}>
            <RefreshCw className="h-4 w-4" /> Change Functionality
          </Button>
        </div>
      </Card>

      <Card className="p-0">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setEditing(false);
          }}
        >
          <TabsList className="w-full px-2">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-6">
            {tab !== "attachments" && !editing && (
              <div className="mb-2 flex justify-end">
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit Details
                </Button>
              </div>
            )}

            <TabsContent value="admin" className="mt-0">
              {editing ? (
                <AdminDetailsEdit lab={lab} onDone={() => setEditing(false)} />
              ) : (
                <AdminDetailsTab lab={lab} />
              )}
            </TabsContent>
            <TabsContent value="lab" className="mt-0">
              {editing ? (
                <LabDetailsEdit lab={lab} onDone={() => setEditing(false)} />
              ) : (
                <LabDetailsTab lab={lab} />
              )}
            </TabsContent>
            <TabsContent value="attachments" className="mt-0">
              <LabAttachmentsTab lab={lab} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {funcOpen && (
        <ChangeFunctionalityDialog lab={lab} onClose={() => setFuncOpen(false)} />
      )}
    </div>
  );
}

const ROLES: { role: LabRole; label: string; description: string }[] = [
  { role: "sendLab", label: "Reference Lab", description: "Samples are sent out to this lab for testing." },
  { role: "receiveLab", label: "Client Lab", description: "This lab sends its samples to you for testing." },
  { role: "sendReceiveLab", label: "Reference-Client Lab", description: "This lab both sends and receives samples." },
];

function ChangeFunctionalityDialog({ lab, onClose }: { lab: Lab; onClose: () => void }) {
  const update = useUpdateLab();
  const [role, setRole] = useState<LabRole>((lab.labRole as LabRole) ?? "sendLab");

  const save = () => {
    update.mutate(
      { id: lab.id, body: { labRole: role } },
      {
        onSuccess: () => {
          toast.success("Lab functionality updated.");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !update.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Functionality</DialogTitle>
        </DialogHeader>
        <RadioGroup value={role} onValueChange={(v) => setRole(v as LabRole)} className="gap-3 py-1">
          {ROLES.map((r) => (
            <label key={r.role} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted">
              <RadioGroupItem value={r.role} className="mt-0.5" />
              <span>
                <span className="block font-semibold text-primary">{r.label}</span>
                <span className="block text-sm text-muted-foreground">{r.description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={update.isPending} className="gap-1.5">
            {update.isPending && <Spinner className="h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
