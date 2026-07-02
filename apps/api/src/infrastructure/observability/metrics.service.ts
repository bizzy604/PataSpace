/**
 * Purpose: Owns the Prometheus metrics registry for the API process — default
 *   Node.js runtime metrics plus RED metrics (rate, errors, duration) for HTTP.
 * Why important: Single source of truth for everything the /metrics endpoint
 *   exposes; Prometheus scrapes it to power dashboards and alerting.
 * Used by: MetricsController (rendering), createHttpMetricsMiddleware (recording),
 *   ObservabilityModule (wiring).
 */
import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequestsTotal: Counter<'method' | 'route' | 'status_code'>;
  private readonly httpRequestDuration: Histogram<'method' | 'route' | 'status_code'>;
  private readonly httpRequestsInFlight: Gauge<string>;

  constructor(@Optional() configService?: ConfigService) {
    this.registry.setDefaultLabels({
      service: configService?.get<string>('app.name') ?? 'pataspace-api',
    });
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestsTotal = new Counter({
      name: 'http_server_requests_total',
      help: 'Total HTTP requests handled, by method, route template, and status code.',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
    this.httpRequestDuration = new Histogram({
      name: 'http_server_request_duration_seconds',
      help: 'HTTP request duration in seconds, by method, route template, and status code.',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
    this.httpRequestsInFlight = new Gauge({
      name: 'http_server_requests_in_flight',
      help: 'HTTP requests currently being handled.',
      registers: [this.registry],
    });
  }

  startHttpRequest() {
    this.httpRequestsInFlight.inc();
  }

  endHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
    const labels = { method, route, status_code: String(statusCode) };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
    this.httpRequestsInFlight.dec();
  }

  get contentType() {
    return this.registry.contentType;
  }

  render(): Promise<string> {
    return this.registry.metrics();
  }
}
