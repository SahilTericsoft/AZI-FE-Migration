# AZI Admin UI — Knowledge Transfer

A simple, practical guide to understanding this codebase.

---

## 1. What this is

A **Next.js admin dashboard** for a lab/healthcare platform (AdvanzInnovation).
It is a **rewrite of an old React 18 + Vite + Redux-saga app**, talking to a
**FastAPI backend monorepo**. The frontend mirrors the backend: every backend
service has a matching frontend "feature" folder.

---

## 2. Tech stack (what's actually used)

| Concern         | Choice                                                     |
| --------------- | ---------------------------------------------------------- |
| Framework       | Next.js 15 (App Router) + React 18 + TypeScript            |
| UI components   | **Radix UI + shadcn/ui + Tailwind CSS** (`src/components/ui/`) |
| Server data     | **React Query** (`@tanstack/react-query`)                  |
| HTTP            | **axios** — one shared client                              |
| Auth            | JWT bearer token in `localStorage`                         |
| Deploy          | Docker → **Fly.io**, auto-deploy on push to `main`         |

> ⚠️ **README is out of date**: it mentions "MUI + Emotion + SCSS." The code
> actually uses Tailwind + shadcn/Radix. There is no MUI in `package.json`.
> Trust the code.

### Full list of technologies (from `package.json`)

**Core framework & language**

| Package                    | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `next` (15.5)              | React framework — App Router, routing, SSR, proxy   |
| `react` / `react-dom` (18) | UI library (pinned to v18)                          |
| `typescript` (5)           | Static typing                                       |

**UI & styling**

| Package                          | Purpose                                                |
| -------------------------------- | ------------------------------------------------------ |
| `@radix-ui/react-*`              | Headless, accessible UI primitives (dialog, select, tabs, popover, dropdown, tooltip, accordion, checkbox, radio, switch, avatar, separator, slot) — the base for the shadcn components |
| `tailwindcss` + `tailwindcss-animate` | Utility-first CSS styling and animations          |
| `class-variance-authority`       | Typed component style variants (shadcn pattern)        |
| `clsx` + `tailwind-merge`        | Conditional + conflict-safe className merging (`cn()`) |
| `lucide-react`                   | Icon set                                               |
| `sonner`                         | Toast notifications                                    |
| `recharts`                       | Charts / data visualization (dashboard)                |
| `react-day-picker` + `date-fns`  | Date picker and date formatting/manipulation           |
| `sass`                           | SCSS support (`globals.scss`)                          |
| `postcss` + `autoprefixer`       | CSS build pipeline                                     |

**Data & networking**

| Package                          | Purpose                                                |
| -------------------------------- | ------------------------------------------------------ |
| `@tanstack/react-query`          | Server-state management (fetching, caching, mutations) |
| `@tanstack/react-query-devtools` | Dev-only query inspector                               |
| `axios`                          | HTTP client (single instance in `core/api/client.ts`)  |

**Other**

| Package    | Purpose                                    |
| ---------- | ------------------------------------------ |
| `jspdf`    | Client-side PDF generation                 |
| `eslint` + `eslint-config-next` | Linting                       |

---

## 3. Folder map

```
src/
├── app/          → routes (App Router). Thin pages that render a feature component
├── core/         → the shared engine (reused by every feature)
├── config/       → env.ts (reads NEXT_PUBLIC_API_BASE_URL)
├── lib/          → tiny helpers (cn, datetime, format)
├── components/
│   ├── ui/       → shadcn primitives (button, table, dialog, …)
│   └── layout/   → app-shell (sidebar/header) + nav-config
└── features/     → 21 domain modules (facility, lab, patient, …) — the real app
```

---

## 4. The core layer (learn this once, it powers everything)

Located in `src/core/`:

- **`api/client.ts`** — the single axios instance (`http`). Auto-attaches the
  JWT, unwraps the backend's `{ message, data }` envelope, normalizes errors,
  and on **401 clears the token and bounces to `/login`**.
- **`api/endpoints.ts`** — just the **service prefixes** (`/facility`,
  `/patient`, …). Features build their own paths from these; no hard-coded URLs.
- **`api/types.ts`** — the backend contract: `ApiResponse<T>` = `{ message, data }`,
  `Paginated<T>` = `{ page, limit, docs, total }`.
- **`resource/createResourceApi.ts`** — factory giving standard CRUD verbs for an
  entity (`list/get/create/update/remove`).
- **`resource/createResourceQueries.ts`** — factory giving standard React Query
  hooks (`useList/useDetail/useCreate/useUpdate/useRemove`) with automatic cache
  invalidation.
- **`auth/token.ts`** — SSR-safe JWT storage helpers.
- **`query/queryClient.ts`** — React Query config (1-min stale time, no retry on 4xx).

---

## 5. The feature module pattern (the recipe that repeats 21 times)

Every folder in `src/features/` follows the **same 4-part shape**, each part
mirroring a backend file:

```
features/<domain>/
├── <domain>.types.ts     ← backend models/schemas  (TS interfaces, camelCase)
├── <domain>.api.ts       ← backend router.py        (typed endpoint calls)
├── <domain>.queries.ts   ← backend controller.py    (React Query hooks)
└── components/           ← the UI (list, create wizard, detail, tabs)
```

**How it works** (using `facility` as the reference example):

- `.api.ts` — reuses `createResourceApi(base)` for standard CRUD, then
  hand-writes bespoke routes (`toggle`, `listLite`, `addPhysicians`,
  `npiLookup`) with `http` directly.
- `.queries.ts` — wraps those calls in React Query hooks (`useFacilityList`,
  `useToggleFacility`, …) with cache invalidation.
- `components/` — the actual screens (e.g. `facility-list.tsx`).

Once you understand `facility`, you understand all 21 features — they are
variations on this template.

---

## 6. Routing & the app shell

- Routes live in `src/app/` as **thin pages** — most just do `return <FeatureList />`.
- `/` redirects to `/dashboard` (`app/page.tsx`).
- The `(app)` **route group** (`app/(app)/layout.tsx`) wraps every authenticated
  page in three guards:

  ```
  RequireAuth → AppShell (sidebar+header) → RequirePermission → page
  ```

- `/login` is outside that group (no shell, no guard).
- A typical entity has 3 routes: `page.tsx` (list), `new/page.tsx` (create),
  `[id]/page.tsx` (detail/edit).

---

## 7. Auth & permissions (ACL) flow

Driven by `features/auth/auth-context.tsx`:

1. **Login** → backend returns `user + token + access modules`. Token stored in
   localStorage.
2. On refresh, the app re-hydrates the session from the token via
   `/auth/check-login`.
3. The user's granted **feature codes** (e.g. `facilityList`) are flattened into
   a permission set.
4. **`canAccess(code)`** gates both the sidebar item and the route.
   `superAdmin` bypasses everything.
5. **`components/layout/nav-config.tsx`** is the single source of truth: it maps
   each nav item to its route + ACL code. `RequirePermission` and the sidebar
   both read from it, so visibility and access never drift apart.

---

## 8. A request's journey (end-to-end)

```
Component calls useFacilityList()
  → React Query hook → facilityApi.list()
  → http.post('/facility/facilities/list')  [axios, adds JWT]
  → (in prod) same-origin /api/backend/* → Next rewrites → FastAPI
  → response { message, data } unwrapped → data cached by React Query → UI
```

The **same-origin proxy** (`next.config.ts` rewrites) means the browser never
calls the backend directly — this avoids CORS. In prod,
`NEXT_PUBLIC_API_BASE_URL=/api/backend` and Next proxies to `BACKEND_ORIGIN`.

---

## 9. Deployment

- **Docker** multi-stage build → Next `standalone` output (`Dockerfile`).
- **Fly.io** (`iad` region), config in `fly.toml`.
- **CI**: push to `main` → GitHub Action runs `flyctl deploy`
  (`.github/workflows/fly-deploy.yml`).

---

## 10. Things worth knowing

- **Migration is in progress.** README lists auth/facility/location/lab/patient
  as "done"; many nav items are placeholders. The file tree shows ~21 features
  scaffolded — status varies per feature, so check each folder.
- Field names are **camelCase everywhere** to match the backend (eases porting
  from the old FE).
- `git log` shows only 2 commits ("Initial commit" + "bug fixes") — history
  won't help; the code and per-feature `README.md` files are your guide.
- To run locally: `npm install`, set `NEXT_PUBLIC_API_BASE_URL` to a running
  backend, `npm run dev` → http://localhost:3000.

---

**The one thing to remember:** it's a **backend-mirroring architecture** — a
small `core/` engine plus a repeating 4-file feature template. Learn `core/` and
one feature (`facility`), and the whole codebase becomes predictable.
