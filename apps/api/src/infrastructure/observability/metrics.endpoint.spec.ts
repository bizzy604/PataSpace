/**
 * Purpose: Gate tests for GET /metrics end to end — middleware recording,
 *   exposition output, and MetricsAuthGuard token / fail-closed behaviour.
 * Why important: Proves the scrape endpoint Prometheus depends on works, that
 *   guard-rejected and unmatched requests are still measured, and that
 *   production without METRICS_TOKEN exposes nothing.
 * Used by: jest (pnpm --filter @pataspace/api test).
 */
import { Controller, Get, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createHttpMetricsMiddleware } from './http-metrics.middleware';
import { MetricsService } from './metrics.service';
import { ObservabilityModule } from './observability.module';

@Controller()
class ProbeController {
  @Get('probe/:id')
  getProbe() {
    return { ok: true };
  }
}

async function createApp(options: { environment: string; metricsToken?: string }) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [
          () => ({
            app: { name: 'pataspace-api', environment: options.environment },
            observability: { metricsToken: options.metricsToken },
          }),
        ],
      }),
      ObservabilityModule,
    ],
    controllers: [ProbeController],
  }).compile();

  const app = moduleRef.createNestApplication();
  // Mirrors configure-app.ts: API routes live under the prefix, /metrics stays
  // at the root so the nginx edge (which only forwards /api/*) never sees it.
  app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
  app.use(createHttpMetricsMiddleware(app.get(MetricsService)));
  await app.init();

  return app;
}

describe('GET /metrics', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  it('serves /metrics at the root, outside the API global prefix', async () => {
    app = await createApp({ environment: 'test' });
    const server = app.getHttpServer();

    await request(server).get('/api/v1/probe/123').expect(200);
    await request(server).get('/api/v1/metrics').expect(404);
    const response = await request(server).get('/metrics').expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('nodejs_eventloop_lag_seconds');
    expect(response.text).toMatch(
      /http_server_requests_total\{[^}]*route="\/api\/v1\/probe\/:id"[^}]*status_code="200"[^}]*\} 1/,
    );
  });

  it('records unmatched requests under a constant route label', async () => {
    app = await createApp({ environment: 'test' });
    const server = app.getHttpServer();

    await request(server).get('/definitely/not/a/route').expect(404);
    const response = await request(server).get('/metrics').expect(200);

    expect(response.text).toMatch(
      /http_server_requests_total\{[^}]*route="unmatched"[^}]*status_code="404"[^}]*\} 1/,
    );
    expect(response.text).not.toContain('definitely');
  });

  it('fails closed with 404 in production when no token is configured', async () => {
    app = await createApp({ environment: 'production' });

    await request(app.getHttpServer()).get('/metrics').expect(404);
  });

  it('requires the exact bearer token when one is configured', async () => {
    app = await createApp({ environment: 'production', metricsToken: 'scrape-secret-token' });
    const server = app.getHttpServer();

    await request(server).get('/metrics').expect(401);
    await request(server)
      .get('/metrics')
      .set('authorization', 'Bearer wrong-token')
      .expect(401);
    await request(server)
      .get('/metrics')
      .set('authorization', 'Bearer scrape-secret-token')
      .expect(200);
  });

  it('stays open outside production when no token is configured', async () => {
    app = await createApp({ environment: 'development' });

    await request(app.getHttpServer()).get('/metrics').expect(200);
  });
});
