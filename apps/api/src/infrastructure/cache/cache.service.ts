import { Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly requestContext: RequestContextService,
  ) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.redisService.getClient().get(key);

    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number) {
    const serializedValue = this.serialize(value);

    if (ttlSeconds) {
      await this.redisService.getClient().set(key, serializedValue, 'EX', ttlSeconds);
    } else {
      await this.redisService.getClient().set(key, serializedValue);
    }

    this.logger.debug(
      JSON.stringify({
        event: 'cache.set',
        key,
        ttlSeconds: ttlSeconds ?? null,
        requestId: this.requestContext.getRequestId() ?? null,
      }),
    );
  }

  async setIfNotExists(key: string, value: unknown, ttlSeconds: number) {
    const result = await this.redisService
      .getClient()
      .set(key, this.serialize(value), 'EX', ttlSeconds, 'NX');

    return result === 'OK';
  }

  async del(key: string) {
    await this.redisService.getClient().del(key);
  }

  async healthCheck() {
    try {
      await this.redisService.getClient().ping();

      return {
        status: 'up' as const,
        provider: 'redis',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        provider: 'redis',
        message: error instanceof Error ? error.message : 'Redis ping failed',
      };
    }
  }

  private serialize(value: unknown) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}
