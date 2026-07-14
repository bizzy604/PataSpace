/**
 * Purpose: Gate tests for AdminSupportActionsService — reply creation, the
 *   status transition map, resolvedAt handling, and priority changes.
 * Why important: The transition map is the guard that keeps a ticket's
 *   lifecycle sane; a hole would let an operator jump a CLOSED ticket straight
 *   back to OPEN or resolve without stamping resolvedAt.
 * Used by: jest runner via apps/api jest config.
 */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role, SupportTicketStatus } from '@prisma/client';
import { AdminSupportActionsService } from './admin-support-actions.service';

const createService = () => {
  const tx = {
    supportTicket: { update: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const prismaService = {
    supportTicket: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    supportTicketMessage: { create: jest.fn() },
    $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };
  return {
    prismaService,
    tx,
    service: new AdminSupportActionsService(prismaService as never),
  };
};

describe('AdminSupportActionsService', () => {
  it('posts an admin reply and pulls an OPEN ticket into review', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({ id: 'ticket_1' });
    prismaService.supportTicketMessage.create.mockResolvedValue({
      id: 'msg_1',
      authorId: 'admin_1',
      authorRole: Role.ADMIN,
      body: 'Looking into it.',
      createdAt: new Date('2026-07-13T10:28:00.000Z'),
      author: { firstName: 'Ada', lastName: 'Njeri' },
    });

    const record = await service.postReply('admin_1', 'ticket_1', { body: '  Looking into it.  ' });

    expect(prismaService.supportTicketMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorId: 'admin_1',
          authorRole: Role.ADMIN,
          body: 'Looking into it.',
        }),
      }),
    );
    expect(prismaService.supportTicket.updateMany).toHaveBeenCalledWith({
      where: { id: 'ticket_1', status: SupportTicketStatus.OPEN },
      data: { status: SupportTicketStatus.IN_REVIEW },
    });
    expect(record).toMatchObject({ id: 'msg_1', authorName: 'Ada Njeri', authorRole: Role.ADMIN });
  });

  it('allows a valid transition and stamps resolvedAt on RESOLVED', async () => {
    const { prismaService, tx, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({
      status: SupportTicketStatus.IN_REVIEW,
      resolvedAt: null,
    });
    const now = new Date('2026-07-13T11:00:00.000Z');

    const result = await service.updateStatus(
      'admin_1',
      'ticket_1',
      { status: SupportTicketStatus.RESOLVED as never },
      now,
    );

    expect(tx.supportTicket.update).toHaveBeenCalledWith({
      where: { id: 'ticket_1' },
      data: { status: SupportTicketStatus.RESOLVED, resolvedAt: now },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'support.status_changed', userId: 'admin_1' }),
      }),
    );
    expect(result).toEqual({ id: 'ticket_1', status: SupportTicketStatus.RESOLVED });
  });

  it('clears resolvedAt when reopening to IN_REVIEW', async () => {
    const { prismaService, tx, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({
      status: SupportTicketStatus.RESOLVED,
      resolvedAt: new Date('2026-07-10T00:00:00.000Z'),
    });

    await service.updateStatus('admin_1', 'ticket_1', {
      status: SupportTicketStatus.IN_REVIEW as never,
    });

    expect(tx.supportTicket.update).toHaveBeenCalledWith({
      where: { id: 'ticket_1' },
      data: { status: SupportTicketStatus.IN_REVIEW, resolvedAt: null },
    });
  });

  it('rejects an illegal transition (CLOSED to OPEN)', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({
      status: SupportTicketStatus.CLOSED,
      resolvedAt: new Date(),
    });

    await expect(
      service.updateStatus('admin_1', 'ticket_1', { status: SupportTicketStatus.OPEN as never }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a status change on a missing ticket', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue(null);

    await expect(
      service.updateStatus('admin_1', 'missing', { status: SupportTicketStatus.CLOSED as never }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses a no-op priority change', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({ priority: 'HIGH' });

    await expect(
      service.updatePriority('admin_1', 'ticket_1', { priority: 'HIGH' as never }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
