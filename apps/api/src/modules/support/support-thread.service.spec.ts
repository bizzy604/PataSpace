/**
 * Purpose: Gate tests for SupportThreadService — ownership guard on read/reply
 *   and the reopen-on-tenant-reply behavior.
 * Why important: A tenant must only see their own ticket thread; an admin may
 *   see any. A returning tenant should reopen a resolved ticket.
 * Used by: jest runner via apps/api jest config.
 */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SupportThreadService } from './support-thread.service';

const createService = () => {
  const prismaService = {
    supportTicket: { findUnique: jest.fn(), updateMany: jest.fn() },
    supportTicketMessage: { findMany: jest.fn(), create: jest.fn() },
  };
  return { prismaService, service: new SupportThreadService(prismaService as never) };
};

describe('SupportThreadService', () => {
  it('lets the owner read their thread', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({ userId: 'user_1' });
    prismaService.supportTicketMessage.findMany.mockResolvedValue([
      {
        id: 'msg_1',
        authorId: 'user_1',
        authorRole: Role.USER,
        body: 'Help please',
        createdAt: new Date('2026-07-13T10:23:00.000Z'),
        author: { firstName: 'Sarah', lastName: 'Kamau' },
      },
    ]);

    const thread = await service.getThread('user_1', Role.USER, 'ticket_1');

    expect(thread.ticketId).toBe('ticket_1');
    expect(thread.messages[0]).toMatchObject({ authorName: 'Sarah Kamau', body: 'Help please' });
  });

  it('forbids a non-owner tenant', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({ userId: 'someone_else' });

    await expect(service.getThread('user_1', Role.USER, 'ticket_1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('lets an admin read any thread', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({ userId: 'someone_else' });
    prismaService.supportTicketMessage.findMany.mockResolvedValue([]);

    const thread = await service.getThread('admin_1', Role.ADMIN, 'ticket_1');

    expect(thread.messages).toEqual([]);
  });

  it('404s a missing ticket', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue(null);

    await expect(service.getThread('user_1', Role.USER, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('posts a reply and reopens a resolved ticket', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({ userId: 'user_1' });
    prismaService.supportTicketMessage.create.mockResolvedValue({
      id: 'msg_2',
      authorId: 'user_1',
      authorRole: Role.USER,
      body: 'Any update?',
      createdAt: new Date('2026-07-14T09:00:00.000Z'),
      author: { firstName: 'Sarah', lastName: 'Kamau' },
    });

    await service.postMessage('user_1', Role.USER, 'ticket_1', { body: 'Any update?' });

    expect(prismaService.supportTicketMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: 'user_1', authorRole: Role.USER }),
      }),
    );
    expect(prismaService.supportTicket.updateMany).toHaveBeenCalledWith({
      where: { id: 'ticket_1', status: 'RESOLVED' },
      data: { status: 'IN_REVIEW' },
    });
  });
});
