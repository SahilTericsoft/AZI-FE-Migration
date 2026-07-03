import WorklistDetail from "@/features/worklist/components/worklist-detail";

export default async function WorklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorklistDetail worklistId={Number(id)} />;
}
