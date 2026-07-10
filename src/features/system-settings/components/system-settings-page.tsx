"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AutoTriggers from "./auto-triggers";
import DropdownControls from "./dropdown-controls";
import GeneralConfig from "./general-config";
import SampleTypesManager from "./sample-types-manager";

export default function SystemSettingsPage() {
  return (
    <div className="shadcn-scope flex flex-col gap-5 text-foreground">
      <h2 className="text-2xl font-bold">System Settings</h2>
      <Card className="p-0">
        <Tabs defaultValue="dropdowns">
          <TabsList className="w-full px-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="dropdowns">Dropdown Controls</TabsTrigger>
            <TabsTrigger value="sample-types">Sample Types</TabsTrigger>
            <TabsTrigger value="triggers">Auto Triggers</TabsTrigger>
          </TabsList>
          <div className="p-4">
            <TabsContent value="general" className="mt-0">
              <GeneralConfig />
            </TabsContent>
            <TabsContent value="dropdowns" className="mt-0">
              <DropdownControls />
            </TabsContent>
            <TabsContent value="sample-types" className="mt-0">
              <SampleTypesManager />
            </TabsContent>
            <TabsContent value="triggers" className="mt-0">
              <AutoTriggers />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
