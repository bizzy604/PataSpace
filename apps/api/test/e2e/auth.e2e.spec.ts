import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { setupSwagger } from '../../src/common/swagger/setup-swagger';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../src/common/database/prisma.service';
import { hashLookupValue, normalizePhoneNumber } from '../../src/common/security/encryption.util';
import { RedisService } from '../../src/infrastructure/cache/redis.service';
import { QueueService } from '../../src/infrastructure/queue/queue.service';
import { createInMemoryRedisService } from '../utils/create-in-memory-redis-service';

describe('Auth and user flows', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let previousDatabaseUrl: string | undefined;
  const createdPhoneNumbers: string[] = [];

  const createForwardedFor = () =>
    `198.51.100.${Math.floor(Math.random() * 150) + 30}`;

  const createPhoneNumber = () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 100000)}`.slice(-8);
    const phoneNumber = `+2547${suffix}`;
    createdPhoneNumbers.push(phoneNumber);
    return phoneNumber;
  };

  const cleanupPhone = async (phoneNumber: string) => {
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

  beforeAll(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pataspace';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(createInMemoryRedisService())
      .overrideProvider(QueueService)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ status: 'up', provider: 'bullmq' }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    const configService = app.get(ConfigService);
    const { globalPrefix } = configureApp(app);
    setupSwagger(app, configService, globalPrefix);
    await app.init();

    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    for (const phoneNumber of createdPhoneNumbers) {
      await cleanupPhone(phoneNumber);
    }

    await app.close();
    process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it('registers, verifies OTP, returns profile, refreshes, and logs out', async () => {
    const phoneNumber = createPhoneNumber();
    const password = 'SecurePassword123!';
    const forwardedFor = createForwardedFor();

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', forwardedFor)
      .send({
        phoneNumber,
        password,
        firstName: 'Alice',
        lastName: 'Otieno',
        email: `alice.${phoneNumber.slice(-4)}@example.com`,
      })
      .expect(201);

    expect(registerResponse.body).toMatchObject({
      message: `OTP sent to ${phoneNumber}`,
      expiresIn: 300,
    });

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .set('X-Forwarded-For', forwardedFor)
      .send({
        phoneNumber,
        code: '123456',
      })
      .expect(200);

    expect(verifyResponse.body).toMatchObject({
      user: {
        phoneNumber,
        firstName: 'Alice',
        lastName: 'Otieno',
        phoneVerified: true,
        role: 'USER',
      },
    });
    expect(verifyResponse.body.accessToken).toBeTruthy();
    expect(verifyResponse.body.refreshToken).toBeTruthy();

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${verifyResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body).toMatchObject({
      phoneNumber,
      firstName: 'Alice',
      lastName: 'Otieno',
      phoneVerified: true,
      role: 'USER',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        phoneNumber,
        password,
      })
      .expect(200);

    expect(loginResponse.body.accessToken).toBeTruthy();
    expect(loginResponse.body.refreshToken).toBeTruthy();

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        refreshToken: loginResponse.body.refreshToken,
      })
      .expect(200);

    expect(refreshResponse.body.accessToken).toBeTruthy();
    expect(refreshResponse.body.refreshToken).toBeTruthy();
    expect(refreshResponse.body.refreshToken).not.toEqual(loginResponse.body.refreshToken);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        refreshToken: loginResponse.body.refreshToken,
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${verifyResponse.body.accessToken}`)
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(401);
  });

  it('rejects duplicate verified registration, wrong OTP, and wrong password login', async () => {
    const phoneNumber = createPhoneNumber();
    const password = 'SecurePassword123!';
    const forwardedFor = createForwardedFor();

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', forwardedFor)
      .send({
        phoneNumber,
        password,
        firstName: 'Brian',
        lastName: 'Njoroge',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .set('X-Forwarded-For', forwardedFor)
      .send({
        phoneNumber,
        code: '123456',
      })
      .expect(200);

    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        phoneNumber,
        password,
        firstName: 'Brian',
        lastName: 'Njoroge',
      })
      .expect(409);

    expect(duplicateResponse.body.error.code).toBe('PHONE_ALREADY_REGISTERED');

    const pendingPhoneNumber = createPhoneNumber();

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        phoneNumber: pendingPhoneNumber,
        password,
        firstName: 'Carol',
        lastName: 'Kamau',
      })
      .expect(201);

    const wrongOtpResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        phoneNumber: pendingPhoneNumber,
        code: '654321',
      })
      .expect(400);

    expect(wrongOtpResponse.body.error.code).toBe('INVALID_OTP');

    const wrongPasswordResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        phoneNumber,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(wrongPasswordResponse.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
