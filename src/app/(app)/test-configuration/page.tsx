import TestConfigPage from "@/features/test-config/components/test-config-page";

export default async function TestConfigurationPage({
  searchParams,
}: {
  searchParams: Promise<{ "active-tab"?: string }>;
}) {
  const params = await searchParams;
  return <TestConfigPage initialTab={params["active-tab"]} />;
}
