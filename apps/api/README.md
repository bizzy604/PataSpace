# API App

## Purpose

`apps/api` is the PataSpace backend. It is responsible for authentication, listing workflows, uploads, credits, unlocks, payments, confirmations, disputes, admin moderation, and background jobs.

## Stack

- NestJS
- Prisma
- PostgreSQL
- Redis
- Zod shared contracts from `packages/contracts`

## Local Commands

```bash
pnpm --filter @pataspace/api start:dev
pnpm --filter @pataspace/api build
pnpm --filter @pataspace/api test
pnpm --filter @pataspace/api test:smoke
pnpm --filter @pataspace/api prisma:generate
pnpm --filter @pataspace/api prisma:seed
docker compose -f infra/docker/docker-compose.yml up -d
```

## Current Source Layout

- `src/common`: shared backend concerns such as config, auth, filters, interceptors, validation, Swagger, throttling, and request context
- `src/infrastructure`: Redis, queue, SMS, storage, and M-Pesa adapters
- `src/modules`: feature modules
- `src/jobs`: scheduled jobs
- `prisma`: schema, migrations, and seed
- `test`: smoke and e2e coverage

## Feature Modules

- Implemented now: `auth`, `user`, `listing`, `upload`, `admin`
- Present but still incomplete: `credit`, `unlock`, `payment`, `confirmation`, `dispute`

## Architecture Rules

- The API must remain a modular monolith.
- Each feature module owns its controllers, services or use cases, DTO or transport models, Swagger docs models, tests, and module wiring.
- Controllers stay thin.
- Business logic belongs in the owning module, not in controllers or unrelated modules.
- Infrastructure integration must stay behind adapters in `src/infrastructure`.
- Source files must stay under the 200-line limit defined in `Docs/08_Engineering_Standards.md`.

## Current Gaps

- Several modules are still scaffold shells and need real implementations.
- Some services are too large and need to be split into smaller collaborators.
- Empty `dto/` directories exist and should be replaced by real module-local transport code or removed.
