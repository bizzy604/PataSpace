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

## Dependencies

- Backend contracts and endpoints served by `apps/api`
- Shared design direction from `packages/design-tokens`

## Development Rules

- Keep route files thin and move reusable logic into feature components or `lib`.
- Reuse shared contracts and design primitives before adding local variants.
- Update this README when routes, commands, or major structure changes.

## Current Gaps

- The app is still scaffold-stage and not yet fully wired to the live backend.
- Some flows still rely on local mock data.
