"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DetailField, DetailSection } from "@/components/ui/detail";
import { displayValue, humanizeKey } from "@/lib/format";

import type { Facility } from "../../facility.types";

export default function FacilityPhysiciansTab({ facility }: { facility: Facility }) {
  const physicians = (facility.physicianDetails ?? []) as Record<string, unknown>[];

  if (physicians.length === 0) {
    return <p className="py-4 text-muted-foreground">No providers added.</p>;
  }

  return (
    <div>
      <h3 className="mb-2 text-base font-bold">Added Providers</h3>
      <Accordion type="multiple" defaultValue={["p-0"]}>
        {physicians.map((p, index) => {
          const f = (key: string) => p[key] as string | number | undefined;
          const name = [f("prefix"), f("firstName"), f("middleName"), f("lastName")]
            .filter(Boolean)
            .join(" ");
          const npi = f("npiNumber");
          const taxonomy = (p.taxonomyDetails ?? undefined) as Record<string, unknown> | undefined;
          const taxEntries = taxonomy
            ? Object.entries(taxonomy).filter(([, v]) => displayValue(v) !== undefined)
            : [];

          return (
            <AccordionItem key={index} value={`p-${index}`}>
              <AccordionTrigger>
                <span className="font-bold uppercase">
                  {name || "Provider"}
                  {npi ? `  (NPI: ${npi})` : ""}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <DetailSection title="Personal Details">
                  <DetailField label="NPI Number" value={f("npiNumber")} />
                  <DetailField label="Credential" value={f("designation")} />
                  <DetailField label="Prefix" value={f("prefix")} />
                  <DetailField label="Suffix" value={f("suffix")} />
                  <DetailField label="First Name" value={f("firstName")} capitalize />
                  <DetailField label="Middle Name" value={f("middleName")} capitalize />
                  <DetailField label="Last Name" value={f("lastName")} capitalize />
                  <DetailField label="Gender" value={f("gender")} capitalize />
                  <DetailField label="Medicare PTAN Number" value={f("pTanNumber")} />
                  <DetailField label="Medicaid TIN Number" value={f("tinNumber")} />
                </DetailSection>

                {taxEntries.length > 0 && (
                  <DetailSection title="Taxonomy Details">
                    {taxEntries.map(([key, value]) => (
                      <DetailField key={key} label={humanizeKey(key)} value={displayValue(value)} />
                    ))}
                  </DetailSection>
                )}

                <DetailSection title="Contact Details">
                  <DetailField label="Mobile Number" value={f("mobileNumber")} />
                  <DetailField label="Fax Number" value={f("faxNumber")} />
                  <DetailField label="Email ID" value={f("emailId")} />
                </DetailSection>

                <DetailSection title="Address Details">
                  <DetailField label="Address Line 1" value={f("addressLine1")} />
                  <DetailField label="Address Line 2" value={f("addressLine2")} />
                  <DetailField label="ZIP Code" value={f("zipcode")} />
                  <DetailField label="State" value={f("state")} capitalize />
                  <DetailField label="City" value={f("city")} capitalize />
                </DetailSection>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
