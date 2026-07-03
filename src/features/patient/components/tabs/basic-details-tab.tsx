import { DetailField, DetailSection } from "@/components/detail-field";

import type { Patient } from "../../patient.types";

export default function BasicDetailsTab({ patient }: { patient: Patient }) {
  return (
    <>
      <DetailSection title="Patient Details">
        <DetailField label="First Name" value={patient.firstName} capitalize />
        <DetailField label="Middle Name" value={patient.middleName} capitalize />
        <DetailField label="Last Name" value={patient.lastName} capitalize />
        <DetailField label="Prefix" value={patient.prefix} />
        <DetailField label="Suffix" value={patient.suffix} />
        <DetailField label="Gender" value={patient.gender} capitalize />
        <DetailField label="Date of Birth" value={patient.dateOfBirth} />
        <DetailField label="Ethnicity" value={patient.ethnicity} capitalize />
        <DetailField label="Race" value={patient.race} capitalize />
        <DetailField label="Weight (in lbs)" value={patient.weight ?? undefined} />
        <DetailField label="Height (in feet)" value={patient.heightInFeet ?? undefined} />
        <DetailField label="Height (in inches)" value={patient.heightInInches ?? undefined} />
        <DetailField
          label="Associated Allergies"
          value={patient.allergieIds?.length ? patient.allergieIds.join(", ") : undefined}
        />
      </DetailSection>

      <DetailSection title="Contact Details">
        <DetailField label="Email ID" value={patient.emailId} />
        <DetailField label="Business Email ID" value={patient.businessEmailId} />
        <DetailField label="Business Mobile Number" value={patient.businessMobileNumber} />
        <DetailField label="Mobile Number" value={patient.mobileNumber} />
        <DetailField label="Secondary Mobile Number" value={patient.secondaryMobileNumber} />
      </DetailSection>

      <DetailSection title="Address Details">
        <DetailField label="Address Line 1" value={patient.addressLine1} />
        <DetailField label="Address Line 2" value={patient.addressLine2} />
        <DetailField label="ZIP Code" value={patient.zipcode} />
        <DetailField label="State" value={patient.state} capitalize />
        <DetailField label="County" value={patient.county} capitalize />
        <DetailField label="City" value={patient.city} capitalize />
        <DetailField label="Country" value={patient.country} />
      </DetailSection>
    </>
  );
}
