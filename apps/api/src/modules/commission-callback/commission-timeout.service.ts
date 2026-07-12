/**
 * Purpose: Handles Daraja B2C queue-timeout callbacks: the payout request
 * expired unprocessed at Safaricom, so the matching PROCESSING commission
 * returns to DUE for a dedupe-safe re-issue on the next payout run.
 * Why important: without this, a queued-then-expired payout sits PROCESSING
 * until the overdue flag fires, delaying the poster's money by a day or
 * more. The claim only touches PROCESSING rows, so a late settlement result
 * can never be overwritten.
 * Used by: PaymentWebhookController (QueueTimeOutURL endpoint).
 */
import { Injectable, Logger } from '@nestjs/common';
import { CommissionStatus, Prisma } from '@prisma/client';
import { MpesaB2CTimeoutRequest } from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';

type B2CTimeoutOutcome =
  | { kind: 'requeued'; commissionId: string }
  | { kind: 'no_state_change'; commissionId: string }
  | { kind: 'ignored' };

@Injectable()
export class CommissionTimeoutService {
  private readonly logger = new Logger(CommissionTimeoutService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async handleB2CTimeout(payload: MpesaB2CTimeoutRequest): Promise<B2CTimeoutOutcome> {
    const originatorConversationId = payload.Result?.OriginatorConversationID;

    if (!originatorConversationId) {
      this.logger.warn(
        JSON.stringify({
          event: 'commission.b2c-timeout.unidentifiable',
          resultDesc: payload.Result?.ResultDesc ?? null,
        }),
      );
      return { kind: 'ignored' };
    }

    const commission = await this.prismaService.commission.findUnique({
      where: { originatorConversationId },
      select: { id: true, status: true, amountKES: true },
    });

    if (!commission) {
      this.logger.warn(
        JSON.stringify({
          event: 'commission.b2c-timeout.unknown',
          originatorConversationId,
        }),
      );
      return { kind: 'ignored' };
    }

    const requeued = await this.prismaService.$transaction(async (tx) => {
      const claimed = await tx.commission.updateMany({
        where: {
          id: commission.id,
          status: CommissionStatus.PROCESSING,
        },
        data: {
          status: CommissionStatus.DUE,
          lastAttemptError: 'Daraja queue timeout; payout will be re-issued',
        },
      });

      if (claimed.count === 0) {
        return false;
      }

      await tx.auditLog.create({
        data: {
          action: 'commission.queue_timeout',
          entityType: 'Commission',
          entityId: commission.id,
          metadata: {
            amountKES: commission.amountKES,
            originatorConversationId,
            resultDesc: payload.Result?.ResultDesc ?? null,
          } satisfies Prisma.InputJsonObject,
        },
      });

      return true;
    });

    return requeued
      ? { kind: 'requeued', commissionId: commission.id }
      : { kind: 'no_state_change', commissionId: commission.id };
  }
}
