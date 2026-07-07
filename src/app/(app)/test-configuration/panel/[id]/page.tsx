// FE "Panel" → BE test.
import TestDetail from "@/features/test-config/components/test-detail";

export default async function PanelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TestDetail testId={Number(id)} />;
}
