"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import BiomarkerTab from "./biomarker-tab";
import PanelTab from "./panel-tab";
import TestTab from "./test-tab";

/**
 * Test Configuration. The visible names are the product/legacy names, which do
 * NOT match the backend entity names:
 *   FE "Test"    → BE `biomarker`   (BiomarkerTab)
 *   FE "Panel"   → BE `test`        (TestTab)
 *   FE "Profile" → BE `panel`       (PanelTab)
 */
const TABS = [
  { key: "test", label: "Test" },
  { key: "panel", label: "Panel" },
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
            {/* FE "Test" → BE biomarkers */}
            <TabsContent value="test" className="mt-0">
              <BiomarkerTab />
            </TabsContent>
            {/* FE "Panel" → BE tests */}
            <TabsContent value="panel" className="mt-0">
              <TestTab />
            </TabsContent>
            {/* FE "Profile" → BE panels */}
            <TabsContent value="profile" className="mt-0">
              <PanelTab />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
