/**
 * Purpose: Orchestrates credit purchases: validates the user, creates the
 * idempotency-keyed transaction record insert-first, and delegates to the
 * M-Pesa or Stellar provider-specific service.
 * Why important: single entry point where money is created. The DB unique
 * constraint on (userId, idempotencyKey) is the atomic dedupe — a same-key
 * retry collides on insert and replays the stored result instead of
 * charging twice. Response shapes live in purchase-response.util.ts.
 * Used by: payment.controller.ts, payment-reconciliation.job.ts
 */
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  PaymentMethod,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import {
  MpesaCallbackRequest,
  PurchaseCreditsRequest,
  PurchaseCreditsResponse,
} from '@pataspace/contracts';
import { normalizePhoneNumber, hashLookupValue } from '../../common/security/encryption.util';
import { PrismaService } from '../../common/database/prisma.service';
import { CreditService } from '../credit/credit.service';
import { UserService } from '../user/user.service';
import { mergeMetadata } from './payment-metadata.util';
import { MpesaPurchaseService } from './mpesa-purchase.service';
import { MpesaReconcileService } from './mpesa-reconcile.service';
import {
  buildMpesaPurchaseResponse,
  buildReplayResponse,
  buildStellarPurchaseResponse,
  CREDIT_PACKAGES,
} from './purchase-response.util';
import { StellarPurchaseService } from './stellar-purchase.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    private readonly userService: UserService,
    private readonly mpesaPurchaseService: MpesaPurchaseService,
    private readonly mpesaReconcileService: MpesaReconcileService,
    private readonly stellarPurchaseService: StellarPurchaseService,
  ) {}

  async createPurchase(
    userId: string,
    input: PurchaseCreditsRequest,
    idempotencyKey: string,
  ): Promise<PurchaseCreditsResponse> {
    await this.assertUserMayPurchase(userId, input.paymentMethod);

    // Same-key retry first: it must replay even while the original purchase
    // is still PENDING (a timed-out client retrying is the normal case), so
    // this lookup runs before the one-pending-at-a-time guard.
    const replayable = await this.findReplayableTransaction(userId, idempotencyKey);
    if (replayable) {
      return buildReplayResponse(replayable);
    }

    await this.reconcilePendingPurchases(new Date(), userId);
    await this.assertNoOtherPendingPurchase(userId);

    const packageConfig = CREDIT_PACKAGES[input.package];
    const paymentMethod = input.paymentMethod === 'stellar' ? PaymentMethod.STELLAR : PaymentMethod.MPESA;
    const normalizedPhone = input.phoneNumber ? normalizePhoneNumber(input.phoneNumber) : undefined;
    const currentBalance = await this.creditService.getCurrentBalanceValue(userId);

    let transaction;
    try {
      transaction = await this.creditService.createTransaction(this.prismaService, {
        userId,
        type: TransactionType.PURCHASE,
        amount: packageConfig.credits,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance,
        status: TransactionStatus.PENDING,
        paymentMethod,
        idempotencyKey,
        description: `Credit purchase - ${packageConfig.label}`,
        phoneNumberHash: normalizedPhone ? hashLookupValue(normalizedPhone) : undefined,
        metadata: mergeMetadata(null, {
          paymentMethod: input.paymentMethod,
          creditsGranted: packageConfig.credits,
          packageKey: input.package,
          paymentAmountKES: packageConfig.amountKES,
          ...(normalizedPhone ? { requestedPhoneNumber: normalizedPhone, callbackPhoneNumber: normalizedPhone } : {}),
        }),
      });
    } catch (error) {
      // The only unique field populated at insert time is the idempotency
      // key, so P2002 here means this exact request was already accepted:
      // replay the stored result, never re-process.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.replayExistingPurchase(userId, idempotencyKey);
      }
      throw error;
    }

    await this.assertNoOtherPendingPurchase(userId, transaction.id).catch(async (conflict) => {
      // Another purchase slipped in between the pre-check and our insert.
      // Void ours before any provider work so two live STK pushes are
      // impossible, then surface the same error as the pre-check.
      await this.prismaService.creditTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.CANCELLED,
          metadata: mergeMetadata(transaction.metadata, {
            failureReason: 'Superseded: another purchase was already pending',
          }),
        },
      });
      throw conflict;
    });

    if (input.paymentMethod === 'stellar') {
      const stellar = await this.stellarPurchaseService.createPaymentRequest(transaction.id, packageConfig);
      return buildStellarPurchaseResponse(transaction.id, packageConfig, stellar);
    }

    await this.mpesaPurchaseService.executeStkPush(transaction.id, normalizedPhone!, packageConfig);

    return buildMpesaPurchaseResponse(transaction.id, packageConfig, normalizedPhone!);
  }

  async handleMpesaCallback(input: MpesaCallbackRequest) {
    return this.mpesaPurchaseService.handleCallback(input);
  }

  getCreditPackages() {
    return CREDIT_PACKAGES;
  }

  async reconcilePendingPurchases(now = new Date(), userId?: string) {
    const [mpesaCount, stellarCount] = await Promise.all([
      this.mpesaReconcileService.reconcilePending(now, userId),
      this.stellarPurchaseService.reconcilePending(now, userId),
    ]);

    return mpesaCount + stellarCount;
  }

  private async assertUserMayPurchase(userId: string, paymentMethod: string) {
    const user = await this.userService.findStoredById(userId);

    if (!user) {
      throw new HttpException({ code: 'USER_NOT_FOUND', message: 'User profile was not found' }, HttpStatus.NOT_FOUND);
    }

    if (!user.phoneVerified && paymentMethod === 'mpesa') {
      throw new ForbiddenException({ code: 'PHONE_NOT_VERIFIED', message: 'Verify your phone number before purchasing credits' });
    }

    if (!user.isActive) {
      throw new ForbiddenException({ code: 'ACCOUNT_INACTIVE', message: 'Account is inactive' });
    }

    if (user.isBanned) {
      throw new ForbiddenException({ code: 'ACCOUNT_BANNED', message: user.banReason ?? 'Account is banned' });
    }
  }

  private async assertNoOtherPendingPurchase(userId: string, excludeTransactionId?: string) {
    const existingPending = await this.prismaService.creditTransaction.findFirst({
      where: {
        userId,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.PENDING,
        ...(excludeTransactionId ? { NOT: { id: excludeTransactionId } } : {}),
      },
      select: { id: true },
    });

    if (existingPending) {
      throw new HttpException(
        { code: 'PURCHASE_ALREADY_PENDING', message: 'Previous credit purchase is still pending' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  private findReplayableTransaction(userId: string, idempotencyKey: string) {
    return this.prismaService.creditTransaction.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      select: { id: true, status: true, amount: true, paymentMethod: true, metadata: true },
    });
  }

  private async replayExistingPurchase(
    userId: string,
    idempotencyKey: string,
  ): Promise<PurchaseCreditsResponse> {
    const existing = await this.findReplayableTransaction(userId, idempotencyKey);

    if (!existing) {
      // Constraint collided but the row is not visible yet (the first
      // request's transaction has not committed). Tell the client to retry
      // the same key rather than guessing at state.
      throw new ConflictException({
        code: 'PURCHASE_IN_PROGRESS',
        message: 'A request with this Idempotency-Key is still being processed. Retry with the same key.',
      });
    }

    return buildReplayResponse(existing);
  }
}
