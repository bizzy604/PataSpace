# PataSpace Self-Hosted CD

Full push-to-deploy automation for the VPS. Pulls `origin/main`, builds images, runs migrations, restarts containers, verifies health, and rolls back on failure. The database volume is external and pinned by name, so rebuilds never wipe data.

## Why this exists

GitHub Actions is billing-locked. This replaces it with a VPS-local runner that costs nothing and never touches the database volume.

## Two triggers, one deploy script

- **Systemd timer** (guaranteed): polls every 3 minutes, always fires
- **Webhook** (instant): GitHub push event hits the endpoint, triggers immediately

Both share a lock. Only one deploy runs at a time; the second waits briefly, then exits.

## On the VPS

### Installation

```bash
# 1. Set the webhook secret (used by both the webhook and the GitHub repo config)
sudo mkdir -p /etc/pataspace
echo "your-webhook-secret-here" | sudo tee /etc/pataspace/webhook-secret
sudo chmod 600 /etc/pataspace/webhook-secret

# 2. Install and enable the systemd units
sudo cp infra/deploy/systemd/pataspace-deploy.service /etc/systemd/system/
sudo cp infra/deploy/systemd/pataspace-deploy.timer /etc/systemd/system/
sudo cp infra/deploy/systemd/pataspace-webhook.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pataspace-deploy.timer
sudo systemctl enable --now pataspace-webhook.service

# 3. Verify
sudo systemctl status pataspace-deploy.timer
sudo systemctl status pataspace-webhook.service
```

### Configure GitHub webhook

Repository → Settings → Webhooks → Add webhook:

- **Payload URL**: `http://api.dalakenya.com:9876/deploy` (or your VPS IP)
- **Content type**: `application/json`
- **Secret**: the same value you wrote to `/etc/pataspace/webhook-secret`
- **Events**: Just the push event
- **Active**: ✓

The webhook accelerates deploys to ~instant. The timer is the fallback: if the webhook is down, offline, or misconfigured, the timer still deploys within 3 minutes.

### Logs

```bash
# Timer/service logs
sudo journalctl -u pataspace-deploy.service -f

# Webhook logs
sudo journalctl -u pataspace-webhook.service -f

# Full deploy transcript (survives service restarts)
tail -f ~/.pataspace/logs/deploy.log
```

### Manual deploy

```bash
cd /path/to/PataSpace
bash infra/deploy/deploy.sh           # deploy if origin/main moved
bash infra/deploy/deploy.sh --force   # deploy even with no new commits
bash infra/deploy/deploy.sh --check   # report what would be deployed, change nothing
```

## Locally (development machine)

### Running the gate tests

```bash
pnpm test:deploy
```

40 tests. Deterministic, no Docker, <2s. Enforces:

- External volumes with pinned names in all compose files
- No `down`, no `-v`, no `prune --volumes` in any deploy script
- Runtime guard (`dc_safe`) rejects volume-destroying commands
- Pre-deploy backup taken before migrations, with content validation
- Rollback trap fires on failure
- Postgres never included in the app `up` command
- LF line endings enforced via `.gitattributes`

### Running mutation tests

```bash
pnpm test:deploy:mutation
```

25 mutations. Proves the gate catches every failure mode by reintroducing them one at a time. A mutation that escapes is a hole in the gate.

### Running the persistence eval

```bash
pnpm eval:deploy
```

7 scenarios, ~90s. Behavioral proof using real Docker:

1. External volume survives `down -v`
2. Counter-experiment: inline volume does NOT survive
3. Same database attached from different directory
4. `dc_safe` runtime guard rejects `-v` at runtime
5. Pre-deploy backup is restorable
6. Production volumes never touched by the eval
7. (Implicit) CreatedAt timestamp unchanged across rebuild

Requires Docker running. Creates an isolated `pataspace-eval` project and `pataspace_eval_*` volumes; never names or mounts production volumes.

## Data safety guarantees

1. **Structural**: External volumes with pinned `name:`, so `down -v` cannot delete them and a different directory attaches the same data.
2. **Runtime**: `dc_safe()` wrapper rejects `-v`, `--volumes`, and every `prune` variant at execution time.
3. **Tested**: Gate suite makes the structure non-removable. Mutation suite proves the gate works. Persistence eval proves real-world behavior.
4. **Pre-deploy snapshot**: `pg_dump` runs before migrations. Content-validated (gzip integrity, header check, size floor). Restore with `bash infra/deploy/restore-db.sh <backup-file>`.
5. **Fingerprint diff**: Table count + live row estimates before and after. Deploy aborts if rows drop to zero.
6. **Rollback on failure**: If health checks fail, `git checkout` + `docker compose up` with the previous SHA-tagged image. Database untouched.

## Compose file rules

Enforced by `infra/deploy/tests/gate.test.mjs`:

```yaml
volumes:
  postgres_data:
    external: true
    name: ${POSTGRES_VOLUME:-pataspace_postgres_data}
  redis_data:
    external: true
    name: ${REDIS_VOLUME:-pataspace_redis_data}
```

- `external: true` — Docker never creates or deletes it
- `name:` pinned — same volume regardless of directory or project name
- Removable only with explicit `docker volume rm <name>`

Never list `postgres` or `redis` in a `dc_safe up` or `dc_safe up -d` service list. They start once at the beginning of deploy and stay up.

## Scripts

| File | Purpose |
|------|---------|
| `deploy.sh` | Main deploy script: pull, build, migrate, restart, verify, rollback on failure |
| `webhook.mjs` | HTTP server for GitHub push events, verifies HMAC-SHA256 signature, spawns `deploy.sh` |
| `lib.sh` | Shared functions: `dc_safe()` guard, lock, logging, env loading |
| `reset-db.sh` | Destructive: drops and recreates the database. Requires typed confirmation. Dev/staging only. |
| `restore-db.sh` | Restores from a `pg_dump` backup. Takes the `.sql.gz` path as an argument. |

## Environment variables

Set in `infra/docker/.env` or export before running:

| Variable | Default | Purpose |
|----------|---------|---------|
| `POSTGRES_VOLUME` | `pataspace_postgres_data` | Volume name for Postgres |
| `REDIS_VOLUME` | `pataspace_redis_data` | Volume name for Redis |
| `PATA_DEPLOY_BRANCH` | `main` | Branch to deploy |
| `PATA_HEALTH_TIMEOUT` | `180` | Seconds to wait for health checks |
| `PATA_BACKUP_RETENTION_DAYS` | `14` | Keep backups this many days |
| `PATA_LOCK_WAIT` | `30` | Seconds to wait for the deploy lock before giving up |
| `PATA_API_PORT` | `3002` | Port where the API listens |
| `PATA_WEB_PORT` | `3003` | Port where the web app listens |

## Rollback

Automatic on failure. Manual rollback to a specific commit:

```bash
bash infra/deploy/deploy.sh --ref <commit-sha>
```

Images are SHA-tagged, so rollback is instant (no rebuild). The database is never rolled back; restore from a snapshot if needed:

```bash
# List available backups
ls -lh ~/.pataspace/backups/

# Restore
bash infra/deploy/restore-db.sh ~/.pataspace/backups/pre-deploy-20260806T123456Z-abcd1234.sql.gz
```

## Troubleshooting

### Deploy fails with "postgres not running"

The volume might be corrupted or the bootstrap SQL might have failed. Check:

```bash
docker compose -f infra/docker/docker-compose.vps.yml logs postgres
docker volume inspect pataspace_postgres_data
```

### Deploy fails with "working tree is dirty"

Somebody edited a file on the VPS without committing it. Either commit the change or discard it:

```bash
git status
git diff
git restore <file>   # discard
# or
git add <file> && git commit -m "hotfix: <what>"
```

### Webhook not firing

```bash
# Check the webhook service is up
sudo systemctl status pataspace-webhook.service

# Check recent requests
sudo journalctl -u pataspace-webhook.service -n 50

# Check GitHub delivery log (repo Settings → Webhooks → Recent Deliveries)
```

The timer is the fallback. Even if the webhook is broken, deploys happen within 3 minutes.

### Health check timeout

The deploy succeeded but health checks failed. Check:

```bash
docker compose -f infra/docker/docker-compose.vps.yml logs api --tail=100
docker compose -f infra/docker/docker-compose.vps.yml logs web --tail=100
curl http://127.0.0.1:3002/api/v1/health
```

The rollback trap restores the previous containers, so the site should still be up.

### Database fingerprint shows row loss

The deploy detected data loss and aborted. DO NOT re-run the deploy. Restore immediately:

```bash
ls -lh ~/.pataspace/backups/ | tail -5
bash infra/deploy/restore-db.sh ~/.pataspace/backups/<most-recent>.sql.gz
```

Then investigate why rows disappeared. This is the safety net that prevents silent data loss.

## Architecture decisions

**Why SHA-tagged images?** Instant rollback with zero rebuild time. `pataspace-api:abcd1234` stays on the host until pruned, so `docker compose up` with the old SHA is instant.

**Why poll + webhook instead of webhook-only?** The webhook accelerates deploys to instant, but it's also a single point of failure: DNS, network, GitHub, the VPS firewall, and the webhook service itself. The timer is the guaranteed path: even if everything else breaks, the deploy happens within 3 minutes.

**Why not blue/green or canary?** One VPS, fixed resources. The health check + rollback trap is the safety mechanism: the new containers start, the old containers keep running until health checks pass, and a failure restores the old ones. The database is never touched on rollback.

**Why forward-only migrations?** Prisma `migrate deploy` only applies unapplied migrations, never resets. The schema is append-only. A migration that needs to be undone gets a new forward migration that reverts the change.

**Why content-validate the backup instead of just checking size?** `pg_dump` can exit 0 and write a gzipped error message under 1KB. A small legitimate database dump is ~686 bytes gzipped, while an error is ~20 bytes. Size alone accepts the error and rejects the real dump. The three-part check (gzip integrity, header presence, size floor) catches both.

**Why `down` is banned, not just `down -v`?** `down` removes containers and networks. The deploy only needs to recreate the app containers (`api`, `web`), not the data containers (`postgres`, `redis`). Stopping and recreating postgres is needless churn and adds failure modes. So `down` never appears in the deploy script. `up -d api web` recreates only what changed.

**Why external + name, not just external?** `external: true` alone still uses the default name `<project>_<key>`. A re-clone into a different directory, or a `docker compose -p different-name`, attaches a different volume. Pinning `name:` makes the volume project-agnostic: the same database regardless of where or how you run compose.
