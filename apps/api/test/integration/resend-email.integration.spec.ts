import { ConfigService } from '@nestjs/config';
import { ResendEmailProvider } from '../../src/infrastructure/email/providers/resend-email.provider';

jest.setTimeout(60_000);

const recipient = process.env.RESEND_INTEGRATION_RECIPIENT;
const apiKey = process.env.RESEND_API_KEY;
const runLiveTest = process.env.RUN_RESEND_INTEGRATION_TESTS === 'true';
const canRunLiveTest = Boolean(runLiveTest && apiKey && recipient);

describe('ResendEmailProvider live integration', () => {
  if (!canRunLiveTest) {
    it.skip('requires RUN_RESEND_INTEGRATION_TESTS=true, RESEND_API_KEY, and RESEND_INTEGRATION_RECIPIENT', () => {});
    return;
  }

  it('submits a transactional email to Resend', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | undefined> = {
          'infrastructure.email.resend.apiKey': apiKey,
          'infrastructure.email.resend.from': process.env.EMAIL_FROM,
        };
        return values[key];
      }),
    };
    const provider = new ResendEmailProvider(configService as unknown as ConfigService);
    const testId = `resend-integration-${Date.now()}`;

    await expect(
      provider.send({
        to: recipient as string,
        subject: `PataSpace Resend integration test (${testId})`,
        text: `Resend accepted this PataSpace integration test email. Test ID: ${testId}`,
        html: `<p>Resend accepted this PataSpace integration test email.</p><p>Test ID: ${testId}</p>`,
      }),
    ).resolves.toBeUndefined();
  });
});
