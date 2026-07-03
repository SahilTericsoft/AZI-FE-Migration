# Features — one self-contained module per backend domain

This mirrors the backend monorepo: each backend service (`services/<name>/`) gets
a matching frontend feature module here. A backend service is **models · schemas
· controller · router**; a feature module is its frontend reflection.

## Anatomy

```
features/<domain>/
├── <domain>.types.ts     ← backend models.py + schemas.py  (TS interfaces)
├── <domain>.api.ts       ← backend router.py               (typed endpoint calls)
├── <domain>.queries.ts   ← backend controller.py           (React Query hooks)
├── components/           ← UI for this domain
├── README.md             ← what it contains + old→new endpoint map
```

- **`.types.ts`** — request/response shapes. Field names stay **camelCase** to
  match the backend, so most old-FE `*.model.ts` interfaces port over directly.
- **`.api.ts`** — for the standard CRUD surface use
  `createResourceApi("<service>/<entity>")` from `@/core/resource`; add bespoke
  calls (toggle, list-lite, view-by-body, sub-resources) with `http` from
  `@/core/api/client`, one function per backend route.
- **`.queries.ts`** — `createResourceQueries(key, api)` from `@/core/resource`
  gives `useList / useDetail / useCreate / useUpdate / useRemove`; add custom
  hooks for the bespoke calls.

## Backend → frontend mapping

| Backend file (`services/<name>/`) | Frontend file (`features/<domain>/`) |
| --- | --- |
| `models.py` / `schemas.py` | `<domain>.types.ts` |
| `router.py` | `<domain>.api.ts` |
| `controller.py` (logic) | `<domain>.queries.ts` (hooks) |
| `core/` (db, api, security) | `@/core` (client, query, auth, resource) |
| `services/<name>/README.md` | `features/<domain>/README.md` |

## Service prefixes

Defined once in `@/core/api/endpoints.ts` (`SERVICE`, `USER_SERVICE`). Compose
paths from these — never hard-code base URLs.

## Migration order (suggested)

Start with **auth** (`user-service/auth`) — small, self-contained, everything
depends on it — then layer on the catalog/admin domains (facility, location,
lab, test-config…) and finally the PHI domains (patient, test-order, sample).
