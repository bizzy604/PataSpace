import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const createStrategy = () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'security.jwtSecret') {
          return 'test-jwt-secret-value-12345';
        }

        return undefined;
      }),
    };
    const userService = {
      findStoredById: jest.fn(),
      toAuthUser: jest.fn((user: { id: string; role: Role }) => ({
        id: user.id,
        role: user.role,
        phoneNumber: '+254712345678',
        phoneVerified: true,
        firstName: 'Test',
        lastName: 'User',
      })),
    };

    return {
      strategy: new JwtStrategy(configService as never, userService as never),
      userService,
    };
  };

  it('hydrates the authenticated user from current storage state', async () => {
    const { strategy, userService } = createStrategy();
    userService.findStoredById.mockResolvedValue({
      id: 'user_1',
      role: Role.ADMIN,
      isActive: true,
      isBanned: false,
    });

    await expect(
      strategy.validate({
        sub: 'user_1',
      }),
    ).resolves.toMatchObject({
      id: 'user_1',
      role: Role.ADMIN,
    });
    expect(userService.toAuthUser).toHaveBeenCalled();
  });

  it('rejects tokens for missing users', async () => {
    const { strategy, userService } = createStrategy();
    userService.findStoredById.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'missing_user',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects tokens for inactive users', async () => {
    const { strategy, userService } = createStrategy();
    userService.findStoredById.mockResolvedValue({
      id: 'inactive_1',
      role: Role.USER,
      isActive: false,
      isBanned: false,
    });

    await expect(
      strategy.validate({
        sub: 'inactive_1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects tokens for banned users', async () => {
    const { strategy, userService } = createStrategy();
    userService.findStoredById.mockResolvedValue({
      id: 'banned_1',
      role: Role.USER,
      isActive: true,
      isBanned: true,
      banReason: 'Fraud review',
    });

    await expect(
      strategy.validate({
        sub: 'banned_1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
