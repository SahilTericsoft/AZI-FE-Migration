import LabDetail from "@/features/lab/components/lab-detail";

export default async function LabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LabDetail labId={Number(id)} />;
}
