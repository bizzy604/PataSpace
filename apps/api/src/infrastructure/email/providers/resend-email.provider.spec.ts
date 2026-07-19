import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ResendEmailProvider } from './resend-email.provider';

jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

describe('ResendEmailProvider', () => {
  const createProvider = (send = jest.fn().mockResolvedValue({ data: { id: 'email_1' }, error: null })) => {
    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: { send },
    }));
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'infrastructure.email.resend.apiKey': 're_test_key',
          'infrastructure.email.resend.from': 'PataSpace <no-reply@example.com>',
        };
        return values[key];
      }),
    };

    return {
      provider: new ResendEmailProvider(configService as unknown as ConfigService),
      send,
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits the configured sender and email content to Resend', async () => {
    const { provider, send } = createProvider();

    await provider.send({
      to: 'user@example.com',
      subject: 'PataSpace test email',
      html: '<p>HTML content</p>',
      text: 'Text content',
    });

    expect(send).toHaveBeenCalledWith({
      from: 'PataSpace <no-reply@example.com>',
      to: ['user@example.com'],
      subject: 'PataSpace test email',
      html: '<p>HTML content</p>',
      text: 'Text content',
    });
  });

  it('surfaces Resend API delivery errors', async () => {
    const { provider } = createProvider(
      jest.fn().mockResolvedValue({ data: null, error: { message: 'Invalid API key' } }),
    );

    await expect(provider.send({ to: 'user@example.com', subject: 'PataSpace test email' })).rejects.toThrow(
      'Resend email delivery failed: Invalid API key',
    );
  });
});
