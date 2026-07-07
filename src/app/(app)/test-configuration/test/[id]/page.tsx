// FE "Test" → BE biomarker.
import BiomarkerDetail from "@/features/test-config/components/biomarker-detail";

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BiomarkerDetail biomarkerId={Number(id)} />;
}
