# Patient feature (PHI)

Frontend reflection of the backend **`patient`** service (`services/patient/`,
PHI — requires a bearer token, which the core client attaches). Mounted at
`/patient`.

## Files
`patient.types.ts` · `patient.api.ts` (**all 18 routes**) · `patient.queries.ts` ·
`components/patient-list.tsx` · `components/patient-form-dialog.tsx` ·
`components/patient-detail.tsx` + `components/tabs/*` + `components/detail-field.tsx`.
Pages: list `src/app/(app)/patient/page.tsx`, detail `src/app/(app)/patient/[id]/page.tsx`.

## Detail page (tabbed — mirrors the live app)
List "View" → `/patient/{id}` → `patient-detail.tsx`: an overview header
(name/status/ID/created-by/timestamp/Delete/Back) + 5 tabs:
**Basic Details · Additional Details** (from the patient record) · **Insurance**
(`usePatientInsurances`) · **Order History** (`@/features/test-order`
`useOrdersByPatient`) · **Activity Logs** (`@/features/activity-log`
`useActivityLogs` by `identityId`). This tabbed-page pattern is the template for
every module's detail view.

## Endpoint coverage (`patient.api.ts`)

| Group | Routes |
| --- | --- |
| Patients | `POST /patients` · `/patients/list` · `/patients/validate` · `GET /patients/{id}` · `PUT /patients/{id}` · `PUT /patients/{id}/toggle` · `PUT /patients/{id}/recover` · `DELETE /patients/{id}` (soft) |
| patient-insurances | `POST` · `GET /by-patient/{id}` · `GET/PUT/DELETE /{id}` (`patientApi.insurances.*`) |
| allergies | `POST` · `POST /list` · `GET/PUT/DELETE /{id}` (`patientApi.allergies.*`) |

## Notes
- Create needs `firstName`, `lastName`, `dateOfBirth`; backend builds a dedup
  `code` and returns the existing patient if it already exists.
- `ssn` / `password` / `drivingLicenseNumber` are never returned (HIPAA).
- The list table shows Name / DOB / Phone / status / **View**. The live app's
  **Added by**, **Linked Locations**, **Linked Facilities** columns need
  cross-service data (users + test-order links) not in the patient list response —
  deferred until those services are wired (would map `createdBy`→user name and
  pull linked locations/facilities from orders).
- View opens a detail drawer (demographics + insurances). Edit / insurance &
  allergy management UIs are follow-ups (API + hooks already present).
