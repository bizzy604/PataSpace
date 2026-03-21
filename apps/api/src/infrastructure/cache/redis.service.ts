import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis({
      host: configService.get<string>('infrastructure.redis.host') ?? 'localhost',
      port: configService.get<number>('infrastructure.redis.port') ?? 6379,
      password: configService.get<string>('infrastructure.redis.password') || undefined,
      db: configService.get<number>('infrastructure.redis.db') ?? 0,
      lazyConnect: true,
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleInit() {
    if (this.client.status === 'ready') {
      return;
    }

    await this.client.connect();
    await this.client.ping();
  }

  getClient() {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client.status === 'end') {
      return;
    }

    await this.client.quit();
  }
}
