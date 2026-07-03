import InstrumentDetail from "@/features/instrument/components/instrument-detail";

export default async function InstrumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstrumentDetail instrumentId={Number(id)} />;
}
