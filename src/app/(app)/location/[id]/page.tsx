import LocationDetail from "@/features/location/components/location-detail";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocationDetail locationId={Number(id)} />;
}
