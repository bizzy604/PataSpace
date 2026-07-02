# Web App

## Purpose

`apps/web` is the PataSpace web presence: the public landing/marketing pages
and the `/admin` operations console. All tenant-facing product flows (browse,
unlock, wallet, posting, confirmations) live in `apps/mobile`.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Clerk (admin authentication)
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

Admin console (Clerk session + ADMIN role required):

- `/admin/sign-in`: Clerk sign-in (the only auth entry point on web)
- `/admin`: operations dashboard (GET /admin/metrics)
- `/admin/listings`: moderation queue + full catalogue CRUD (edit, soft delete)
- `/admin/users`: account directory with ban/unban
- `/admin/disputes`: dispute queue with investigate/resolve/close

Everything else redirects to `/` via `proxy.ts` middleware.

## Access Control

- `proxy.ts`: public gate (marketing set only) + Clerk session gate on `/admin`.
- `app/admin/(console)/layout.tsx`: server-side ADMIN role check against
  `GET /users/me`; non-admins get a refusal screen.
- The API is the security boundary — every `/admin/*` endpoint enforces
  `Role.ADMIN` independently.

## Current Source Layout

- `app`: route entrypoints (marketing + `app/admin/(console)` pages)
- `components/admin`: console shell, panels, and data hook
- `components/shared`, `components/ui`, `components/waitlist`: shared UI
- `lib/api`: API client (`client.ts`), admin fetchers (`admin.ts`), user profile
- `tests/e2e`: Playwright suites (landing, marketing pages, route gates)

## E2E Tests

`pnpm --filter @pataspace/web test:e2e` boots a dev server on port 4400 and
verifies the landing, marketing pages, admin sign-in redirects, and
retired-route redirects. Requires the Clerk dev keys in `apps/web/.env`.
