import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { StoredUser } from '../user/user.service';

describe('AuthService', () => {
  const createStoredUser = async (overrides: Partial<StoredUser> = {}): Promise<StoredUser> => ({
    id: 'user_1',
    phoneNumberEncrypted: 'encrypted-phone',
    phoneVerified: true,
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
    refreshRecord?: {
      id: string;
      expiresAt: Date;
      user: StoredUser;
    } | null;
    latestOtp?: {
      id: string;
      phoneNumberHash: string;
      codeHash: string;
      attempts: number;
      expiresAt: Date;
      createdAt: Date;
      verified: boolean;
    } | null;
  } = {}) => {
    const storedUser = options.storedUser ?? (await createStoredUser());
    const latestOtp =
      options.latestOtp ??
      ({
        id: 'otp_1',
        phoneNumberHash: 'phone_hash',
        codeHash: 'hashed-code',
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        verified: false,
      } as const);
    const transactionClient = {
      user: {
        create: jest.fn().mockResolvedValue({ id: 'user_1' }),
        update: jest.fn().mockResolvedValue(storedUser),
      },
      oTPCode: {
        create: jest.fn().mockResolvedValue({ id: 'otp_1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt_1' }),
        delete: jest.fn().mockResolvedValue({ id: 'rt_1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prismaService = {
      $transaction: jest.fn(async (callback: (tx: typeof transactionClient) => unknown) =>
        callback(transactionClient),
      ),
      oTPCode: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue(latestOtp),
        update: jest.fn().mockResolvedValue({}),
      },
      refreshToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue(options.refreshRecord ?? null),
      },
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'app.environment': 'test',
          'infrastructure.sms.provider': 'sandbox',
          'security.accessTokenTtl': '15m',
          'security.encryptionKey': '12345678901234567890123456789012',
          'security.jwtRefreshSecret': 'refresh-secret',
          'security.otpMaxAttempts': 3,
          'security.otpTtlSeconds': 300,
          'security.refreshTokenTtlDays': 30,
          'security.sandboxOtpCode': '123456',
        };

        return values[key];
      }),
    };
    const smsService = {
      sendOtp: jest.fn().mockResolvedValue({
        accepted: true,
        messageId: 'sms_1',
        provider: 'sandbox',
      }),
    };
    const userService = {
      decryptPhoneNumber: jest.fn().mockReturnValue('+254712345678'),
      findStoredByEmail: jest.fn().mockResolvedValue(null),
      findStoredByPhoneNumber: jest.fn().mockResolvedValue(storedUser),
      toAuthUser: jest.fn().mockReturnValue({
        id: 'user_1',
        phoneNumber: '+254712345678',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        phoneVerified: true,
      }),
    };

    return {
      jwtService,
      prismaService,
      service: new AuthService(
        prismaService as never,
        jwtService as never,
        configService as never,
        smsService as never,
        userService as never,
      ),
      smsService,
      transactionClient,
      userService,
    };
  };

  it('rejects registration when the phone is already verified', async () => {
    const { service } = await createAuthService({
      storedUser: await createStoredUser({ phoneVerified: true }),
    });

    await expect(
      service.register({
        phoneNumber: '+254712345678',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects login when the password is incorrect', async () => {
    const { service } = await createAuthService();

    await expect(
      service.login({
        phoneNumber: '+254712345678',
        password: 'WrongPassword123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects registration when an unverified account is banned', async () => {
    const { service } = await createAuthService({
      storedUser: await createStoredUser({
        phoneVerified: false,
        isBanned: true,
        banReason: 'Terms violation',
      }),
    });

    await expect(
      service.register({
        phoneNumber: '+254712345678',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects registration when the email already belongs to another user', async () => {
    const { service, userService } = await createAuthService({
      storedUser: await createStoredUser({
        id: 'user_pending',
        phoneVerified: false,
      }),
    });

    (userService.findStoredByEmail as jest.Mock).mockResolvedValue(
      await createStoredUser({
        id: 'user_other',
      }),
    );

    await expect(
      service.register({
        phoneNumber: '+254712345678',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects login when the phone number is not verified', async () => {
    const { service } = await createAuthService({
      storedUser: await createStoredUser({
        phoneVerified: false,
      }),
    });

    await expect(
      service.login({
        phoneNumber: '+254712345678',
        password: 'SecurePassword123!',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects login when the account is inactive', async () => {
    const { service } = await createAuthService({
      storedUser: await createStoredUser({
        isActive: false,
      }),
    });

    await expect(
      service.login({
        phoneNumber: '+254712345678',
        password: 'SecurePassword123!',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects login when the account is banned', async () => {
    const { service } = await createAuthService({
      storedUser: await createStoredUser({
        banReason: 'Fraud review',
        isBanned: true,
      }),
    });

    await expect(
      service.login({
        phoneNumber: '+254712345678',
        password: 'SecurePassword123!',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('increments OTP attempts when verification fails', async () => {
    const { prismaService, service } = await createAuthService({
      latestOtp: {
        id: 'otp_1',
        phoneNumberHash: 'phone_hash',
        codeHash: 'different-hash',
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        verified: false,
      },
    });

    await expect(
      service.verifyOtp({
        phoneNumber: '+254712345678',
        code: '123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaService.oTPCode.update).toHaveBeenCalled();
  });

  it('rejects OTP verification when the latest code is expired and clears stale records', async () => {
    const { prismaService, service } = await createAuthService({
      latestOtp: {
        id: 'otp_expired',
        phoneNumberHash: 'phone_hash',
        codeHash: 'hashed-code',
        attempts: 0,
        expiresAt: new Date(Date.now() - 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
        verified: false,
      },
    });

    await expect(
      service.verifyOtp({
        phoneNumber: '+254712345678',
        code: '123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaService.oTPCode.deleteMany).toHaveBeenCalled();
  });

  it('rejects OTP verification when the max attempts are already exhausted', async () => {
    const { prismaService, service } = await createAuthService({
      latestOtp: {
        id: 'otp_locked',
        phoneNumberHash: 'phone_hash',
        codeHash: 'hashed-code',
        attempts: 3,
        expiresAt: new Date(Date.now() + 60 * 1000),
        createdAt: new Date(),
        verified: false,
      },
    });

    await expect(
      service.verifyOtp({
        phoneNumber: '+254712345678',
        code: '123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaService.oTPCode.deleteMany).toHaveBeenCalled();
    expect(prismaService.oTPCode.update).not.toHaveBeenCalled();
  });

  it('rotates refresh tokens on refresh', async () => {
    const storedUser = await createStoredUser();
    const { jwtService, service, transactionClient } = await createAuthService({
      refreshRecord: {
        id: 'refresh_1',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        user: storedUser,
      },
      storedUser,
    });

    const response = await service.refresh({
      refreshToken: 'refresh-token',
    });

    expect(response.accessToken).toBe('access-token');
    expect(response.refreshToken).toBeDefined();
    expect(transactionClient.refreshToken.delete).toHaveBeenCalledWith({
      where: {
        id: 'refresh_1',
      },
    });
    expect(transactionClient.refreshToken.create).toHaveBeenCalled();
    expect(jwtService.signAsync).toHaveBeenCalled();
  });

  it('rejects refresh when the token is expired', async () => {
    const storedUser = await createStoredUser();
    const { service } = await createAuthService({
      refreshRecord: {
        id: 'refresh_expired',
        expiresAt: new Date(Date.now() - 60 * 1000),
        user: storedUser,
      },
      storedUser,
    });

    await expect(
      service.refresh({
        refreshToken: 'expired-refresh-token',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('invalidates the provided refresh token on logout', async () => {
    const { prismaService, service } = await createAuthService();

    await service.logout('user_1', {
      refreshToken: 'refresh-token',
    });

    expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: {
        tokenHash: expect.any(String),
        userId: 'user_1',
      },
    });
  });
});
