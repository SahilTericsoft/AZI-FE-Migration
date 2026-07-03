import ResultSessionDetail from "@/features/result/components/result-session-detail";

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResultSessionDetail sessionId={Number(id)} />;
}
