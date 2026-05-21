/**
 * Purpose: Handles the Daraja B2C async result payload — Safaricom POSTs this
 *   to our ResultURL once a payout is settled. Transitions the Commission
 *   row to PAID or FAILED in real time so users do not have to wait for the
 *   next scheduled CommissionPayoutJob run.
 * Why important: Closes the largest latency window in the payout flow. The
 *   job remains a safety net for missed callbacks, but the happy path now
 *   completes in seconds rather than up to a day.
 * Used by: PaymentWebhookController.
 */
import { Injectable, Logger } from '@nestjs/common';
import {
  CommissionStatus,
  Prisma,
} from '@prisma/client';
import { MpesaB2CResultRequest } from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { UserService } from '../user/user.service';

const RECEIPT_PARAMETER_KEYS = ['TransactionReceipt', 'MpesaReceiptNumber'] as const;

type B2CCallbackOutcome =
  | { kind: 'paid'; commissionId: string }
  | { kind: 'failed'; commissionId: string }
  | { kind: 'unknown_commission' }
  | { kind: 'no_state_change'; commissionId: string };

@Injectable()
export class CommissionCallbackService {
  private readonly logger = new Logger(CommissionCallbackService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
  ) {}

  async handleB2CResult(payload: MpesaB2CResultRequest): Promise<B2CCallbackOutcome> {
    const { Result } = payload;
    const originatorConversationId = Result.OriginatorConversationID;
    const isSuccess = Result.ResultCode === 0;
    const now = new Date();

    const commission = await this.prismaService.commission.findUnique({
      where: { originatorConversationId },
      select: {
        id: true,
        status: true,
        amountKES: true,
        unlock: {
          select: {
            listing: {
              select: {
                neighborhood: true,
                user: {
                  select: { phoneNumberEncrypted: true },
                },
              },
            },
          },
        },
      },
    });

    if (!commission) {
      this.logger.warn(
        JSON.stringify({
          event: 'commission.b2c-callback.unknown',
          originatorConversationId,
        }),
      );
      return { kind: 'unknown_commission' };
    }

    if (
      commission.status === CommissionStatus.PAID ||
      commission.status === CommissionStatus.FAILED ||
      commission.status === CommissionStatus.CANCELLED
    ) {
      // Already settled — Daraja sometimes redelivers. Idempotent no-op.
      return { kind: 'no_state_change', commissionId: commission.id };
    }

    if (isSuccess) {
      const receipt = this.extractReceiptNumber(payload);
      const phoneNumber = commission.unlock.listing.user.phoneNumberEncrypted
        ? this.userService.decryptPhoneNumber(
            commission.unlock.listing.user.phoneNumberEncrypted,
          )
        : null;

      await this.prismaService.$transaction(async (tx) => {
        const claimed = await tx.commission.updateMany({
          where: {
            id: commission.id,
            status: { in: [CommissionStatus.PROCESSING, CommissionStatus.DUE] },
          },
          data: {
            status: CommissionStatus.PAID,
            paidAt: now,
            mpesaTransactionId: Result.ConversationID,
            mpesaReceiptNumber: receipt ?? undefined,
            lastAttemptAt: now,
            lastAttemptError: null,
          },
        });
        if (claimed.count === 0) {
          return;
        }
        await tx.auditLog.create({
          data: {
            action: 'commission.paid_via_callback',
            entityType: 'Commission',
            entityId: commission.id,
            metadata: {
              amountKES: commission.amountKES,
              conversationId: Result.ConversationID,
              originatorConversationId,
              mpesaReceiptNumber: receipt,
              neighborhood: commission.unlock.listing.neighborhood,
            } satisfies Prisma.InputJsonObject,
          },
        });
      });

      if (phoneNumber) {
        await this.smsService
          .sendMessage(
            phoneNumber,
            `You've received ${commission.amountKES} KES from PataSpace. Check your M-Pesa.`,
          )
          .catch(() => undefined);
      }

      return { kind: 'paid', commissionId: commission.id };
    }

    // Terminal failure reported by Safaricom — flip to FAILED. Operator can
    // investigate via audit log + lastAttemptError.
    await this.prismaService.$transaction(async (tx) => {
      const claimed = await tx.commission.updateMany({
        where: {
          id: commission.id,
          status: { in: [CommissionStatus.PROCESSING, CommissionStatus.DUE] },
        },
        data: {
          status: CommissionStatus.FAILED,
          lastAttemptAt: now,
          lastAttemptError: `B2C callback failure ${Result.ResultCode}: ${Result.ResultDesc}`,
        },
      });
      if (claimed.count === 0) {
        return;
      }
      await tx.auditLog.create({
        data: {
          action: 'commission.failed_via_callback',
          entityType: 'Commission',
          entityId: commission.id,
          metadata: {
            amountKES: commission.amountKES,
            originatorConversationId,
            resultCode: Result.ResultCode,
            resultDesc: Result.ResultDesc,
          } satisfies Prisma.InputJsonObject,
        },
      });
    });

    return { kind: 'failed', commissionId: commission.id };
  }

  private extractReceiptNumber(payload: MpesaB2CResultRequest): string | null {
    const params = payload.Result.ResultParameters?.ResultParameter ?? [];
    for (const entry of params) {
      if (
        RECEIPT_PARAMETER_KEYS.includes(
          entry.Key as (typeof RECEIPT_PARAMETER_KEYS)[number],
        ) &&
        typeof entry.Value === 'string' &&
        entry.Value.length > 0
      ) {
        return entry.Value;
      }
    }
    return null;
  }
}
