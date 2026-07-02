#!/usr/bin/env bash
# Purpose: Validates every observability config — dashboard JSON freshness,
#   Prometheus config + alert rules (promtool), Alertmanager config (amtool),
#   and the compose overlay merged against both base stacks.
# Why important: Catches a broken scrape config or alert rule in CI instead of
#   at deploy time, when Prometheus would silently refuse to start.
# Used by: the observability job in .github/workflows/ci.yml, and operators
#   before deploying config changes.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_DIR="$ROOT/../docker"

echo "==> Checking generated dashboards are up to date"
node "$ROOT/scripts/generate-dashboards.mjs" --check

echo "==> promtool check config (validates prometheus.yml + alert rules)"
docker run --rm -v "$ROOT/prometheus:/config:ro" \
  --entrypoint promtool prom/prometheus:v3.13.0 check config /config/prometheus.yml

echo "==> amtool check-config"
docker run --rm -v "$ROOT/alertmanager:/config:ro" \
  --entrypoint amtool prom/alertmanager:v0.33.0 check-config /config/alertmanager.yml

echo "==> docker compose merge check (base stacks + observability overlay)"
created_env=0
if [ ! -f "$DOCKER_DIR/.env" ]; then
  touch "$DOCKER_DIR/.env"
  created_env=1
fi
trap '[ "$created_env" = 1 ] && rm -f "$DOCKER_DIR/.env"' EXIT
(
  cd "$DOCKER_DIR"
  export POSTGRES_PASSWORD=x PATA_DB_APP_PASSWORD=x PATA_DB_MIGRATOR_PASSWORD=x \
    REDIS_PASSWORD=x GRAFANA_ADMIN_PASSWORD=x METRICS_TOKEN=x CLERK_SECRET_KEY=x
  docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml config -q
  docker compose -f docker-compose.vps.yml -f docker-compose.observability.yml config -q
)

echo "All observability configs valid."
