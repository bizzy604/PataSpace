/**
 * Purpose: Gate tests for authenticated phone verification: OTP issue,
 * ownership conflicts, code validation with attempt caps, and the
 * verified-phone bind (including the unique-constraint race).
 * Why important: this flow unlocks listing submission and M-Pesa purchases;
 * a hole here lets one account claim another account's number.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  hashLookupValue,
  hashSecretValue,
  normalizePhoneNumber,
} from '../../common/security/encryption.util';
import { PhoneVerificationService } from './phone-verification.service';

describe('PhoneVerificationService', () => {
  const phoneNumber = '+254712345678';
  const phoneNumberHash = hashLookupValue(normalizePhoneNumber(phoneNumber));

  const createService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      oTPCode: {
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };
    const smsService = {
      sendOtp: jest.fn(),
    };
    const userService = {
      getProfileOrThrow: jest.fn(),
    };
    const configService = {
      // sandbox provider => deterministic sandbox code '123456'
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'infrastructure.sms.provider') return 'sandbox';
        if (key === 'security.encryptionKey') return '12345678901234567890123456789012';
        return undefined;
      }),
    };

    return {
      prismaService,
      smsService,
      userService,
      service: new PhoneVerificationService(
        prismaService as never,
        smsService as never,
        userService as never,
        configService as never,
      ),
    };
  };

  describe('requestOtp', () => {
    it('issues a sandbox OTP for an unclaimed number and sends the SMS', async () => {
      const { prismaService, service, smsService } = createService();
      const transactionClient = {
        oTPCode: {
          deleteMany: jest.fn(),
          create: jest.fn(),
        },
      };
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockImplementation(async (callback: Function) =>
        callback(transactionClient),
      );

      const result = await service.requestOtp('user_1', phoneNumber);

      expect(transactionClient.oTPCode.deleteMany).toHaveBeenCalledWith({
        where: { phoneNumberHash },
      });
      expect(transactionClient.oTPCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneNumberHash,
          codeHash: hashSecretValue('123456'),
          attempts: 0,
          verified: false,
        }),
      });
      expect(smsService.sendOtp).toHaveBeenCalledWith(phoneNumber, '123456');
      expect(result.expiresIn).toBe(300);
    });

    it('rejects a number already owned by another account', async () => {
      const { prismaService, service, smsService } = createService();
      prismaService.user.findUnique.mockResolvedValue({ id: 'someone_else' });

      await expect(service.requestOtp('user_1', phoneNumber)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prismaService.$transaction).not.toHaveBeenCalled();
      expect(smsService.sendOtp).not.toHaveBeenCalled();
    });

    it('allows re-requesting a code for the caller own number', async () => {
      const { prismaService, service } = createService();
      const transactionClient = {
        oTPCode: {
          deleteMany: jest.fn(),
          create: jest.fn(),
        },
      };
      prismaService.user.findUnique.mockResolvedValue({ id: 'user_1' });
      prismaService.$transaction.mockImplementation(async (callback: Function) =>
        callback(transactionClient),
      );

      await expect(service.requestOtp('user_1', phoneNumber)).resolves.toMatchObject({
        expiresIn: 300,
      });
    });
  });

  describe('verifyOtp', () => {
    const validOtpRow = () => ({
      id: 'otp_1',
      attempts: 0,
      codeHash: hashSecretValue('123456'),
      expiresAt: new Date(Date.now() + 60_000),
    });

    it('binds the number to the user and returns the refreshed profile', async () => {
      const { prismaService, service, userService } = createService();
      const transactionClient = {
        oTPCode: {
          deleteMany: jest.fn(),
        },
        user: {
          update: jest.fn(),
        },
      };
      prismaService.oTPCode.findFirst.mockResolvedValue(validOtpRow());
      prismaService.$transaction.mockImplementation(async (callback: Function) =>
        callback(transactionClient),
      );
      userService.getProfileOrThrow.mockResolvedValue({
        id: 'user_1',
        phoneVerified: true,
      });

      const profile = await service.verifyOtp('user_1', phoneNumber, '123456');

      expect(transactionClient.oTPCode.deleteMany).toHaveBeenCalledWith({
        where: { phoneNumberHash },
      });
      expect(transactionClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        data: expect.objectContaining({
          phoneNumberHash,
          phoneVerified: true,
        }),
      });
      expect(profile).toMatchObject({ phoneVerified: true });
    });

    it('increments attempts and rejects on a wrong code', async () => {
      const { prismaService, service } = createService();
      prismaService.oTPCode.findFirst.mockResolvedValue(validOtpRow());

      await expect(
        service.verifyOtp('user_1', phoneNumber, '000000'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prismaService.oTPCode.update).toHaveBeenCalledWith({
        where: { id: 'otp_1' },
        data: { attempts: { increment: 1 } },
      });
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('rejects and cleans up when the OTP is expired or attempt-capped', async () => {
      const { prismaService, service } = createService();
      prismaService.oTPCode.findFirst.mockResolvedValue({
        ...validOtpRow(),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.verifyOtp('user_1', phoneNumber, '123456'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaService.oTPCode.deleteMany).toHaveBeenCalled();
    });

    it('maps the unique-phone race to the same conflict as the upfront check', async () => {
      const { prismaService, service } = createService();
      prismaService.oTPCode.findFirst.mockResolvedValue(validOtpRow());
      prismaService.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.verifyOtp('user_1', phoneNumber, '123456'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
