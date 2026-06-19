<!--
Purpose: Step-by-step guide for deploying the PataSpace API to a Hostinger VPS
  using Docker Manager + SSH for the initial setup.
Why important: The mobile app needs a public HTTPS API before store submission;
  this is the single-source runbook for getting from "empty VPS" to "API live."
Used by: operator deploying the first production API instance.
-->

# PataSpace API — VPS Deployment Guide

Target: Hostinger VPS with Docker Manager. Ships: API + Postgres + Redis + Caddy
(auto-TLS). Uses prebuilt GHCR images.

## Prerequisites

| Item | Where to get it |
| --- | --- |
| **API domain** (e.g. `api.pataspace.com`) | Register or use a subdomain you own |
| **DNS A-record** pointing the domain → VPS IP | Hostinger/Cloudflare DNS panel |
| **Clerk production keys** (`CLERK_SECRET_KEY`) | Clerk dashboard → Production instance |
| **VPS SSH access** (host, user, key) | Hostinger VPS panel |
| **GHCR images pushed** | Merge the Docker workflow to `main` → Actions builds and pushes |

## Step 0 — Push images to GHCR

All Docker infrastructure and the Docker Publish workflow must be committed to
`main` so that GitHub Actions builds and pushes the images:

```bash
# From a feature branch, merge to main (or go via staging):
git checkout main
git merge <your-branch>
git push origin main
```

Wait for the **Docker Publish** action to finish. Verify the API image exists:

```bash
# On any machine with gh CLI:
gh api user/packages/container/pataspace-api/versions --jq '.[0].metadata.container.tags'
```

If the repo/packages are private, the VPS needs a GHCR read token (Step 2).

## Step 1 — Prepare the VPS

SSH into the VPS and create the project directory:

```bash
ssh user@<VPS_IP>
mkdir -p /opt/pataspace && cd /opt/pataspace
```

Clone the repo (only needs `infra/docker` and `apps/api/prisma/bootstrap`):

```bash
git clone --depth 1 https://github.com/bizzy604/pataspace.git .
cd infra/docker
```

## Step 2 — Authenticate Docker to GHCR (if repo is private)

Create a GitHub Personal Access Token (PAT) with `read:packages` scope, then:

```bash
echo "<PAT>" | docker login ghcr.io -u <github-username> --password-stdin
```

Skip this if packages are public.

## Step 3 — Create the .env file

```bash
cp .env.vps.example .env
```

Fill in every `REPLACE_*` placeholder. Generate secrets with:

```bash
# Run this 5 times — one each for POSTGRES_PASSWORD, PATA_DB_APP_PASSWORD,
# PATA_DB_MIGRATOR_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET:
openssl rand -base64 32

# APP_ENCRYPTION_KEY needs exactly 32 characters:
openssl rand -hex 16

# REDIS_PASSWORD:
openssl rand -base64 24
```

Critical values to set correctly:

| Variable | Value |
| --- | --- |
| `API_DOMAIN` | Your API domain (e.g. `api.pataspace.com`) |
| `APP_BASE_URL` | `https://<API_DOMAIN>` |
| `CLERK_SECRET_KEY` | From Clerk dashboard (production instance) |
| `DATABASE_URL` | `postgresql://pataspace_app:<APP_PW>@postgres:5432/pataspace` |
| `DATABASE_MIGRATION_URL` | `postgresql://pataspace_migrator:<MIG_PW>@postgres:5432/pataspace` |
| `DATABASE_ADMIN_URL` | `postgresql://postgres:<PG_PW>@postgres:5432/pataspace` |
| `ALLOWED_ORIGINS` | `*` for now (tighten to app domains later) |

All DB URLs use the compose service name `postgres` (resolves inside the network).

## Step 4 — Start the stack

```bash
cd /opt/pataspace/infra/docker
docker compose -f docker-compose.vps.yml pull
docker compose -f docker-compose.vps.yml up -d
```

First boot sequence:
1. **postgres** starts and runs the bootstrap scripts (creates app/migrator roles).
2. **redis** starts.
3. **api-migrate** runs `prisma:migrate:deploy`, then exits.
4. **api** boots once migration succeeds; health check starts.
5. **caddy** provisions a Let's Encrypt cert for `API_DOMAIN` and starts proxying.

Watch logs:

```bash
docker compose -f docker-compose.vps.yml logs -f
```

## Step 5 — Verify

```bash
# From your local machine (or the VPS):
curl https://<API_DOMAIN>/api/v1/health
# Expected: {"status":"ok","service":"pataspace-api",...}

curl https://<API_DOMAIN>/api/v1/ready
# Expected: {"status":"ready","dependencies":{...}}
```

If Caddy shows a TLS error, verify the DNS A-record resolves to the VPS IP and
ports 80/443 are open in the VPS firewall.

## Step 6 — Wire the mobile app

Set the EAS environment variable so production mobile builds point here:

```bash
cd apps/mobile
eas env:create --environment production \
  --name EXPO_PUBLIC_API_BASE_URL \
  --value "https://<API_DOMAIN>/api/v1" \
  --visibility plaintext
```

Also set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to the `pk_live_…` key.

## Updating the API

After merging new code to `main`, the Docker Publish action pushes a fresh
`:latest` image. On the VPS:

```bash
cd /opt/pataspace/infra/docker
docker compose -f docker-compose.vps.yml pull api
docker compose -f docker-compose.vps.yml up -d api api-migrate
```

`api-migrate` re-runs migrations (idempotent), then `api` restarts with the new
image.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `api-migrate` exits with error | Check `docker compose logs api-migrate` — usually a missing/wrong `DATABASE_MIGRATION_URL` |
| Caddy `tls.obtain` error | DNS A-record not propagated, or ports 80/443 blocked |
| API returns 403 `ACCOUNT_INACTIVE` | Clerk user exists but the local DB record has `isActive=false` |
| `POSTGRES_PASSWORD not set` on startup | The `.env` file is missing or not in the same directory as the compose file |
| Redis connection refused | Check `REDIS_PASSWORD` matches between `.env` and the redis service command |
