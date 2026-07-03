"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowLeft, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailField } from "@/components/ui/detail";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";

import { useFacilityView } from "../facility.queries";
import FacilityCreateWizard from "./facility-create-wizard";
import {
  FacilityAdminEdit,
  FacilityPhysiciansEdit,
  FacilityUsersEdit,
} from "./tabs/facility-relations-edit";
import FacilityAdminTab from "./tabs/facility-admin-tab";
import FacilityDetailsEdit from "./tabs/facility-details-edit";
import FacilityDetailsTab from "./tabs/facility-details-tab";
import FacilityPhysiciansTab from "./tabs/facility-physicians-tab";
import FacilityPrimaryContactTab from "./tabs/facility-primary-contact-tab";
import FacilityUsersTab from "./tabs/facility-users-tab";

const TABS = [
  { value: "admin", label: "Admin Details" },
  { value: "users", label: "User Details" },
  { value: "details", label: "Facility Details" },
  { value: "contact", label: "Primary Contact" },
  { value: "physician", label: "Provider/Physician" },
];

export default function FacilityDetail({ facilityId }: { facilityId: number }) {
  const { data: facility, isLoading, isError } = useFacilityView(facilityId);
  const [tab, setTab] = useState("admin");
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[50dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !facility) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/facility" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-muted-foreground">Facility not found.</p>
      </div>
    );
  }

  // A draft facility isn't finished — continue onboarding in the wizard.
  if (facility.status === "draft") {
    return <FacilityCreateWizard facilityId={facilityId} />;
  }

  const name = facility.code ?? facility.name ?? "";
  const created = facility.createdAt ? formatDateTime(facility.createdAt) : "—";
  const addedBy = facility.createdByDetails as Record<string, unknown> | undefined;
  const addedByName = addedBy
    ? [addedBy.firstName, addedBy.lastName].filter(Boolean).join(" ")
    : undefined;
  const status = facility.statusObj?.title ?? facility.status ?? undefined;

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link
        href="/facility"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Facility Details
      </p>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold uppercase">{name}</h2>
          {status && (
            <Badge variant={facility.status === "completed" ? "success" : "outline"}>
              {status}
            </Badge>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
          <DetailField label="Facility Type" value={facility.type} />
          <DetailField label="Added by" value={addedByName} capitalize />
          <DetailField label="Created on" value={created} />
          <DetailField label="No. of Locations" value={facility.numberOfLocations ?? undefined} />
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
          <TabsList className="w-full overflow-x-auto px-2">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-6">
            {!editing && tab !== "contact" && (
              <div className="mb-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4" /> Edit Details
                </Button>
              </div>
            )}

            <TabsContent value="admin" className="mt-0">
              {editing ? (
                <FacilityAdminEdit facility={facility} onDone={() => setEditing(false)} />
              ) : (
                <FacilityAdminTab facility={facility} />
              )}
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              {editing ? (
                <FacilityUsersEdit facility={facility} onDone={() => setEditing(false)} />
              ) : (
                <FacilityUsersTab facility={facility} />
              )}
            </TabsContent>
            <TabsContent value="details" className="mt-0">
              {editing ? (
                <FacilityDetailsEdit facility={facility} onDone={() => setEditing(false)} />
              ) : (
                <FacilityDetailsTab facility={facility} />
              )}
            </TabsContent>
            <TabsContent value="contact" className="mt-0">
              <FacilityPrimaryContactTab facility={facility} />
            </TabsContent>
            <TabsContent value="physician" className="mt-0">
              {editing ? (
                <FacilityPhysiciansEdit facility={facility} onDone={() => setEditing(false)} />
              ) : (
                <FacilityPhysiciansTab facility={facility} />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
