import { DetailField, DetailSection } from "@/components/ui/detail";

import type { Lab } from "../../lab.types";

/** Admin Details = the lab's admin user (`adminDetails`, populated by `view`). */
export default function AdminDetailsTab({ lab }: { lab: Lab }) {
  const admin = (lab.adminDetails ?? undefined) as
    | Record<string, unknown>
    | undefined;
  const f = (key: string) => admin?.[key] as string | number | undefined;

  return (
    <>
      <DetailSection title="Basic Details">
        <DetailField label="NPI Number" value={f("npiNumber")} />
        <DetailField label="First Name" value={f("firstName")} capitalize />
        <DetailField label="Middle Name" value={f("middleName")} capitalize />
        <DetailField label="Last Name" value={f("lastName")} capitalize />
      </DetailSection>

      <DetailSection title="Contact Details">
        <DetailField label="Email ID" value={f("emailId")} />
        <DetailField label="Mobile Number" value={f("mobileNumber")} />
        <DetailField label="Fax Number" value={f("faxNumber")} />
      </DetailSection>

      <DetailSection title="Address Details">
        <DetailField label="Address Line 1" value={f("addressLine1")} />
        <DetailField label="Address Line 2" value={f("addressLine2")} />
        <DetailField label="ZIP Code" value={f("zipcode")} />
        <DetailField label="State" value={f("state")} capitalize />
        <DetailField label="City" value={f("city")} capitalize />
      </DetailSection>
    </>
  );
}
