# Backend Local Runbook

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop or compatible Docker runtime

## Install

```bash
pnpm install
```

## Start Local Infra

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

## Environment

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Adjust values only if your local ports or credentials differ.
3. Leave `SMS_PROVIDER=sandbox`, `STORAGE_PROVIDER=sandbox`, and `MPESA_MODE=sandbox` for local work unless you are explicitly validating a live adapter.
4. Keep the DB role split in place:
   - `DATABASE_URL` is the runtime app role.
   - `DATABASE_MIGRATION_URL` is the Prisma migration role.
   - `DATABASE_ADMIN_URL` is only for one-time bootstrap commands.

If you start with a fresh Docker Postgres volume, the compose init scripts create the roles automatically. If you are upgrading an existing local database, run:

```bash
pnpm --filter @pataspace/api prisma:bootstrap:roles
```

### Sandbox Failure Injection

Use these optional flags when you need to verify failure paths locally without live credentials:

```text
SANDBOX_SMS_FAIL_OTP=true
SANDBOX_SMS_FAIL_MESSAGE=true
SANDBOX_STORAGE_FAIL_CREATE_UPLOAD_URL=true
SANDBOX_STORAGE_FAIL_CONFIRM_UPLOAD=true
SANDBOX_STORAGE_FAIL_DELETE_OBJECT=true
SANDBOX_MPESA_FAIL_STK_PUSH=true
SANDBOX_MPESA_FAIL_B2C=true
```

- Leave them as `false` for normal local development.
- When any of them is enabled, `/api/v1/ready` will report the affected sandbox adapter as degraded.

## Run The API

```bash
pnpm dev:api
```

API base URL:

```text
http://localhost:3000/api/v1
```

## Health Checks

```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/ready
```

## API Docs

Swagger UI:

```text
http://localhost:3000/api/v1/docs
```

Raw OpenAPI JSON:

```text
http://localhost:3000/api/v1/docs/openapi.json
```

## Sandbox Auth Flow

- With the default local sandbox setup, OTP verification uses `123456`.
- Register and verify locally against:

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-otp
POST /api/v1/auth/resend-otp
GET /api/v1/users/me
```

## Sandbox Upload And Listing Flow

- Uploads stay on the sandbox storage adapter by default and return deterministic `s3Key`, `url`, and `cdnUrl` values.
- Listing creation still requires the `X-Device-Type: mobile` header.
- Useful Phase 4 endpoints:

```text
POST /api/v1/uploads/presigned-url
POST /api/v1/uploads/confirm
POST /api/v1/listings
GET /api/v1/listings
GET /api/v1/listings/:id
GET /api/v1/listings/my-listings
PATCH /api/v1/listings/:id
DELETE /api/v1/listings/:id
GET /api/v1/admin/listings/pending
POST /api/v1/admin/listings/:id/approve
POST /api/v1/admin/listings/:id/reject
```

- Browse and detail responses now emit `ETag` headers and accept `If-None-Match`.

## Validation Commands

```bash
pnpm lint
pnpm --filter @pataspace/contracts build
pnpm --filter @pataspace/api prisma:migrate:status
pnpm --filter @pataspace/api build
pnpm --filter @pataspace/api test
pnpm --filter @pataspace/api test:integration
pnpm --filter @pataspace/api test:smoke
pnpm --filter @pataspace/api test:e2e
```

Deployment notes for production-like environments are in `Docs/09_Backend_Deployment_Notes.md`.
