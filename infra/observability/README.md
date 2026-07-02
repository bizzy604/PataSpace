# Observability

Production monitoring for PataSpace: Prometheus (metrics + alerting), Grafana
(dashboards), Alertmanager (notification routing), and exporters for the host,
containers, PostgreSQL, and Redis.

## What is here

| Path | Purpose |
| --- | --- |
| `prometheus/prometheus.yml` | Scrape config for every target. |
| `prometheus/alerts/*.rules.yml` | Alert rules (API + infrastructure). |
| `alertmanager/alertmanager.yml` | Alert routing; notification channels are wired here. |
| `grafana/provisioning/` | Auto-provisioned datasource and dashboard provider. |
| `grafana/dashboards/*.json` | Generated dashboards — do not hand-edit. |
| `scripts/dashboards/*.mjs` | Dashboard definitions (the source of truth). |
| `scripts/generate-dashboards.mjs` | Regenerates the JSON (`--check` verifies in CI). |
| `scripts/validate.sh` | Validates all configs; runs in the `observability` CI job. |

The compose overlay itself lives at `infra/docker/docker-compose.observability.yml`
so relative paths resolve no matter which base stack it is layered onto.

## Run it

```bash
cd infra/docker
# .env needs METRICS_TOKEN and GRAFANA_ADMIN_PASSWORD (see .env.prod.example)
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up -d
# or on the VPS stack:
docker compose -f docker-compose.vps.yml -f docker-compose.observability.yml up -d
```

UIs bind to localhost only. From your machine:

```bash
ssh -L 3005:localhost:3005 -L 9090:localhost:9090 -L 9093:localhost:9093 <vps>
```

- Grafana: http://localhost:3005 (login: `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`)
- Prometheus: http://localhost:9090 (targets: /targets, rules: /rules)
- Alertmanager: http://localhost:9093

Dashboards are provisioned into the **PataSpace** folder: *PataSpace API*
(RED metrics, Node.js runtime) and *PataSpace Infrastructure* (host,
containers, PostgreSQL, Redis).

## How /metrics is secured

The API exposes Prometheus metrics at `GET /metrics`, deliberately **outside**
the `/api/v1` prefix:

- In the prod stack the nginx edge only forwards `/api/*`, so `/metrics` is
  unreachable from the internet; Prometheus scrapes `api:3001` on the compose
  network.
- In production the endpoint **fails closed**: without `METRICS_TOKEN` it
  returns 404. With it, a `Authorization: Bearer <token>` header is required
  (constant-time compare). This protects the VPS setup, where the host nginx
  forwards every path to the API.
- Prometheus sends the token automatically: the compose entrypoint writes
  `METRICS_TOKEN` from `.env` into a credentials file the scrape config reads.

## Alerting

Rules live in `prometheus/alerts/`. Highlights: `ApiDown`, `ApiHighErrorRate`
(>5% 5xx), `ApiHighLatencyP95` (>1s), `PostgresDown`, `RedisDown`,
`HostDiskSpaceCritical`. Criticals repeat every 4h, warnings every 12h, and a
firing critical inhibits its own warning duplicate.

Notifications are a no-op until you wire a channel: uncomment the Slack or
email example in `alertmanager/alertmanager.yml`, then
`docker compose restart alertmanager`. Keep real webhook URLs out of git.

## Editing dashboards

Edit the definitions in `scripts/dashboards/`, then:

```bash
node infra/observability/scripts/generate-dashboards.mjs
```

CI fails if the JSON does not match the definitions. Ad-hoc edits in the
Grafana UI are allowed (`allowUiUpdates`) but are lost on container recreation;
promote anything worth keeping into the definitions.

## Least-privilege postgres-exporter (recommended)

By default the exporter connects as the postgres superuser from `.env`. To use
a dedicated monitoring role instead:

```sql
CREATE USER pataspace_monitor WITH PASSWORD '<password>';
GRANT pg_monitor TO pataspace_monitor;
```

Then set `POSTGRES_EXPORTER_DSN` in `.env` and recreate the exporter.

## Validate before deploying

```bash
infra/observability/scripts/validate.sh
```

Runs promtool + amtool against the configs, checks dashboard freshness, and
merges the overlay against both base stacks. The `observability` CI job runs
the same script on every push.

## Adding a domain metric

Inject `MetricsService` (global module) anywhere in the API, register a
`Counter`/`Histogram` on its registry, and it appears at `/metrics` on the next
scrape. Add a panel for it in `scripts/dashboards/` and an alert rule if it has
a failure threshold.
