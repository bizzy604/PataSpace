#!/usr/bin/env bash
# Purpose: One-time setup that makes the database survive every future rebuild.
# Why important: The compose files declare `external: true` volumes, which Docker
#   will NOT auto-create. This creates them — and, critically, migrates data out
#   of the old project-scoped volumes so switching to external loses nothing.
# Used by: operator, once per machine. Safe to re-run (idempotent).
#
#   bash infra/deploy/bootstrap.sh            # VPS stack
#   bash infra/deploy/bootstrap.sh --local    # local dev db/redis stack
#
# Exit codes: 0 ok, 1 error.

set -Eeuo pipefail
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

LOCAL_MODE=0
for arg in "$@"; do
  case "$arg" in
    --local)
      LOCAL_MODE=1
      COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"
      # Match the historical inline names for the dev stack (project `docker`),
      # so an existing local database is adopted rather than orphaned.
      POSTGRES_VOLUME="${POSTGRES_VOLUME_LOCAL:-docker_postgres_data}"
      REDIS_VOLUME="${REDIS_VOLUME_LOCAL:-docker_redis_data}"
      export POSTGRES_VOLUME REDIS_VOLUME
      ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) die "unknown argument: $arg" ;;
  esac
done

log "bootstrap starting (mode: $([ "$LOCAL_MODE" = 1 ] && echo local || echo vps))"
command -v docker >/dev/null 2>&1 || die "docker not found on PATH"
docker info >/dev/null 2>&1 || die "cannot talk to the Docker daemon (is it running? are you in the docker group?)"

# ---- Adopt data from a legacy project-scoped volume --------------------------
# Before this change the volumes were inline, so Docker named them
# <project>_<key>. If such a volume exists, holds data, and the new target does
# not, copy the bytes across so the switch to external is invisible.
#
# Copy, never move: the legacy volume is left untouched as a rollback path.
adopt_legacy() {
  local legacy="$1" target="$2"

  volume_exists "$legacy" || { debug "no legacy volume $legacy"; return 0; }
  [ "$legacy" = "$target" ] && { debug "$legacy is already the target"; return 0; }

  # Only adopt into an empty target — never overwrite live data.
  if volume_exists "$target"; then
    local target_files
    target_files="$(docker run --rm -v "$target:/t:ro" alpine:3 sh -c 'ls -A /t 2>/dev/null | wc -l' || echo 0)"
    if [ "${target_files:-0}" -gt 0 ]; then
      warn "both $legacy and $target hold data; leaving $target alone (no automatic merge)"
      return 0
    fi
  fi

  local legacy_files
  legacy_files="$(docker run --rm -v "$legacy:/l:ro" alpine:3 sh -c 'ls -A /l 2>/dev/null | wc -l' || echo 0)"
  [ "${legacy_files:-0}" -eq 0 ] && { debug "legacy $legacy is empty, nothing to adopt"; return 0; }

  log "adopting data: $legacy -> $target ($(volume_size "$legacy"))"
  ensure_volume "$target"
  # -a preserves ownership/permissions, which Postgres requires (it refuses to
  # start if the data directory is not owned by the postgres uid).
  docker run --rm -v "$legacy:/from:ro" -v "$target:/to" alpine:3 \
    sh -c 'cp -a /from/. /to/ && ls -A /to | head -1 >/dev/null' \
    || die "failed to copy $legacy -> $target"
  ok "adopted $legacy -> $target (original left in place as a rollback)"
}

# Stop the stack first: copying a Postgres data directory out from under a
# running server yields a torn snapshot.
if docker ps --format '{{.Names}}' | grep -qE '^(pataspace|docker)-postgres' 2>/dev/null; then
  log "stopping running stack before touching volumes"
  dc_safe stop postgres redis 2>/dev/null || true
fi

if [ "$LOCAL_MODE" = 1 ]; then
  adopt_legacy "docker_postgres_data" "$POSTGRES_VOLUME"
  adopt_legacy "docker_redis_data"    "$REDIS_VOLUME"
else
  adopt_legacy "pataspace_postgres_data" "$POSTGRES_VOLUME"
  adopt_legacy "pataspace_redis_data"    "$REDIS_VOLUME"
  # Covers a VPS that ran the stack from a directory named something else.
  for legacy in $(docker volume ls --format '{{.Name}}' | grep -E '_postgres_data$' || true); do
    adopt_legacy "$legacy" "$POSTGRES_VOLUME"
  done
fi

ensure_volume "$POSTGRES_VOLUME"
ensure_volume "$REDIS_VOLUME"

# ---- State directories -------------------------------------------------------
# Backups and logs live outside the repo so `git clean` and re-clones cannot
# remove them. Fall back to a user-writable path when not root (local dev).
for d in "$STATE_DIR" "$BACKUP_DIR" "$LOG_DIR"; do
  if mkdir -p "$d" 2>/dev/null; then
    debug "state dir ready: $d"
  else
    warn "cannot create $d (need sudo?) — falling back to \$HOME/.pataspace"
    STATE_DIR="$HOME/.pataspace"; BACKUP_DIR="$STATE_DIR/backups"; LOG_DIR="$STATE_DIR/logs"
    mkdir -p "$STATE_DIR" "$BACKUP_DIR" "$LOG_DIR"
    break
  fi
done

ok "bootstrap complete"
printf '\n  postgres volume : %s (%s)\n  redis volume    : %s\n  backups         : %s\n  logs            : %s\n\n' \
  "$POSTGRES_VOLUME" "$(volume_size "$POSTGRES_VOLUME")" "$REDIS_VOLUME" "$BACKUP_DIR" "$LOG_DIR" >&2
log "these volumes are now external — Compose cannot delete them, even on a stack teardown with volume flags"
