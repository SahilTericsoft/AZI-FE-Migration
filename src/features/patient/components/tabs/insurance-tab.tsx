"use client";

import { Card } from "@/components/ui/card";
import { DetailField } from "@/components/ui/detail";
import { Spinner } from "@/components/ui/spinner";

import { usePatientInsurances } from "../../patient.queries";

export default function InsuranceTab({ patientId }: { patientId: number }) {
  const { data: insurances, isLoading } = usePatientInsurances(patientId);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!insurances || insurances.length === 0) {
    return <p className="py-4 text-muted-foreground">No insurances on file.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {insurances.map((ins, index) => (
        <Card key={ins.id} className="p-6">
          <p className="mb-3 font-bold">Insurance {index + 1}</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
            <DetailField label="Insurance Company" value={ins.insuranceCompany} capitalize />
            <DetailField label="Payor ID" value={ins.payerId} />
            <DetailField label="First Name" value={ins.firstName} capitalize />
            <DetailField label="Middle Name" value={ins.middleName} capitalize />
            <DetailField label="Last Name" value={ins.lastName} capitalize />
            <DetailField label="Date Of Birth" value={ins.dateOfBirth} />
            <DetailField label="Relationship" value={ins.relationship} capitalize />
            <DetailField label="Policy Number" value={ins.policyNumber} />
            <DetailField label="Network/Plan Name" value={ins.networkPlanName} />
            <DetailField label="Effective Date" value={ins.effectiveDate} />
            <DetailField label="Group Name" value={ins.groupName} />
            <DetailField label="IPA/Medical Group Name" value={ins.ipaMedicalGroupName} />
            <DetailField label="Group/Network" value={ins.groupNetwork} />
            <DetailField label="Insurance Type" value={ins.type} capitalize />
          </div>
        </Card>
      ))}
    </div>
  );
}
