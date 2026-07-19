import request from 'supertest';
import { EmailService, SendMailPayload } from '../../src/infrastructure/email/email.service';
import { createVerifiedUser } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Auth magic-link integration', () => {
  let context: ApiTestContext;
  const emailService = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    context = await createApiTestContext({
      ipRangePrefix: 67,
      overrides: [{ token: EmailService, value: emailService }],
    });
  });

  afterAll(async () => {
    await context.close();
  });

  beforeEach(() => {
    emailService.sendMail.mockClear();
  });

  it('sends a magic link and exchanges its token for an authenticated session', async () => {
    const user = await createVerifiedUser(context);

    await request(context.app.getHttpServer())
      .post('/api/v1/auth/magic-link/request')
      .set('X-Forwarded-For', context.createForwardedFor())
      .send({ email: user.email })
      .expect(200);

    expect(emailService.sendMail).toHaveBeenCalledTimes(1);
    const sentMail = emailService.sendMail.mock.calls[0][0] as SendMailPayload;
    expect(sentMail).toMatchObject({
      to: user.email,
      subject: 'Sign in to PataSpace',
    });

    const link = new URL(sentMail.text?.replace('Use the following link to sign in to PataSpace: ', '') ?? '');
    const token = link.searchParams.get('token');
    expect(token).toBeTruthy();

    const signInResponse = await request(context.app.getHttpServer())
      .post('/api/v1/auth/magic-link/sign-in')
      .set('X-Forwarded-For', context.createForwardedFor())
      .send({ email: user.email, token })
      .expect(200);

    expect(signInResponse.body).toMatchObject({
      user: {
        id: user.userId,
        email: user.email,
      },
    });
    expect(signInResponse.body.accessToken).toBeTruthy();
    expect(signInResponse.body.refreshToken).toBeTruthy();
  });
});
