import FacilityDetail from "@/features/facility/components/facility-detail";

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FacilityDetail facilityId={Number(id)} />;
}
