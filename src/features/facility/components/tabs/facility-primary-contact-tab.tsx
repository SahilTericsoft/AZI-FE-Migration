import { DetailField, DetailSection } from "@/components/ui/detail";
import { displayValue, humanizeKey } from "@/lib/format";

import type { Facility } from "../../facility.types";

export default function FacilityPrimaryContactTab({ facility }: { facility: Facility }) {
  const pc = (facility.primaryContactDetails ?? undefined) as Record<string, unknown> | undefined;
  const entries = pc
    ? Object.entries(pc).filter(([, v]) => displayValue(v) !== undefined)
    : [];

  if (entries.length === 0) {
    return <p className="py-4 text-muted-foreground">No primary contact added.</p>;
  }

  return (
    <DetailSection title="Primary Contact">
      {entries.map(([key, value]) => (
        <DetailField key={key} label={humanizeKey(key)} value={displayValue(value)} />
      ))}
    </DetailSection>
  );
}
