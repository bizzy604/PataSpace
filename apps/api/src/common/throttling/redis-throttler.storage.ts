import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '../../infrastructure/cache/redis.service';

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const redis = this.redisService.getClient();
    const hitKey = `throttle:${throttlerName}:${key}:hits`;
    const blockKey = `throttle:${throttlerName}:${key}:block`;
    const totalHits = await redis.incr(hitKey);
    let timeToExpireMilliseconds = await redis.pttl(hitKey);

    if (timeToExpireMilliseconds < 0 || totalHits === 1) {
      await redis.pexpire(hitKey, ttl);
      timeToExpireMilliseconds = ttl;
    }

    let timeToBlockExpireMilliseconds = await redis.pttl(blockKey);

    if (timeToBlockExpireMilliseconds > 0) {
      return {
        totalHits,
        timeToExpire: Math.ceil(timeToExpireMilliseconds / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(timeToBlockExpireMilliseconds / 1000),
      };
    }

    if (totalHits > limit) {
      await redis.set(blockKey, '1', 'PX', blockDuration);
      timeToBlockExpireMilliseconds = blockDuration;
    }

    return {
      totalHits,
      timeToExpire: Math.ceil(timeToExpireMilliseconds / 1000),
      isBlocked: timeToBlockExpireMilliseconds > 0,
      timeToBlockExpire:
        timeToBlockExpireMilliseconds > 0
          ? Math.ceil(timeToBlockExpireMilliseconds / 1000)
          : 0,
    };
  }
}
