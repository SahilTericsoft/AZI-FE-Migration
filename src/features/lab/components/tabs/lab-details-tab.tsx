import { DetailField, DetailSection } from "@/components/ui/detail";

import { labRoleLabel, labTypeLabel } from "../../lab.format";
import type { Lab } from "../../lab.types";

export default function LabDetailsTab({ lab }: { lab: Lab }) {
  return (
    <>
      <DetailSection title="Lab Details">
        <DetailField label="Lab Name" value={lab.name} capitalize />
        <DetailField label="Lab ID" value={lab.labExternalId} />
        <DetailField label="NPI Number" value={lab.npiNumber} />
        <DetailField label="CLIA ID" value={lab.cliaId} />
        <DetailField label="CAP ID" value={lab.capId} />
        <DetailField label="COLA ID" value={lab.colaId} />
        <DetailField label="Lab Type" value={labTypeLabel(lab.labType)} />
        <DetailField label="Lab Role" value={labRoleLabel(lab.labRole)} />
      </DetailSection>

      <DetailSection title="Contact Details">
        <DetailField label="Email ID" value={lab.emailId} />
        <DetailField label="Secondary Mobile Number" value={lab.secondaryMobileNumber} />
        <DetailField label="Mobile Number" value={lab.mobileNumber} />
        <DetailField label="Fax Number" value={lab.faxNumber} />
      </DetailSection>

      <DetailSection title="Address Details">
        <DetailField label="Address Line 1" value={lab.addressLine1} />
        <DetailField label="Address Line 2" value={lab.addressLine2} />
        <DetailField label="ZIP Code" value={lab.zipcode} />
        <DetailField label="State" value={lab.state} capitalize />
        <DetailField label="City" value={lab.city} capitalize />
      </DetailSection>
    </>
  );
}
