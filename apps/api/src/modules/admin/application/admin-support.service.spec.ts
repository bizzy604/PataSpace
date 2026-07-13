/**
 * Purpose: Gate tests for AdminSupportService — queue mapping/filters and the
 *   ticket detail (reporter profile + decrypted phone + thread).
 * Why important: The detail view exposes a decrypted phone; this proves the
 *   decryption path is wired and that a missing ticket 404s.
 * Used by: jest runner via apps/api jest config.
 */
import { NotFoundException } from '@nestjs/common';
import { Role, SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import { AdminSupportService } from './admin-support.service';

const createService = () => {
  const prismaService = {
    supportTicket: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  };
  const userService = { decryptPhoneNumber: jest.fn(() => '+254712345678') };
  return {
    prismaService,
    userService,
    service: new AdminSupportService(prismaService as never, userService as never),
  };
};

describe('AdminSupportService', () => {
  it('maps queue rows with message count, last-message time, and meta', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.count.mockResolvedValue(12);
    prismaService.supportTicket.findMany.mockResolvedValue([
      {
        id: 'ticket_1',
        subject: 'Landlord rejected application',
        status: SupportTicketStatus.OPEN,
        priority: SupportTicketPriority.HIGH,
        assignedToId: null,
        relatedUnlockId: null,
        createdAt: new Date('2026-07-13T10:23:00.000Z'),
        user: { id: 'user_1', firstName: 'Sarah', lastName: 'Kamau' },
        messages: [{ createdAt: new Date('2026-07-13T10:28:00.000Z') }],
        _count: { messages: 3 },
      },
    ]);

    const result = await service.listTickets({ page: 1, limit: 20 });

    expect(result.data[0]).toMatchObject({
      id: 'ticket_1',
      priority: 'HIGH',
      reporter: { id: 'user_1', firstName: 'Sarah', lastName: 'Kamau' },
      messageCount: 3,
      lastMessageAt: '2026-07-13T10:28:00.000Z',
    });
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 12, totalPages: 1 });
  });

  it('filters by status, priority, and search term', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.count.mockResolvedValue(0);
    prismaService.supportTicket.findMany.mockResolvedValue([]);

    await service.listTickets({
      page: 1,
      limit: 20,
      status: SupportTicketStatus.OPEN as never,
      priority: SupportTicketPriority.HIGH as never,
      search: 'sarah',
    });

    const where = prismaService.supportTicket.count.mock.calls[0][0].where;
    expect(where.status).toBe(SupportTicketStatus.OPEN);
    expect(where.priority).toBe(SupportTicketPriority.HIGH);
    expect(where.OR).toEqual(
      expect.arrayContaining([{ subject: { contains: 'sarah', mode: 'insensitive' } }]),
    );
  });

  it('returns ticket detail with a decrypted reporter phone and thread', async () => {
    const { prismaService, userService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue({
      id: 'ticket_1',
      subject: 'Landlord rejected application',
      status: SupportTicketStatus.OPEN,
      priority: SupportTicketPriority.HIGH,
      assignedToId: null,
      channel: null,
      adminNotes: null,
      relatedUnlockId: null,
      resolvedAt: null,
      createdAt: new Date('2026-07-13T10:23:00.000Z'),
      updatedAt: new Date('2026-07-13T10:28:00.000Z'),
      user: {
        id: 'user_1',
        firstName: 'Sarah',
        lastName: 'Kamau',
        phoneNumberEncrypted: 'enc',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
      },
      messages: [
        {
          id: 'msg_1',
          authorId: 'user_1',
          authorRole: Role.USER,
          body: 'I need help.',
          createdAt: new Date('2026-07-13T10:23:00.000Z'),
          author: { firstName: 'Sarah', lastName: 'Kamau' },
        },
      ],
    });

    const detail = await service.getTicketDetail('ticket_1');

    expect(userService.decryptPhoneNumber).toHaveBeenCalledWith('enc');
    expect(detail.reporter.phoneNumber).toBe('+254712345678');
    expect(detail.messages).toEqual([
      {
        id: 'msg_1',
        authorId: 'user_1',
        authorRole: Role.USER,
        authorName: 'Sarah Kamau',
        body: 'I need help.',
        createdAt: '2026-07-13T10:23:00.000Z',
      },
    ]);
  });

  it('404s a missing ticket', async () => {
    const { prismaService, service } = createService();
    prismaService.supportTicket.findUnique.mockResolvedValue(null);

    await expect(service.getTicketDetail('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
