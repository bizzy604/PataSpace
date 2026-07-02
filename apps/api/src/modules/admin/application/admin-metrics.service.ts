/**
 * Purpose: Aggregates the counts behind the admin dashboard — users, listings,
 *   unlocks, disputes, commissions, and support tickets in one payload.
 * Why important: This is the operator's first screen; every number is a
 *   database count, never an estimate, so ops decisions rest on real state.
 * Used by: AdminMetricsController (modules/admin).
 */
import { Injectable } from '@nestjs/common';
import {
  CommissionStatus,
  DisputeStatus,
  ListingStatus,
  SupportTicketStatus,
} from '@prisma/client';
import { AdminMetricsResponse } from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminMetricsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMetrics(now = new Date()): Promise<AdminMetricsResponse> {
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_IN_MS);

    const [
      usersTotal,
      usersBanned,
      usersNew,
      listingsTotal,
      listingsPending,
      listingsActive,
      listingsRejected,
      unlocksTotal,
      unlocksRecent,
      disputesOpen,
      disputesInvestigating,
      commissionAggregates,
      ticketsOpen,
    ] = await Promise.all([
      this.prismaService.user.count(),
      this.prismaService.user.count({ where: { isBanned: true } }),
      this.prismaService.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prismaService.listing.count({ where: { isDeleted: false } }),
      this.prismaService.listing.count({
        where: { isDeleted: false, status: ListingStatus.PENDING },
      }),
      this.prismaService.listing.count({
        where: { isDeleted: false, status: ListingStatus.ACTIVE },
      }),
      this.prismaService.listing.count({
        where: { isDeleted: false, status: ListingStatus.REJECTED },
      }),
      this.prismaService.unlock.count(),
      this.prismaService.unlock.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prismaService.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      this.prismaService.dispute.count({
        where: { status: DisputeStatus.INVESTIGATING },
      }),
      this.prismaService.commission.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { amountKES: true },
      }),
      this.prismaService.supportTicket.count({
        where: { status: SupportTicketStatus.OPEN },
      }),
    ]);

    const commissionByStatus = new Map<
      CommissionStatus,
      { count: number; amountKES: number }
    >(
      commissionAggregates.map(
        (row: {
          status: CommissionStatus;
          _count: { _all: number };
          _sum: { amountKES: number | null };
        }) => [row.status, { count: row._count._all, amountKES: row._sum.amountKES ?? 0 }],
      ),
    );
    const pending = commissionByStatus.get(CommissionStatus.PENDING) ?? {
      count: 0,
      amountKES: 0,
    };
    const paid = commissionByStatus.get(CommissionStatus.PAID) ?? {
      count: 0,
      amountKES: 0,
    };

    return {
      users: { total: usersTotal, banned: usersBanned, newLast7Days: usersNew },
      listings: {
        total: listingsTotal,
        pending: listingsPending,
        active: listingsActive,
        rejected: listingsRejected,
      },
      unlocks: { total: unlocksTotal, last7Days: unlocksRecent },
      disputes: { open: disputesOpen, investigating: disputesInvestigating },
      commissions: {
        pendingCount: pending.count,
        pendingAmountKES: pending.amountKES,
        paidCount: paid.count,
        paidAmountKES: paid.amountKES,
      },
      supportTickets: { open: ticketsOpen },
      generatedAt: now.toISOString(),
    };
  }
}
