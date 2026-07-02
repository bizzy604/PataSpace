/**
 * Purpose: Guards the /metrics endpoint with an optional static bearer token.
 * Why important: /metrics leaks operational detail (routes, error rates, memory).
 *   In production the endpoint fails closed (404) until METRICS_TOKEN is set, so
 *   a host proxy that forwards every path cannot expose it by accident. Outside
 *   production it stays open for local Prometheus and development.
 * Used by: MetricsController via @UseGuards.
 */
import { timingSafeEqual } from 'crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetricsAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedToken = this.configService.get<string>('observability.metricsToken');

    if (!expectedToken) {
      if (this.configService.get<string>('app.environment') === 'production') {
        // Fail closed and hide the endpoint's existence until a token is set.
        throw new NotFoundException();
      }

      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const authorizationHeader = request.headers['authorization'];
    const presentedToken =
      typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')
        ? authorizationHeader.slice('Bearer '.length)
        : '';

    if (!safeEquals(presentedToken, expectedToken)) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'A valid metrics bearer token is required.',
      });
    }

    return true;
  }
}

function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}
