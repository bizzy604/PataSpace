import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PasswordRecoveryService } from './password-recovery.service';
import { StoredUser } from '../../user/user.service';

describe('PasswordRecoveryService', () => {
  const createStoredUser = (overrides: Partial<StoredUser> = {}): StoredUser => ({
    id: 'user_1',
    phoneNumberEncrypted: 'encrypted-phone',
    phoneVerified: true,
    emailVerified: false,
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
    const emailService = { sendMail: jest.fn().mockResolvedValue(undefined) };
    const userService = {
      findStoredByEmail: jest.fn().mockResolvedValue(user),
      decryptPhoneNumber: jest.fn().mockReturnValue('+254712345678'),
    };
    const authTokenService = {
      revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
      createMagicLinkToken: jest.fn().mockResolvedValue('magic-link-token'),
      verifyMagicLinkToken: jest.fn().mockResolvedValue({
        sub: 'user_1',
        email: 'user@example.com',
        purpose: 'magic-link',
      }),
      issueAuthSession: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user_1',
          phoneNumber: '+254712345678',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          phoneVerified: true,
    emailVerified: false,
          email: 'user@example.com',
        },
      }),
    };
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
        emailService as never,
      ),
      smsService,
      emailService,
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

    it('sends a branded password-reset email template when an account exists', async () => {
      const { service, emailService } = createService(createStoredUser());

      await service.forgotPassword({ email: 'user@example.com' });

      expect(emailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Reset your PataSpace password',
          html: expect.stringContaining('Reset your password'),
        }),
      );
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

  describe('requestMagicLink', () => {
    it('sends a branded magic-link email with a signed token for an existing account', async () => {
      const { service, emailService, authTokenService } = createService(createStoredUser());

      await service.requestMagicLink({ email: 'user@example.com' });

      expect(authTokenService.createMagicLinkToken).toHaveBeenCalled();
      expect(emailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Sign in to PataSpace',
          html: expect.stringContaining('magic-link-token'),
        }),
      );
    });

    it('returns the same anti-enumeration response when the account does not exist', async () => {
      const { service, emailService } = createService(null);

      await expect(service.requestMagicLink({ email: 'nobody@example.com' })).resolves.toBeUndefined();
      expect(emailService.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('signInWithMagicLink', () => {
    it('issues an auth session when the token is valid for the matching user', async () => {
      const { service, authTokenService } = createService(createStoredUser());

      const session = await service.signInWithMagicLink({ email: 'user@example.com', token: 'magic-link-token' });

      expect(authTokenService.verifyMagicLinkToken).toHaveBeenCalledWith('magic-link-token');
      expect(authTokenService.issueAuthSession).toHaveBeenCalled();
      expect(session).toEqual(
        expect.objectContaining({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        }),
      );
    });

    it('rejects tokens that do not belong to the signed-in email', async () => {
      const { service, authTokenService } = createService(createStoredUser());
      (authTokenService.verifyMagicLinkToken as jest.Mock).mockResolvedValue({
        sub: 'user_1',
        email: 'someone-else@example.com',
        purpose: 'magic-link',
      });

      await expect(
        service.signInWithMagicLink({ email: 'user@example.com', token: 'magic-link-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
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
