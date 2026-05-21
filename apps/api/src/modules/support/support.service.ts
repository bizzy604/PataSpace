/**
 * Purpose: Application service for support tickets — creates, reads, and
 *   updates support records for the authenticated user.
 * Why important: Backs the tenant support inbox and admin triage view so
 *   help requests are persisted and tracked through the OPEN → IN_REVIEW
 *   → RESOLVED → CLOSED lifecycle instead of being lost in local state.
 * Used by: SupportController.
 */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import {
  CreateSupportTicketRequest,
  CreateSupportTicketResponse,
  PaginatedSupportTicketsResponse,
  SupportTicketRecord,
  SupportTicketStatus as ContractSupportTicketStatus,
  SupportTicketsFilters,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class SupportService {
  constructor(private readonly prismaService: PrismaService) {}

  async createTicket(
    userId: string,
    input: CreateSupportTicketRequest,
  ): Promise<CreateSupportTicketResponse> {
    if (input.relatedUnlockId) {
      await this.assertOwnedUnlock(userId, input.relatedUnlockId);
    }

    const ticket = await this.prismaService.supportTicket.create({
      data: {
        userId,
        subject: input.subject.trim(),
        message: input.message.trim(),
        relatedUnlockId: input.relatedUnlockId ?? null,
      },
    });

    return this.toRecord(ticket);
  }

  async getMyTickets(
    userId: string,
    filters: SupportTicketsFilters,
  ): Promise<PaginatedSupportTicketsResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.SupportTicketWhereInput = {
      userId,
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [total, tickets] = await this.prismaService.$transaction([
      this.prismaService.supportTicket.count({ where }),
      this.prismaService.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: tickets.map((ticket) => this.toRecord(ticket)),
      pagination: this.buildPagination(total, page, limit),
    };
  }

  async getTicket(
    userId: string,
    role: Role,
    ticketId: string,
  ): Promise<SupportTicketRecord> {
    const ticket = await this.prismaService.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException({
        code: 'SUPPORT_TICKET_NOT_FOUND',
        message: 'Support ticket was not found',
      });
    }

    if (role !== Role.ADMIN && ticket.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You are not allowed to read this ticket',
      });
    }

    return this.toRecord(ticket);
  }

  private async assertOwnedUnlock(userId: string, unlockId: string) {
    const unlock = await this.prismaService.unlock.findUnique({
      where: { id: unlockId },
      select: { buyerId: true, listing: { select: { userId: true } } },
    });

    if (!unlock || (unlock.buyerId !== userId && unlock.listing.userId !== userId)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only attach a ticket to an unlock you participated in',
      });
    }
  }

  private toRecord(ticket: {
    id: string;
    subject: string;
    message: string;
    status: string;
    relatedUnlockId: string | null;
    channel: string | null;
    adminNotes: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SupportTicketRecord {
    return {
      id: ticket.id,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status as unknown as ContractSupportTicketStatus,
      relatedUnlockId: ticket.relatedUnlockId,
      channel: ticket.channel,
      adminNotes: ticket.adminNotes,
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  private buildPagination(total: number, page: number, limit: number) {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: totalPages > 0 && page < totalPages,
      hasPrev: totalPages > 0 && page > 1,
    };
  }
}
