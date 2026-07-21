import request from 'supertest';
import { EmailService, SendMailPayload } from '../../src/infrastructure/email/email.service';
import { createVerifiedUser } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Email verification integration', () => {
  let context: ApiTestContext;
  const emailService = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    context = await createApiTestContext({
      ipRangePrefix: 68,
      overrides: [{ token: EmailService, value: emailService }],
    });
  });

  afterAll(async () => {
    await context.close();
  });

  beforeEach(() => {
    emailService.sendMail.mockClear();
  });

  function extractLink(mail: SendMailPayload): string {
    const match = mail.text?.match(/https?:\/\/\S+/);
    expect(match).toBeTruthy();
    return match![0].replace(/\.$/, '');
  }

  it('sends a code+link email and verifies via the 6-digit code, then rejects replay', async () => {
    const user = await createVerifiedUser(context);
    const forwardedFor = context.createForwardedFor();

    await request(context.app.getHttpServer())
      .post('/api/v1/auth/email-verification/request')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('X-Forwarded-For', forwardedFor)
      .expect(201);

    expect(emailService.sendMail).toHaveBeenCalledTimes(1);
    const sentMail = emailService.sendMail.mock.calls[0][0] as SendMailPayload;
    expect(sentMail.to).toBe(user.email);
    expect(sentMail.subject).toBe('Verify your PataSpace email');
    expect(sentMail.text).toContain('123456');
    expect(extractLink(sentMail)).toContain('/verify-email');

    const verifyResponse = await request(context.app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify-code')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('X-Forwarded-For', forwardedFor)
      .send({ code: '123456' })
      .expect(200);

    expect(verifyResponse.body).toMatchObject({
      id: user.userId,
      email: user.email,
      emailVerified: true,
    });

    await request(context.app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify-code')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('X-Forwarded-For', forwardedFor)
      .send({ code: '123456' })
      .expect(400);
  });

  it('rejects a wrong code without verifying', async () => {
    const user = await createVerifiedUser(context);
    const forwardedFor = context.createForwardedFor();

    await request(context.app.getHttpServer())
      .post('/api/v1/auth/email-verification/request')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('X-Forwarded-For', forwardedFor)
      .expect(201);

    await request(context.app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify-code')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('X-Forwarded-For', forwardedFor)
      .send({ code: '000000' })
      .expect(400);

    const profile = await request(context.app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(profile.body.emailVerified).toBe(false);
  });

  it('verifies via the signed magic link from the same email', async () => {
    const user = await createVerifiedUser(context);
    const forwardedFor = context.createForwardedFor();

    await request(context.app.getHttpServer())
      .post('/api/v1/auth/email-verification/request')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('X-Forwarded-For', forwardedFor)
      .expect(201);

    const sentMail = emailService.sendMail.mock.calls[0][0] as SendMailPayload;
    const link = new URL(extractLink(sentMail));
    const token = link.searchParams.get('token');
    expect(token).toBeTruthy();

    const verifyResponse = await request(context.app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify-link')
      .set('X-Forwarded-For', forwardedFor)
      .send({ email: user.email, token })
      .expect(200);

    expect(verifyResponse.body).toMatchObject({
      id: user.userId,
      email: user.email,
      emailVerified: true,
    });
  });

  it('rate-limits verification requests like the phone OTP', async () => {
    const user = await createVerifiedUser(context);
    const forwardedFor = context.createForwardedFor();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(context.app.getHttpServer())
        .post('/api/v1/auth/email-verification/request')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('X-Forwarded-For', forwardedFor)
        .expect(201);
    }

    await request(context.app.getHttpServer())
      .post('/api/v1/auth/email-verification/request')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('X-Forwarded-For', forwardedFor)
      .expect(429);
  });
});
