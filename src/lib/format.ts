/** Turn a camelCase / snake_case / kebab key into a "Title Case" label. */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Coerce an unknown JSON value to a display string (or undefined when empty). */
export function displayValue(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
