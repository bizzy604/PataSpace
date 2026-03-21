import request from 'supertest';
import { Body, Controller, Get, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../../src/common/decorators/public.decorator';
import { Roles } from '../../src/common/decorators/roles.decorator';
import { CurrentUser } from '../../src/common/decorators/current-user.decorator';
import { Idempotent } from '../../src/common/idempotency/idempotency.decorator';
import { ApiRateLimit } from '../../src/common/throttling/rate-limit.decorator';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { PrismaService } from '../../src/common/database/prisma.service';
import { MpesaClient } from '../../src/infrastructure/payment/mpesa.client';
import { SmsService } from '../../src/infrastructure/sms/sms.service';
import { StorageService } from '../../src/infrastructure/storage/storage.service';
import { Role } from '@prisma/client';

@Controller('phase2')
class Phase2TestController {
  private idempotentCounter = 0;

  @Public()
  @Post('rate-limited')
  @ApiRateLimit('authLogin')
  createRateLimited() {
    return {
      accepted: true,
    };
  }

  @Roles(Role.ADMIN)
  @Post('idempotent')
  @Idempotent()
  createIdempotent(@Body() body: { value: string }) {
    this.idempotentCounter += 1;

    return {
      count: this.idempotentCounter,
      value: body.value,
    };
  }

  @Roles(Role.ADMIN)
  @Get('protected')
  getProtected(@CurrentUser() user: { id: string; role: Role }) {
    return {
      userId: user.id,
      role: user.role,
    };
  }
}

describe('Phase 2 cross-cutting infrastructure', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [Phase2TestController],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .overrideProvider(SmsService)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ status: 'up', provider: 'sandbox' }),
      })
      .overrideProvider(StorageService)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ status: 'up', provider: 'sandbox' }),
      })
      .overrideProvider(MpesaClient)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ status: 'up', provider: 'sandbox' }),
      })
      .compile();

    jwtService = moduleRef.get(JwtService);
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces auth and role guards', async () => {
    await request(app.getHttpServer()).get('/api/v1/phase2/protected').expect(401);

    const userToken = jwtService.sign({
      sub: 'user_1',
      role: Role.USER,
    });

    await request(app.getHttpServer())
      .get('/api/v1/phase2/protected')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    const adminToken = jwtService.sign({
      sub: 'admin_1',
      role: Role.ADMIN,
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/phase2/protected')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual({
      userId: 'admin_1',
      role: Role.ADMIN,
    });
  });

  it('replays idempotent POST requests without executing twice', async () => {
    const adminToken = jwtService.sign({
      sub: 'admin_2',
      role: Role.ADMIN,
    });
    const idempotencyKey = `phase2-idempotent-${Date.now()}`;

    const firstResponse = await request(app.getHttpServer())
      .post('/api/v1/phase2/idempotent')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        value: 'alpha',
      })
      .expect(201);

    expect(firstResponse.body).toEqual({
      count: 1,
      value: 'alpha',
    });

    const replayResponse = await request(app.getHttpServer())
      .post('/api/v1/phase2/idempotent')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        value: 'alpha',
      })
      .expect(200);

    expect(replayResponse.body).toEqual({
      count: 1,
      value: 'alpha',
    });
    expect(replayResponse.headers['x-idempotent']).toBe('true');

    const conflictResponse = await request(app.getHttpServer())
      .post('/api/v1/phase2/idempotent')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        value: 'beta',
      })
      .expect(409);

    expect(conflictResponse.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('applies endpoint-specific rate limits and headers', async () => {
    const forwardedFor = `198.51.100.${(Date.now() % 200) + 20}`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/phase2/rate-limited')
        .set('X-Forwarded-For', forwardedFor)
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .post('/api/v1/phase2/rate-limited')
      .set('X-Forwarded-For', forwardedFor)
      .expect(429);

    expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(response.headers['x-ratelimit-limit']).toBe('5');
    expect(response.headers['retry-after']).toBeDefined();
  });
});
