import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CommissionStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import {
  CreditBalance,
  CreditTransactionFilters,
  PaginatedCreditTransactionsResponse,
  TransactionStatus as ContractTransactionStatus,
  TransactionType as ContractTransactionType,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';

type CreditDbClient = PrismaService | Prisma.TransactionClient;

type BalanceUpdateInput = {
  userId: string;
  amount: number;
  lifetimeEarnedDelta?: number;
  lifetimeSpentDelta?: number;
};

type CreateTransactionInput = {
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status?: TransactionStatus;
  description?: string;
  phoneNumberHash?: string | null;
  unlockId?: string;
  mpesaReceiptNumber?: string | null;
  mpesaTransactionId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

const BALANCE_CACHE_TTL_SECONDS = 300;
const PENDING_COMMISSION_STATUSES = [
  CommissionStatus.PENDING,
  CommissionStatus.DUE,
  CommissionStatus.PROCESSING,
] as const;

@Injectable()
export class CreditService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getBalance(userId: string): Promise<CreditBalance> {
    const cacheKey = this.balanceCacheKey(userId);
    const cached = await this.cacheService.get<CreditBalance>(cacheKey);

    if (cached) {
      return cached;
    }

    const [credit, pendingCommissions] = await this.prismaService.$transaction([
      this.ensureCreditAccount(userId),
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

  ensureCreditAccount(userId: string, client: CreditDbClient = this.prismaService) {
    return client.credit.upsert({
      where: {
        userId,
      },
      update: {},
      create: {
        userId,
      },
    });
  }

  async getCurrentBalanceValue(userId: string, client: CreditDbClient = this.prismaService) {
    const credit = await this.ensureCreditAccount(userId, client);
    return credit.balance;
  }

  async applyBalanceIncrement(
    client: CreditDbClient,
    input: BalanceUpdateInput,
  ): Promise<{ balanceBefore: number; balanceAfter: number }> {
    await this.ensureCreditAccount(input.userId, client);

    const data: Prisma.CreditUpdateInput = {
      balance: {
        increment: input.amount,
      },
    };

    if (input.lifetimeEarnedDelta) {
      data.lifetimeEarned = {
        increment: input.lifetimeEarnedDelta,
      };
    }

    if (input.lifetimeSpentDelta) {
      data.lifetimeSpent = {
        increment: input.lifetimeSpentDelta,
      };
    }

    const updatedCredit = await client.credit.update({
      where: {
        userId: input.userId,
      },
      data,
      select: {
        balance: true,
      },
    });

    return {
      balanceBefore: updatedCredit.balance - input.amount,
      balanceAfter: updatedCredit.balance,
    };
  }

  async applyBalanceDecrement(
    client: CreditDbClient,
    input: BalanceUpdateInput,
  ): Promise<{ balanceBefore: number; balanceAfter: number }> {
    await this.ensureCreditAccount(input.userId, client);

    const data: Prisma.CreditUpdateManyMutationInput = {
      balance: {
        decrement: input.amount,
      },
    };

    if (input.lifetimeEarnedDelta) {
      data.lifetimeEarned = {
        increment: input.lifetimeEarnedDelta,
      };
    }

    if (input.lifetimeSpentDelta) {
      data.lifetimeSpent = {
        increment: input.lifetimeSpentDelta,
      };
    }

    const updatedCount = await client.credit.updateMany({
      where: {
        userId: input.userId,
        balance: {
          gte: input.amount,
        },
      },
      data,
    });

    if (updatedCount.count === 0) {
      const credit = await this.ensureCreditAccount(input.userId, client);

      throw new HttpException(
        {
          code: 'INSUFFICIENT_CREDITS',
          message: `You need ${input.amount} credits. Current balance: ${credit.balance}.`,
          details: {
            required: input.amount,
            current: credit.balance,
            shortfall: Math.max(input.amount - credit.balance, 0),
          },
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const updatedCredit = await client.credit.findUniqueOrThrow({
      where: {
        userId: input.userId,
      },
      select: {
        balance: true,
      },
    });

    return {
      balanceBefore: updatedCredit.balance + input.amount,
      balanceAfter: updatedCredit.balance,
    };
  }

  createTransaction(client: CreditDbClient, input: CreateTransactionInput) {
    return client.creditTransaction.create({
      data: {
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        balanceBefore: input.balanceBefore,
        balanceAfter: input.balanceAfter,
        status: input.status ?? TransactionStatus.COMPLETED,
        description: input.description,
        phoneNumberHash: input.phoneNumberHash ?? undefined,
        unlockId: input.unlockId,
        mpesaReceiptNumber: input.mpesaReceiptNumber ?? undefined,
        mpesaTransactionId: input.mpesaTransactionId ?? undefined,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  async spendCredits(
    client: CreditDbClient,
    input: {
      userId: string;
      amount: number;
      description: string;
      unlockId: string;
      phoneNumberHash?: string | null;
      metadata?: Prisma.InputJsonValue | null;
    },
  ) {
    const balance = await this.applyBalanceDecrement(client, {
      userId: input.userId,
      amount: input.amount,
      lifetimeSpentDelta: input.amount,
    });

    const transaction = await this.createTransaction(client, {
      userId: input.userId,
      type: TransactionType.SPEND,
      amount: -input.amount,
      balanceBefore: balance.balanceBefore,
      balanceAfter: balance.balanceAfter,
      description: input.description,
      phoneNumberHash: input.phoneNumberHash ?? undefined,
      unlockId: input.unlockId,
      metadata: input.metadata ?? undefined,
    });

    return {
      balanceAfter: balance.balanceAfter,
      transaction,
    };
  }

  async refundCredits(
    client: CreditDbClient,
    input: {
      userId: string;
      amount: number;
      description: string;
      metadata?: Prisma.InputJsonValue | null;
    },
  ) {
    const balance = await this.applyBalanceIncrement(client, {
      userId: input.userId,
      amount: input.amount,
    });

    const transaction = await this.createTransaction(client, {
      userId: input.userId,
      type: TransactionType.REFUND,
      amount: input.amount,
      balanceBefore: balance.balanceBefore,
      balanceAfter: balance.balanceAfter,
      description: input.description,
      metadata: input.metadata ?? undefined,
    });

    return {
      balanceAfter: balance.balanceAfter,
      transaction,
    };
  }

  async invalidateBalanceCache(userId: string) {
    await this.cacheService.del(this.balanceCacheKey(userId));
  }

  private balanceCacheKey(userId: string) {
    return `credit:balance:${userId}`;
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
