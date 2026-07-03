/**
 * Date/time formatting for the app. Dates render as MM/DD/YYYY and times in
 * 12-hour format. Timezone follows the in-house lab — pass a tz (IANA) to pin
 * it; otherwise the viewer's local zone is used.
 */

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
};

const DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTS,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
};

function toDate(value?: string | number | Date | null): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** MM/DD/YYYY */
export function formatDate(value?: string | number | Date | null, timeZone?: string): string {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", { ...DATE_OPTS, timeZone }).format(d);
}

/** MM/DD/YYYY hh:mm AM/PM */
export function formatDateTime(value?: string | number | Date | null, timeZone?: string): string {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", { ...DATETIME_OPTS, timeZone }).format(d);
}
