"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";

import { useBiomarkerOptions, useUpdateTest } from "../test-config.queries";
import type { Test } from "../test-config.types";
import ReportTypeDesigner, {
  reportLayoutFromDetails,
  type ReportLayoutValue,
} from "./report-type-designer";

/** Report Type tab for a FE "Panel" (BE test) detail — layout designer + save. */
export default function PanelReportType({ test }: { test: Test }) {
  const { data: biomarkerOptions = [] } = useBiomarkerOptions();
  const [value, setValue] = useState<ReportLayoutValue>(() =>
    reportLayoutFromDetails(test.testLayoutDetails),
  );
  const update = useUpdateTest();

  const testOptions = useMemo(() => {
    const nameOf = new Map<number, string>();
    biomarkerOptions.forEach((b) => nameOf.set(b.id, b.name ?? b.code ?? `#${b.id}`));
    return (test.biomarkerIds ?? []).map((id) => ({ id, label: nameOf.get(id) ?? `#${id}` }));
  }, [biomarkerOptions, test.biomarkerIds]);

  const save = () =>
    update.mutate(
      {
        id: test.id,
        body: {
          testLayoutDetails: [
            {
              layout: value.layout,
              disclaimer: value.disclaimer,
              footNote: value.footNote,
              blocks: value.blocks,
            },
          ],
        },
      },
      {
        onSuccess: () => toast.success("Report type saved."),
        onError: (e) => toast.error(e?.message ?? "Could not save report type."),
      },
    );

  return (
    <div className="flex flex-col gap-5">
      <ReportTypeDesigner
        value={value}
        onChange={setValue}
        testOptions={testOptions}
        testName={test.name ?? undefined}
      />
      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={save} disabled={update.isPending} className="gap-1.5">
          {update.isPending && <Spinner className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
