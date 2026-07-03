import SampleProcessingDetail from "@/features/sample-processing/components/sample-processing-detail";

export default async function SampleProcessingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SampleProcessingDetail sessionId={Number(id)} />;
}
