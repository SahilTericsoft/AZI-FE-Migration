# Auth feature

Frontend reflection of the backend **`user-service/auth`**
(`services/user_service/auth.py`). First migrated slice — the template every
other feature follows.

## Files

| File | Role | Backend mirror |
| --- | --- | --- |
| `auth.types.ts` | request/response + user types | `schemas.py` + `User` model |
| `auth.api.ts` | one function per route | `auth.py` routes |
| `auth.queries.ts` | React Query mutation hooks | — |
| `auth-context.tsx` | app-global session (`AuthProvider`, `useAuth`) | replaces Redux `account` slice |
| `components/login-form.tsx` | the sign-in form (MUI) | — |
| `components/require-auth.tsx` | client route guard | — |

## Endpoint map (old FE → new backend)

| Action | New backend | Old FE (`APIConfig`) |
| --- | --- | --- |
| Login | `POST /user-service/auth/login` `{emailId, password}` | `POST /login` `{username, password}` |
| Check login | `GET /user-service/auth/check-login` (Bearer) | `GET /checkLogin` |
| Logout | `POST /user-service/auth/logout` `{userId}` | `GET /logout` |
| Verify password | `POST /user-service/auth/verify-password` | `POST /verifyPassword` |
| Forgot password | `PUT /user-service/auth/forgot-password` | `forgotPassword` / `forgotManualPassword` |
| Send reset mail | `POST /user-service/auth/forgot-password/send-mail` | `POST /sendForgotPasswordMail` |

Key change: login is by **`emailId`** (not `username`); response is the
`{ message, data }` envelope where `data` = user fields + `token` +
`expiryTime` + `userAccessModules` (+ `systemConfig`).

## Wiring

`AuthProvider` is mounted in `app/providers.tsx` (inside `QueryClientProvider`).
Anything can read the session with `useAuth()`. Protected pages wrap content in
`<RequireAuth>`. The JWT is stored via `@/core/auth/token` and attached to every
request by the axios client.

## Deferred

Forgot-password / reset screens (hooks exist: `useForgotPasswordMutation`,
`useSendResetMailMutation`), and login enrichment (facility/lab details) — the
backend defers the latter until those services' read endpoints are wired.
