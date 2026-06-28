/**
 * Purpose: Owner-side query for unlocks placed against the authenticated user's
 *   listings, exposing per-side confirmation state and commission status so an
 *   outgoing tenant can discover which unlocks still need their confirmation.
 * Why important: The buyer-only `/unlocks/my-unlocks` view gave the outgoing
 *   tenant no handle on the unlockIds they must confirm. Without this the
 *   outgoing-tenant confirmation step had no working entry point and relied
 *   entirely on the 14-day auto-confirm fallback.
 * Used by: UnlockController (GET /unlocks/received) and the mobile MyListings flow.
 */
import { Injectable } from '@nestjs/common';
import { ConfirmationSide, DisputeStatus, Prisma } from '@prisma/client';
import {
  CommissionStatus as ContractCommissionStatus,
  PaginatedReceivedUnlocksResponse,
  ReceivedUnlockRecord,
  ReceivedUnlocksFilters,
  ReceivedUnlockStatus,
  UnlockHistoryStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';

const ACTIVE_DISPUTE_STATUSES: DisputeStatus[] = [
  DisputeStatus.OPEN,
  DisputeStatus.INVESTIGATING,
];

type ReceivedUnlock = Prisma.UnlockGetPayload<{
  select: {
    id: true;
    isRefunded: true;
    createdAt: true;
    confirmations: { select: { confirmedAt: true; side: true } };
    dispute: { select: { status: true } };
    commission: { select: { amountKES: true; status: true; eligibleAt: true } };
    listing: {
      select: { id: true; neighborhood: true; monthlyRent: true; bedrooms: true };
    };
  };
}>;

@Injectable()
export class ReceivedUnlockService {
  constructor(private readonly prismaService: PrismaService) {}

  async getReceivedUnlocks(
    ownerId: string,
    filters: ReceivedUnlocksFilters,
  ): Promise<PaginatedReceivedUnlocksResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.UnlockWhereInput = {
      listing: { is: { userId: ownerId } },
      ...this.buildStatusWhere(filters.status),
    };

    const [total, unlocks] = await this.prismaService.$transaction([
      this.prismaService.unlock.count({ where }),
      this.prismaService.unlock.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          isRefunded: true,
          createdAt: true,
          confirmations: { select: { confirmedAt: true, side: true } },
          dispute: { select: { status: true } },
          commission: { select: { amountKES: true, status: true, eligibleAt: true } },
          listing: {
            select: { id: true, neighborhood: true, monthlyRent: true, bedrooms: true },
          },
        },
      }),
    ]);

    return {
      data: unlocks.map((unlock) => this.toRecord(unlock)),
      pagination: this.buildPagination(total, page, limit),
    };
  }

  private toRecord(unlock: ReceivedUnlock): ReceivedUnlockRecord {
    const incomingConfirmed = unlock.confirmations.some(
      (confirmation) => confirmation.side === ConfirmationSide.INCOMING_TENANT,
    );
    const outgoingConfirmed = unlock.confirmations.some(
      (confirmation) => confirmation.side === ConfirmationSide.OUTGOING_TENANT,
    );

    return {
      unlockId: unlock.id,
      listing: {
        id: unlock.listing.id,
        neighborhood: unlock.listing.neighborhood,
        monthlyRent: unlock.listing.monthlyRent,
        bedrooms: unlock.listing.bedrooms,
      },
      incomingConfirmed,
      outgoingConfirmed,
      status: this.resolveHistoryStatus(
        unlock.isRefunded,
        unlock.dispute?.status,
        incomingConfirmed,
        outgoingConfirmed,
      ),
      commission: unlock.commission
        ? {
            amountKES: unlock.commission.amountKES,
            status: unlock.commission.status as unknown as ContractCommissionStatus,
            payableOn: unlock.commission.eligibleAt?.toISOString() ?? null,
          }
        : null,
      isRefunded: unlock.isRefunded,
      createdAt: unlock.createdAt.toISOString(),
    };
  }

  private buildStatusWhere(status?: ReceivedUnlockStatus): Prisma.UnlockWhereInput {
    if (!status || status === 'all') {
      return {};
    }

    const bothConfirmedFilter: Prisma.UnlockWhereInput = {
      AND: [
        { confirmations: { some: { side: ConfirmationSide.INCOMING_TENANT } } },
        { confirmations: { some: { side: ConfirmationSide.OUTGOING_TENANT } } },
      ],
    };

    if (status === 'confirmed') {
      return { isRefunded: false, ...bothConfirmedFilter };
    }

    // awaiting_confirmation: owner has not confirmed, not refunded, not blocked
    return {
      isRefunded: false,
      confirmations: { none: { side: ConfirmationSide.OUTGOING_TENANT } },
      NOT: {
        dispute: { is: { status: { in: [...ACTIVE_DISPUTE_STATUSES] } } },
      },
    };
  }

  private resolveHistoryStatus(
    isRefunded: boolean,
    disputeStatus: DisputeStatus | undefined,
    incomingConfirmed: boolean,
    outgoingConfirmed: boolean,
  ): UnlockHistoryStatus {
    if (isRefunded) {
      return 'refunded';
    }
    if (disputeStatus && ACTIVE_DISPUTE_STATUSES.includes(disputeStatus)) {
      return 'disputed';
    }
    if (incomingConfirmed && outgoingConfirmed) {
      return 'confirmed';
    }
    return 'pending_confirmation';
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
