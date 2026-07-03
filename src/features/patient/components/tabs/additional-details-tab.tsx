import { DetailField, DetailSection } from "@/components/detail-field";

import type { Patient } from "../../patient.types";

const yesNo = (v?: boolean | null) => (v ? "Yes" : "No");

export default function AdditionalDetailsTab({ patient }: { patient: Patient }) {
  return (
    <>
      <DetailSection title="Additional Details">
        <DetailField label="Alias Name" value={patient.aliasName} capitalize />
        <DetailField label="Patient Account Number" value={patient.patientAccountNumber} />
        {/* SSN is never returned by the API (HIPAA minimum-necessary) */}
        <DetailField label="Social Security Number" value={undefined} />
        <DetailField label="Nationality" value={patient.nationality} capitalize />
        <DetailField label="Marital Status" value={patient.maritalStatus} capitalize />
        <DetailField label="Degree" value={patient.degree} capitalize />
        <DetailField label="Notes" value={patient.notes} />
      </DetailSection>

      <DetailSection title="Driving License">
        <DetailField
          label="Is driving license available"
          value={yesNo(patient.isDrivingLicenseAvailable)}
        />
      </DetailSection>

      <DetailSection title="Patient death details">
        <DetailField label="Is patient dead" value={yesNo(patient.isPatientDead)} />
        <DetailField label="Date of Death" value={patient.dateOfDeath} />
        <DetailField label="Time of Death" value={patient.timeOfDeath} />
      </DetailSection>
    </>
  );
}
