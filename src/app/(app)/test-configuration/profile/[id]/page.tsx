// FE "Profile" → BE panel.
import PanelDetail from "@/features/test-config/components/panel-detail";

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PanelDetail panelId={Number(id)} />;
}
