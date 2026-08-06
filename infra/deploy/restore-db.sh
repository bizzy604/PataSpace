#!/usr/bin/env bash
# Purpose: Restore the PataSpace database from a pre-deploy dump.
# Why important: A backup nobody has practised restoring is not a backup. This is
#   the tested path back after a bad migration or a botched deploy.
# Used by: operator, after a failed deploy. Referenced by deploy.sh error output.
#
#   bash infra/deploy/restore-db.sh                      # newest backup
#   bash infra/deploy/restore-db.sh <file.sql.gz>         # a specific backup
#   bash infra/deploy/restore-db.sh --list                # show what's available
#
# Requires typing the database name to confirm: this overwrites live data.

set -Eeuo pipefail
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

load_env
: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_DB:=pataspace}"

if [ "${1:-}" = "--list" ]; then
  log "backups in $BACKUP_DIR:"
  ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "  ", $9, "("$5")", $6, $7, $8}' >&2 \
    || warn "no backups found"
  exit 0
fi

[ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ] && { sed -n '2,14p' "$0"; exit 0; }

BACKUP="${1:-}"
if [ -z "$BACKUP" ]; then
  # shellcheck disable=SC2012  # ls -t is the simplest newest-first here
  BACKUP="$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1 || true)"
  [ -n "$BACKUP" ] || die "no backups found in $BACKUP_DIR"
  log "using newest backup: $BACKUP"
fi
[ -f "$BACKUP" ] || die "backup file not found: $BACKUP"

# Verify the gzip stream before dropping anything. A truncated dump discovered
# halfway through a restore is the worst possible time to find out.
log "verifying archive integrity"
gzip -t "$BACKUP" || die "archive is corrupt: $BACKUP"
ok "archive verified ($(du -h "$BACKUP" | awk '{print $1}'))"

dc ps --status running --format '{{.Service}}' 2>/dev/null | grep -qx postgres \
  || die "postgres is not running — start it first: docker compose -f $COMPOSE_FILE up -d postgres"

warn "this OVERWRITES the current contents of database '$POSTGRES_DB'"
warn "current: $(dc exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  'SELECT count(*)||" tables" FROM pg_stat_user_tables;' 2>/dev/null || echo unknown)"
printf 'Type the database name (%s) to proceed: ' "$POSTGRES_DB" >&2
read -r reply
[ "$reply" = "$POSTGRES_DB" ] || die "aborted (got '$reply')"

# Safety dump of the current state, so even a mistaken restore is reversible.
SAFETY="$BACKUP_DIR/pre-restore-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
log "dumping current state first -> $SAFETY"
dc exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  | gzip -9 > "$SAFETY" || warn "safety dump failed; continuing because you confirmed"

# Stop the API so nothing writes mid-restore. Postgres stays up; only app
# containers pause. The volume is never unmounted.
log "stopping api + web during restore"
dc_safe stop api web >/dev/null 2>&1 || true

log "restoring $BACKUP"
# The dump was taken with --clean --if-exists, so it drops and recreates objects.
# ON_ERROR_STOP=1 makes psql abort on the first real failure.
if gunzip -c "$BACKUP" | dc exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
     -v ON_ERROR_STOP=1 --quiet 2>&1 | tail -20 >&2; then
  ok "restore completed"
else
  err "restore reported errors — inspect above; safety dump is at $SAFETY"
fi

log "restarting api + web"
dc_safe up -d api web >/dev/null 2>&1 || warn "could not restart app containers"

TABLES="$(dc exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  'SELECT count(*) FROM pg_stat_user_tables;' 2>/dev/null | tr -d ' \r' || echo '?')"
ok "database now has $TABLES tables"
printf '\n  restored from : %s\n  safety dump   : %s\n  verify        : curl http://127.0.0.1:%s/api/v1/health\n\n' \
  "$BACKUP" "$SAFETY" "${PATA_API_PORT:-3002}" >&2
