import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { PrismaService } from '../../src/common/database/prisma.service';
import { hashLookupValue, normalizePhoneNumber } from '../../src/common/security/encryption.util';
import { setupSwagger } from '../../src/common/swagger/setup-swagger';
import { RedisService } from '../../src/infrastructure/cache/redis.service';
import { QueueService } from '../../src/infrastructure/queue/queue.service';
import { createInMemoryRedisService } from './create-in-memory-redis-service';

const DEFAULT_TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pataspace';

type CreateApiTestContextOptions = {
  databaseUrl?: string;
  ipRangePrefix?: number;
  overrides?: Array<{
    token: string | symbol | Function;
    value: unknown;
  }>;
};

export type ApiTestContext = {
  app: INestApplication;
  prismaService: PrismaService;
  createForwardedFor: () => string;
  createPhoneNumber: () => string;
  cleanupPhoneNumber: (phoneNumber: string) => Promise<void>;
  get: <T>(token: string | symbol | Function) => T;
  close: () => Promise<void>;
};

export async function createApiTestContext(
  options: CreateApiTestContextOptions = {},
): Promise<ApiTestContext> {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = options.databaseUrl ?? DEFAULT_TEST_DATABASE_URL;

  let testingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(RedisService)
    .useValue(createInMemoryRedisService())
    .overrideProvider(QueueService)
    .useValue({
      healthCheck: jest.fn().mockResolvedValue({ status: 'up', provider: 'bullmq' }),
    });

  for (const override of options.overrides ?? []) {
    testingModuleBuilder = testingModuleBuilder
      .overrideProvider(override.token as never)
      .useValue(override.value);
  }

  const moduleRef = await testingModuleBuilder.compile();

  const app = moduleRef.createNestApplication();
  const configService = app.get(ConfigService);
  const { globalPrefix } = configureApp(app);
  setupSwagger(app, configService, globalPrefix);
  await app.init();

  const prismaService = app.get(PrismaService);
  const createdPhoneNumbers: string[] = [];
  let forwardedForCounter = 0;
  const forwardedForSeed = Math.floor(Math.random() * 180) + 1;
  const ipRangePrefix = options.ipRangePrefix ?? 60;

  const cleanupPhoneNumber = async (phoneNumber: string) => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
    const user = await prismaService.user.findUnique({
      where: {
        phoneNumberHash,
      },
      select: {
        id: true,
      },
    });

    await prismaService.oTPCode.deleteMany({
      where: {
        phoneNumberHash,
      },
    });

    if (user) {
      await prismaService.user.delete({
        where: {
          id: user.id,
        },
      });
    }
  };

  return {
    app,
    prismaService,
    createForwardedFor: () => {
      const counter = forwardedForCounter;
      forwardedForCounter += 1;

      return `198.${ipRangePrefix}.${((forwardedForSeed + Math.floor(counter / 200)) % 200) + 1}.${(counter % 200) + 1}`;
    },
    createPhoneNumber: () => {
      const suffix = `${Date.now()}${Math.floor(Math.random() * 100000)}`.slice(-8);
      const phoneNumber = `+2547${suffix}`;
      createdPhoneNumbers.push(phoneNumber);
      return phoneNumber;
    },
    cleanupPhoneNumber,
    get: <T>(token: string | symbol | Function): T => app.get<T>(token as never),
    close: async () => {
      for (const phoneNumber of createdPhoneNumbers) {
        await cleanupPhoneNumber(phoneNumber);
      }

      await app.close();
      process.env.DATABASE_URL = previousDatabaseUrl;
    },
  };
}
