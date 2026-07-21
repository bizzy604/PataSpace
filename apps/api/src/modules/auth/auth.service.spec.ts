import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { StoredUser } from '../user/user.service';

describe('AuthService (session: login, refresh, logout)', () => {
  const createStoredUser = async (overrides: Partial<StoredUser> = {}): Promise<StoredUser> => ({
    id: 'user_1',
    phoneNumberEncrypted: 'encrypted-phone',
    phoneVerified: true,
    emailVerified: false,
    email: 'user@example.com',
    passwordHash: await bcrypt.hash('SecurePassword123!', 12),
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

  const createAuthService = async (options: {
    storedUser?: StoredUser | null;
    refreshRecord?: { id: string; expiresAt: Date; user: StoredUser } | null;
  } = {}) => {
    const storedUser =
      options.storedUser === undefined ? await createStoredUser() : options.storedUser;
    const txClient = {
      user: { update: jest.fn().mockResolvedValue(storedUser) },
      refreshToken: { delete: jest.fn().mockResolvedValue({ id: 'rt_1' }) },
    };
    const prismaService = {
      $transaction: jest.fn(async (callback: (tx: typeof txClient) => unknown) => callback(txClient)),
      refreshToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue(options.refreshRecord ?? null),
      },
    };
    const userService = { findStoredByEmail: jest.fn().mockResolvedValue(storedUser) };
    const authTokenService = {
      hashRefreshToken: jest.fn((token: string) => `hashed:${token}`),
      issueAuthSession: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'new-refresh-token',
        user: { id: storedUser?.id },
      }),
      createAccessToken: jest.fn().mockResolvedValue('access-token'),
      createRefreshToken: jest.fn().mockResolvedValue('rotated-refresh-token'),
    };

    return {
      authTokenService,
      prismaService,
      service: new AuthService(prismaService as never, userService as never, authTokenService as never),
      txClient,
      userService,
    };
  };

  describe('login', () => {
    it('rejects when no account exists for the email', async () => {
      const { service, userService } = await createAuthService();
      (userService.findStoredByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'SecurePassword123!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when the password is incorrect', async () => {
      const { service } = await createAuthService();

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPassword123!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when the phone number is not verified', async () => {
      const { service } = await createAuthService({
        storedUser: await createStoredUser({ phoneVerified: false }),
      });

      await expect(
        service.login({ email: 'user@example.com', password: 'SecurePassword123!' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when the account is inactive', async () => {
      const { service } = await createAuthService({
        storedUser: await createStoredUser({ isActive: false }),
      });

      await expect(
        service.login({ email: 'user@example.com', password: 'SecurePassword123!' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when the account is banned', async () => {
      const { service } = await createAuthService({
        storedUser: await createStoredUser({ isBanned: true, banReason: 'Fraud review' }),
      });

      await expect(
        service.login({ email: 'user@example.com', password: 'SecurePassword123!' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('issues a session on valid credentials', async () => {
      const { service, authTokenService } = await createAuthService();

      const session = await service.login({
        email: 'user@example.com',
        password: 'SecurePassword123!',
      });

      expect(session.accessToken).toBe('access-token');
      expect(authTokenService.issueAuthSession).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates refresh tokens', async () => {
      const storedUser = await createStoredUser();
      const { service, authTokenService, txClient } = await createAuthService({
        refreshRecord: { id: 'refresh_1', expiresAt: new Date(Date.now() + 60 * 60 * 1000), user: storedUser },
        storedUser,
      });

      const response = await service.refresh({ refreshToken: 'refresh-token' });

      expect(response.accessToken).toBe('access-token');
      expect(response.refreshToken).toBe('rotated-refresh-token');
      expect(txClient.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'refresh_1' } });
      expect(authTokenService.createAccessToken).toHaveBeenCalled();
      expect(authTokenService.createRefreshToken).toHaveBeenCalled();
    });

    it('rejects when the token is expired', async () => {
      const storedUser = await createStoredUser();
      const { service } = await createAuthService({
        refreshRecord: { id: 'refresh_expired', expiresAt: new Date(Date.now() - 60 * 1000), user: storedUser },
        storedUser,
      });

      await expect(
        service.refresh({ refreshToken: 'expired-refresh-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when the token record is missing', async () => {
      const { service } = await createAuthService({ refreshRecord: null });

      await expect(
        service.refresh({ refreshToken: 'unknown-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('invalidates the provided refresh token for the current user', async () => {
      const { prismaService, service } = await createAuthService();

      await service.logout('user_1', { refreshToken: 'refresh-token' });

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          tokenHash: 'hashed:refresh-token',
          userId: 'user_1',
        },
      });
    });
  });
});
