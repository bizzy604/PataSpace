/**
 * Purpose: End-to-end proof of the verify-before-posting journey: a
 * Clerk-style account with no phone is blocked from creating a listing,
 * verifies a number via the sandbox OTP, and then posts successfully.
 * Why important: this is the exact mobile flow (no SMS provider wired yet);
 * it also pins the ownership conflict for numbers registered to others.
 * Used by: jest e2e lane (pnpm test:e2e).
 */
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { PrismaService } from '../../src/common/database/prisma.service';
import {
  hashLookupValue,
  normalizePhoneNumber,
} from '../../src/common/security/encryption.util';
import { setupSwagger } from '../../src/common/swagger/setup-swagger';
import { RedisService } from '../../src/infrastructure/cache/redis.service';
import { QueueService } from '../../src/infrastructure/queue/queue.service';
import { createInMemoryRedisService } from '../utils/create-in-memory-redis-service';

jest.setTimeout(60_000);

describe('Phone verification before posting', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let previousDatabaseUrl: string | undefined;
  const createdUserIds: string[] = [];
  const createdPhoneNumbers: string[] = [];
  let forwardedForCounter = 0;
  const forwardedForSeed = Math.floor(Math.random() * 180) + 1;

  const createForwardedFor = () => {
    const counter = forwardedForCounter;
    forwardedForCounter += 1;

    return `197.44.${((forwardedForSeed + Math.floor(counter / 200)) % 200) + 1}.${(counter % 200) + 1}`;
  };

  const createPhoneNumber = () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 100000)}`.slice(-8);
    const phoneNumber = `+2547${suffix}`;
    createdPhoneNumbers.push(phoneNumber);
    return phoneNumber;
  };

  // Mirrors ClerkJwtStrategy.createFromClerk: a Clerk sign-in produces a user
  // row with no phone at all. The minted first-party JWT stands in for the
  // Clerk token so the flow under test starts from the same principal state.
  const createClerkStyleUser = async () => {
    const user = await prismaService.user.create({
      data: {
        clerkId: `clerk_e2e_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        firstName: 'Clerk',
        lastName: 'Tester',
        isActive: true,
        credit: { create: { balance: 0 } },
      },
      select: { id: true },
    });
    createdUserIds.push(user.id);

    const accessToken = await app
      .get(JwtService)
      .signAsync({ sub: user.id, role: 'USER' }, { expiresIn: '15m' } as never);

    return { userId: user.id, accessToken };
  };

  const createConfirmedMediaSet = async (accessToken: string, label: string) => {
    const latitude = -1.289563;
    const longitude = 36.790942;
    const photos: Array<{
      url: string;
      s3Key: string;
      order: number;
      latitude: number;
      longitude: number;
      takenAt: string;
    }> = [];

    for (let index = 1; index <= 5; index += 1) {
      const createUploadResponse = await request(app.getHttpServer())
        .post('/api/v1/uploads/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Forwarded-For', createForwardedFor())
        .send({
          filename: `${label}-photo-${index}.jpg`,
          contentType: 'image/jpeg',
          fileSize: 512 * 1024,
        })
        .expect(200);

      const confirmUploadResponse = await request(app.getHttpServer())
        .post('/api/v1/uploads/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Forwarded-For', createForwardedFor())
        .send({ s3Key: createUploadResponse.body.s3Key })
        .expect(200);

      photos.push({
        url: confirmUploadResponse.body.cdnUrl as string,
        s3Key: confirmUploadResponse.body.s3Key as string,
        order: index,
        latitude,
        longitude,
        takenAt: `2026-03-2${index}T10:30:00.000Z`,
      });
    }

    return { photos, latitude, longitude };
  };

  const attemptCreateListing = async (accessToken: string, label: string) => {
    const media = await createConfirmedMediaSet(accessToken, label);

    return request(app.getHttpServer())
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Device-Type', 'mobile')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        county: 'Nairobi',
        neighborhood: 'Kilimani',
        address: `${label} House, Nairobi`,
        latitude: media.latitude,
        longitude: media.longitude,
        monthlyRent: 45000,
        bedrooms: 2,
        bathrooms: 1,
        houseType: 'TWO_BEDROOM',
        propertyType: 'Apartment',
        furnished: false,
        description: `Listing ${label} has enough detail to satisfy validation rules.`,
        amenities: ['Water 24/7', 'Parking'],
        propertyNotes: `Notes for ${label}`,
        availableFrom: '2026-05-01T00:00:00.000Z',
        availableTo: '2026-05-31T00:00:00.000Z',
        photos: media.photos,
        landlordAware: true,
      });
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
      await prismaService.oTPCode.deleteMany({
        where: { phoneNumberHash: hashLookupValue(normalizePhoneNumber(phoneNumber)) },
      });
    }

    await prismaService.listing.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prismaService.user.deleteMany({
      where: { id: { in: createdUserIds } },
    });

    await app.close();
    process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it('blocks posting until the phone is verified, then allows it', async () => {
    const { accessToken } = await createClerkStyleUser();
    const phoneNumber = createPhoneNumber();

    const profileBefore = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(profileBefore.body.phoneVerified).toBe(false);
    expect(profileBefore.body.phoneNumber).toBeNull();

    const blockedAttempt = await attemptCreateListing(accessToken, 'Blocked');
    expect(blockedAttempt.status).toBe(403);
    expect(blockedAttempt.body.error.code).toBe('PHONE_NOT_VERIFIED');

    const requestOtpResponse = await request(app.getHttpServer())
      .post('/api/v1/users/me/phone/request-otp')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({ phoneNumber })
      .expect(200);
    expect(requestOtpResponse.body.expiresIn).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post('/api/v1/users/me/phone/verify-otp')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({ phoneNumber, code: '000000' })
      .expect(400);

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/users/me/phone/verify-otp')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({ phoneNumber, code: '123456' })
      .expect(200);
    expect(verifyResponse.body.phoneVerified).toBe(true);
    expect(verifyResponse.body.phoneNumber).toBe(phoneNumber);

    const allowedAttempt = await attemptCreateListing(accessToken, 'Allowed');
    expect(allowedAttempt.status).toBe(201);
  });

  it('rejects a number already verified by another account', async () => {
    const first = await createClerkStyleUser();
    const second = await createClerkStyleUser();
    const phoneNumber = createPhoneNumber();

    await request(app.getHttpServer())
      .post('/api/v1/users/me/phone/request-otp')
      .set('Authorization', `Bearer ${first.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({ phoneNumber })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/users/me/phone/verify-otp')
      .set('Authorization', `Bearer ${first.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({ phoneNumber, code: '123456' })
      .expect(200);

    const conflict = await request(app.getHttpServer())
      .post('/api/v1/users/me/phone/request-otp')
      .set('Authorization', `Bearer ${second.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({ phoneNumber })
      .expect(409);
    expect(conflict.body.error.code).toBe('PHONE_ALREADY_REGISTERED');
  });
});
