"use client";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import BiomarkerTab from "./biomarker-tab";
import InstrumentTab from "./instrument-tab";
import PanelTab from "./panel-tab";
import TestTab from "./test-tab";

const TABS = [
  { key: "test", label: "Test" },
  { key: "panel", label: "Panel" },
  { key: "biomarker", label: "Biomarker" },
  { key: "instrument", label: "Instrument" },
  { key: "profile", label: "Profile" },
];

export default function TestConfigPage({ initialTab }: { initialTab?: string }) {
  const start = TABS.find((t) => t.key === initialTab)?.key ?? "test";

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <h2 className="text-2xl font-bold">Test Configuration</h2>

      <Card className="p-0">
        <Tabs defaultValue={start}>
          <TabsList className="w-full px-2">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="p-6">
            <TabsContent value="test" className="mt-0">
              <TestTab />
            </TabsContent>
            <TabsContent value="panel" className="mt-0">
              <PanelTab />
            </TabsContent>
            <TabsContent value="biomarker" className="mt-0">
              <BiomarkerTab />
            </TabsContent>
            <TabsContent value="instrument" className="mt-0">
              <InstrumentTab />
            </TabsContent>
            <TabsContent value="profile" className="mt-0">
              <ProfileTab />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <strong>Profiles are not yet available in the migrated backend.</strong> In the
        live app a Profile groups one or more Panels and Tests, but the migrated{" "}
        <code>test_config</code> service only exposes Tests, Panels and Biomarkers — there
        is no Profile model or API yet. This tab is a placeholder until a Profile service
        is added to the backend.
      </Alert>
      <p className="text-sm text-muted-foreground">
        Once the backend exposes a Profile resource, this tab will list Profiles (Profile
        ID, Profile Name, Panel(s), Test(s), Status) and feed the Test Order dropdown the
        same way Panels and Tests do.
      </p>
    </div>
  );
}
