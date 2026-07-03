import { DetailField, DetailSection } from "@/components/ui/detail";
import { displayValue, humanizeKey } from "@/lib/format";

/**
 * Read-only renderer for a free-form JSON record (e.g. criticalDetails,
 * billingDetails, accountPreferences). Renders scalar fields as DetailFields,
 * one level of nested objects as their own sub-sections, and arrays as a list.
 */
export default function JsonDetail({
  data,
  title,
  emptyText = "No details added.",
}: {
  data?: Record<string, unknown> | null;
  title?: string;
  emptyText?: string;
}) {
  const entries = data ? Object.entries(data) : [];
  const scalars = entries.filter(([, v]) => v === null || typeof v !== "object");
  const objects = entries.filter(([, v]) => v !== null && typeof v === "object" && !Array.isArray(v));
  const arrays = entries.filter(([, v]) => Array.isArray(v)) as [string, unknown[]][];

  if (entries.length === 0) {
    return <p className="py-4 text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-4">
      {scalars.length > 0 && (
        <DetailSection title={title ?? "Details"}>
          {scalars.map(([k, v]) => (
            <DetailField key={k} label={humanizeKey(k)} value={displayValue(v)} />
          ))}
        </DetailSection>
      )}
      {objects.map(([k, v]) => (
        <DetailSection key={k} title={humanizeKey(k)}>
          {Object.entries(v as Record<string, unknown>).map(([ik, iv]) => (
            <DetailField key={ik} label={humanizeKey(ik)} value={displayValue(iv)} />
          ))}
        </DetailSection>
      ))}
      {arrays.map(([k, list]) => (
        <div key={k}>
          <h3 className="mb-2 text-base font-bold">{humanizeKey(k)}</h3>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">None</p>
          ) : (
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {list.map((item, i) => (
                <li key={i}>
                  {typeof item === "object" && item !== null
                    ? Object.entries(item as Record<string, unknown>)
                        .map(([ik, iv]) => `${humanizeKey(ik)}: ${displayValue(iv) ?? "—"}`)
                        .join(", ")
                    : String(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
