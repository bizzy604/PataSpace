import { BadRequestException, Controller, Get, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { Public } from '../../src/common/decorators/public.decorator';
import { ApiRateLimit } from '../../src/common/throttling/rate-limit.decorator';
import { PrismaService } from '../../src/common/database/prisma.service';
import { CacheService } from '../../src/infrastructure/cache/cache.service';
import { QueueService } from '../../src/infrastructure/queue/queue.service';
import { MpesaClient } from '../../src/infrastructure/payment/mpesa.client';
import { SmsService } from '../../src/infrastructure/sms/sms.service';
import { StorageService } from '../../src/infrastructure/storage/storage.service';

@Controller('integration-http')
class IntegrationHttpTestController {
  @Public()
  @Post('rate-limited')
  @ApiRateLimit('authLogin')
  createRateLimited() {
    return {
      accepted: true,
    };
  }

  @Public()
  @Get('boom')
  getBoom() {
    throw new BadRequestException({
      code: 'TEST_FAILURE',
      details: {
        reason: 'integration',
      },
      message: 'Integration failure',
    });
  }
}

describe('Cross-cutting HTTP integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [IntegrationHttpTestController],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .overrideProvider(CacheService)
      .useValue({
        del: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue(null),
        healthCheck: jest.fn().mockResolvedValue({ provider: 'redis', status: 'up' }),
        set: jest.fn().mockResolvedValue(undefined),
        setIfNotExists: jest.fn().mockResolvedValue(true),
      })
      .overrideProvider(QueueService)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ provider: 'bullmq', status: 'up' }),
      })
      .overrideProvider(SmsService)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ provider: 'sandbox', status: 'up' }),
      })
      .overrideProvider(StorageService)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ provider: 'sandbox', status: 'up' }),
      })
      .overrideProvider(MpesaClient)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ provider: 'sandbox', status: 'up' }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces endpoint rate limits with the standard error envelope', async () => {
    const forwardedFor = `198.51.100.${(Date.now() % 200) + 20}`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/integration-http/rate-limited')
        .set('X-Forwarded-For', forwardedFor)
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .post('/api/v1/integration-http/rate-limited')
      .set('X-Forwarded-For', forwardedFor)
      .expect(429);

    expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(response.body.meta.requestId).toBeTruthy();
    expect(response.headers['retry-after']).toBeDefined();
    expect(response.headers['x-ratelimit-limit']).toBe('5');
  });

  it('propagates request IDs through the exception filter envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/integration-http/boom')
      .set('X-Request-Id', 'integration-request-1')
      .expect(400);

    expect(response.headers['x-request-id']).toBe('integration-request-1');
    expect(response.body).toMatchObject({
      error: {
        code: 'TEST_FAILURE',
        details: {
          reason: 'integration',
        },
        message: 'Integration failure',
        statusCode: 400,
      },
      meta: {
        path: '/api/v1/integration-http/boom',
        requestId: 'integration-request-1',
      },
    });
  });
});
