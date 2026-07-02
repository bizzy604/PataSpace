/**
 * Purpose: Gate tests for AdminUserService — ban/unban policy branches,
 *   session revocation, audit logging, and directory mapping.
 * Why important: Banning locks real accounts; a policy hole here would let an
 *   admin ban themselves or another admin, or leave sessions alive after a ban.
 * Used by: jest runner via apps/api jest config.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminUserService } from './admin-user.service';

const createService = () => {
  const tx = {
    user: { update: jest.fn() },
    refreshToken: { deleteMany: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const prismaService = {
    user: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  };
  const userService = {
    decryptPhoneNumber: jest.fn(() => '+254712345678'),
  };

  return {
    prismaService,
    tx,
    userService,
    service: new AdminUserService(prismaService as never, userService as never),
  };
};

const storedUser = (overrides = {}) => ({
  id: 'user_1',
  role: Role.USER,
  isActive: true,
  isBanned: false,
  banReason: null,
  ...overrides,
});

describe('AdminUserService', () => {
  it('lists users with decrypted phone numbers and pagination meta', async () => {
    const { prismaService, service } = createService();
    prismaService.user.count.mockResolvedValue(41);
    prismaService.user.findMany.mockResolvedValue([
      {
        id: 'user_1',
        firstName: 'John',
        lastName: 'Mwangi',
        email: null,
        phoneNumberEncrypted: 'encrypted',
        role: Role.USER,
        phoneVerified: true,
        isActive: true,
        isBanned: false,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        lastLoginAt: null,
        _count: { listings: 2, unlocks: 3 },
      },
    ]);

    const result = await service.listUsers({ page: 2, limit: 20 });

    expect(result.meta).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
    expect(result.data[0]).toMatchObject({
      id: 'user_1',
      phoneNumber: '+254712345678',
      listingsCount: 2,
      unlocksCount: 3,
      createdAt: '2026-03-01T00:00:00.000Z',
    });
    expect(prismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
  });

  it('bans a user, revokes sessions, and writes an audit log', async () => {
    const { prismaService, tx, service } = createService();
    prismaService.user.findUnique.mockResolvedValue(storedUser());

    const result = await service.banUser('admin_1', 'user_1', { reason: 'Fraudulent listings' });

    expect(result).toEqual({
      id: 'user_1',
      isBanned: true,
      message: 'User banned and sessions revoked',
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { isActive: false, isBanned: true, banReason: 'Fraudulent listings' },
    });
    expect(tx.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user_1' } });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'user.ban', entityId: 'user_1' }),
      }),
    );
  });

  it('refuses to ban the acting admin themselves', async () => {
    const { prismaService, service } = createService();
    prismaService.user.findUnique.mockResolvedValue(storedUser({ id: 'admin_1' }));

    await expect(
      service.banUser('admin_1', 'admin_1', { reason: 'testing self ban' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });

  it('refuses to ban another admin account', async () => {
    const { prismaService, service } = createService();
    prismaService.user.findUnique.mockResolvedValue(storedUser({ role: Role.ADMIN }));

    await expect(
      service.banUser('admin_1', 'user_1', { reason: 'should not work' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects banning an already banned user', async () => {
    const { prismaService, service } = createService();
    prismaService.user.findUnique.mockResolvedValue(storedUser({ isBanned: true }));

    await expect(
      service.banUser('admin_1', 'user_1', { reason: 'double ban attempt' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('404s for unknown users', async () => {
    const { prismaService, service } = createService();
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      service.banUser('admin_1', 'ghost', { reason: 'missing user' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getUserDetail('ghost')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('unbans a banned user and clears the reason', async () => {
    const { prismaService, tx, service } = createService();
    prismaService.user.findUnique.mockResolvedValue(
      storedUser({ isBanned: true, isActive: false, banReason: 'Fraud' }),
    );

    const result = await service.unbanUser('admin_1', 'user_1');

    expect(result.isBanned).toBe(false);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { isActive: true, isBanned: false, banReason: null },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'user.unban' }),
      }),
    );
  });

  it('rejects unbanning a user who is not banned', async () => {
    const { prismaService, service } = createService();
    prismaService.user.findUnique.mockResolvedValue(storedUser());

    await expect(service.unbanUser('admin_1', 'user_1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
