import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';

@Injectable()
export class ApiThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected override async handleRequest(
    requestProps: Parameters<ThrottlerGuard['handleRequest']>[0],
  ): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, getTracker, generateKey } =
      requestProps;
    const { req, res } = this.getRequestResponse(context);
    const tracker = await getTracker(req, context);
    const throttlerName = throttler.name ?? 'default';
    const key = generateKey(context, tracker, throttlerName);
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(key, ttl, limit, blockDuration, throttlerName);

    const resetAt = Math.floor(Date.now() / 1000) + timeToExpire;
    res.header('X-RateLimit-Limit', String(limit));
    res.header('X-RateLimit-Remaining', String(Math.max(0, limit - totalHits)));
    res.header('X-RateLimit-Reset', String(resetAt));

    if (isBlocked) {
      res.header('Retry-After', String(timeToBlockExpire));

      throw new HttpException(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Try again in ${timeToBlockExpire} seconds.`,
          retryAfter: timeToBlockExpire,
          details: {
            limit,
            retryAfter: timeToBlockExpire,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
