import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  const storedUser = {
    id: 'user_1',
    clerkId: null,
    phoneNumberEncrypted: 'encrypted-phone',
    phoneVerified: true,
    email: 'user@example.com',
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as never,
    isActive: true,
    isBanned: false,
    banReason: null,
    createdAt: new Date('2026-03-21T10:00:00.000Z'),
    updatedAt: new Date('2026-03-21T10:00:00.000Z'),
    lastLoginAt: null,
  };

  const createService = () => {
    const txClient = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt_1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const jwtService = { signAsync: jest.fn().mockResolvedValue('access-token') };
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'security.accessTokenTtl': '15m',
          'security.jwtRefreshSecret': 'refresh-secret',
          'security.refreshTokenTtlDays': 30,
        };
        return values[key];
      }),
    };
    const userService = {
      decryptPhoneNumber: jest.fn().mockReturnValue('+254712345678'),
      toAuthUser: jest.fn().mockReturnValue({
        id: 'user_1',
        phoneNumber: '+254712345678',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        phoneVerified: true,
        email: 'user@example.com',
      }),
    };

    return {
      service: new AuthTokenService(jwtService as never, configService as never, userService as never),
      jwtService,
      txClient,
      userService,
    };
  };

  it('createAccessToken signs the expected claims with the configured TTL', async () => {
    const { service, jwtService } = createService();

    const token = await service.createAccessToken(storedUser);

    expect(token).toBe('access-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user_1',
        role: 'USER',
        phoneNumber: '+254712345678',
        phoneVerified: true,
      }),
      { expiresIn: '15m' },
    );
  });

  it('createRefreshToken persists a hashed token and returns the plaintext', async () => {
    const { service, txClient } = createService();

    const token = await service.createRefreshToken(txClient as never, 'user_1');

    expect(typeof token).toBe('string');
    expect(txClient.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: service.hashRefreshToken(token),
        userId: 'user_1',
      }),
    });
  });

  it('hashRefreshToken is deterministic for the same token', () => {
    const { service } = createService();

    expect(service.hashRefreshToken('abc')).toBe(service.hashRefreshToken('abc'));
    expect(service.hashRefreshToken('abc')).not.toBe(service.hashRefreshToken('xyz'));
  });

  it('issueAuthSession returns both tokens and the contract-shaped user', async () => {
    const { service, txClient, userService } = createService();

    const session = await service.issueAuthSession(txClient as never, storedUser);

    expect(session.accessToken).toBe('access-token');
    expect(typeof session.refreshToken).toBe('string');
    expect(session.user).toEqual(
      expect.objectContaining({ id: 'user_1', role: 'USER', email: 'user@example.com' }),
    );
    expect(userService.toAuthUser).toHaveBeenCalledWith(storedUser);
  });

  it('revokeAllRefreshTokens deletes every refresh token for the user', async () => {
    const { service, txClient } = createService();

    await service.revokeAllRefreshTokens(txClient as never, 'user_1');

    expect(txClient.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user_1' } });
  });
});
