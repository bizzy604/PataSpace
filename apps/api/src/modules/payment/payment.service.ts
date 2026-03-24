import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import {
  CreditPurchasePackage,
  MpesaCallbackAckResponse,
  MpesaCallbackRequest,
  PurchaseCreditsRequest,
  PurchaseCreditsResponse,
  TransactionStatus as ContractTransactionStatus,
} from '@pataspace/contracts';
import { hashLookupValue, normalizePhoneNumber } from '../../common/security/encryption.util';
import { PrismaService } from '../../common/database/prisma.service';
import { MpesaClient } from '../../infrastructure/payment/mpesa.client';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { CreditService } from '../credit/credit.service';
import { UserService } from '../user/user.service';

type PurchasePackageConfig = {
  amountKES: number;
  credits: number;
  label: string;
};

type ParsedCallback = {
  checkoutRequestId: string;
  merchantRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount: number | null;
  mpesaReceiptNumber: string | null;
  phoneNumber: string | null;
  phoneNumberHash: string | null;
};

const PENDING_PURCHASE_TIMEOUT_MS = 5 * 60 * 1000;
const CANCELLED_CALLBACK_CODES = new Set([1032, 2032]);

const CREDIT_PACKAGES: Record<CreditPurchasePackage, PurchasePackageConfig> = {
  '5_credits': {
    amountKES: 5000,
    credits: 5000,
    label: '5 credits package',
  },
  '10_credits': {
    amountKES: 10000,
    credits: 10500,
    label: '10 credits package',
  },
  '20_credits': {
    amountKES: 20000,
    credits: 22000,
    label: '20 credits package',
  },
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    private readonly userService: UserService,
    private readonly mpesaClient: MpesaClient,
    private readonly smsService: SmsService,
  ) {}

  async createPurchase(
    userId: string,
    input: PurchaseCreditsRequest,
  ): Promise<PurchaseCreditsResponse> {
    const user = await this.userService.findStoredById(userId);

    if (!user) {
      throw new HttpException(
        {
          code: 'USER_NOT_FOUND',
          message: 'User profile was not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (!user.phoneVerified) {
      throw new ForbiddenException({
        code: 'PHONE_NOT_VERIFIED',
        message: 'Verify your phone number before purchasing credits',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: user.banReason ?? 'Account is banned',
      });
    }

    await this.reconcilePendingPurchases(new Date(), userId);

    const existingPendingPurchase = await this.prismaService.creditTransaction.findFirst({
      where: {
        userId,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    if (existingPendingPurchase) {
      throw new HttpException(
        {
          code: 'PURCHASE_ALREADY_PENDING',
          message: 'Previous credit purchase is still pending',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const packageConfig = CREDIT_PACKAGES[input.package];
    const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
    const currentBalance = await this.creditService.getCurrentBalanceValue(userId);
    const description = `Credit purchase - ${packageConfig.label}`;
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);

    const transaction = await this.creditService.createTransaction(this.prismaService, {
      userId,
      type: TransactionType.PURCHASE,
      amount: packageConfig.credits,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance,
      status: TransactionStatus.PENDING,
      description,
      phoneNumberHash,
      metadata: this.mergeMetadata(null, {
        callbackPhoneNumber: normalizedPhoneNumber,
        creditsGranted: packageConfig.credits,
        packageKey: input.package,
        paymentAmountKES: packageConfig.amountKES,
        requestedPhoneNumber: normalizedPhoneNumber,
      }),
    });

    try {
      const providerResponse = await this.mpesaClient.stkPush({
        phoneNumber: normalizedPhoneNumber,
        amount: packageConfig.amountKES,
        accountReference: transaction.id,
      });

      await this.prismaService.creditTransaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          mpesaTransactionId: providerResponse.checkoutRequestId,
          metadata: this.mergeMetadata(transaction.metadata, {
            checkoutRequestId: providerResponse.checkoutRequestId,
            merchantRequestId: providerResponse.merchantRequestId,
            providerResponseCode: providerResponse.responseCode,
            providerResponseDescription: providerResponse.responseDescription,
          }),
        },
      });
    } catch (error) {
      await this.prismaService.creditTransaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: TransactionStatus.FAILED,
          metadata: this.mergeMetadata(transaction.metadata, {
            failureReason:
              error instanceof Error ? error.message : 'M-Pesa STK push request failed',
          }),
        },
      });

      throw new ServiceUnavailableException({
        code: 'MPESA_UNAVAILABLE',
        message: 'M-Pesa service is currently unavailable',
      });
    }

    return {
      transactionId: transaction.id,
      status: TransactionStatus.PENDING as unknown as ContractTransactionStatus,
      amount: packageConfig.amountKES,
      credits: packageConfig.credits,
      message: `M-Pesa prompt sent to ${normalizedPhoneNumber}. Enter your PIN.`,
      estimatedCompletion: '30 seconds',
    };
  }

  async handleMpesaCallback(input: MpesaCallbackRequest): Promise<MpesaCallbackAckResponse> {
    const callback = this.parseCallback(input);
    const transaction = await this.findPurchaseTransaction(
      callback.checkoutRequestId,
      callback.mpesaReceiptNumber,
    );

    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return this.callbackAck();
    }

    if (callback.resultCode === 0 && callback.mpesaReceiptNumber && callback.amount !== null) {
      await this.processSuccessfulCallback(transaction.id, callback);
      return this.callbackAck();
    }

    await this.processFailedCallback(transaction.id, callback);
    return this.callbackAck();
  }

  async reconcilePendingPurchases(now = new Date(), userId?: string) {
    const staleBefore = new Date(now.getTime() - PENDING_PURCHASE_TIMEOUT_MS);
    const pendingTransactions = await this.prismaService.creditTransaction.findMany({
      where: {
        ...(userId ? { userId } : {}),
        type: TransactionType.PURCHASE,
        status: TransactionStatus.PENDING,
        createdAt: {
          lt: staleBefore,
        },
      },
      select: {
        id: true,
        metadata: true,
        mpesaTransactionId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: userId ? undefined : 100,
    });

    let reconciledCount = 0;

    for (const transaction of pendingTransactions) {
      if (!transaction.mpesaTransactionId) {
        continue;
      }

      try {
        const query = await this.mpesaClient.queryStkPush({
          checkoutRequestId: transaction.mpesaTransactionId,
        });
        const fallbackAmount = this.readNumberMetadata(transaction.metadata, 'paymentAmountKES');
        const fallbackPhoneNumber =
          this.readStringMetadata(transaction.metadata, 'callbackPhoneNumber') ??
          this.readStringMetadata(transaction.metadata, 'requestedPhoneNumber');
        const resolvedPhoneNumber = query.phoneNumber ?? fallbackPhoneNumber;
        const callback: ParsedCallback = {
          checkoutRequestId: query.checkoutRequestId,
          merchantRequestId:
            this.readStringMetadata(transaction.metadata, 'merchantRequestId') ?? query.checkoutRequestId,
          resultCode: query.resultCode,
          resultDesc: query.resultDesc,
          amount: fallbackAmount,
          mpesaReceiptNumber: query.mpesaReceiptNumber ?? null,
          phoneNumber: resolvedPhoneNumber,
          phoneNumberHash: resolvedPhoneNumber ? hashLookupValue(resolvedPhoneNumber) : null,
        };

        if (callback.resultCode === 0 && callback.amount !== null) {
          await this.processSuccessfulCallback(transaction.id, callback);
          reconciledCount += 1;
          continue;
        }

        await this.processFailedCallback(transaction.id, callback);
        reconciledCount += 1;
      } catch {
        continue;
      }
    }

    return reconciledCount;
  }

  private async processSuccessfulCallback(transactionId: string, callback: ParsedCallback) {
    let notificationTargetUserId: string | null = null;
    let notificationPhoneNumber = callback.phoneNumber;
    let creditsGranted = 0;

    await this.prismaService.$transaction(async (db) => {
      const currentTransaction = await db.creditTransaction.findUnique({
        where: {
          id: transactionId,
        },
      });

      if (!currentTransaction || currentTransaction.status !== TransactionStatus.PENDING) {
        return;
      }

      const claimed = await db.creditTransaction.updateMany({
        where: {
          id: transactionId,
          status: TransactionStatus.PENDING,
        },
        data: {
          status: TransactionStatus.COMPLETED,
        },
      });

      if (claimed.count === 0) {
        return;
      }

      creditsGranted = currentTransaction.amount;
      const expectedAmount = this.readNumberMetadata(currentTransaction.metadata, 'paymentAmountKES');

      if (expectedAmount !== null && expectedAmount !== callback.amount) {
        await db.creditTransaction.update({
          where: {
            id: currentTransaction.id,
          },
          data: {
            status: TransactionStatus.FAILED,
            metadata: this.mergeMetadata(currentTransaction.metadata, {
              callbackAmount: callback.amount,
              callbackResultCode: callback.resultCode,
              callbackResultDesc: `Amount mismatch. Expected ${expectedAmount}, got ${callback.amount}.`,
              callbackReceivedAt: new Date().toISOString(),
              mpesaReceiptNumber: callback.mpesaReceiptNumber,
            }),
          },
        });

        return;
      }

      const balance = await this.creditService.applyBalanceIncrement(db, {
        userId: currentTransaction.userId,
        amount: currentTransaction.amount,
        lifetimeEarnedDelta: currentTransaction.amount,
      });

      await db.creditTransaction.update({
        where: {
          id: currentTransaction.id,
        },
        data: {
          balanceBefore: balance.balanceBefore,
          balanceAfter: balance.balanceAfter,
          phoneNumberHash: callback.phoneNumberHash ?? currentTransaction.phoneNumberHash ?? undefined,
          mpesaReceiptNumber: callback.mpesaReceiptNumber,
          mpesaTransactionId: currentTransaction.mpesaTransactionId ?? callback.checkoutRequestId,
          status: TransactionStatus.COMPLETED,
          metadata: this.mergeMetadata(currentTransaction.metadata, {
            callbackAmount: callback.amount,
            callbackPhoneNumber: callback.phoneNumber,
            callbackResultCode: callback.resultCode,
            callbackResultDesc: callback.resultDesc,
            callbackReceivedAt: new Date().toISOString(),
            merchantRequestId: callback.merchantRequestId,
            mpesaReceiptNumber: callback.mpesaReceiptNumber,
          }),
        },
      });

      notificationTargetUserId = currentTransaction.userId;
    });

    if (!notificationTargetUserId) {
      return;
    }

    await this.creditService.invalidateBalanceCache(notificationTargetUserId);

    if (!notificationPhoneNumber) {
      const user = await this.userService.findStoredById(notificationTargetUserId);
      notificationPhoneNumber = user
        ? this.userService.decryptPhoneNumber(user.phoneNumberEncrypted)
        : null;
    }

    if (notificationPhoneNumber) {
      await this.sendSmsQuietly(
        notificationPhoneNumber,
        `Your PataSpace balance has been credited with ${creditsGranted} credits.`,
      );
    }
  }

  private async processFailedCallback(transactionId: string, callback: ParsedCallback) {
    let notificationTargetPhoneNumber = callback.phoneNumber;

    await this.prismaService.$transaction(async (db) => {
      const currentTransaction = await db.creditTransaction.findUnique({
        where: {
          id: transactionId,
        },
      });

      if (!currentTransaction || currentTransaction.status !== TransactionStatus.PENDING) {
        return;
      }

      const mappedStatus = CANCELLED_CALLBACK_CODES.has(callback.resultCode)
        ? TransactionStatus.CANCELLED
        : TransactionStatus.FAILED;
      const claimed = await db.creditTransaction.updateMany({
        where: {
          id: transactionId,
          status: TransactionStatus.PENDING,
        },
        data: {
          status: mappedStatus,
        },
      });

      if (claimed.count === 0) {
        return;
      }

      await db.creditTransaction.update({
        where: {
          id: currentTransaction.id,
        },
        data: {
          phoneNumberHash: callback.phoneNumberHash ?? currentTransaction.phoneNumberHash ?? undefined,
          status: mappedStatus,
          metadata: this.mergeMetadata(currentTransaction.metadata, {
            callbackAmount: callback.amount,
            callbackPhoneNumber: callback.phoneNumber,
            callbackResultCode: callback.resultCode,
            callbackResultDesc: callback.resultDesc,
            callbackReceivedAt: new Date().toISOString(),
            merchantRequestId: callback.merchantRequestId,
            mpesaReceiptNumber: callback.mpesaReceiptNumber,
          }),
        },
      });

      if (!notificationTargetPhoneNumber) {
        notificationTargetPhoneNumber =
          this.readStringMetadata(currentTransaction.metadata, 'requestedPhoneNumber') ?? null;
      }
    });

    if (notificationTargetPhoneNumber) {
      await this.sendSmsQuietly(
        notificationTargetPhoneNumber,
        `Your PataSpace credit purchase failed: ${callback.resultDesc}`,
      );
    }
  }

  private async findPurchaseTransaction(
    checkoutRequestId: string,
    mpesaReceiptNumber: string | null,
  ) {
    return this.prismaService.creditTransaction.findFirst({
      where: {
        type: TransactionType.PURCHASE,
        OR: [
          {
            mpesaTransactionId: checkoutRequestId,
          },
          ...(mpesaReceiptNumber
            ? [
                {
                  mpesaReceiptNumber,
                },
              ]
            : []),
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  private parseCallback(input: MpesaCallbackRequest): ParsedCallback {
    const payload = input.Body.stkCallback;
    const metadataItems = payload.CallbackMetadata?.Item ?? [];
    const amountValue = this.findCallbackItem(metadataItems, 'Amount');
    const phoneNumberValue = this.findCallbackItem(metadataItems, 'PhoneNumber');
    const receiptValue = this.findCallbackItem(metadataItems, 'MpesaReceiptNumber');
    const normalizedPhoneNumber =
      phoneNumberValue !== undefined && phoneNumberValue !== null
        ? normalizePhoneNumber(String(phoneNumberValue))
        : null;

    return {
      checkoutRequestId: payload.CheckoutRequestID,
      merchantRequestId: payload.MerchantRequestID,
      resultCode: payload.ResultCode,
      resultDesc: payload.ResultDesc,
      amount:
        amountValue !== undefined && amountValue !== null
          ? Number(amountValue)
          : null,
      mpesaReceiptNumber: typeof receiptValue === 'string' ? receiptValue : null,
      phoneNumber: normalizedPhoneNumber,
      phoneNumberHash: normalizedPhoneNumber ? hashLookupValue(normalizedPhoneNumber) : null,
    };
  }

  private callbackAck(): MpesaCallbackAckResponse {
    return {
      ResultCode: 0,
      ResultDesc: 'Accepted',
    };
  }

  private findCallbackItem(
    items: Array<{ Name: string; Value?: string | number }>,
    targetName: string,
  ) {
    return items.find((item) => item.Name === targetName)?.Value;
  }

  private mergeMetadata(
    existing: Prisma.JsonValue | null | undefined,
    patch: Record<string, unknown>,
  ): Prisma.InputJsonObject {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Prisma.InputJsonObject)
        : {};

    return {
      ...base,
      ...(patch as Prisma.InputJsonObject),
    };
  }

  private readStringMetadata(metadata: Prisma.JsonValue | null, key: string) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const value = (metadata as Prisma.JsonObject)[key];
    return typeof value === 'string' ? value : null;
  }

  private readNumberMetadata(metadata: Prisma.JsonValue | null, key: string) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const value = (metadata as Prisma.JsonObject)[key];
    return typeof value === 'number' ? value : null;
  }

  private async sendSmsQuietly(phoneNumber: string, message: string) {
    try {
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }
}
