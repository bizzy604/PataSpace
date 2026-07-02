/**
 * Purpose: Express middleware that records RED metrics for every HTTP request,
 *   including requests rejected by guards (401/429) and unmatched routes (404).
 * Why important: A Nest interceptor only sees requests that reach a handler, so
 *   auth failures and rate-limit rejections would be invisible to monitoring.
 *   Middleware observes the response 'finish' event and misses nothing.
 * Used by: configure-app.ts, installed before routing on the Express instance.
 */
import { MetricsService } from './metrics.service';

interface HttpRequestLike {
  method?: string;
  route?: { path?: string };
}

interface HttpResponseLike {
  statusCode: number;
  once: (event: string, listener: () => void) => void;
}

// Unmatched requests get a single constant route label so scanners probing
// random paths cannot inflate the metric's label cardinality.
const UNMATCHED_ROUTE = 'unmatched';

export function createHttpMetricsMiddleware(metricsService: MetricsService) {
  return (request: HttpRequestLike, response: HttpResponseLike, next: () => void) => {
    const startedAt = process.hrtime.bigint();
    let recorded = false;

    metricsService.startHttpRequest();

    const record = () => {
      if (recorded) {
        return;
      }

      recorded = true;
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
      // request.route is set by Express once routing matched, so the label is
      // the route template (e.g. /api/v1/listings/:id), never a raw URL.
      const route = request.route?.path ?? UNMATCHED_ROUTE;

      metricsService.endHttpRequest(
        request.method ?? 'UNKNOWN',
        route,
        response.statusCode,
        durationSeconds,
      );
    };

    // 'finish' covers completed responses; 'close' covers client aborts where
    // 'finish' never fires. The recorded flag makes the pair idempotent.
    response.once('finish', record);
    response.once('close', record);
    next();
  };
}
