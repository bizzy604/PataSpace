# Backend Deployment Notes

## Scope

These notes cover the current `apps/api` deployment baseline for a single backend service behind a reverse proxy.

## Environment Setup

1. Copy `apps/api/.env.example` to the target host as `apps/api/.env`.
2. Replace all placeholder secrets before first boot:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `APP_ENCRYPTION_KEY`
   - any live provider credentials if you are not using sandbox adapters
3. Keep `/api/v1` as the public path prefix in the process manager, reverse proxy, and client configuration.
4. Use sandbox adapters in staging unless you are intentionally validating live SMS, storage, or M-Pesa behavior.

## Database Migrations

Run migrations before each release restart:

```bash
pnpm --filter @pataspace/api prisma:migrate:deploy
```

Recommended release order:

1. Pull the new revision.
2. Run `pnpm install --frozen-lockfile`.
3. Run `pnpm --filter @pataspace/contracts build`.
4. Run `pnpm --filter @pataspace/api prisma:migrate:deploy`.
5. Run `pnpm --filter @pataspace/api build`.
6. Restart the API process.

If a release includes new seed-only development data, do not run `prisma db seed` in production.

## Process Manager

PM2 is the simplest fit for the current modular-monolith backend:

```bash
pnpm --filter @pataspace/api build
pm2 start apps/api/dist/main.js --name pataspace-api
pm2 save
```

Useful PM2 operations:

```bash
pm2 restart pataspace-api
pm2 logs pataspace-api
pm2 status pataspace-api
```

## Reverse Proxy

NGINX should forward traffic to the NestJS process and preserve request metadata:

```nginx
server {
  listen 80;
  server_name api.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Request-Id $request_id;
  }
}
```

Keep the proxy aligned with the application prefix so public traffic reaches `/api/v1/*` unchanged.

## Release Validation

Run these checks before considering a release healthy:

```bash
pnpm lint
pnpm --filter @pataspace/contracts build
pnpm --filter @pataspace/api build
pnpm --filter @pataspace/api test:smoke
pnpm --filter @pataspace/api test
```

After restart, verify:

```bash
curl http://127.0.0.1:3000/api/v1/health
curl http://127.0.0.1:3000/api/v1/ready
curl http://127.0.0.1:3000/api/v1/docs/openapi.json
```

## Operational Notes

- Jobs run in-process through the API application, so only one scheduler-active backend instance should own cron execution until job coordination changes.
- Keep Postgres and Redis reachable before restarting the API, otherwise readiness will degrade immediately.
- If sandbox failure injection flags are enabled on a host, clear them before production traffic is routed to that instance.
