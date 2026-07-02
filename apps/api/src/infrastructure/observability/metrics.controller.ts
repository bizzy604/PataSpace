/**
 * Purpose: Serves the Prometheus exposition endpoint at GET /metrics.
 * Why important: This is the scrape target Prometheus polls. It lives outside
 *   the /api/v1 global prefix, so the nginx edge (which only forwards /api/*)
 *   never exposes it publicly; access control is MetricsAuthGuard's job.
 * Used by: Prometheus (infra/observability) over the internal docker network.
 */
import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { MetricsAuthGuard } from './metrics-auth.guard';
import { MetricsService } from './metrics.service';

interface MetricsResponse {
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
}

@ApiExcludeController()
@Public()
// Scrapes must stay observable even when Redis (the throttler store) is down.
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @UseGuards(MetricsAuthGuard)
  @Get()
  async getMetrics(@Res() response: MetricsResponse) {
    response.setHeader('content-type', this.metricsService.contentType);
    response.send(await this.metricsService.render());
  }
}
