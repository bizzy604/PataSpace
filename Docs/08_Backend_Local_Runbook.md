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
pnpm --filter @pataspace/api build
pnpm --filter @pataspace/api test
pnpm --filter @pataspace/api test:smoke
pnpm --filter @pataspace/api test:e2e
```
