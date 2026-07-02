# PataSpace

PataSpace is a multi-app workspace for a housing marketplace with a NestJS backend, a web app (public landing + admin console), and a mobile app for all tenant-facing flows.

## Workspace Apps

- `apps/api`: NestJS backend modular monolith.
- `apps/web`: Next.js landing/marketing pages plus the `/admin` operations console.
- `apps/mobile`: Expo and React Native tenant application (all client-facing flows).

## Shared Packages

- `packages/contracts`: Shared contracts and Zod schemas used across apps.
- `packages/design-tokens`: Shared design primitives.

## Infrastructure

- `infra/docker`: Local PostgreSQL and Redis services (`docker-compose.yml`) plus the
  full production-style stack (`docker-compose.prod.yml`). See `infra/docker/README.md`.
- `infra/nginx`: Edge reverse-proxy image (`Dockerfile`, `edge.conf`) fronting the API and web containers.
- `infra/observability`: Prometheus, Grafana, and Alertmanager configs plus generated
  dashboards; deployed via the `infra/docker/docker-compose.observability.yml` overlay.
  See `infra/observability/README.md`.
- Per-app container images: `apps/api/Dockerfile`, `apps/web/Dockerfile`.

## CI/CD

- `.github/workflows/ci.yml`: backend test/lint/build + frontend build.
- `.github/workflows/docker-publish.yml`: builds all service images and pushes them
  to GHCR (`ghcr.io/<owner>/pataspace-*`) on `main` and version tags.

## Standards

- Engineering standards: `Docs/08_Engineering_Standards.md`
- Project-wide agent rules: `CLAUDE.md`
- Delivery phasing rule: `.claude/rules/delivery-phasing.md`

## Local Commands

```bash
pnpm install
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
pnpm build
pnpm test
pnpm standards:check
```

## App READMEs

- `apps/api/README.md`
- `apps/web/README.md`
- `apps/mobile/README.md`
