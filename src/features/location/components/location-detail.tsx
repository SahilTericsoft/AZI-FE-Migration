"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowLeft, Pencil } from "lucide-react";

import AdminUserDetails from "@/components/admin-user-details";
import JsonDetail from "@/components/json-detail";
import PrimaryContactDetails from "@/components/primary-contact-details";
import UserDetailsTable from "@/components/user-details-table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailField } from "@/components/ui/detail";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";

import { useLocationView } from "../location.queries";
import LocationCreateWizard from "./location-create-wizard";
import LocationDetailsEdit from "./tabs/location-details-edit";
import LocationDetailsTab from "./tabs/location-details-tab";
import {
  LocationAdminEdit,
  LocationPrimaryContactEdit,
  LocationUsersEdit,
} from "./tabs/location-relations-edit";

const TABS = [
  { value: "admin", label: "Admin Details" },
  { value: "users", label: "User Details" },
  { value: "details", label: "Location Details" },
  { value: "contact", label: "Primary Contact" },
  { value: "physician", label: "Provider/Physician" },
  { value: "offerings", label: "Location Offerings" },
  { value: "critical", label: "Critical Details" },
  { value: "billing", label: "Billing Details" },
  { value: "account", label: "Account Preferences" },
  { value: "blood", label: "Blood Draw Information" },
];

// Tabs that have an inline edit form (others are read-only).
const EDITABLE_TABS = new Set(["admin", "users", "details", "contact"]);

function recordName(rec: Record<string, unknown> | null | undefined): string | undefined {
  if (!rec) return undefined;
  const name = [rec.firstName, rec.lastName].filter(Boolean).join(" ").trim();
  return name || (rec.name as string | undefined) || undefined;
}

export default function LocationDetail({ locationId }: { locationId: number }) {
  const { data: location, isLoading, isError } = useLocationView(locationId);
  const [tab, setTab] = useState("admin");
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[50dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !location) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link href="/location" className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-muted-foreground">Location not found.</p>
      </div>
    );
  }

  // A draft location isn't finished — continue onboarding in the wizard.
  if (location.status === "draft") {
    return <LocationCreateWizard locationId={locationId} />;
  }

  const name = location.code ?? location.name ?? "";
  const created = location.createdAt ? formatDateTime(location.createdAt) : "—";
  const facilityName = (location.facilityDetails as { name?: string } | undefined)?.name;
  const addedBy = recordName(location.createdByDetails);
  const status = location.statusObj?.title ?? location.status;

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link
        href="/location"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Location Details
      </p>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold capitalize">{name}</h2>
          {status && (
            <Badge variant={location.status === "completed" ? "success" : "outline"}>
              {status}
            </Badge>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
          <DetailField label="Location Type" value={location.type} />
          <DetailField label="Facility" value={facilityName} capitalize />
          <DetailField label="Added by" value={addedBy} capitalize />
          <DetailField label="Created on" value={created} />
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
            {!editing && EDITABLE_TABS.has(tab) && (
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
                <LocationAdminEdit location={location} onDone={() => setEditing(false)} />
              ) : (
                <AdminUserDetails admin={location.adminDetails} />
              )}
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              {editing ? (
                <LocationUsersEdit location={location} onDone={() => setEditing(false)} />
              ) : (
                <UserDetailsTable users={location.userDetails} />
              )}
            </TabsContent>
            <TabsContent value="details" className="mt-0">
              {editing ? (
                <LocationDetailsEdit location={location} onDone={() => setEditing(false)} />
              ) : (
                <LocationDetailsTab location={location} />
              )}
            </TabsContent>
            <TabsContent value="contact" className="mt-0">
              {editing ? (
                <LocationPrimaryContactEdit location={location} onDone={() => setEditing(false)} />
              ) : (
                <PrimaryContactDetails contact={location.primaryContactDetails} />
              )}
            </TabsContent>
            <TabsContent value="physician" className="mt-0">
              <UserDetailsTable users={location.physicianDetails as Record<string, unknown>[] | null | undefined} />
            </TabsContent>
            <TabsContent value="offerings" className="mt-0">
              {(location.panels?.length ?? 0) === 0 ? (
                <p className="py-4 text-muted-foreground">No offerings selected.</p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {(location.panels ?? []).map((p) => (
                    <li key={p}>Panel #{p}</li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="critical" className="mt-0">
              <JsonDetail data={location.criticalDetails} title="Critical Details" emptyText="No critical details added." />
            </TabsContent>
            <TabsContent value="billing" className="mt-0">
              <JsonDetail data={location.billingDetails} title="Billing Details" emptyText="No billing details added." />
            </TabsContent>
            <TabsContent value="account" className="mt-0">
              <JsonDetail data={location.accountPreferences} title="Account Preferences" emptyText="No account preferences added." />
            </TabsContent>
            <TabsContent value="blood" className="mt-0">
              <JsonDetail data={location.bloodDrawInformation} title="Blood Draw Information" emptyText="No blood draw information added." />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
