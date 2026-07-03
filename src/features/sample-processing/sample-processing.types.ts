/**
 * Sample Processing types — faithful to the legacy `sample-processing.model.ts`.
 * A processing session is persisted as a lab-os LabSession; all plate state
 * lives in `sample_config` so no backend service is required.
 */

export type ProcessingTypeCode = "Extraction" | "Extractionless" | "PCR Processing" | "General";

export const PROCESSING_TYPES: { code: ProcessingTypeCode; title: string }[] = [
  { code: "Extraction", title: "Extraction" },
  { code: "Extractionless", title: "Extractionless" },
  { code: "PCR Processing", title: "PCR Processing" },
  { code: "General", title: "General" },
];

export const PLATE_TYPES: { code: string; title: string; rows: number | null; columns: number | null; isCustom: boolean }[] = [
  { code: "96-well", title: "96-well (8 × 12)", rows: 8, columns: 12, isCustom: false },
  { code: "384-well", title: "384-well (16 × 24)", rows: 16, columns: 24, isCustom: false },
  { code: "custom", title: "Custom", rows: null, columns: null, isCustom: true },
];

export interface CellValue {
  type: "samples" | "controls";
  value: string; // barcode for samples, control name for controls
  testOrPanelId?: number;
  testOrPanelType?: "biomarker" | "test";
}

export type CellData = Record<string, CellValue>; // key: "row-col" (0-based)

export interface ProcessingSample {
  id: number;
  barcode: string;
  code?: string | null;
  panel?: string | null;
  patient?: string | null;
}

/** Everything stored on the LabSession.sample_config for a processing session. */
export interface ProcessingConfig {
  kind: "processing";
  name?: string;
  department?: string;
  processingType?: ProcessingTypeCode;
  plateId?: string;
  comments?: string;
  worklistIds?: number[];
  subListIds?: number[];
  plateType?: string;
  rows?: number | null;
  columns?: number | null;
  cells?: CellData;
  samples?: ProcessingSample[];
  testPanelCodes?: string[];
  /** Set when the plate was provided via file upload instead of manual config. */
  uploadFileDetails?: { title: string } | null;
  /** PCR: existing plate(s) selected for reuse at session creation. */
  existingPlateDetails?: { id: number; plateId: string; cells?: CellData }[];
}

/** Column label helpers: row 0 -> "A", etc. */
export const rowLabel = (i: number): string => {
  let s = "";
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};
export const cellKey = (r: number, c: number) => `${r}-${c}`;
