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
import { StorageService } from '../../../infrastructure/storage/storage.service';

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
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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
      data: await Promise.all(disputes.map((dispute: DisputeRow) => this.toSummary(dispute))),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private async toSummary(dispute: DisputeRow): Promise<AdminDisputeSummary> {
    const evidence = await Promise.all(dispute.evidence.map((entry) => this.presignEvidence(entry)));
    return {
      id: dispute.id,
      unlockId: dispute.unlockId,
      status: dispute.status as unknown as ContractDisputeStatus,
      reason: dispute.reason,
      evidenceCount: dispute.evidence.length,
      evidence,
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

  /**
   * Evidence lives on the private `evidence/` prefix, so the console gets a
   * short-TTL presigned GET instead of the stored plain URL. Entries that are
   * not evidence-prefix URLs (legacy rows, external links) pass through as-is;
   * a presign failure also falls back to the stored URL rather than hiding the
   * attachment from the admin.
   */
  private async presignEvidence(entry: string): Promise<string> {
    const marker = '/evidence/';
    const markerIndex = entry.indexOf(marker);

    if (markerIndex === -1) {
      return entry;
    }

    const key = entry
      .slice(markerIndex + 1)
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');

    try {
      return await this.storageService.createReadUrl(key);
    } catch {
      return entry;
    }
  }
}




