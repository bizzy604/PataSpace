/**
 * Purpose: Gate tests for UserService.createFromClerk concurrency behaviour.
 * Why important: Two parallel first-login requests race Prisma's non-atomic
 *   upsert (nested credit create) and one hits P2002; without the retry the
 *   loser surfaces a 500 to the client on its very first API call.
 * Used by: apps/api unit test lane.
 */
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';

describe('UserService.createFromClerk', () => {
  const storedUser = {
    id: 'user_1',
    clerkId: 'clerk_1',
    phoneNumberEncrypted: null,
    phoneVerified: false,
    email: null,
    passwordHash: null,
    firstName: 'Amoni',
    lastName: 'Kevin',
    role: 'USER',
    isActive: true,
    isBanned: false,
    banReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  };

  const createService = (upsert: jest.Mock) => {
    const prismaService = { user: { upsert } };
    const configService = { get: jest.fn().mockReturnValue('0'.repeat(32)) };

    return new UserService(prismaService as never, configService as never);
  };

  const uniqueViolation = () =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });

  it('returns the user on a clean upsert', async () => {
    const upsert = jest.fn().mockResolvedValue(storedUser);
    const service = createService(upsert);

    await expect(
      service.createFromClerk({ clerkId: 'clerk_1', firstName: 'Amoni', lastName: 'Kevin' }),
    ).resolves.toMatchObject({ id: 'user_1' });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('retries once when the upsert loses the first-login race (P2002)', async () => {
    const upsert = jest
      .fn()
      .mockRejectedValueOnce(uniqueViolation())
      .mockResolvedValueOnce(storedUser);
    const service = createService(upsert);

    await expect(
      service.createFromClerk({ clerkId: 'clerk_1', firstName: 'Amoni', lastName: 'Kevin' }),
    ).resolves.toMatchObject({ id: 'user_1' });
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it('rethrows non-P2002 errors without retrying', async () => {
    const upsert = jest.fn().mockRejectedValue(new Error('connection lost'));
    const service = createService(upsert);

    await expect(
      service.createFromClerk({ clerkId: 'clerk_1', firstName: 'Amoni', lastName: 'Kevin' }),
    ).rejects.toThrow('connection lost');
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
