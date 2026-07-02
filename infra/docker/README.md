# Docker Provisioning

Container images and a production-style stack for PataSpace.

## What is here

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Local **dev** dependencies only (Postgres + Redis). |
| `docker-compose.prod.yml` | Full **production-style** stack from built images. |
| `docker-compose.vps.yml` | **API-only** VPS stack with Caddy auto-TLS. |
| `docker-compose.observability.yml` | Monitoring **overlay** (Prometheus, Grafana, Alertmanager, exporters) for either stack — see `infra/observability/README.md`. |
| `Caddyfile` | Caddy reverse-proxy config (used by the VPS stack). |
| `.env.prod.example` | Template for the full prod stack's `.env`. |
| `.env.vps.example` | Template for the VPS API-only stack's `.env`. |
| `VPS_DEPLOY.md` | Step-by-step VPS deployment guide (Hostinger). |

Image build files live with each app:

- `apps/api/Dockerfile` — NestJS API (multi-stage, Prisma).
- `apps/web/Dockerfile` — Next.js site (standalone output).
- `apps/admin/Dockerfile` — Vite SPA built and served by nginx (`apps/admin/docker/nginx.conf`).
- `infra/nginx/Dockerfile` + `infra/nginx/edge.conf` — edge reverse proxy.

All images build from the **repo root** context so the pnpm workspace resolves.

## Run the full stack locally

```bash
cd infra/docker
cp .env.prod.example .env        # then edit secrets
docker compose -f docker-compose.prod.yml up --build
```

Service topology:

- `nginx` (edge) → published on `HTTP_PORT` (default `80`): routes `/api/*` → `api`, everything else → `web`.
- `api` (NestJS) on internal `3001`, `web` (Next.js) on internal `3000`.
- `admin` (static SPA) published on `ADMIN_PORT` (default `8080`).
- `postgres` + `redis` with healthchecks and named volumes.
- `api-migrate`: one-shot service that runs `prisma:migrate:deploy` (single owner of schema changes) and must finish before `api` starts.

Verify the API once healthy:

```bash
curl http://localhost/api/v1/health
curl http://localhost/api/v1/ready
```

## Monitoring

Layer the observability overlay onto either stack to add Prometheus, Grafana,
Alertmanager, and host/container/Postgres/Redis exporters:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up -d
```

Requires `METRICS_TOKEN` and `GRAFANA_ADMIN_PASSWORD` in `.env`. Full details:
`infra/observability/README.md`.

## Migrations

Migrations are intentionally a discrete step (matches `Docs/09_Backend_Deployment_Notes.md`). The
`api-migrate` service runs `prisma:migrate:deploy` using `DATABASE_MIGRATION_URL`
before the long-running `api` container boots. The least-privilege
`pataspace_app` / `pataspace_migrator` roles are bootstrapped by the Postgres
init scripts in `apps/api/prisma/bootstrap` on first volume creation.

## Using prebuilt images (GHCR)

CI publishes `ghcr.io/bizzy604/pataspace-{api,web,admin,nginx}`. To run the stack
from those instead of building locally, set the image vars in `.env`
(`API_IMAGE`, `WEB_IMAGE`, `ADMIN_IMAGE`, `NGINX_IMAGE`) and run
`docker compose -f docker-compose.prod.yml up` (no `--build`).

## Notes / follow-ups

- The API runtime image currently carries the full workspace install so the same
  image can both run the service and run Prisma migrations. Slimming it (scoped
  prod install) is a known optimization, tracked separately.
- `NODE_ENV=production` makes the API require HTTPS `APP_BASE_URL` and
  `ALLOWED_ORIGINS`. For a quick local smoke test set `NODE_ENV=development` in `.env`.
