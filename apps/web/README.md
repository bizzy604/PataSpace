# Web App

## Purpose

`apps/web` is the public web experience for browsing listings, viewing details, and supporting future web-based authentication and unlock flows.

## Stack

- Next.js App Router
- React
- Tailwind CSS

## Local Commands

```bash
pnpm --filter @pataspace/web dev
pnpm --filter @pataspace/web build
pnpm --filter @pataspace/web start
```

## Current Source Layout

- `app`: route entrypoints and page composition
- `components`: shared UI and feature components
- `lib`: API helpers, utilities, and local mock data
- `public`: static assets

## Current Route Surface

- `/`: landing page and web scope overview
- `/listings`: browse listings with inline search and filter shell
- `/listings/[id]`: listing details
- `/listings/[id]/gallery`: media review
- `/listings/[id]/unlock`: unlock confirmation
- `/auth/register`: account creation
- `/auth/verify-otp`: OTP verification
- `/auth/sign-in`: sign-in flow
- `/wallet`: wallet overview
- `/wallet/buy`: credit purchase flow
- `/wallet/processing`: M-Pesa pending state
- `/wallet/success`: payment success state
- `/wallet/transactions`: transaction history
- `/wallet/transactions/[id]`: transaction detail
- `/unlocks`: unlock history
- `/unlocks/[id]`: revealed contact state
- `/unlocks/[id]/confirm`: confirmation flow
- `/unlocks/[id]/dispute`: dispute entry
- `/profile`: tenant dashboard
- `/support`: support and FAQ

## Dependencies

- Backend contracts and endpoints served by `apps/api`
- Shared design direction from `packages/design-tokens`

## Development Rules

- Keep route files thin and move reusable logic into feature components or `lib`.
- Reuse shared contracts and design primitives before adding local variants.
- Update this README when routes, commands, or major structure changes.

## Current Gaps

- The app now has a full tenant-facing route scaffold, but it still relies on local mock data for most route content.
- API integration, auth session persistence, and real mutation wiring are the next major steps.
