/**
 * Static option sets for the Test/Panel configuration wizard.
 *
 * In the old FE these came from hardcoded arrays (Resulting Mode, Category) and
 * `/staticData/types/*` lookups (Report Type, Sample Type, Collection Device).
 * They are small, stable enums, so we keep them here rather than add backend
 * endpoints just to serve constants.
 */

export interface Option {
  title: string;
  code: string;
}

/** Report Type drives the available categories (Qualitative vs Quantitative). */
export const REPORT_FORMATS: Option[] = [
  { title: "Qualitative", code: "Qualitative" },
  { title: "Quantitative", code: "Quantitative" },
];

/** Test/Panel Category (legacy `biomarkerTestCategory`). */
export const TEST_CATEGORIES: Option[] = [
  { title: "General", code: "General" },
  { title: "Manual (POC)", code: "POC" },
];

/** Resulting Mode (legacy `testResultingMode`). */
export const RESULTING_MODES: Option[] = [
  { title: "Manual Upload / System Generated", code: "manual upload" },
  { title: "No Report", code: "No Report" },
];

/** Reporting schedule, used when State Reporting is enabled. */
export const REPORTING_SCHEDULES: Option[] = [
  { title: "Everyday (24 hrs)", code: "daily" },
  { title: "Every Month (month-end)", code: "monthly" },
];

export const SAMPLE_TYPES: Option[] = [
  { title: "Blood", code: "blood" },
  { title: "Serum", code: "serum" },
  { title: "Plasma", code: "plasma" },
  { title: "Urine", code: "urine" },
  { title: "Saliva", code: "saliva" },
  { title: "Nasal Swab", code: "nasal swab" },
  { title: "Nasopharyngeal Swab", code: "nasopharyngeal swab" },
  { title: "Oropharyngeal Swab", code: "oropharyngeal swab" },
  { title: "Wound Swab", code: "wound swab" },
  { title: "Stool", code: "stool" },
  { title: "Tissue", code: "tissue" },
  { title: "Sputum", code: "sputum" },
];

export const SAMPLE_COLLECTION_DEVICES: Option[] = [
  { title: "Swab", code: "swab" },
  { title: "Vacutainer (EDTA)", code: "vacutainer edta" },
  { title: "Vacutainer (SST)", code: "vacutainer sst" },
  { title: "Urine Cup", code: "urine cup" },
  { title: "Viral Transport Medium", code: "vtm" },
  { title: "Saliva Collection Kit", code: "saliva kit" },
  { title: "Stool Container", code: "stool container" },
];

/** Category options applicable for a given report format (legacy helper). */
export const categoriesForReportFormat = (reportFormat?: string): Option[] =>
  reportFormat === "Quantitative"
    ? TEST_CATEGORIES.filter((c) => c.code === "General")
    : TEST_CATEGORIES;
