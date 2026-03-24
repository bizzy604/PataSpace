import { AuthCleanupService } from './auth.cleanup.service';

describe('AuthCleanupService', () => {
  const createService = () => {
    const prismaService = {
      oTPCode: {
        deleteMany: jest.fn(),
      },
      refreshToken: {
        deleteMany: jest.fn(),
      },
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'security.otpMaxAttempts') {
          return 3;
        }

        return undefined;
      }),
    };

    return {
      prismaService,
      service: new AuthCleanupService(prismaService as never, configService as never),
    };
  };

  it('cleans up expired, verified, and exhausted OTP codes', async () => {
    const { service, prismaService } = createService();
    prismaService.oTPCode.deleteMany.mockResolvedValue({ count: 2 });

    await service.pruneExpiredOtps();

    expect(prismaService.oTPCode.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { expiresAt: { lt: expect.any(Date) } },
          { verified: true },
          { attempts: { gte: 3 } },
        ],
      },
    });
  });

  it('cleans up expired refresh tokens', async () => {
    const { service, prismaService } = createService();
    prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 4 });

    await service.pruneExpiredRefreshTokens();

    expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { lt: expect.any(Date) },
      },
    });
  });
});
