/**
 * Purpose: Unit tests for SupportService — creation, listing, access control.
 * Why important: Guards the support ticket lifecycle (forbidden access,
 *   unlock-ownership check, lifecycle date serialization).
 * Used by: jest runner via apps/api jest config.
 */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, SupportTicketStatus } from '@prisma/client';
import { SupportService } from './support.service';

describe('SupportService', () => {
  const createService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      supportTicket: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      unlock: {
        findUnique: jest.fn(),
      },
    };

    return {
      prismaService,
      service: new SupportService(prismaService as never),
    };
  };

  const buildTicket = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'support_1',
    userId: 'user_1',
    subject: 'STK push stuck',
    message: 'Pending for fifteen minutes.',
    status: SupportTicketStatus.OPEN,
    relatedUnlockId: null,
    channel: null,
    adminNotes: null,
    resolvedAt: null,
    createdAt: new Date('2026-03-29T08:10:00.000Z'),
    updatedAt: new Date('2026-03-29T08:10:00.000Z'),
    ...overrides,
  });

  it('creates a ticket without an unlock reference', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.create.mockResolvedValue(buildTicket());

    const result = await service.createTicket('user_1', {
      subject: 'STK push stuck',
      message: 'Pending for fifteen minutes.',
    });

    expect(prismaService.supportTicket.create).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        subject: 'STK push stuck',
        message: 'Pending for fifteen minutes.',
        relatedUnlockId: null,
      },
    });
    expect(result.status).toBe(SupportTicketStatus.OPEN);
    expect(result.createdAt).toBe('2026-03-29T08:10:00.000Z');
  });

  it('refuses to attach a ticket to an unlock the user does not own', async () => {
    const { prismaService, service } = createService();
    prismaService.unlock.findUnique.mockResolvedValue({
      buyerId: 'other_user',
      listing: { userId: 'someone_else' },
    });

    await expect(
      service.createTicket('user_1', {
        subject: 'Cannot reach tenant',
        message: 'Tenant has not picked up the phone.',
        relatedUnlockId: 'unlock_99',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists my tickets with descending createdAt order', async () => {
    const { prismaService, service } = createService();
    prismaService.$transaction.mockImplementation(
      async (operations: Array<Promise<unknown>>) => Promise.all(operations),
    );
    prismaService.supportTicket.count.mockResolvedValue(2);
    prismaService.supportTicket.findMany.mockResolvedValue([
      buildTicket({ id: 'support_2', subject: 'Refund follow-up' }),
      buildTicket(),
    ]);

    const result = await service.getMyTickets('user_1', { page: 1, limit: 20 });

    expect(prismaService.supportTicket.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    expect(result.pagination.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('throws when reading another user ticket without admin role', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue(
      buildTicket({ userId: 'someone_else' }),
    );

    await expect(
      service.getTicket('user_1', Role.USER, 'support_1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not-found when the ticket id does not exist', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue(null);

    await expect(
      service.getTicket('user_1', Role.USER, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
