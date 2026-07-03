# Location feature

Frontend reflection of the backend **`location`** service
(`services/location/`). Mounted at `/location`.

## Files
`location.types.ts` · `location.api.ts` (**all 18 routes**) ·
`location.queries.ts` · `components/{location-list,location-form-dialog}.tsx`.
Page: `app/locations/page.tsx` (guarded).

## Endpoint coverage (`location.api.ts`)

| Group | Routes |
| --- | --- |
| Locations | `POST /locations` · `/locations/list` · `/locations/list-lite` · `/locations/view` · `GET/DELETE /locations/{id}` · `PUT /locations/{id}` · `PUT /locations/{id}/toggle` · `POST /locations/{id}/physicians` (+ `/bulk`) |
| location-users | `POST /location-users` · `GET/PUT/DELETE /location-users/{id}` (`locationApi.users.*`) |
| location-physicians | `POST /location-physicians` · `GET/PUT/DELETE /location-physicians/{id}` (`locationApi.physicians.*`) |

## Notes
- Create requires a **facilityId** and **labId** — the form selects these from
  `facility` / `lab` `list-lite` (cross-feature reuse).
- New locations start `status="draft"`; backend mints `internalLocationId`.
- Physicians are tracked via the `LocationPhysician` link table (not a column);
  `addPhysician` / `addPhysiciansBulk` create/reactivate rows.
- UI currently surfaces list/create/toggle/delete; edit + sub-details +
  user/physician management are follow-ups (API + most hooks already present).
