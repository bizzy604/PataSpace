#!/usr/bin/env bash
# Purpose: The ONE deliberate way to wipe a PataSpace database.
# Why important: Making volumes external removes the accidental wipe (`down -v`),
#   but resetting a local dev database is a legitimate need. This provides that
#   path with guardrails, so destruction is always explicit and never a
#   side-effect of a rebuild.
# Used by: developers resetting local state. Refuses to run against the VPS stack
#   unless --i-know-this-is-production is passed.
#
#   bash infra/deploy/reset-db.sh --local     # wipe the local dev database
#
# Takes a dump first, so even an intentional wipe is recoverable.

set -Eeuo pipefail
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

LOCAL_MODE=0; PROD_ACK=0
for arg in "$@"; do
  case "$arg" in
    --local)
      LOCAL_MODE=1
      COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"
      POSTGRES_VOLUME="${POSTGRES_VOLUME_LOCAL:-docker_postgres_data}"
      REDIS_VOLUME="${REDIS_VOLUME_LOCAL:-docker_redis_data}"
      export POSTGRES_VOLUME REDIS_VOLUME
      ;;
    --i-know-this-is-production) PROD_ACK=1 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) die "unknown argument: $arg" ;;
  esac
done

if [ "$LOCAL_MODE" = 0 ] && [ "$PROD_ACK" = 0 ]; then
  die "refusing to wipe a non-local stack. Use --local for dev, or pass --i-know-this-is-production if you truly mean it."
fi

warn "about to PERMANENTLY DELETE volume: $POSTGRES_VOLUME ($(volume_size "$POSTGRES_VOLUME"))"
[ "$LOCAL_MODE" = 0 ] && err "*** THIS IS THE PRODUCTION STACK ***"

# Best-effort dump before destroying. Requires the database to be running.
if dc ps --status running --format '{{.Service}}' 2>/dev/null | grep -qx postgres; then
  mkdir -p "$BACKUP_DIR" 2>/dev/null || { BACKUP_DIR="$HOME/.pataspace/backups"; mkdir -p "$BACKUP_DIR"; }
  SNAP="$BACKUP_DIR/pre-reset-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
  log "taking a final dump -> $SNAP"
  dc exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-pataspace}" \
    --clean --if-exists 2>/dev/null | gzip -9 > "$SNAP" \
    && ok "dumped ($(du -h "$SNAP" | awk '{print $1}'))" \
    || warn "dump failed; the wipe will be unrecoverable"
else
  warn "postgres is not running — cannot take a final dump"
fi

printf 'Type DELETE to permanently wipe %s: ' "$POSTGRES_VOLUME" >&2
read -r reply
[ "$reply" = "DELETE" ] || die "aborted (got '$reply')"

log "stopping stack"
dc_safe down 2>/dev/null || true   # no -v: dc_safe would reject it anyway

log "removing volume $POSTGRES_VOLUME"
docker volume rm "$POSTGRES_VOLUME" >/dev/null || die "could not remove $POSTGRES_VOLUME (still in use?)"
ensure_volume "$POSTGRES_VOLUME"

ok "database volume reset (empty, recreated)"
log "next: docker compose -f $COMPOSE_FILE up -d   (migrations will rebuild the schema)"
