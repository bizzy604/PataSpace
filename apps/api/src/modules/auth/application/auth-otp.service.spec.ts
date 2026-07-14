import { BadRequestException } from '@nestjs/common';
import { hashSecretValue } from '../../../common/security/encryption.util';
import { AuthOtpService } from './auth-otp.service';

describe('AuthOtpService', () => {
  const createService = (otp: {
    id: string;
    codeHash: string;
    attempts: number;
    expiresAt: Date;
  } | null) => {
    const txClient = {
      oTPCode: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 'otp_new' }),
      },
    };
    const prismaService = {
      oTPCode: {
        findFirst: jest.fn().mockResolvedValue(otp),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'app.environment': 'test',
          'infrastructure.sms.provider': 'sandbox',
          'security.otpMaxAttempts': 3,
          'security.otpTtlSeconds': 300,
          'security.sandboxOtpCode': '123456',
        };
        return values[key];
      }),
    };

    return {
      service: new AuthOtpService(prismaService as never, configService as never),
      prismaService,
      txClient,
    };
  };

  it('issue() deletes any pending OTP and creates a fresh one with the sandbox code', async () => {
    const { service, txClient } = createService(null);

    const result = await service.issue(txClient as never, 'phone_hash');

    expect(result.code).toBe('123456');
    expect(txClient.oTPCode.deleteMany).toHaveBeenCalledWith({ where: { phoneNumberHash: 'phone_hash' } });
    expect(txClient.oTPCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attempts: 0,
        phoneNumberHash: 'phone_hash',
        verified: false,
      }),
    });
  });

  it('assertValid() throws and cleans up when no pending OTP exists', async () => {
    const { service, prismaService } = createService(null);

    await expect(service.assertValid('phone_hash', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.oTPCode.deleteMany).toHaveBeenCalled();
  });

  it('assertValid() throws and cleans up when the OTP is expired', async () => {
    const { service, prismaService } = createService({
      id: 'otp_1',
      codeHash: hashSecretValue('123456'),
      attempts: 0,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.assertValid('phone_hash', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.oTPCode.deleteMany).toHaveBeenCalled();
  });

  it('assertValid() throws and cleans up when attempts are exhausted', async () => {
    const { service, prismaService } = createService({
      id: 'otp_1',
      codeHash: hashSecretValue('123456'),
      attempts: 3,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.assertValid('phone_hash', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.oTPCode.deleteMany).toHaveBeenCalled();
  });

  it('assertValid() increments attempts (without deleting) on a code mismatch', async () => {
    const { service, prismaService } = createService({
      id: 'otp_1',
      codeHash: 'different-hash',
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.assertValid('phone_hash', '000000')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaService.oTPCode.update).toHaveBeenCalledWith({
      where: { id: 'otp_1' },
      data: { attempts: { increment: 1 } },
    });
    expect(prismaService.oTPCode.deleteMany).not.toHaveBeenCalled();
  });

  it('assertValid() resolves without throwing on a matching code', async () => {
    const { service } = createService({
      id: 'otp_1',
      codeHash: hashSecretValue('123456'),
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.assertValid('phone_hash', '123456')).resolves.toBeUndefined();
  });

  it('consume() deletes every OTP record for the phone', async () => {
    const { service, txClient } = createService(null);

    await service.consume(txClient as never, 'phone_hash');

    expect(txClient.oTPCode.deleteMany).toHaveBeenCalledWith({ where: { phoneNumberHash: 'phone_hash' } });
  });
});
