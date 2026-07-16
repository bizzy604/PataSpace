/**
 * Purpose: The credit wallet's movement engine: atomic balance increments and
 * guarded decrements, movement-row creation (spend, refund, bonus), and
 * balance-cache invalidation. Read models live in CreditQueryService.
 * Why important: every credit that enters or leaves a wallet goes through
 * these methods; the conditional decrement is the spend check that prevents
 * overdrafts, and movement rows are the audit trail.
 * Used by: payment, unlock, confirmation, referral, and job modules.
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  PaymentMethod,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { creditBalanceCacheKey } from './credit-cache.util';

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
  paymentMethod?: PaymentMethod;
  /**
   * Client-supplied dedupe key for money-creating requests, unique per
   * (userId, idempotencyKey) at the DB level. A same-key retry collides on
   * the constraint and must replay the stored result, never re-process.
   */
  idempotencyKey?: string | null;
  description?: string;
  phoneNumberHash?: string | null;
  unlockId?: string;
  mpesaReceiptNumber?: string | null;
  mpesaTransactionId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

@Injectable()
export class CreditService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

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
        paymentMethod: input.paymentMethod ?? undefined,
        idempotencyKey: input.idempotencyKey ?? undefined,
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
      // Optional: unlock purchases link the spend to their unlock row;
      // success-fee settlements spend without one (unlockId is unique per
      // transaction and already consumed by the original unlock spend).
      unlockId?: string;
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

  async grantBonusCredits(
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
      lifetimeEarnedDelta: input.amount,
    });

    const transaction = await this.createTransaction(client, {
      userId: input.userId,
      type: TransactionType.BONUS,
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
    await this.cacheService.del(creditBalanceCacheKey(userId));
  }
}
