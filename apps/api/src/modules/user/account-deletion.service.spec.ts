import { NotFoundException } from '@nestjs/common';
import { AccountDeletionService } from './account-deletion.service';

describe('AccountDeletionService', () => {
  function setup(user: { id: string; clerkId: string | null } | null) {
    const prisma = { user: { delete: jest.fn() } };
    const clerk = { deleteUser: jest.fn() };
    const users = { findStoredById: jest.fn().mockResolvedValue(user) };
    const service = new AccountDeletionService(
      prisma as never,
      clerk as never,
      users as never,
    );
    return { service, prisma, clerk };
  }

  it('deletes the Clerk identity and the local record', async () => {
    const { service, prisma, clerk } = setup({ id: 'u1', clerkId: 'ck_1' });

    await service.deleteAccount('u1');

    expect(clerk.deleteUser).toHaveBeenCalledWith('ck_1');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('skips Clerk deletion when the user has no Clerk id', async () => {
    const { service, prisma, clerk } = setup({ id: 'u2', clerkId: null });

    await service.deleteAccount('u2');

    expect(clerk.deleteUser).not.toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
  });

  it('throws when the user does not exist', async () => {
    const { service, prisma } = setup(null);

    await expect(service.deleteAccount('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
