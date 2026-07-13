/**
 * Purpose: Read side of the admin finance surface — the payout summary tiles
 *   and the paginated commission payout ledger.
 * Why important: These are money figures an operator acts on, so every number
 *   is a live DB aggregate, never an estimate; the ledger is the list the
 *   retry action operates over.
 * Used by: AdminFinanceController (modules/admin).
 */
import { Injectable } from '@nestjs/common';
import { CommissionStatus, Prisma } from '@prisma/client';
import {
  AdminFinanceSummaryResponse,
  AdminPayoutLedgerResponse,
  AdminPayoutRecord,
  CommissionStatus as ContractCommissionStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';

export type AdminPayoutLedgerQuery = {
  page: number;
  limit: number;
  status?: ContractCommissionStatus;
  search?: string;
};

const IN_FLIGHT: CommissionStatus[] = [
  CommissionStatus.PENDING,
  CommissionStatus.DUE,
  CommissionStatus.PROCESSING,
];

type LedgerRow = {
  id: string;
  unlockId: string;
  status: CommissionStatus;
  amountKES: number;
  mpesaReceiptNumber: string | null;
  paymentAttempts: number;
  lastAttemptError: string | null;
  eligibleAt: Date;
  paidAt: Date | null;
  createdAt: Date;
  unlock: {
    listing: {
      id: string;
      county: string;
      neighborhood: string;
      user: { id: string; firstName: string; lastName: string };
    };
  };
};

@Injectable()
export class AdminFinanceService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSummary(now = new Date()): Promise<AdminFinanceSummaryResponse> {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [inFlight, failed, paidMonth, paidYear] = await Promise.all([
      this.aggregate({ status: { in: IN_FLIGHT } }),
      this.aggregate({ status: CommissionStatus.FAILED }),
      this.aggregate({ status: CommissionStatus.PAID, paidAt: { gte: monthStart } }),
      this.aggregate({ status: CommissionStatus.PAID, paidAt: { gte: yearStart } }),
    ]);

    const partners = await this.countDistinctPayees();

    return {
      pendingPayouts: { ...inFlight, partners },
      failedPayouts: failed,
      paidThisMonth: paidMonth,
      paidYearToDate: paidYear,
      generatedAt: now.toISOString(),
    };
  }

  private async aggregate(where: Prisma.CommissionWhereInput) {
    const result = await this.prismaService.commission.aggregate({
      where,
      _sum: { amountKES: true },
      _count: { _all: true },
    });
    return { amountKES: result._sum.amountKES ?? 0, count: result._count._all };
  }

  // Distinct payees among in-flight payouts. Bounded by money in flight, so a
  // findMany-and-dedupe stays cheap and gives a real count, not an estimate.
  private async countDistinctPayees(): Promise<number> {
    const rows = await this.prismaService.commission.findMany({
      where: { status: { in: IN_FLIGHT } },
      select: { unlock: { select: { listing: { select: { userId: true } } } } },
    });
    return new Set(rows.map((row) => row.unlock.listing.userId)).size;
  }

  async listPayouts(query: AdminPayoutLedgerQuery): Promise<AdminPayoutLedgerResponse> {
    const where = this.buildWhere(query);
    const [total, rows] = await Promise.all([
      this.prismaService.commission.count({ where }),
      this.prismaService.commission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          unlock: {
            select: {
              listing: {
                select: {
                  id: true,
                  county: true,
                  neighborhood: true,
                  user: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: rows.map((row: LedgerRow) => this.toRecord(row)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private buildWhere(query: AdminPayoutLedgerQuery): Prisma.CommissionWhereInput {
    const where: Prisma.CommissionWhereInput = {};
    if (query.status) {
      where.status = query.status as unknown as CommissionStatus;
    }
    if (query.search) {
      const term = query.search;
      where.OR = [
        { id: { contains: term, mode: 'insensitive' } },
        { mpesaReceiptNumber: { contains: term, mode: 'insensitive' } },
        { unlockId: { contains: term, mode: 'insensitive' } },
        { unlock: { listing: { neighborhood: { contains: term, mode: 'insensitive' } } } },
      ];
    }
    return where;
  }

  private toRecord(row: LedgerRow): AdminPayoutRecord {
    const listing = row.unlock.listing;
    return {
      id: row.id,
      unlockId: row.unlockId,
      status: row.status as unknown as ContractCommissionStatus,
      amountKES: row.amountKES,
      mpesaReceiptNumber: row.mpesaReceiptNumber,
      paymentAttempts: row.paymentAttempts,
      lastAttemptError: row.lastAttemptError,
      payee: {
        id: listing.user.id,
        firstName: listing.user.firstName,
        lastName: listing.user.lastName,
      },
      listing: { id: listing.id, county: listing.county, neighborhood: listing.neighborhood },
      eligibleAt: row.eligibleAt.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
