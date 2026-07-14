/**
 * Purpose: Mutations on the admin support workspace — post an admin reply,
 *   transition status, and change priority, each audit-logged.
 * Why important: Status transitions gate what an operator can do next; the
 *   transition map refuses nonsensical jumps and keeps resolvedAt honest.
 * Used by: AdminSupportController (modules/admin).
 */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import {
  PostSupportMessageRequest,
  SupportTicketMessageRecord,
  SupportTicketPriority as ContractPriority,
  SupportTicketStatus as ContractStatus,
  UpdateSupportTicketPriorityRequest,
  UpdateSupportTicketStatusRequest,
} from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';
import { mapSupportMessage } from './admin-support.mapper';

const ALLOWED_TRANSITIONS: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  [SupportTicketStatus.OPEN]: [
    SupportTicketStatus.IN_REVIEW,
    SupportTicketStatus.RESOLVED,
    SupportTicketStatus.CLOSED,
  ],
  [SupportTicketStatus.IN_REVIEW]: [
    SupportTicketStatus.OPEN,
    SupportTicketStatus.RESOLVED,
    SupportTicketStatus.CLOSED,
  ],
  [SupportTicketStatus.RESOLVED]: [SupportTicketStatus.IN_REVIEW, SupportTicketStatus.CLOSED],
  [SupportTicketStatus.CLOSED]: [SupportTicketStatus.IN_REVIEW],
};

const CLOSED_LIKE = new Set<SupportTicketStatus>([
  SupportTicketStatus.RESOLVED,
  SupportTicketStatus.CLOSED,
]);

@Injectable()
export class AdminSupportActionsService {
  constructor(private readonly prismaService: PrismaService) {}

  async postReply(
    adminId: string,
    ticketId: string,
    input: PostSupportMessageRequest,
  ): Promise<SupportTicketMessageRecord> {
    await this.assertTicketExists(ticketId);
    const message = await this.prismaService.supportTicketMessage.create({
      data: { ticketId, authorId: adminId, authorRole: Role.ADMIN, body: input.body.trim() },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    // An admin reply pulls an untouched ticket into review.
    await this.prismaService.supportTicket.updateMany({
      where: { id: ticketId, status: SupportTicketStatus.OPEN },
      data: { status: SupportTicketStatus.IN_REVIEW },
    });
    return mapSupportMessage(message);
  }

  async updateStatus(
    adminId: string,
    ticketId: string,
    input: UpdateSupportTicketStatusRequest,
    now = new Date(),
  ) {
    const ticket = await this.getTicketStatus(ticketId);
    const target = input.status as unknown as SupportTicketStatus;
    if (!ALLOWED_TRANSITIONS[ticket.status].includes(target)) {
      throw new ConflictException(`Cannot move a ${ticket.status} ticket to ${target}`);
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: target,
          resolvedAt: CLOSED_LIKE.has(target) ? (ticket.resolvedAt ?? now) : null,
        },
      });
      await this.writeAudit(tx, adminId, ticketId, 'support.status_changed', {
        status: ticket.status,
      }, { status: target });
    });

    return { id: ticketId, status: target as unknown as ContractStatus };
  }

  async updatePriority(
    adminId: string,
    ticketId: string,
    input: UpdateSupportTicketPriorityRequest,
  ) {
    const ticket = await this.getTicketPriority(ticketId);
    const target = input.priority as unknown as SupportTicketPriority;
    if (ticket.priority === target) {
      throw new ConflictException(`Ticket is already ${target} priority`);
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.supportTicket.update({ where: { id: ticketId }, data: { priority: target } });
      await this.writeAudit(tx, adminId, ticketId, 'support.priority_changed', {
        priority: ticket.priority,
      }, { priority: target });
    });

    return { id: ticketId, priority: target as unknown as ContractPriority };
  }

  private async assertTicketExists(ticketId: string) {
    const exists = await this.prismaService.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Support ticket was not found');
    }
  }

  private async getTicketStatus(ticketId: string) {
    const ticket = await this.prismaService.supportTicket.findUnique({
      where: { id: ticketId },
      select: { status: true, resolvedAt: true },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket was not found');
    }
    return ticket;
  }

  private async getTicketPriority(ticketId: string) {
    const ticket = await this.prismaService.supportTicket.findUnique({
      where: { id: ticketId },
      select: { priority: true },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket was not found');
    }
    return ticket;
  }

  private writeAudit(
    tx: Prisma.TransactionClient,
    adminId: string,
    ticketId: string,
    action: string,
    oldValue: Prisma.InputJsonObject,
    newValue: Prisma.InputJsonObject,
  ) {
    return tx.auditLog.create({
      data: {
        userId: adminId,
        action,
        entityType: 'SupportTicket',
        entityId: ticketId,
        oldValue,
        newValue,
      },
    });
  }
}
