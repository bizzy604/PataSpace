/**
 * Purpose: Read models for the credit wallet: cached balance summary (with
 * pending commissions) and paginated transaction history.
 * Why important: keeps HTTP read concerns out of CreditService, which owns
 * the money movements; reads must never mutate.
 * Used by: credit.controller.ts.
 */
import { Injectable } from '@nestjs/common';
import { CommissionStatus, Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import {
  CreditBalance,
  CreditTransactionFilters,
  PaginatedCreditTransactionsResponse,
  TransactionStatus as ContractTransactionStatus,
  TransactionType as ContractTransactionType,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { creditBalanceCacheKey } from './credit-cache.util';
import { CreditService } from './credit.service';

const BALANCE_CACHE_TTL_SECONDS = 300;
const PENDING_COMMISSION_STATUSES = [
  CommissionStatus.PENDING,
  CommissionStatus.DUE,
  CommissionStatus.PROCESSING,
] as const;

@Injectable()
export class CreditQueryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
    private readonly creditService: CreditService,
  ) {}

  async getBalance(userId: string): Promise<CreditBalance> {
    const cacheKey = creditBalanceCacheKey(userId);
    const cached = await this.cacheService.get<CreditBalance>(cacheKey);

    if (cached) {
      return cached;
    }

    const [credit, pendingCommissions] = await this.prismaService.$transaction([
      this.creditService.ensureCreditAccount(userId),
      this.prismaService.commission.aggregate({
        where: {
          outgoingTenantId: userId,
          status: {
            in: [...PENDING_COMMISSION_STATUSES],
          },
        },
        _sum: {
          amountKES: true,
        },
      }),
    ]);

    const balance: CreditBalance = {
      balance: credit.balance,
      lifetimeEarned: credit.lifetimeEarned,
      lifetimeSpent: credit.lifetimeSpent,
      pendingCommissions: pendingCommissions._sum.amountKES ?? 0,
    };

    await this.cacheService.set(cacheKey, balance, BALANCE_CACHE_TTL_SECONDS);

    return balance;
  }

  async getTransactionHistory(
    userId: string,
    filters: CreditTransactionFilters,
  ): Promise<PaginatedCreditTransactionsResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.CreditTransactionWhereInput = {
      userId,
    };

    if (filters.type) {
      where.type = filters.type as unknown as TransactionType;
    }

    if (filters.status) {
      where.status = filters.status as unknown as TransactionStatus;
    }

    const [total, transactions] = await this.prismaService.$transaction([
      this.prismaService.creditTransaction.count({ where }),
      this.prismaService.creditTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          status: true,
          description: true,
          mpesaReceiptNumber: true,
          unlockId: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type as unknown as ContractTransactionType,
        amount: transaction.amount,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        status: transaction.status as unknown as ContractTransactionStatus,
        description: transaction.description ?? undefined,
        mpesaReceiptNumber: transaction.mpesaReceiptNumber ?? undefined,
        unlockId: transaction.unlockId ?? undefined,
        createdAt: transaction.createdAt.toISOString(),
      })),
      pagination: this.buildPagination(total, page, limit),
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
