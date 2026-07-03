/** System Settings — Dropdown Controls module→feature map (mirrors Test env).
 *
 * Most features are generic value sets stored in the backend Dropdown store
 * (`/static-data/dropdowns/{code}`). Two features are backed by dedicated
 * entities and rendered with a bespoke table/form:
 *   - `address`    → geo / zipcode store (`/static-data/geo`)
 *   - `department` → Departments entity (`/lab-os/departments`)
 */

export type FeatureKind = "generic" | "address" | "department";

export interface FeatureDef {
  code: string;
  title: string;
  kind?: FeatureKind;
  /** address is paginated (large set); generic sets are returned whole. */
  isPaginated?: boolean;
}

export interface ModuleDef {
  code: string;
  title: string;
  features: FeatureDef[];
}

export const SETTINGS_MODULES: ModuleDef[] = [
  {
    code: "patient",
    title: "Patient",
    features: [
      { code: "prefix", title: "Prefix" },
      { code: "suffix", title: "Suffix" },
      { code: "maritalStatus", title: "Marital Status" },
      { code: "race", title: "Race" },
      { code: "ethnicity", title: "Ethnicity" },
      { code: "relationships", title: "Relationship" },
      { code: "gender", title: "Gender" },
    ],
  },
  {
    code: "order",
    title: "Order",
    features: [
      { code: "reasonForOrderCancellation", title: "Reason For Order Cancellation" },
      { code: "resonsForSampleRejection", title: "Reason For Sample Rejection" },
      { code: "sampleTypes", title: "Sample Type" },
    ],
  },
  {
    code: "test",
    title: "Test",
    features: [
      { code: "reportTypes", title: "Report Type" },
      { code: "equipmentType", title: "Equipment Type" },
    ],
  },
  {
    code: "lab",
    title: "Lab",
    features: [
      { code: "labType", title: "Lab Type" },
      { code: "facilityType", title: "Facility Type" },
      { code: "department", title: "Department", kind: "department" },
      { code: "payorMix", title: "Payor Mix" },
    ],
  },
  {
    code: "location",
    title: "Location",
    features: [
      { code: "locationType", title: "Location Type" },
      { code: "address", title: "Address", kind: "address", isPaginated: true },
      { code: "pickupMethod", title: "Pickup Method" },
      { code: "pickupSchedule", title: "Pickup Schedule" },
      { code: "preferredDeliveryReport", title: "Preferred Delivery Report" },
    ],
  },
];

/** Report Type / Report Format options for the Department form. */
export const REPORT_TYPE_OPTIONS = [
  { code: "final", title: "Final" },
  { code: "preliminary", title: "Preliminary" },
  { code: "amended", title: "Amended" },
  { code: "supplemental", title: "Supplemental" },
];

export const REPORT_FORMAT_OPTIONS = [
  { code: "PDF", title: "PDF" },
  { code: "HL7", title: "HL7" },
  { code: "CSV", title: "CSV" },
];
