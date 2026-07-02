/**
 * Purpose: Wires the Prometheus metrics registry, the /metrics endpoint, and
 *   its auth guard into the application.
 * Why important: Global so any module can inject MetricsService to publish
 *   domain metrics without new wiring; the HTTP middleware itself is installed
 *   in configure-app.ts so it also sees guard-rejected and unmatched requests.
 * Used by: AppModule (imports), configure-app.ts (resolves MetricsService).
 */
import { Global, Module } from '@nestjs/common';
import { MetricsAuthGuard } from './metrics-auth.guard';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsAuthGuard],
  exports: [MetricsService],
})
export class ObservabilityModule {}
