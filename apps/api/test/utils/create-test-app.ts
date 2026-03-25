import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { PrismaService } from '../../src/common/database/prisma.service';
import { CacheService } from '../../src/infrastructure/cache/cache.service';
import { SmsService } from '../../src/infrastructure/sms/sms.service';
import { StorageService } from '../../src/infrastructure/storage/storage.service';
import { MpesaClient } from '../../src/infrastructure/payment/mpesa.client';
import { QueueService } from '../../src/infrastructure/queue/queue.service';
import { RedisService } from '../../src/infrastructure/cache/redis.service';
import { setupSwagger } from '../../src/common/swagger/setup-swagger';
import { createInMemoryRedisService } from './create-in-memory-redis-service';

type TestAppOptions = {
  databaseHealth?: {
    shouldFail?: boolean;
  };
  cacheHealth?: {
    status: 'up' | 'degraded' | 'down';
    provider: string;
  };
  queueHealth?: {
    status: 'up' | 'degraded' | 'down';
    provider: string;
  };
  smsHealth?: {
    status: 'up' | 'degraded' | 'down';
    provider: string;
  };
  storageHealth?: {
    status: 'up' | 'degraded' | 'down';
    provider: string;
  };
  mpesaHealth?: {
    status: 'up' | 'degraded' | 'down';
    provider: string;
  };
  providerOverrides?: Array<{
    token: Function | string | symbol;
    value: unknown;
  }>;
};

export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication> {
  let testingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      $queryRawUnsafe: options.databaseHealth?.shouldFail
        ? jest.fn().mockRejectedValue(new Error('database unavailable'))
        : jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    })
    .overrideProvider(RedisService)
    .useValue(createInMemoryRedisService())
    .overrideProvider(CacheService)
    .useValue({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      setIfNotExists: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
      healthCheck: jest.fn().mockResolvedValue({
        status: options.cacheHealth?.status ?? 'up',
        provider: options.cacheHealth?.provider ?? 'redis',
      }),
    })
    .overrideProvider(QueueService)
    .useValue({
      healthCheck: jest.fn().mockResolvedValue({
        status: options.queueHealth?.status ?? 'up',
        provider: options.queueHealth?.provider ?? 'bullmq',
      }),
    })
    .overrideProvider(SmsService)
    .useValue({
      healthCheck: jest.fn().mockResolvedValue({
        status: options.smsHealth?.status ?? 'up',
        provider: options.smsHealth?.provider ?? 'sandbox',
      }),
    })
    .overrideProvider(StorageService)
    .useValue({
      healthCheck: jest.fn().mockResolvedValue({
        status: options.storageHealth?.status ?? 'up',
        provider: options.storageHealth?.provider ?? 'sandbox',
      }),
    })
    .overrideProvider(MpesaClient)
    .useValue({
      healthCheck: jest.fn().mockResolvedValue({
        status: options.mpesaHealth?.status ?? 'up',
        provider: options.mpesaHealth?.provider ?? 'sandbox',
      }),
    });

  for (const providerOverride of options.providerOverrides ?? []) {
    testingModuleBuilder = testingModuleBuilder
      .overrideProvider(providerOverride.token as never)
      .useValue(providerOverride.value);
  }

  const moduleRef = await testingModuleBuilder.compile();

  const app = moduleRef.createNestApplication();
  const configService = app.get(ConfigService);
  const { globalPrefix } = configureApp(app);
  setupSwagger(app, configService, globalPrefix);
  await app.init();

  return app;
}
