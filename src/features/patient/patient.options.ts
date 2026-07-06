/**
 * Static value-sets for the patient enum fields.
 *
 * The backend serves these via configurable dropdowns
 * (`/user-service/static-data/dropdowns/{code}`), but they ship empty by
 * default. These constants are the fallback the UI uses when a dropdown has no
 * configured values, and — importantly — the single source of truth shared by
 * BOTH the create/edit form and the list filter, so their vocabularies always
 * agree (a mismatch silently breaks server-side filtering).
 *
 * `code` is what is stored/filtered; `title` is what the user sees.
 */

export interface PatientOption {
  code: string;
  title: string;
}

export const GENDER_OPTIONS: PatientOption[] = [
  { code: "male", title: "Male" },
  { code: "female", title: "Female" },
  { code: "other", title: "Other" },
  { code: "unknown", title: "Unknown" },
];

export const PREFIX_OPTIONS: PatientOption[] = [
  { code: "mr", title: "Mr." },
  { code: "mrs", title: "Mrs." },
  { code: "ms", title: "Ms." },
  { code: "dr", title: "Dr." },
  { code: "prof", title: "Prof." },
];

export const SUFFIX_OPTIONS: PatientOption[] = [
  { code: "jr", title: "Jr." },
  { code: "sr", title: "Sr." },
  { code: "ii", title: "II" },
  { code: "iii", title: "III" },
  { code: "iv", title: "IV" },
];

export const RACE_OPTIONS: PatientOption[] = [
  { code: "americanIndian", title: "American Indian or Alaska Native" },
  { code: "asian", title: "Asian" },
  { code: "black", title: "Black or African American" },
  { code: "pacificIslander", title: "Native Hawaiian or Pacific Islander" },
  { code: "white", title: "White" },
  { code: "other", title: "Other" },
];

export const ETHNICITY_OPTIONS: PatientOption[] = [
  { code: "hispanic", title: "Hispanic or Latino" },
  { code: "nonHispanic", title: "Not Hispanic or Latino" },
  { code: "unknown", title: "Unknown" },
];

export const MARITAL_STATUS_OPTIONS: PatientOption[] = [
  { code: "single", title: "Single" },
  { code: "married", title: "Married" },
  { code: "divorced", title: "Divorced" },
  { code: "widowed", title: "Widowed" },
  { code: "separated", title: "Separated" },
];

/** Map a dropdown code (from any of the sets above) back to its display title. */
export function optionTitle(options: PatientOption[], code?: string | null): string {
  if (!code) return "";
  return options.find((o) => o.code === code)?.title ?? code;
}
