# Web App

## Purpose

`apps/web` is the PataSpace web presence: the public landing/marketing pages
and the `/admin` operations console. All tenant-facing product flows (browse,
unlock, wallet, posting, confirmations) live in `apps/mobile`.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- NextAuth (Auth.js) v5 — Credentials provider over the API's own
  `/auth/login|refresh|logout` (admin authentication)
- Three.js via `@react-three/fiber` and `@react-three/drei` for the landing scene

## Local Commands

```bash
pnpm --filter @pataspace/web dev
pnpm --filter @pataspace/web build
pnpm --filter @pataspace/web start
pnpm --filter @pataspace/web test:e2e
```

## Route Surface

Public:

- `/`: waitlist landing page
- `/about`, `/how-it-works`, `/pricing`: static marketing pages

Admin console (NextAuth session + ADMIN role required):

- `/admin/sign-in`: email + password credentials form (the only auth entry
  point on web) — calls NextAuth's `signIn('credentials', ...)`, which in
  turn calls the API's `POST /auth/login`
- `/admin`: operations dashboard (GET /admin/metrics)
- `/admin/listings`: moderation queue + full catalogue CRUD (edit, soft delete)
- `/admin/users`: account directory with ban/unban
- `/admin/finance`: payout summary + commission payout ledger with retry for
  failed B2C payouts (GET /admin/finance/summary, /transactions; POST
  /admin/finance/commissions/:id/retry)
- `/admin/support`: triage queue + ticket workspace — reporter profile,
  message thread, admin reply, status/priority transitions (GET
  /admin/support/tickets[/:id]; POST .../messages, .../status, .../priority)
- `/admin/disputes`: dispute queue with investigate/resolve/close

Everything else redirects to `/` via `proxy.ts` middleware.

## Access Control

- `proxy.ts`: public gate (marketing set only) + NextAuth session gate on
  `/admin` — redirects to `/admin/sign-in` when there is no session, the
  session's refresh rotation has failed, or the role is not `ADMIN`.
- `auth.ts`: the only identity layer — a Credentials provider that calls the
  API's `POST /auth/login`, rejects non-admin roles at `authorize()` itself
  (a correct password for a non-admin account still cannot get a session
  here), and rotates the API's access/refresh token pair via
  `POST /auth/refresh` in the `jwt` callback before it expires.
- `app/admin/(console)/layout.tsx`: server-side ADMIN role check against the
  NextAuth session (defense in depth — proxy.ts already redirects); non-admins
  get a refusal screen.
- The API is the security boundary — every `/admin/*` endpoint enforces
  `Role.ADMIN` independently.

## Current Source Layout

- `app`: route entrypoints (marketing + `app/admin/(console)` pages,
  `app/admin/sign-in`, `app/api/auth/[...nextauth]`)
- `auth.ts`: NextAuth (Auth.js) configuration
- `components/admin`: console shell, panels, sign-in form, and data hook
- `components/shared`, `components/ui`, `components/waitlist`: shared UI
- `lib/api`: API client (`client.ts`), admin fetchers (`admin.ts`), user
  profile, server-only auth fetchers (`auth.ts`, used by `../../auth.ts`)
- `tests/e2e`: Playwright suites (landing, marketing pages, route gates,
  admin sign-in)

## E2E Tests

`pnpm --filter @pataspace/web test:e2e` boots a dev server on port 4400.
`playwright.config.ts` supplies `AUTH_SECRET`/`AUTH_URL` itself, so the suite
is self-contained — no local `.env` file required. Most specs mock the API via
`tests/e2e/fixtures/api-mock.ts` (`page.route()`); the sign-in spec
(`tests/e2e/sign-in.spec.ts`) does the same for its negative cases, and can
optionally run against a real API by exporting `NEXT_PUBLIC_API_BASE_URL` /
`API_INTERNAL_BASE_URL` before invoking the suite.
