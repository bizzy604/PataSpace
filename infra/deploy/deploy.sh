#!/usr/bin/env bash
# Purpose: Full self-hosted CD for PataSpace — pull main, rebuild, migrate,
#   restart, verify, and roll back on failure, without ever touching the database
#   volume.
# Why important: Replaces the manual pull+rebuild loop that currently risks the
#   production database on every deploy, and replaces GitHub Actions (billing
#   locked) with a runner that costs nothing and runs on the VPS itself.
# Used by: pataspace-deploy.service (poll timer + webhook), or by hand on the VPS.
#
#   bash infra/deploy/deploy.sh              # deploy if origin/main moved
#   bash infra/deploy/deploy.sh --force      # deploy even with no new commits
#   bash infra/deploy/deploy.sh --check      # report only, change nothing
#   bash infra/deploy/deploy.sh --no-backup  # skip pre-deploy dump (not advised)
#   bash infra/deploy/deploy.sh --ref <sha>  # deploy a specific commit
#
# Exit codes: 0 deployed or already current, 1 failed (rolled back), 2 locked.
#
# Data safety: this script NEVER runs `down`, never passes -v/--volumes, and
# never calls `docker volume rm` or `docker system prune --volumes`. Containers
# and images are disposable; volumes are not. dc_safe() in lib.sh enforces it.

set -Eeuo pipefail
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

FORCE=0; CHECK_ONLY=0; DO_BACKUP=1; TARGET_REF=""
BRANCH="${PATA_DEPLOY_BRANCH:-main}"
HEALTH_TIMEOUT="${PATA_HEALTH_TIMEOUT:-180}"
BACKUP_RETENTION_DAYS="${PATA_BACKUP_RETENTION_DAYS:-14}"

while [ $# -gt 0 ]; do
  case "$1" in
    --force)     FORCE=1 ;;
    --check)     CHECK_ONLY=1 ;;
    --no-backup) DO_BACKUP=0 ;;
    --ref)       TARGET_REF="${2:?--ref needs a commit-ish}"; shift ;;
    --branch)    BRANCH="${2:?--branch needs a name}"; shift ;;
    -h|--help)   sed -n '2,22p' "$0"; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
  shift
done

STARTED_AT="$(date -u +%s)"
PROGRESS_LOG="${LOG_DIR}/deploy.log"
mkdir -p "$LOG_DIR" "$BACKUP_DIR" 2>/dev/null || {
  STATE_DIR="$HOME/.pataspace"; BACKUP_DIR="$STATE_DIR/backups"; LOG_DIR="$STATE_DIR/logs"
  mkdir -p "$BACKUP_DIR" "$LOG_DIR"; PROGRESS_LOG="$LOG_DIR/deploy.log"
}

# Mirror every log line into the durable log while keeping it on the console.
exec > >(tee -a "$PROGRESS_LOG") 2> >(tee -a "$PROGRESS_LOG" >&2)

log "=== PataSpace deploy $(date -u '+%F %T')Z ==="
log "follow along: tail -f $PROGRESS_LOG"

# ---- Preflight ---------------------------------------------------------------
cd "$REPO_ROOT"
command -v docker >/dev/null 2>&1 || die "docker not on PATH"
command -v git    >/dev/null 2>&1 || die "git not on PATH"
docker info >/dev/null 2>&1       || die "Docker daemon unreachable"
[ -f "$COMPOSE_DIR/.env" ]        || die "missing $COMPOSE_DIR/.env"
[ -f "$COMPOSE_FILE" ]            || die "missing compose file $COMPOSE_FILE"

# Only one deploy at a time. Webhook + timer can fire together; the second waits
# briefly, then gives up rather than stacking.
acquire_lock "${PATA_LOCK_WAIT:-30}" || exit 2

load_env
: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_DB:=pataspace}"

# ---- Work out whether there is anything to deploy ----------------------------
log "fetching origin/$BRANCH"
git fetch --quiet origin "$BRANCH" --tags || die "git fetch failed"

CURRENT_SHA="$(git rev-parse HEAD)"
TARGET_SHA="$(git rev-parse "${TARGET_REF:-origin/$BRANCH}")"
SHORT_CUR="${CURRENT_SHA:0:8}"; SHORT_TGT="${TARGET_SHA:0:8}"

log "current: $SHORT_CUR   target: $SHORT_TGT"

if [ "$CURRENT_SHA" = "$TARGET_SHA" ] && [ "$FORCE" = 0 ]; then
  ok "already at $SHORT_TGT — nothing to deploy"
  exit 0
fi

if [ "$CHECK_ONLY" = 1 ]; then
  log "commits that would be deployed:"
  git --no-pager log --oneline "$CURRENT_SHA..$TARGET_SHA" 2>/dev/null | head -20 >&2 || true
  ok "--check: no changes made"
  exit 0
fi

# Refuse to blow away uncommitted work on the VPS. A dirty tree usually means
# somebody hot-patched a file; silently resetting it would destroy that.
if ! git diff --quiet || ! git diff --cached --quiet; then
  die "working tree is dirty — commit, stash, or discard local changes first (git status)"
fi

# ---- Snapshot the database BEFORE anything changes ---------------------------
BACKUP_FILE=""
db_running() { dc ps --status running --format '{{.Service}}' 2>/dev/null | grep -qx postgres; }

# Deterministic fingerprint used to prove the data survived: table count plus
# per-table live row estimates. Printed before and after, diffed at the end.
db_fingerprint() {
  dc exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAF'|' -c \
    "SELECT count(*), coalesce(sum(n_live_tup),0) FROM pg_stat_user_tables;" 2>/dev/null \
    | tr -d ' \r' | head -1 || echo "unavailable"
}

FINGERPRINT_BEFORE="unavailable"
if db_running; then
  FINGERPRINT_BEFORE="$(db_fingerprint)"
  log "db fingerprint before: $FINGERPRINT_BEFORE (tables|rows)"

  if [ "$DO_BACKUP" = 1 ]; then
    BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date -u +%Y%m%dT%H%M%SZ)-$SHORT_TGT.sql.gz"
    log "backing up database -> $BACKUP_FILE"

    # -Fp plain SQL so restore needs nothing but psql + gunzip. `set -o pipefail`
    # is what makes pg_dump's exit status visible through the pipe into gzip.
    if ! dc exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
           | gzip -9 > "$BACKUP_FILE"; then
      rm -f "$BACKUP_FILE"; BACKUP_FILE=""
      die "pg_dump failed — aborting deploy (use --no-backup to override, at your own risk)"
    fi

    # Validate by CONTENT, not just size. pg_dump can exit 0 and still produce
    # something unusable, and size alone is a bad proxy: a legitimate dump of a
    # small database is well under 1KB gzipped, while a gzipped error message is
    # around 20 bytes. So check the archive is intact and carries a real header.
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
      rm -f "$BACKUP_FILE"; BACKUP_FILE=""
      die "backup is not a valid gzip archive — aborting before touching anything"
    fi
    if ! gunzip -c "$BACKUP_FILE" 2>/dev/null | head -40 | grep -q 'PostgreSQL database dump'; then
      rm -f "$BACKUP_FILE"; BACKUP_FILE=""
      die "backup has no pg_dump header — pg_dump wrote an error, not a dump"
    fi
    if [ "$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE")" -lt 200 ]; then
      rm -f "$BACKUP_FILE"; BACKUP_FILE=""
      die "backup is implausibly small even for an empty database — aborting"
    fi

    ok "backup written ($(du -h "$BACKUP_FILE" 2>/dev/null | awk '{print $1}'), gzip + header verified)"
  else
    warn "--no-backup: skipping pre-deploy snapshot"
  fi
else
  warn "postgres not running — skipping backup and fingerprint (first deploy?)"
fi

# ---- Roll the code forward ---------------------------------------------------
# Record what to go back to. Images are tagged by SHA so rollback is instant.
PREV_API_IMAGE="pataspace-api:${SHORT_CUR}"
PREV_WEB_IMAGE="pataspace-web:${SHORT_CUR}"
NEW_API_IMAGE="pataspace-api:${SHORT_TGT}"
NEW_WEB_IMAGE="pataspace-web:${SHORT_TGT}"

log "checking out $SHORT_TGT"
git checkout --quiet --detach "$TARGET_SHA" || die "git checkout failed"

# From here on, a failure must restore the previous code + containers.
ROLLBACK_NEEDED=1
rollback() {
  [ "$ROLLBACK_NEEDED" = 1 ] || return 0
  err "deploy failed — rolling back to $SHORT_CUR"
  git checkout --quiet --detach "$CURRENT_SHA" 2>/dev/null || warn "could not restore previous commit"
  if docker image inspect "$PREV_API_IMAGE" >/dev/null 2>&1; then
    log "restoring previous images"
    API_IMAGE="$PREV_API_IMAGE" WEB_IMAGE="$PREV_WEB_IMAGE" dc_safe up -d --no-build api web 2>&1 | tail -5 >&2 || true
  else
    warn "no previous image tagged $PREV_API_IMAGE — restarting current containers instead"
    dc_safe up -d api web 2>&1 | tail -5 >&2 || true
  fi
  err "rolled back. database untouched; backup at ${BACKUP_FILE:-<none>}"
  err "logs: docker compose -f $COMPOSE_FILE logs --tail=100 api"
}
trap rollback ERR

log "changes in this deploy:"
git --no-pager log --oneline "$CURRENT_SHA..$TARGET_SHA" 2>/dev/null | head -20 >&2 || true

# ---- Build -------------------------------------------------------------------
# Built before stopping anything, so a build failure costs zero downtime.
log "building images (this is the slow part; BuildKit cache makes reruns fast)"
export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1
API_IMAGE="$NEW_API_IMAGE" WEB_IMAGE="$NEW_WEB_IMAGE" dc_safe build api web \
  || die "image build failed — nothing was deployed, the running stack is untouched"
ok "images built: $NEW_API_IMAGE, $NEW_WEB_IMAGE"

# ---- Infrastructure ----------------------------------------------------------
ensure_volume "$POSTGRES_VOLUME"
ensure_volume "$REDIS_VOLUME"

log "ensuring postgres + redis are up"
dc_safe up -d postgres redis || die "failed to start postgres/redis"

log "waiting for postgres to accept connections"
for i in $(seq 1 60); do
  if dc exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    ok "postgres ready"; break
  fi
  [ "$i" = 60 ] && die "postgres did not become ready within 60s"
  sleep 1
done

# ---- Migrate -----------------------------------------------------------------
# `prisma migrate deploy` only applies forward, never resets. It is the single
# owner of schema change; the API image is identical, only the command differs.
log "running database migrations"
if ! API_IMAGE="$NEW_API_IMAGE" dc_safe run --rm --no-deps api-migrate 2>&1 | tail -30 >&2; then
  die "migration failed — database left at its previous schema, restore from $BACKUP_FILE if needed"
fi
ok "migrations applied"

# ---- Restart the app ---------------------------------------------------------
# `up -d` recreates only what changed. postgres/redis are not listed, so they are
# never recreated and the data volume is never remounted.
log "recreating api + web with the new images"
API_IMAGE="$NEW_API_IMAGE" WEB_IMAGE="$NEW_WEB_IMAGE" dc_safe up -d --no-build api web \
  || die "failed to start new containers"

# ---- Verify ------------------------------------------------------------------
API_PORT="${PATA_API_PORT:-3002}"
WEB_PORT="${PATA_WEB_PORT:-3003}"

wait_healthy() {
  local name="$1" url="$2" deadline=$(( $(date -u +%s) + HEALTH_TIMEOUT )) code
  log "waiting for $name at $url (timeout ${HEALTH_TIMEOUT}s)"
  while [ "$(date -u +%s)" -lt "$deadline" ]; do
    code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 5 "$url" 2>/dev/null || echo 000)"
    if [ "$code" = "200" ]; then ok "$name healthy (HTTP 200)"; return 0; fi
    sleep 3
  done
  err "$name did not become healthy within ${HEALTH_TIMEOUT}s (last HTTP $code)"
  dc logs --tail=40 "${name}" 2>&1 | tail -40 >&2 || true
  return 1
}

wait_healthy api "http://127.0.0.1:${API_PORT}/api/v1/health" || die "api health check failed"
wait_healthy web "http://127.0.0.1:${WEB_PORT}/"              || warn "web health check failed (api is up; check web logs)"

# ---- Prove the data survived -------------------------------------------------
FINGERPRINT_AFTER="$(db_fingerprint)"
log "db fingerprint after:  $FINGERPRINT_AFTER (tables|rows)"

if [ "$FINGERPRINT_BEFORE" != "unavailable" ] && [ "$FINGERPRINT_AFTER" != "unavailable" ]; then
  rows_before="${FINGERPRINT_BEFORE#*|}"; rows_after="${FINGERPRINT_AFTER#*|}"
  if [ "${rows_before:-0}" -gt 0 ] && [ "${rows_after:-0}" -eq 0 ]; then
    err "DATA LOSS DETECTED: $rows_before rows before, 0 after"
    err "restore immediately: bash infra/deploy/restore-db.sh $BACKUP_FILE"
    exit 1
  fi
  ok "data intact across deploy (${rows_before} -> ${rows_after} rows; row counts are live estimates)"
fi

# ---- Success -----------------------------------------------------------------
ROLLBACK_NEEDED=0
trap - ERR

# Only dangling (untagged) images. Never `--volumes`, never `-a`: `-a` would
# delete the previous SHA-tagged image that rollback depends on.
log "pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true

# Keep the last N days of dumps; a deploy a day is cheap insurance.
find "$BACKUP_DIR" -name 'pre-deploy-*.sql.gz' -mtime "+$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true

echo "$TARGET_SHA" > "$STATE_DIR/last-deployed-sha" 2>/dev/null || true
ELAPSED=$(( $(date -u +%s) - STARTED_AT ))

ok "=== deployed $SHORT_CUR -> $SHORT_TGT in ${ELAPSED}s ==="
printf '\n  api     : http://127.0.0.1:%s/api/v1/health  [200]\n  web     : http://127.0.0.1:%s/\n  backup  : %s\n  rollback: bash infra/deploy/deploy.sh --ref %s\n  log     : %s\n\n' \
  "$API_PORT" "$WEB_PORT" "${BACKUP_FILE:-<skipped>}" "$SHORT_CUR" "$PROGRESS_LOG" >&2
