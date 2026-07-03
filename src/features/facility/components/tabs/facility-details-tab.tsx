import { DetailField, DetailSection } from "@/components/detail-field";

import type { Facility } from "../../facility.types";

export default function FacilityDetailsTab({ facility }: { facility: Facility }) {
  const addr = facility.addressDetails ?? undefined;
  const a = (key: string) => addr?.[key] as string | undefined;

  return (
    <>
      <DetailSection title="Basic Details">
        <DetailField
          label="Facility Name"
          value={facility.code ?? facility.name}
          capitalize
        />
        <DetailField label="Facility Type" value={facility.type} />
      </DetailSection>

      <DetailSection title="Address Details">
        <DetailField label="Address Line 1" value={a("addressLine1")} />
        <DetailField label="Address Line 2" value={a("addressLine2")} />
        <DetailField label="ZIP Code" value={a("zipcode")} />
        <DetailField label="City" value={a("city")} capitalize />
        <DetailField label="State" value={a("state")} capitalize />
      </DetailSection>

      <DetailSection title="Insurance Preference">
        <DetailField
          label="Is uploading insurance images mandatory for this facility?"
          value={facility.isInsuranceImageRequired ? "Yes" : "No"}
        />
      </DetailSection>
    </>
  );
}
