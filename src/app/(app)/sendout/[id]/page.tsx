import SendoutDetail from "@/features/sendout/components/sendout-detail";

export default async function SendoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SendoutDetail batchId={Number(id)} />;
}
