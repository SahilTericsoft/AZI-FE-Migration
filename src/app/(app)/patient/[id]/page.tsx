import PatientDetail from "@/features/patient/components/patient-detail";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientDetail patientId={Number(id)} />;
}
