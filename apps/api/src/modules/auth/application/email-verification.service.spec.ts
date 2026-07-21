import { BadRequestException } from '@nestjs/common';
import { hashSecretValue } from '../../../common/security/encryption.util';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  const createService = (code: {
    id: string;
    codeHash: string;
    attempts: number;
    expiresAt: Date;
  } | null) => {
    const txClient = {
      emailVerificationCode: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 'evc_new' }),
      },
    };
    const prismaService = {
      emailVerificationCode: {
        findFirst: jest.fn().mockResolvedValue(code),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'app.environment': 'test',
          'security.otpMaxAttempts': 3,
          'security.otpTtlSeconds': 300,
          'security.sandboxOtpCode': '123456',
        };
        return values[key];
      }),
    };

    return {
      service: new EmailVerificationService(prismaService as never, configService as never),
      prismaService,
      txClient,
    };
  };

  it('issue() deletes any pending code and creates a fresh one with the sandbox code', async () => {
    const { service, txClient } = createService(null);

    const result = await service.issue(txClient as never, 'email_hash');

    expect(result.code).toBe('123456');
    expect(txClient.emailVerificationCode.deleteMany).toHaveBeenCalledWith({
      where: { emailHash: 'email_hash' },
    });
    expect(txClient.emailVerificationCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attempts: 0,
        emailHash: 'email_hash',
        verified: false,
      }),
    });
  });

  it('assertValid() throws and cleans up when no pending code exists', async () => {
    const { service, prismaService } = createService(null);

    await expect(service.assertValid('email_hash', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.emailVerificationCode.deleteMany).toHaveBeenCalled();
  });

  it('assertValid() throws and cleans up when the code is expired', async () => {
    const { service, prismaService } = createService({
      id: 'evc_1',
      codeHash: hashSecretValue('123456'),
      attempts: 0,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.assertValid('email_hash', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.emailVerificationCode.deleteMany).toHaveBeenCalled();
  });

  it('assertValid() throws and cleans up when attempts are exhausted', async () => {
    const { service, prismaService } = createService({
      id: 'evc_1',
      codeHash: hashSecretValue('123456'),
      attempts: 3,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.assertValid('email_hash', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.emailVerificationCode.deleteMany).toHaveBeenCalled();
  });

  it('assertValid() increments attempts (without deleting) on a code mismatch', async () => {
    const { service, prismaService } = createService({
      id: 'evc_1',
      codeHash: 'different-hash',
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.assertValid('email_hash', '000000')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.emailVerificationCode.update).toHaveBeenCalledWith({
      where: { id: 'evc_1' },
      data: { attempts: { increment: 1 } },
    });
    expect(prismaService.emailVerificationCode.deleteMany).not.toHaveBeenCalled();
  });

  it('assertValid() resolves without throwing on a matching code', async () => {
    const { service } = createService({
      id: 'evc_1',
      codeHash: hashSecretValue('123456'),
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.assertValid('email_hash', '123456')).resolves.toBeUndefined();
  });

  it('consume() deletes every verification code for the email', async () => {
    const { service, txClient } = createService(null);

    await service.consume(txClient as never, 'email_hash');

    expect(txClient.emailVerificationCode.deleteMany).toHaveBeenCalledWith({
      where: { emailHash: 'email_hash' },
    });
  });
});
