/** Human-readable labels for lab enum codes. */

function titleCaseFromCamel(s: string): string {
  const spaced = s.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function labTypeLabel(type?: string | null): string | undefined {
  if (!type) return undefined;
  const map: Record<string, string> = {
    externalLab: "External Lab",
    inHouseLab: "In-House Lab",
  };
  return map[type] ?? titleCaseFromCamel(type);
}

export function labRoleLabel(role?: string | null): string | undefined {
  if (!role) return undefined;
  // Mapping confirmed against the live app's "Select Lab Functionality" flow:
  // Reference Lab → sendLab, Client Lab → receiveLab, Reference-Client → sendReceiveLab.
  const map: Record<string, string> = {
    sendLab: "Reference Lab",
    receiveLab: "Client Lab",
    sendReceiveLab: "Reference-Client Lab",
  };
  return map[role] ?? titleCaseFromCamel(role);
}
