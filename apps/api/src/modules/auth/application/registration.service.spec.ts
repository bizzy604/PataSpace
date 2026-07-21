import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { StoredUser } from '../../user/user.service';

describe('RegistrationService', () => {
  const createStoredUser = (overrides: Partial<StoredUser> = {}): StoredUser => ({
    id: 'user_1',
    phoneNumberEncrypted: 'encrypted-phone',
    phoneVerified: true,
    emailVerified: false,
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as never,
    isActive: true,
    isBanned: false,
    banReason: null,
    createdAt: new Date('2026-03-21T10:00:00.000Z'),
    updatedAt: new Date('2026-03-21T10:00:00.000Z'),
    lastLoginAt: null,
    ...overrides,
  });

  const validRegisterInput = {
    email: 'user@example.com',
    password: 'SecurePassword123!',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+254712345678',
  };

  const createRegistrationService = (options: {
    existingByEmail?: StoredUser | null;
    existingByPhone?: StoredUser | null;
  } = {}) => {
    const txClient = {
      user: {
        create: jest.fn().mockResolvedValue({ id: 'user_new' }),
        update: jest.fn().mockResolvedValue({ id: 'user_1' }),
      },
    };
    const prismaService = {
      $transaction: jest.fn(async (callback: (tx: typeof txClient) => unknown) => callback(txClient)),
    };
    const smsService = { sendOtp: jest.fn().mockResolvedValue({ accepted: true }) };
    const userService = {
      findStoredByEmail: jest.fn().mockResolvedValue(
        options.existingByEmail === undefined ? null : options.existingByEmail,
      ),
      findStoredByPhoneNumber: jest.fn().mockResolvedValue(
        options.existingByPhone === undefined ? null : options.existingByPhone,
      ),
      decryptPhoneNumber: jest.fn().mockReturnValue('+254712345678'),
    };
    const referralService = { linkPendingReferral: jest.fn().mockResolvedValue(0) };
    const authTokenService = {
      issueAuthSession: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user_1' },
      }),
    };
    const authOtpService = {
      ttlSeconds: 300,
      issue: jest.fn().mockResolvedValue({ code: '123456', expiresAt: new Date() }),
      assertValid: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      get: jest.fn((key: string) =>
        key === 'security.encryptionKey' ? '12345678901234567890123456789012' : undefined,
      ),
    };

    return {
      authOtpService,
      authTokenService,
      prismaService,
      referralService,
      service: new RegistrationService(
        prismaService as never,
        smsService as never,
        userService as never,
        referralService as never,
        authTokenService as never,
        authOtpService as never,
        configService as never,
      ),
      smsService,
      txClient,
      userService,
    };
  };

  describe('register', () => {
    it('rejects when the email already belongs to a verified account', async () => {
      const { service } = createRegistrationService({
        existingByEmail: createStoredUser({ phoneVerified: true }),
      });

      await expect(service.register(validRegisterInput)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when the pending account for that email is banned', async () => {
      const { service } = createRegistrationService({
        existingByEmail: createStoredUser({
          phoneVerified: false,
    emailVerified: false,
          isBanned: true,
          banReason: 'Terms violation',
        }),
      });

      await expect(service.register(validRegisterInput)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when the phone already belongs to a different account', async () => {
      const { service } = createRegistrationService({
        existingByEmail: null,
        existingByPhone: createStoredUser({ id: 'someone_else' }),
      });

      await expect(service.register(validRegisterInput)).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a new user and dispatches the OTP when no account exists', async () => {
      const { service, smsService, txClient, authOtpService } = createRegistrationService();

      const response = await service.register(validRegisterInput);

      expect(txClient.user.create).toHaveBeenCalled();
      expect(txClient.user.update).not.toHaveBeenCalled();
      expect(authOtpService.issue).toHaveBeenCalled();
      expect(smsService.sendOtp).toHaveBeenCalledWith('+254712345678', '123456');
      expect(response).toEqual({
        userId: 'user_new',
        message: 'OTP sent to +254712345678',
        expiresIn: 300,
      });
    });

    it('updates the existing pending account on re-registration', async () => {
      const { service, txClient } = createRegistrationService({
        existingByEmail: createStoredUser({ id: 'user_pending', phoneVerified: false }),
      });

      await service.register(validRegisterInput);

      expect(txClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user_pending' } }),
      );
      expect(txClient.user.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('rejects with INVALID_OTP when no pending account exists for the phone', async () => {
      const svc = createRegistrationService();
      (svc.userService.findStoredByPhoneNumber as jest.Mock).mockResolvedValue(null);

      await expect(
        svc.service.verifyOtp({ phoneNumber: '+254712345678', code: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('propagates the OTP validity check', async () => {
      const svc = createRegistrationService();
      (svc.userService.findStoredByPhoneNumber as jest.Mock).mockResolvedValue(createStoredUser());
      (svc.authOtpService.assertValid as jest.Mock).mockRejectedValue(
        new BadRequestException({ code: 'INVALID_OTP', message: 'OTP is invalid or expired' }),
      );

      await expect(
        svc.service.verifyOtp({ phoneNumber: '+254712345678', code: '000000' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('consumes the OTP, verifies the user, and issues a session on success', async () => {
      const svc = createRegistrationService();
      (svc.userService.findStoredByPhoneNumber as jest.Mock).mockResolvedValue(createStoredUser());

      const session = await svc.service.verifyOtp({ phoneNumber: '+254712345678', code: '123456' });

      expect(svc.authOtpService.consume).toHaveBeenCalled();
      expect(svc.txClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ phoneVerified: true }) }),
      );
      expect(svc.authTokenService.issueAuthSession).toHaveBeenCalled();
      expect(session.accessToken).toBe('access-token');
    });

    it('does not fail the response when linking a referral throws', async () => {
      const svc = createRegistrationService();
      (svc.userService.findStoredByPhoneNumber as jest.Mock).mockResolvedValue(createStoredUser());
      (svc.referralService.linkPendingReferral as jest.Mock).mockRejectedValue(new Error('boom'));

      await expect(
        svc.service.verifyOtp({ phoneNumber: '+254712345678', code: '123456' }),
      ).resolves.toBeDefined();
    });
  });

  describe('resendOtp', () => {
    it('rejects with NotFoundException when there is no pending account', async () => {
      const svc = createRegistrationService();
      (svc.userService.findStoredByPhoneNumber as jest.Mock).mockResolvedValue(null);

      await expect(
        svc.service.resendOtp({ phoneNumber: '+254712345678' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects with ConflictException when the phone is already verified', async () => {
      const svc = createRegistrationService();
      (svc.userService.findStoredByPhoneNumber as jest.Mock).mockResolvedValue(
        createStoredUser({ phoneVerified: true }),
      );

      await expect(
        svc.service.resendOtp({ phoneNumber: '+254712345678' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('issues a fresh OTP and sends it', async () => {
      const svc = createRegistrationService();
      (svc.userService.findStoredByPhoneNumber as jest.Mock).mockResolvedValue(
        createStoredUser({ phoneVerified: false }),
      );

      const response = await svc.service.resendOtp({ phoneNumber: '+254712345678' });

      expect(svc.authOtpService.issue).toHaveBeenCalled();
      expect(svc.smsService.sendOtp).toHaveBeenCalledWith('+254712345678', '123456');
      expect(response.message).toBe('OTP resent to +254712345678');
    });
  });
});
