import { BadRequestException } from '@nestjs/common';
import { PasswordRecoveryService } from './password-recovery.service';
import { StoredUser } from '../../user/user.service';

describe('PasswordRecoveryService', () => {
  const createStoredUser = (overrides: Partial<StoredUser> = {}): StoredUser => ({
    id: 'user_1',
    phoneNumberEncrypted: 'encrypted-phone',
    phoneVerified: true,
    email: 'user@example.com',
    passwordHash: 'old-hash',
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

  const createService = (user: StoredUser | null) => {
    const txClient = {
      user: { update: jest.fn().mockResolvedValue({ id: 'user_1' }) },
    };
    const prismaService = {
      $transaction: jest.fn(async (callback: (tx: typeof txClient) => unknown) => callback(txClient)),
    };
    const smsService = { sendOtp: jest.fn().mockResolvedValue({ accepted: true }) };
    const userService = {
      findStoredByEmail: jest.fn().mockResolvedValue(user),
      decryptPhoneNumber: jest.fn().mockReturnValue('+254712345678'),
    };
    const authTokenService = { revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined) };
    const authOtpService = {
      ttlSeconds: 300,
      issue: jest.fn().mockResolvedValue({ code: '123456', expiresAt: new Date() }),
      assertValid: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
    };

    return {
      authOtpService,
      authTokenService,
      prismaService,
      service: new PasswordRecoveryService(
        prismaService as never,
        smsService as never,
        userService as never,
        authTokenService as never,
        authOtpService as never,
      ),
      smsService,
      txClient,
      userService,
    };
  };

  describe('forgotPassword', () => {
    it('sends an OTP and returns the standard response when the account exists', async () => {
      const { service, smsService } = createService(createStoredUser());

      const response = await service.forgotPassword({ email: 'user@example.com' });

      expect(smsService.sendOtp).toHaveBeenCalledWith('+254712345678', '123456');
      expect(response).toEqual({
        message: 'If an account exists for this email, an OTP has been sent to the phone on file.',
        expiresIn: 300,
      });
    });

    it('returns the identical response when the account does not exist (anti-enumeration)', async () => {
      const { service, smsService } = createService(null);

      const response = await service.forgotPassword({ email: 'nobody@example.com' });

      expect(smsService.sendOtp).not.toHaveBeenCalled();
      expect(response).toEqual({
        message: 'If an account exists for this email, an OTP has been sent to the phone on file.',
        expiresIn: 300,
      });
    });

    it('does not dispatch an OTP for a banned account but still returns the standard response', async () => {
      const { service, smsService } = createService(createStoredUser({ isBanned: true }));

      const response = await service.forgotPassword({ email: 'user@example.com' });

      expect(smsService.sendOtp).not.toHaveBeenCalled();
      expect(response.message).toBe(
        'If an account exists for this email, an OTP has been sent to the phone on file.',
      );
    });
  });

  describe('resetPassword', () => {
    const input = { email: 'user@example.com', code: '123456', newPassword: 'NewSecurePassword123!' };

    it('rejects with INVALID_OTP when the account does not exist (anti-enumeration)', async () => {
      const { service } = createService(null);

      await expect(service.resetPassword(input)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('propagates the OTP validity check', async () => {
      const { service, authOtpService } = createService(createStoredUser());
      (authOtpService.assertValid as jest.Mock).mockRejectedValue(
        new BadRequestException({ code: 'INVALID_OTP', message: 'OTP is invalid or expired' }),
      );

      await expect(service.resetPassword(input)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets the new password and revokes every refresh token on success', async () => {
      const { service, authOtpService, authTokenService, txClient } = createService(createStoredUser());

      await service.resetPassword(input);

      expect(authOtpService.consume).toHaveBeenCalled();
      expect(txClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user_1' },
          data: expect.objectContaining({ passwordHash: expect.any(String) }),
        }),
      );
      expect(authTokenService.revokeAllRefreshTokens).toHaveBeenCalledWith(txClient, 'user_1');
    });
  });
});
