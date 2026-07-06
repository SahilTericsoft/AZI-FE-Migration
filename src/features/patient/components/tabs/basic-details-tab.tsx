"use client";

import { DetailField, DetailSection } from "@/components/detail-field";

import {
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  PREFIX_OPTIONS,
  RACE_OPTIONS,
  SUFFIX_OPTIONS,
  optionTitle,
} from "../../patient.options";
import { useAllergies } from "../../patient.queries";
import type { Patient } from "../../patient.types";

export default function BasicDetailsTab({ patient }: { patient: Patient }) {
  const { data: allergies = [] } = useAllergies();

  const allergyNames = (patient.allergieIds ?? [])
    .map((id) => allergies.find((a) => a.id === id)?.name ?? `#${id}`)
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <DetailSection title="Patient Details">
        <DetailField label="First Name" value={patient.firstName} capitalize />
        <DetailField label="Middle Name" value={patient.middleName} capitalize />
        <DetailField label="Last Name" value={patient.lastName} capitalize />
        <DetailField label="Prefix" value={optionTitle(PREFIX_OPTIONS, patient.prefix) || undefined} />
        <DetailField label="Suffix" value={optionTitle(SUFFIX_OPTIONS, patient.suffix) || undefined} />
        <DetailField label="Gender" value={optionTitle(GENDER_OPTIONS, patient.gender) || undefined} />
        <DetailField label="Date of Birth" value={patient.dateOfBirth} />
        <DetailField label="Ethnicity" value={optionTitle(ETHNICITY_OPTIONS, patient.ethnicity) || undefined} />
        <DetailField label="Race" value={optionTitle(RACE_OPTIONS, patient.race) || undefined} />
        <DetailField label="Weight (in lbs)" value={patient.weight ?? undefined} />
        <DetailField label="Height (in feet)" value={patient.heightInFeet ?? undefined} />
        <DetailField label="Height (in inches)" value={patient.heightInInches ?? undefined} />
        <DetailField label="Associated Allergies" value={allergyNames || undefined} />
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
