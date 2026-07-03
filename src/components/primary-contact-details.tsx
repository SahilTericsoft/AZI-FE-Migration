import { DetailField, DetailSection } from "@/components/ui/detail";
import { displayValue, humanizeKey } from "@/lib/format";

/** Read-only view of a `primaryContactDetails` JSON blob (shape varies). */
export default function PrimaryContactDetails({
  contact,
}: {
  contact?: Record<string, unknown> | null;
}) {
  const entries = contact
    ? Object.entries(contact).filter(([, v]) => displayValue(v) !== undefined)
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
