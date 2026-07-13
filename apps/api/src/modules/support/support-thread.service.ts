/**
 * Purpose: Tenant-facing support thread — read the conversation and post a
 *   reply on a ticket the caller owns (admins may act on any ticket).
 * Why important: Closes the loop the mobile app needs: a user can follow the
 *   back-and-forth on their own ticket instead of it being admin-only.
 * Used by: SupportController.
 */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  PostSupportMessageRequest,
  Role as ContractRole,
  SupportTicketMessageRecord,
  SupportTicketThreadResponse,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';

type ThreadMessageRow = {
  id: string;
  authorId: string;
  authorRole: Role;
  body: string;
  createdAt: Date;
  author: { firstName: string; lastName: string };
};

@Injectable()
export class SupportThreadService {
  constructor(private readonly prismaService: PrismaService) {}

  async getThread(
    userId: string,
    role: Role,
    ticketId: string,
  ): Promise<SupportTicketThreadResponse> {
    await this.assertAccess(userId, role, ticketId);
    const messages = await this.prismaService.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    return { ticketId, messages: messages.map((row) => this.toRecord(row)) };
  }

  async postMessage(
    userId: string,
    role: Role,
    ticketId: string,
    input: PostSupportMessageRequest,
  ): Promise<SupportTicketMessageRecord> {
    await this.assertAccess(userId, role, ticketId);
    const message = await this.prismaService.supportTicketMessage.create({
      data: { ticketId, authorId: userId, authorRole: role, body: input.body.trim() },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    // A tenant coming back on a resolved ticket reopens it for another look.
    await this.prismaService.supportTicket.updateMany({
      where: { id: ticketId, status: 'RESOLVED' },
      data: { status: 'IN_REVIEW' },
    });
    return this.toRecord(message);
  }

  private async assertAccess(userId: string, role: Role, ticketId: string) {
    const ticket = await this.prismaService.supportTicket.findUnique({
      where: { id: ticketId },
      select: { userId: true },
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
  }

  private toRecord(row: ThreadMessageRow): SupportTicketMessageRecord {
    return {
      id: row.id,
      authorId: row.authorId,
      authorRole: row.authorRole as unknown as ContractRole,
      authorName: `${row.author.firstName} ${row.author.lastName}`.trim(),
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
