/**
 * Purpose: Gate tests for MetricsService — registry content and RED metric
 *   recording, with no external dependencies.
 * Why important: Dashboards and alerts key on these exact metric names and
 *   labels; a silent rename would blank every panel and mute every alert.
 * Used by: jest (pnpm --filter @pataspace/api test).
 */
import { ConfigService } from '@nestjs/config';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('exposes default Node.js runtime metrics', async () => {
    const service = new MetricsService();
    const rendered = await service.render();

    expect(rendered).toContain('process_cpu_user_seconds_total');
    expect(rendered).toContain('nodejs_eventloop_lag_seconds');
    expect(service.contentType).toContain('text/plain');
  });

  it('labels every metric with the configured service name', async () => {
    const configService = { get: jest.fn().mockReturnValue('custom-api') };
    const service = new MetricsService(configService as unknown as ConfigService);

    service.startHttpRequest();
    const rendered = await service.render();

    expect(configService.get).toHaveBeenCalledWith('app.name');
    expect(rendered).toMatch(/http_server_requests_in_flight\{service="custom-api"\} 1/);
  });

  it('records request count, duration, and in-flight lifecycle', async () => {
    const service = new MetricsService();

    service.startHttpRequest();
    expect(await service.render()).toMatch(/http_server_requests_in_flight\{[^}]*\} 1/);

    service.endHttpRequest('GET', '/api/v1/listings/:id', 200, 0.05);
    const rendered = await service.render();

    expect(rendered).toMatch(
      /http_server_requests_total\{[^}]*method="GET"[^}]*route="\/api\/v1\/listings\/:id"[^}]*status_code="200"[^}]*\} 1/,
    );
    expect(rendered).toMatch(
      /http_server_request_duration_seconds_count\{[^}]*status_code="200"[^}]*\} 1/,
    );
    // 0.05s lands in the le=0.05 bucket, not le=0.025.
    expect(rendered).toMatch(/http_server_request_duration_seconds_bucket\{[^}]*le="0.05"[^}]*\} 1/);
    expect(rendered).toMatch(/http_server_requests_in_flight\{[^}]*\} 0/);
  });

  it('keeps separate label sets for distinct routes and statuses', async () => {
    const service = new MetricsService();

    service.startHttpRequest();
    service.endHttpRequest('GET', '/health', 200, 0.001);
    service.startHttpRequest();
    service.endHttpRequest('POST', '/auth/login', 401, 0.002);
    const rendered = await service.render();

    expect(rendered).toMatch(/http_server_requests_total\{[^}]*route="\/health"[^}]*\} 1/);
    expect(rendered).toMatch(
      /http_server_requests_total\{[^}]*route="\/auth\/login"[^}]*status_code="401"[^}]*\} 1/,
    );
  });
});
