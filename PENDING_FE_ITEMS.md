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
- ✅ **Test Configuration §A** — detail pages + edit + delete + assign-lab for all three tabs; rows clickable + row actions; CPT/ICD CRUD hooks; **tabs relabeled to product naming (see mapping below).**

---

> ### ⚠️ Test Configuration naming (product ≠ backend)
> The visible tab names do **not** match the backend entity names. Everything is
> wired to the correct backend endpoint; only the labels/routes use FE names:
>
> | FE tab | Backend entity | List component | Detail route | Create |
> |--------|----------------|----------------|--------------|--------|
> | **Test** | `biomarker` | `biomarker-tab` | `/test-configuration/test/[id]` → `BiomarkerDetail` | dialog |
> | **Panel** | `test` | `test-tab` | `/test-configuration/panel/[id]` → `TestDetail` | wizard `/panel/new` |
> | **Profile** | `panel` | `panel-tab` | `/test-configuration/profile/[id]` → `PanelDetail` | dialog |
>
> Only 3 tabs (Biomarker/Instrument tabs removed). `AssignLabCard` still passes
> the **backend** `kind` (`biomarkers`/`tests`/`panels`).

> ### Test Configuration — legacy-parity rebuild COMPLETE (2026-07-07)
> - **Test tab (BE biomarker)** — ✅ list chrome (filters/CSV/column-prefs/toggle-confirm); 4-step wizard (Basic Details → Report Configuration deep builder → Report Type → Assign Lab, draft-resume); detail view/edit (all fields + config view/edit + report type + assign lab); delete.
> - **Panel tab (BE test)** — ✅ list chrome; **7-step wizard** (Basic Details → Report Type → ICD Code → CPT Code → Configuration → Assign Lab → Attachments); detail view/edit with Basic/Report Config/ICD-CPT/Assigned Labs/**Attachments** tabs; delete.
> - **Profile tab (BE panel)** — ✅ list chrome; create dialog (Panels + Tests); detail view/edit (Panels/Tests/Assigned Labs); delete. (Migrated uses a detail page instead of the legacy drawer.)
> - **Backend (AZI-Migration)** — ✅ `static-data` endpoints; ✅ `BiomarkerReportConfigurations` table + `/biomarkers/{id}/configurations` CRUD; ✅ `sampleTypes` catalog filter; ✅ `Tests.attachments` + `/tests/{id}/attachments` upload/remove.
>
> **Backend DB actions before testing:**
> 1. `python -m scripts.init_db` — creates `BiomarkerReportConfigurations` table.
> 2. `psql "$DATABASE_URL" -f migrations/pending_migrations.sql` — adds `Tests.attachments`.
> 3. Attachment uploads need `AZURE_STORAGE_CONNECTION_STRING` set (else 503, same as lab attachments).

## A. Modules in progress (partially migrated)

### Test Configuration 🟨
| Item | State | BE? | Priority |
|------|:----:|:----:|:----:|
| View / Detail pages for Test, Panel, Profile (rows clickable + row actions) | ✅ | FE-only (`GET /{id}`) | 🔴 |
| Edit existing Test / Panel / Profile (edit dialogs) | ✅ | FE-only (`PUT /{id}`) | 🔴 |
| Delete for Test / Panel / Profile (list row action + detail page) | ✅ | FE-only (`DELETE /{id}`) | 🟠 |
| Assign-Lab for **Test (=biomarker)** and **Profile-panels (=panel)** — shared `AssignLabCard` | ✅ | FE-only (BE endpoints exist) | 🟠 |
| Profile tab (BE `panel`) now real — was a placeholder; lists + edits panels | ✅ | FE-only | 🟡 |
| Profile create — assign Panels (BE `testIds`) + Tests (BE `biomarkerIds`); create dialog only sets panels, edit sets both | 🟨 | FE-only | 🟠 |
| Biomarker (=FE Test) deep config (POC config, layout, report type) — edit covers report format only | 🟨 | FE-only (fields exist on model) | 🟠 |
| CPT / ICD standalone management UI — CRUD hooks + `code-tab.tsx` built, **not surfaced** (3-tab request) | 🟨 | FE-only (full CRUD exists) | 🟡 |
| Lab detail: show/manage the tests/panels it offers (`/assignments/{kind}/by-lab/{id}`) | ⬜ | FE-only | 🟡 |
| Test / Biomarker **attachments** step | ⬜ | **BE+FE** (no attachments field/endpoint) | 🟡 |

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
