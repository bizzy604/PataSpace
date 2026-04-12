# Web App

## Purpose

`apps/web` is the public web experience for browsing listings, viewing details, and supporting future web-based authentication and unlock flows.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Three.js via `@react-three/fiber` and `@react-three/drei` for the landing scene

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

- `/`: Stitch-backed PataSpace home
- `/listings`: browse listings with inline search and filter shell
- `/listings/[id]`: Stitch-backed listing details
- `/listings/[id]/gallery`: media review
- `/listings/[id]/unlock`: unlock confirmation
- `/auth/register`: account creation
- `/auth/verify-otp`: OTP verification
- `/auth/sign-in`: Stitch-backed sign-in flow
- `/wallet`: Stitch-backed wallet overview
- `/wallet/buy`: Stitch-backed M-Pesa payment flow
- `/wallet/processing`: M-Pesa pending state
- `/wallet/success`: payment success state
- `/wallet/transactions`: Stitch-backed transaction history
- `/wallet/transactions/[id]`: transaction detail
- `/unlocks`: unlock history
- `/unlocks/[id]`: Stitch-backed connection status
- `/unlocks/[id]/confirm`: confirmation flow
- `/unlocks/[id]/dispute`: dispute entry
- `/profile`: Stitch-backed user profile
- `/profile/edit`: Stitch-backed edit profile
- `/notifications`: Stitch-backed notifications
- `/post`: redirects to the listing-posting upload flow
- `/post/upload-photos`: Stitch-backed listing photo upload
- `/post/details`: Stitch-backed listing details form
- `/search`: Stitch-backed search and map view
- `/map`: Stitch-backed search and map view
- `/settings`: Stitch-backed settings
- `/support`: Stitch-backed help center
- `/whats-new`: Stitch-backed feature announcement
- `/stitch/pataspace-login`: supporting Stitch asset index and raw export access

## Dependencies

- Backend contracts and endpoints served by `apps/api`
- Shared design direction from `packages/design-tokens`
- Stitch export artifacts stored under `Docs/Stitch/PataSpace-Login`

## Development Rules

- Keep route files thin and move reusable logic into feature components or `lib`.
- Reuse shared contracts and design primitives before adding local variants.
- Update this README when routes, commands, or major structure changes.

## Current Gaps

- Several user-facing routes now render committed Stitch HTML exports through local iframe-backed shells for design fidelity. They are integrated into the app route surface, but they are not yet native React/Tailwind rewrites.
- The app still relies on local mock data for most route content and route gating.
- API integration, auth session persistence, and real mutation wiring are the next major steps.
