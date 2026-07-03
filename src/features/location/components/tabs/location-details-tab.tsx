import { DetailField, DetailSection } from "@/components/detail-field";

import type { Location } from "../../location.types";

export default function LocationDetailsTab({ location }: { location: Location }) {
  const addr = location.addressDetails ?? undefined;
  const a = (key: string) => addr?.[key] as string | undefined;
  const facility = location.facilityDetails as { name?: string } | undefined;
  const lab = location.labDetails as { name?: string } | undefined;

  return (
    <>
      <DetailSection title="Basic Details">
        <DetailField
          label="Location Name"
          value={location.code ?? location.name}
          capitalize
        />
        <DetailField label="Location Type" value={location.type} />
        <DetailField label="Facility" value={facility?.name} capitalize />
        <DetailField label="Lab" value={lab?.name} capitalize />
        <DetailField label="Internal Location ID" value={location.internalLocationId} />
        <DetailField label="Purpose" value={location.purpose} />
      </DetailSection>

      <DetailSection title="Address Details">
        <DetailField label="Address Line 1" value={a("addressLine1")} />
        <DetailField label="Address Line 2" value={a("addressLine2")} />
        <DetailField label="ZIP Code" value={a("zipcode")} />
        <DetailField label="City" value={a("city")} capitalize />
        <DetailField label="State" value={a("state")} capitalize />
      </DetailSection>
    </>
  );
}
