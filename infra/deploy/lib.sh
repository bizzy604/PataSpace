# Purpose: Shared helpers for the PataSpace self-hosted deploy scripts.
# Why important: Logging, locking, and volume identity are the three things every
#   deploy script must get right; keeping one copy means a fix lands everywhere.
# Used by: infra/deploy/{bootstrap,deploy,reset-db,restore-db}.sh
#
# Sourced, never executed. Assumes `set -Eeuo pipefail` in the caller.

# ---- Paths -------------------------------------------------------------------
# DEPLOY_DIR is the directory holding this file; REPO_ROOT is two levels up.
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/../.." && pwd)"
COMPOSE_DIR="$REPO_ROOT/infra/docker"

# Default stack file. --local swaps this for the dev-only db/redis stack.
COMPOSE_FILE="${COMPOSE_FILE:-$COMPOSE_DIR/docker-compose.vps.yml}"

# State lives outside the repo so a fresh clone never clobbers it.
STATE_DIR="${PATA_STATE_DIR:-/var/lib/pataspace}"
BACKUP_DIR="${PATA_BACKUP_DIR:-$STATE_DIR/backups}"
LOG_DIR="${PATA_LOG_DIR:-/var/log/pataspace}"
LOCK_FILE="${PATA_LOCK_FILE:-/tmp/pataspace-deploy.lock}"

# ---- Volume identity ---------------------------------------------------------
# These MUST match the `name:` defaults in the compose files. The compose files
# read the same env vars, so overriding here overrides there too.
POSTGRES_VOLUME="${POSTGRES_VOLUME:-pataspace_postgres_data}"
REDIS_VOLUME="${REDIS_VOLUME:-pataspace_redis_data}"
export POSTGRES_VOLUME REDIS_VOLUME

# ---- Logging -----------------------------------------------------------------
# Colors only when stdout is a TTY, so log files stay free of escape codes.
if [ -t 1 ]; then
  C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'
  C_BLU=$'\033[34m'; C_DIM=$'\033[2m';  C_RST=$'\033[0m'
else
  C_RED=''; C_GRN=''; C_YEL=''; C_BLU=''; C_DIM=''; C_RST=''
fi

_ts() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }

# All log lines go to stderr so a function can `echo` its return value on stdout
# without the caller having to strip log noise out of the captured string.
log()   { printf '%s %s[ .. ]%s %s\n' "$(_ts)" "$C_BLU" "$C_RST" "$*" >&2; }
ok()    { printf '%s %s[ ok ]%s %s\n' "$(_ts)" "$C_GRN" "$C_RST" "$*" >&2; }
warn()  { printf '%s %s[warn]%s %s\n' "$(_ts)" "$C_YEL" "$C_RST" "$*" >&2; }
err()   { printf '%s %s[FAIL]%s %s\n' "$(_ts)" "$C_RED" "$C_RST" "$*" >&2; }
debug() { [ "${PATA_DEBUG:-0}" = "1" ] && printf '%s %s[dbg ] %s%s\n' "$(_ts)" "$C_DIM" "$*" "$C_RST" >&2 || true; }
die()   { err "$*"; exit 1; }

# ---- Compose wrapper ---------------------------------------------------------
# Single choke point for every compose invocation. Two reasons this exists:
#   1. `--env-file` must point at infra/docker/.env explicitly, because we run
#      compose with -f from arbitrary working directories (systemd runs it from
#      /), and compose only auto-loads .env from the *current* directory.
#   2. It is the enforcement point for the no-destructive-flags rule below.
dc() {
  local env_args=()
  [ -f "$COMPOSE_DIR/.env" ] && env_args=(--env-file "$COMPOSE_DIR/.env")
  docker compose --project-directory "$COMPOSE_DIR" "${env_args[@]}" -f "$COMPOSE_FILE" "$@"
}

# Hard guard. `down -v` / `--volumes` deletes named volumes; with external
# volumes Compose refuses anyway, but defense in depth is cheap and this also
# catches `rm -v` on the ephemeral migrate container. If a future edit adds a
# destructive flag, this aborts before Docker ever sees it.
dc_safe() {
  local a
  for a in "$@"; do
    case "$a" in
      -v|--volumes)
        die "refusing compose command with '$a' (would target volumes): docker compose $*" ;;
    esac
  done
  dc "$@"
}

# ---- Locking -----------------------------------------------------------------
# flock so a webhook burst and the poll timer cannot deploy concurrently. Falls
# back to a mkdir mutex when util-linux flock is absent (some minimal images).
acquire_lock() {
  local waited=0 max_wait="${1:-0}"
  if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCK_FILE"
    if [ "$max_wait" -gt 0 ]; then
      flock -w "$max_wait" 9 || die "another deploy holds the lock ($LOCK_FILE) after ${max_wait}s"
    else
      flock -n 9 || die "another deploy is already running (lock: $LOCK_FILE)"
    fi
  else
    while ! mkdir "$LOCK_FILE.d" 2>/dev/null; do
      [ "$waited" -ge "$max_wait" ] && die "another deploy is already running (lock: $LOCK_FILE.d)"
      sleep 1; waited=$((waited + 1))
    done
    # shellcheck disable=SC2064  # expand LOCK_FILE now, not at trap time
    trap "rmdir '$LOCK_FILE.d' 2>/dev/null || true" EXIT
  fi
  debug "lock acquired"
}

# ---- Volume helpers ----------------------------------------------------------
volume_exists() { docker volume inspect "$1" >/dev/null 2>&1; }

# Creates a volume only when missing. Never deletes, never overwrites: running
# this against a populated volume is a no-op, which is what makes it safe to
# call on every single deploy.
ensure_volume() {
  local name="$1"
  if volume_exists "$name"; then
    debug "volume $name exists"
  else
    docker volume create "$name" >/dev/null
    ok "created volume $name"
  fi
}

# Best-effort size readout for the pre-deploy report.
volume_size() {
  docker run --rm -v "$1:/v:ro" alpine:3 du -sh /v 2>/dev/null | awk '{print $1}' || echo "?"
}

# ---- Env loading -------------------------------------------------------------
# Reads infra/docker/.env into the current shell. `set -a` exports everything so
# child processes (docker compose, pg_dump) inherit it.
load_env() {
  local f="$COMPOSE_DIR/.env"
  [ -f "$f" ] || die "missing $f — copy .env.vps.example and fill it in"
  set -a
  # shellcheck disable=SC1090
  . "$f"
  set +a
}

# Pull one key out of .env without sourcing the whole file. Used where a single
# value is needed before the full env is validated.
env_value() {
  local key="$1" f="$COMPOSE_DIR/.env"
  [ -f "$f" ] || return 1
  sed -n "s/^${key}=//p" "$f" | tail -1 | sed 's/^"//; s/"$//'
}
