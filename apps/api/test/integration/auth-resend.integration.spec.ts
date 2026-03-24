import request from 'supertest';
import { hashLookupValue, normalizePhoneNumber } from '../../src/common/security/encryption.util';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Auth resend-OTP integration', () => {
  let context: ApiTestContext;

  beforeAll(async () => {
    context = await createApiTestContext({
      ipRangePrefix: 66,
    });
  });

  afterAll(async () => {
    await context.close();
  });

  it('resends a fresh OTP for a pending account and rotates the stored OTP record', async () => {
    const phoneNumber = context.createPhoneNumber();
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
    const forwardedFor = context.createForwardedFor();

    const registerResponse = await request(context.app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', forwardedFor)
      .send({
        phoneNumber,
        password: 'SecurePassword123!',
        firstName: 'Pending',
        lastName: 'User',
      })
      .expect(201);

    const originalOtp = await context.prismaService.oTPCode.findFirstOrThrow({
      where: {
        phoneNumberHash,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    const resendResponse = await request(context.app.getHttpServer())
      .post('/api/v1/auth/resend-otp')
      .set('X-Forwarded-For', context.createForwardedFor())
      .send({
        phoneNumber,
      })
      .expect(200);

    expect(resendResponse.body).toEqual({
      userId: registerResponse.body.userId,
      message: `OTP resent to ${phoneNumber}`,
      expiresIn: 300,
    });

    const otpRecords = await context.prismaService.oTPCode.findMany({
      where: {
        phoneNumberHash,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        verified: true,
      },
    });

    expect(otpRecords).toHaveLength(1);
    expect(otpRecords[0].id).not.toBe(originalOtp.id);
    expect(otpRecords[0].verified).toBe(false);

    const verifyResponse = await request(context.app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .set('X-Forwarded-For', context.createForwardedFor())
      .send({
        phoneNumber,
        code: '123456',
      })
      .expect(200);

    expect(verifyResponse.body.user).toMatchObject({
      id: registerResponse.body.userId,
      phoneNumber,
      phoneVerified: true,
    });
  });

  it('applies resend-specific throttling with the standard error envelope', async () => {
    const phoneNumber = context.createPhoneNumber();
    const forwardedFor = context.createForwardedFor();

    await request(context.app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', forwardedFor)
      .send({
        phoneNumber,
        password: 'SecurePassword123!',
        firstName: 'Rate',
        lastName: 'Limited',
      })
      .expect(201);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(context.app.getHttpServer())
        .post('/api/v1/auth/resend-otp')
        .set('X-Forwarded-For', forwardedFor)
        .send({
          phoneNumber,
        })
        .expect(200);
    }

    const throttledResponse = await request(context.app.getHttpServer())
      .post('/api/v1/auth/resend-otp')
      .set('X-Forwarded-For', forwardedFor)
      .send({
        phoneNumber,
      })
      .expect(429);

    expect(throttledResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(throttledResponse.body.meta.requestId).toBeTruthy();
    expect(throttledResponse.headers['x-ratelimit-limit']).toBe('3');
  });
});
