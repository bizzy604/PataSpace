/**
 * Purpose: Read side of the admin support workspace — the triage queue and a
 *   single ticket's detail (reporter profile + full message thread).
 * Why important: This is the operator's view into user pain; the detail view
 *   decrypts the reporter's phone so support can reach them.
 * Used by: AdminSupportController (modules/admin).
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import {
  AdminSupportTicketDetail,
  AdminSupportTicketsResponse,
  AdminSupportTicketSummary,
  SupportTicketPriority as ContractPriority,
  SupportTicketStatus as ContractStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';
import { UserService } from '../../user/user.service';
import { mapSupportMessages } from './admin-support.mapper';

export type AdminSupportTicketsQuery = {
  page: number;
  limit: number;
  status?: ContractStatus;
  priority?: ContractPriority;
  search?: string;
};

@Injectable()
export class AdminSupportService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async listTickets(query: AdminSupportTicketsQuery): Promise<AdminSupportTicketsResponse> {
    const where = this.buildWhere(query);
    const [total, tickets] = await Promise.all([
      this.prismaService.supportTicket.count({ where }),
      this.prismaService.supportTicket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    return {
      data: tickets.map((ticket) => this.toSummary(ticket)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getTicketDetail(ticketId: string): Promise<AdminSupportTicketDetail> {
    const ticket = await this.prismaService.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumberEncrypted: true,
            createdAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException({
        code: 'SUPPORT_TICKET_NOT_FOUND',
        message: 'Support ticket was not found',
      });
    }

    const phoneNumber = ticket.user.phoneNumberEncrypted
      ? this.userService.decryptPhoneNumber(ticket.user.phoneNumberEncrypted)
      : null;

    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status as unknown as ContractStatus,
      priority: ticket.priority as unknown as ContractPriority,
      assignedToId: ticket.assignedToId,
      channel: ticket.channel,
      adminNotes: ticket.adminNotes,
      relatedUnlockId: ticket.relatedUnlockId,
      reporter: {
        id: ticket.user.id,
        firstName: ticket.user.firstName,
        lastName: ticket.user.lastName,
        phoneNumber,
        createdAt: ticket.user.createdAt.toISOString(),
      },
      messages: mapSupportMessages(ticket.messages),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  private buildWhere(query: AdminSupportTicketsQuery): Prisma.SupportTicketWhereInput {
    const where: Prisma.SupportTicketWhereInput = {};
    if (query.status) {
      where.status = query.status as unknown as SupportTicketStatus;
    }
    if (query.priority) {
      where.priority = query.priority as unknown as SupportTicketPriority;
    }
    if (query.search) {
      const term = query.search;
      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { user: { firstName: { contains: term, mode: 'insensitive' } } },
        { user: { lastName: { contains: term, mode: 'insensitive' } } },
      ];
    }
    return where;
  }

  private toSummary(ticket: {
    id: string;
    subject: string;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    assignedToId: string | null;
    relatedUnlockId: string | null;
    createdAt: Date;
    user: { id: string; firstName: string; lastName: string };
    messages: { createdAt: Date }[];
    _count: { messages: number };
  }): AdminSupportTicketSummary {
    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status as unknown as ContractStatus,
      priority: ticket.priority as unknown as ContractPriority,
      reporter: {
        id: ticket.user.id,
        firstName: ticket.user.firstName,
        lastName: ticket.user.lastName,
      },
      assignedToId: ticket.assignedToId,
      messageCount: ticket._count.messages,
      lastMessageAt: ticket.messages[0]?.createdAt.toISOString() ?? null,
      relatedUnlockId: ticket.relatedUnlockId,
      createdAt: ticket.createdAt.toISOString(),
    };
  }
}
