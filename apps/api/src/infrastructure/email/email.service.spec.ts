/**
 * Purpose: Unit tests for the email service wrapper and provider delegation.
 * Why important: Email delivery is a cross-cutting concern; the service must
 *   fail predictably and preserve the provider contract.
 * Used by: auth and any future transactional email flows.
 */
import { EmailService } from './email.service';

describe('EmailService', () => {
  it('delegates email sends to the configured provider', async () => {
    const provider = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const service = new EmailService(provider as never);

    await service.sendMail({
      to: 'user@example.com',
      subject: 'Reset your password',
      html: '<p>Hi</p>',
      text: 'Hi',
    });

    expect(provider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Reset your password',
      }),
    );
  });
});
