# Admin App

## Purpose

`apps/admin` is the operations console for listing review, moderation, disputes, and future diagnostics for marketplace operators.

## Stack

- Vite
- React
- Tailwind CSS

## Local Commands

```bash
pnpm --filter @pataspace/admin dev
pnpm --filter @pataspace/admin build
pnpm --filter @pataspace/admin preview
```

## Current Source Layout

- `src/pages`: admin screens
- `src/components`: reusable UI and layout components
- `src/App.tsx`: app shell
- `src/main.tsx`: bootstrap entrypoint

## Dependencies

- Admin endpoints from `apps/api`
- Shared contracts from `packages/contracts`

## Development Rules

- Keep page files thin and move reusable behavior into feature components.
- Keep moderation and operational workflows aligned with backend module boundaries.
- Update this README when routes, commands, or architecture change.

## Current Gaps

- The current implementation is minimal and does not yet cover the full moderation and dispute workflow.
