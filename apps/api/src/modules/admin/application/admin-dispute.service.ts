/**
 * Purpose: Admin dispute queue — paginated dispute list with reporter and
 *   listing context for the console.
 * Why important: Dispute actions (investigate/resolve/close) already exist on
 *   DisputeController, but the console needs this queue to find them.
 * Used by: AdminDisputesController (modules/admin).
 */
import { Injectable } from '@nestjs/common';
import { DisputeStatus } from '@prisma/client';
import {
  AdminDisputesResponse,
  AdminDisputeSummary,
  DisputeStatus as ContractDisputeStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';

export type AdminDisputesQuery = {
  page: number;
  limit: number;
  status?: ContractDisputeStatus;
};

type DisputeRow = {
  id: string;
  unlockId: string;
  status: DisputeStatus;
  reason: string;
  evidence: string[];
  resolution: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  user: { id: string; firstName: string; lastName: string };
  unlock: { listing: { id: string; county: string; neighborhood: string } };
};

@Injectable()
export class AdminDisputeService {
  constructor(private readonly prismaService: PrismaService) {}

  async listDisputes(query: AdminDisputesQuery): Promise<AdminDisputesResponse> {
    const where = query.status
      ? { status: query.status as unknown as DisputeStatus }
      : {};
    const [total, disputes] = await Promise.all([
      this.prismaService.dispute.count({ where }),
      this.prismaService.dispute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          unlock: {
            select: {
              listing: { select: { id: true, county: true, neighborhood: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: disputes.map((dispute: DisputeRow) => this.toSummary(dispute)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private toSummary(dispute: DisputeRow): AdminDisputeSummary {
    return {
      id: dispute.id,
      unlockId: dispute.unlockId,
      status: dispute.status as unknown as ContractDisputeStatus,
      reason: dispute.reason,
      evidenceCount: dispute.evidence.length,
      reportedBy: {
        id: dispute.user.id,
        firstName: dispute.user.firstName,
        lastName: dispute.user.lastName,
      },
      listing: {
        id: dispute.unlock.listing.id,
        county: dispute.unlock.listing.county,
        neighborhood: dispute.unlock.listing.neighborhood,
      },
      resolution: dispute.resolution,
      resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
      createdAt: dispute.createdAt.toISOString(),
    };
  }
}
