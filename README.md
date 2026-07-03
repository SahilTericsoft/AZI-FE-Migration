# AZI Admin UI — Next.js (migrated frontend)

Migration of the old `AI-admin-UI-alturos-aca` (React 18 + Vite + Redux-saga +
axios) to **Next.js**, mirroring the migrated backend monorepo
(`AZI-Migration/backend`, FastAPI). Same philosophy: **self-contained domain
modules over a small shared core.**

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 18 + TypeScript |
| UI | MUI v5 + Emotion + SCSS (matches old FE → minimal component rewrite) |
| Server state | React Query (`@tanstack/react-query`) |
| HTTP | axios (single client in `src/core/api/client.ts`) |

> React is pinned to 18 (MUI v5's supported major), matching the old FE.

## Structure

```
src/
├── app/            Next App Router — layout, providers, routes
├── config/         env access (core/config.py analogue)
├── core/           shared machinery used by every feature
│   ├── api/        client (axios + JWT + {message,data} envelope), types, endpoints
│   ├── auth/       JWT token storage (SSR-safe)
│   ├── query/      React Query client factory
│   └── resource/   createResourceApi + createResourceQueries (BaseController analogue)
├── theme/          MUI theme (ported brand palette)
└── features/       one module per backend domain — see features/README.md
```

## Backend contract

- Base URL: `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`).
- Success: `{ message, data }`; lists: `{ page, limit, docs, total }`.
- Errors: FastAPI `{ detail }`; validation → `422` (mapped to `fieldErrors`).
- Each service is mounted under a prefix (`/user-service`, `/facility`, …) — see
  `src/core/api/endpoints.ts`.

## Develop

```bash
npm install
cp .env.example .env.local      # point NEXT_PUBLIC_API_BASE_URL at the backend
npm run dev                     # http://localhost:3000
npm run build                   # production build (also type-checks)
```

## Migration status

- [x] Scaffold + `core/` layer (api client, auth, React Query, resource helpers, theme)
- [x] `auth` feature (user-service/auth) — login, session (`AuthProvider`/`useAuth`), `RequireAuth` guard → `/login`
- [x] `facility` feature — list/search/paginate, create, toggle, delete → `/facilities` (guarded)
- [x] `location` feature — full API coverage (18 routes) + list/create UI (shows parent Facility Name) → `/location`
- [x] `lab` feature — full API coverage (14 routes) + list/create UI → `/lab`
- [x] `patient` feature (PHI) — full API coverage (18 routes) + list/create/view-drawer → `/patient`
- [ ] remaining catalog/admin domains (test-config, users/ACL, …)
- [ ] remaining PHI domains (test-order, sample, …)

> End-to-end (login + facility CRUD) needs the backend running with a seeded
> user. Set `NEXT_PUBLIC_API_BASE_URL`, then `npm run dev`.
