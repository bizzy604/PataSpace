/**
 * Purpose: Orchestrates credit purchases by validating the user, creating the transaction record,
 *          and delegating to the M-Pesa or Stellar provider-specific service.
 * Why important: Single entry point for all payment operations; keeps provider details out of controllers.
 * Used by: payment.controller.ts, payment-reconciliation.job.ts
 */

import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PaymentMethod, TransactionStatus, TransactionType } from '@prisma/client';
import {
  CreditPurchasePackage,
  MpesaCallbackRequest,
  PurchaseCreditsRequest,
  PurchaseCreditsResponse,
  TransactionStatus as ContractTransactionStatus,
} from '@pataspace/contracts';
import { normalizePhoneNumber, hashLookupValue } from '../../common/security/encryption.util';
import { PrismaService } from '../../common/database/prisma.service';
import { CreditService } from '../credit/credit.service';
import { UserService } from '../user/user.service';
import { mergeMetadata } from './payment-metadata.util';
import { MpesaPurchaseService } from './mpesa-purchase.service';
import { StellarPurchaseService } from './stellar-purchase.service';

type PurchasePackageConfig = { amountKES: number; credits: number; label: string };

const CREDIT_PACKAGES: Record<CreditPurchasePackage, PurchasePackageConfig> = {
  '5_credits': { amountKES: 500, credits: 5, label: '5 credits package' },
  '10_credits': { amountKES: 1000, credits: 10, label: '10 credits package' },
  '20_credits': { amountKES: 2000, credits: 20, label: '20 credits package' },
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    private readonly userService: UserService,
    private readonly mpesaPurchaseService: MpesaPurchaseService,
    private readonly stellarPurchaseService: StellarPurchaseService,
  ) {}

  async createPurchase(userId: string, input: PurchaseCreditsRequest): Promise<PurchaseCreditsResponse> {
    const user = await this.userService.findStoredById(userId);

    if (!user) {
      throw new HttpException({ code: 'USER_NOT_FOUND', message: 'User profile was not found' }, HttpStatus.NOT_FOUND);
    }

    if (!user.phoneVerified && !user.clerkId && input.paymentMethod === 'mpesa') {
      throw new ForbiddenException({ code: 'PHONE_NOT_VERIFIED', message: 'Verify your phone number before purchasing credits' });
    }

    if (!user.isActive) {
      throw new ForbiddenException({ code: 'ACCOUNT_INACTIVE', message: 'Account is inactive' });
    }

    if (user.isBanned) {
      throw new ForbiddenException({ code: 'ACCOUNT_BANNED', message: user.banReason ?? 'Account is banned' });
    }

    await this.reconcilePendingPurchases(new Date(), userId);

    const existingPending = await this.prismaService.creditTransaction.findFirst({
      where: { userId, type: TransactionType.PURCHASE, status: TransactionStatus.PENDING },
      select: { id: true },
    });

    if (existingPending) {
      throw new HttpException({ code: 'PURCHASE_ALREADY_PENDING', message: 'Previous credit purchase is still pending' }, HttpStatus.PAYMENT_REQUIRED);
    }

    const packageConfig = CREDIT_PACKAGES[input.package];
    const paymentMethod = input.paymentMethod === 'stellar' ? PaymentMethod.STELLAR : PaymentMethod.MPESA;
    const normalizedPhone = input.phoneNumber ? normalizePhoneNumber(input.phoneNumber) : undefined;
    const currentBalance = await this.creditService.getCurrentBalanceValue(userId);

    const transaction = await this.creditService.createTransaction(this.prismaService, {
      userId,
      type: TransactionType.PURCHASE,
      amount: packageConfig.credits,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance,
      status: TransactionStatus.PENDING,
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

    await this.prismaService.creditTransaction.update({
      where: { id: transaction.id },
      data: { paymentMethod },
    });

    if (input.paymentMethod === 'stellar') {
      const stellar = await this.stellarPurchaseService.createPaymentRequest(transaction.id, packageConfig);
      return {
        transactionId: transaction.id,
        status: TransactionStatus.PENDING as unknown as ContractTransactionStatus,
        amount: packageConfig.amountKES,
        credits: packageConfig.credits,
        paymentMethod: 'stellar',
        message: `Send ${stellar.stellarAmountXLM} XLM to the PataSpace treasury with memo: ${stellar.stellarMemo}`,
        estimatedCompletion: '5–30 seconds after sending',
        stellarDestinationAddress: stellar.stellarDestinationAddress,
        stellarMemo: stellar.stellarMemo,
        stellarAmountXLM: stellar.stellarAmountXLM,
      };
    }

    await this.mpesaPurchaseService.executeStkPush(transaction.id, normalizedPhone!, packageConfig);

    return {
      transactionId: transaction.id,
      status: TransactionStatus.PENDING as unknown as ContractTransactionStatus,
      amount: packageConfig.amountKES,
      credits: packageConfig.credits,
      paymentMethod: 'mpesa',
      message: `M-Pesa prompt sent to ${normalizedPhone}. Enter your PIN.`,
      estimatedCompletion: '30 seconds',
    };
  }

  async handleMpesaCallback(input: MpesaCallbackRequest) {
    return this.mpesaPurchaseService.handleCallback(input);
  }

  async reconcilePendingPurchases(now = new Date(), userId?: string) {
    const [mpesaCount, stellarCount] = await Promise.all([
      this.mpesaPurchaseService.reconcilePending(now, userId),
      this.stellarPurchaseService.reconcilePending(now, userId),
    ]);

    return mpesaCount + stellarCount;
  }
}
