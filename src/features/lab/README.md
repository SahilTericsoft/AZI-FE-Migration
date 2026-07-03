# Lab feature

Frontend reflection of the backend **`lab`** service (`services/lab/`).
Mounted at `/lab`.

## Files
`lab.types.ts` · `lab.api.ts` (**all 14 routes**) · `lab.queries.ts` ·
`components/{lab-list,lab-form-dialog}.tsx`. Page: `app/labs/page.tsx` (guarded).

## Endpoint coverage (`lab.api.ts`)

| Group | Routes |
| --- | --- |
| Labs | `POST /labs` · `/labs/list` · `/labs/list-lite` · `/labs/view` · `GET /labs/by-admin/{adminId}` · `GET/DELETE /labs/{id}` · `PUT /labs/{id}` · `PUT /labs/{id}/toggle` |
| lab-users | `POST /lab-users` · `GET /lab-users/by-lab/{labId}` · `GET/PUT/DELETE /lab-users/{id}` (`labApi.users.*`) |

## Notes
- `labRole` is one of `sendLab` / `receiveLab` / `sendReceiveLab` (select in the
  form). `labType="externalLab"` ⇒ backend sets `isSdiLab=false`; blank ⇒ in-house.
- `code` = lowercased name; new labs start `status="draft"`, `isActive=false`.
- Lab-user hooks (`useLabUsers`, `useAddLabUser`, `useRemoveLabUser`) exist for
  the lab-detail screen (follow-up). View/edit/by-admin screens are follow-ups.
