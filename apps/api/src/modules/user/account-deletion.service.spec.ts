import { NotFoundException } from '@nestjs/common';
import { AccountDeletionService } from './account-deletion.service';

describe('AccountDeletionService', () => {
  function setup(user: { id: string } | null) {
    const prisma = { user: { delete: jest.fn() } };
    const users = { findStoredById: jest.fn().mockResolvedValue(user) };
    const service = new AccountDeletionService(prisma as never, users as never);
    return { service, prisma };
  }

  it('deletes the local record', async () => {
    const { service, prisma } = setup({ id: 'u1' });

    await service.deleteAccount('u1');

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('throws when the user does not exist', async () => {
    const { service, prisma } = setup(null);

    await expect(service.deleteAccount('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
