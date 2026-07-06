# Pending Frontend Items — AZI FE Migration

Tracking of remaining frontend work, derived from a module-by-module review of the
migrated app (`AZI-FE-Migration`) against the legacy app (`AI-admin-UI`) and the
migrated backend (`AZI-Migration/backend`).

**Legend**
- ⬜ not started · 🟨 partial · ✅ done (this migration effort)
- **BE?** — does the item need backend work, or is the backend already ready?
  - `FE-only` = backend endpoint already exists, just needs UI
  - `BE+FE` = backend piece is missing too
- **Priority**: 🔴 high · 🟠 medium · 🟡 low

Last reviewed: 2026-07-06.

---

## ✅ Completed this effort (for reference)
- ✅ **Sendout** — list + detail + create dialog wired to existing BE (`/sendout/batches`).
- ✅ **Patient** — gender vocabulary unified + dropdown fallbacks; Activate/Deactivate; deleted filter + Recover; Created-By name; allergy names + enum titles; CSV exports all rows. (BE 500 fixed — missing `Patients` columns migrated.)
- ✅ **Lab ↔ test/panel/biomarker assignment (BE)** — `LinkLabTests/Panels/Biomarkers` + `/lab/assignments/*` endpoints.
- ✅ **Test wizard "Assign Lab"** now persists via `/lab/assignments/tests/by-entity/{id}` (was a silent no-op).

---

## A. Modules in progress (partially migrated)

### Test Configuration 🟨
| Item | State | BE? | Priority |
|------|:----:|:----:|:----:|
| View / Detail pages for Test, Panel, Biomarker (rows not clickable) | ⬜ | FE-only (`GET /{id}`) | 🔴 |
| Edit existing Panel / Biomarker (no update UI; only `useUpdateTest` exists) | ⬜ | FE-only (`PUT /{id}`) | 🔴 |
| Edit existing Test (wizard is create-only; no `/test/[id]/edit` entry) | ⬜ | FE-only | 🔴 |
| Delete for Test / Panel / Biomarker / CPT / ICD (API has `remove`, no UI) | ⬜ | FE-only (`DELETE /{id}`) | 🟠 |
| Panel create is stubbed ("full lab wizard depends on services not yet migrated") — assign tests/biomarkers | ⬜ | FE-only (Panel has `testIds`/`biomarkerIds`) | 🟠 |
| Biomarker deep config (report config, POC config, layout, report type) — currently a small dialog | ⬜ | FE-only (fields exist on model) | 🟠 |
| CPT / ICD standalone management UI (currently only pickers) | ⬜ | FE-only (full CRUD exists) | 🟡 |
| Assign-Lab for **Panel** and **Biomarker** (test done) | ⬜ | FE-only (BE endpoints exist) | 🟠 |
| Lab detail: show/manage the tests/panels it offers (`/assignments/{kind}/by-lab/{id}`) | ⬜ | FE-only | 🟡 |
| Test / Biomarker **attachments** step | ⬜ | **BE+FE** (no attachments field/endpoint) | 🟡 |
| **Profile** tab (groups panels + tests) | ⬜ | **BE+FE** (no Profile model) | 🟡 |

### Patient 🟨
| Item | State | BE? | Priority |
|------|:----:|:----:|:----:|
| Bulk-patient **sessions / history / view** (legacy session-based workflow; only one-shot dialog exists) | ⬜ | **BE+FE** (BE bulk is synchronous, not session-tracked) | 🟠 |

### Auth 🟨
| Item | State | BE? | Priority |
|------|:----:|:----:|:----:|
| Forgot Password flow (API/types scaffolded, no page) | ⬜ | verify BE | 🟠 |
| Check-your-mail / Set-new-password / 2FA / Reset-successful screens | ⬜ | verify BE | 🟠 |

### Result 🟨
| Item | State | BE? | Priority |
|------|:----:|:----:|:----:|
| Result **Archive** view | ⬜ | verify BE | 🟡 |
| Result **Review** as a dedicated screen (currently via session detail) | 🟨 | verify BE | 🟡 |
| Result **Preview** | ⬜ | verify BE | 🟡 |

### Lab-OS 🟨
| Item | State | BE? | Priority |
|------|:----:|:----:|:----:|
| Departments · Equipment · Storage · Calculations · Reports · Forms screens (only API/type stubs) | ⬜ | verify BE | 🟠 |
| HR / Employee Documents | ⬜ | **BE+FE** | 🟡 |

---

## B. Backend-ready, FE-only surfacing (quick wins)

These have working backend endpoints (confirmed) and only need UI. Highest ROI.

- ⬜ Test / Panel / Biomarker **view + edit + delete** (Test Configuration, above).
- ⬜ **Sendout** batch **edit** (`PUT /sendout/batches/{id}` exists; detail is read-only).
- ⬜ **State Reporting** UI — list + session view (`/state-reporting` endpoints exist; no nav, no page). 🔴
- ⬜ Panel/Biomarker **assign-lab** UI (BE endpoints now exist).

---

## C. Whole modules not migrated (need BE + FE)

| Module | Legacy scope | Priority |
|--------|--------------|:----:|
| **Compliance Hub** | Forms Hub, QC Logs, Analytics, Review Files, Quality Control, Quality Assurance, HR docs, recycle bin (~15 routes) | 🔴 (largest gap) |
| **SOP & Validation** | SOP add/view, Validation add/view | 🟠 |
| **Bulk Test Order** | list + view (session-based) | 🟠 |
| **Accessioning** | accessioning list/workflow | 🟠 |
| **OCR** | OCR screen | 🟡 |
| **QR Code** | QR code list/generation | 🟡 |
| **Barcodes** | barcode management | 🟡 |
| **Signature** screen | e-signature capture | 🟡 |
| **Attachment preview** overlay | shared doc preview | 🟡 |
| Dashboard: **Sample Rejected List**, **CAPA Analytics** | dashboard sub-routes | 🟡 |
| Patient **ENB details** view | patient sub-view | 🟡 |

---

## Suggested order of attack
1. **Test Configuration view/edit/delete** — biggest FE-only win, all BE-ready. 🔴
2. **State Reporting UI** — BE ready, currently unreachable. 🔴
3. **Panel/Biomarker deep config + assign-lab UI** — BE ready. 🟠
4. **Auth password flows** — user-facing, small. 🟠
5. **Bulk-patient sessions** and **Lab-OS screens** — need BE work; scope first. 🟠
6. **Compliance Hub / SOP** — large BE+FE builds, plan as epics. 🔴/🟠
