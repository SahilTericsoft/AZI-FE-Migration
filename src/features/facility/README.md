# Facility feature

Frontend reflection of the backend **`facility`** service
(`services/facility/`). Mounted at `/facility`, entity nested under
`/facility/facilities`.

## Files

| File | Role | Backend mirror |
| --- | --- | --- |
| `facility.types.ts` | Facility + request/query types | `models.py` + `schemas.py` |
| `facility.api.ts` | one function per route (CRUD via `createResourceApi` + bespoke) | `router.py` |
| `facility.queries.ts` | React Query hooks (list/detail/create/update/toggle/delete) | `controller.py` |
| `components/facility-list.tsx` | search + paginated table + toggle + delete | — |
| `components/facility-form-dialog.tsx` | create dialog | — |

Page: `app/facilities/page.tsx` (wrapped in `<RequireAuth>`).

## Endpoint map

| Action | Backend | Notes |
| --- | --- | --- |
| List | `POST /facility/facilities/list` | rich filters; paginated `{docs,total,…}` + `statusObj` |
| List-lite | `POST /facility/facilities/list-lite` | array, for dropdowns |
| View | `POST /facility/facilities/view` | by id/adminId; optional sub-details |
| Get | `GET /facility/facilities/{id}` | |
| Create | `POST /facility/facilities` | `{name, type, addressDetails, loginUserId}` |
| Update | `PUT /facility/facilities/{id}` | appends physicians |
| Toggle | `PUT /facility/facilities/{id}/toggle` | cascades to completed locations |
| Delete | `DELETE /facility/facilities/{id}` | soft delete |
| Physicians | `POST` / `DELETE .../{id}/physicians[/{pid}]` | link / unlink |
| Admin | `PUT /facility/facilities/{id}/admin` | set admin |

## Notes / deferred

- New facilities start `status="draft"`, `isActive=false` (backend default).
- `type` is free text here pending the static-data service migration (the old FE
  populated it from `FACILITY_TYPES_LIST`).
- Edit form, view/detail drawer with sub-details, and physician/admin management
  UIs are follow-ups — the API + hooks for them already exist in this module.
