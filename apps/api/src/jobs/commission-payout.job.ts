import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { CommissionStatus, DisputeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { RequestContextService } from '../common/request-context/request-context.service';
import {
  ADVISORY_LOCK_KEYS,
  releaseAdvisoryLock,
  tryAdvisoryLock,
} from '../common/database/advisory-lock.util';
import { MpesaClient } from '../infrastructure/payment/mpesa.client';
import { MpesaB2CQueryResponse } from '../infrastructure/payment/mpesa.types';
import { SmsService } from '../infrastructure/sms/sms.service';
import { UserService } from '../modules/user/user.service';

@Injectable()
export class CommissionPayoutJob {
  private readonly logger = new Logger(CommissionPayoutJob.name);
  private readonly batchSize = 50;
  private readonly maxAttempts = 3;
  private readonly staleProcessingMs = 30 * 60 * 1000;
  private readonly blockingDisputeStatuses = new Set<DisputeStatus>([
    DisputeStatus.OPEN,
    DisputeStatus.INVESTIGATING,
  ]);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mpesaClient: MpesaClient,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Cron('0 9 * * *')
  async handleCommissionPayouts() {
    return this.requestContext.runInternal(() => this.runCommissionPayoutsWithLock());
  }

  private async runCommissionPayoutsWithLock() {
    const acquired = await tryAdvisoryLock(
      this.prismaService,
      ADVISORY_LOCK_KEYS.commissionPayoutJob,
    );

    if (!acquired) {
      this.logger.log(
        JSON.stringify({
          event: 'job.commission-payout.skipped',
          reason: 'another replica holds the advisory lock',
          at: new Date().toISOString(),
        }),
      );
      return null;
    }

    try {
      return await this.processCommissionPayouts();
    } finally {
      await releaseAdvisoryLock(
        this.prismaService,
        ADVISORY_LOCK_KEYS.commissionPayoutJob,
      ).catch((error) => {
        this.logger.warn(
          `Failed to release commission-payout advisory lock: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }
  }

  async processCommissionPayouts(now = new Date()) {
    const [recoveredProcessing, promotedToDue] = await Promise.all([
      this.recoverStaleProcessingCommissions(now),
      this.promoteEligibleCommissions(now),
    ]);

    const dueCommissions = await this.prismaService.commission.findMany({
      where: {
        status: CommissionStatus.DUE,
        eligibleAt: {
          lte: now,
        },
      },
      orderBy: {
        eligibleAt: 'asc',
      },
      take: this.batchSize,
      include: {
        unlock: {
          include: {
            dispute: {
              select: {
                status: true,
              },
            },
            listing: {
              select: {
                id: true,
                neighborhood: true,
                user: {
                  select: {
                    phoneNumberEncrypted: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const summary = {
      recoveredProcessing,
      promotedToDue,
      candidates: dueCommissions.length,
      paid: 0,
      retried: 0,
      deadLettered: 0,
      blockedByDispute: 0,
      skipped: 0,
    };

    for (const commission of dueCommissions) {
      if (
        commission.unlock.dispute &&
        this.blockingDisputeStatuses.has(commission.unlock.dispute.status)
      ) {
        summary.blockedByDispute += 1;
        continue;
      }

      const result = await this.processSingleCommission(commission, now);

      if (result === 'paid') {
        summary.paid += 1;
      } else if (result === 'retry') {
        summary.retried += 1;
      } else if (result === 'dead-letter') {
        summary.deadLettered += 1;
      } else {
        summary.skipped += 1;
      }
    }

    this.logger.log(
      JSON.stringify({
        event: 'job.commission-payout.summary',
        ...summary,
        at: now.toISOString(),
      }),
    );

    return summary;
  }

  private async promoteEligibleCommissions(now: Date) {
    const result = await this.prismaService.commission.updateMany({
      where: {
        status: CommissionStatus.PENDING,
        eligibleAt: {
          lte: now,
        },
      },
      data: {
        status: CommissionStatus.DUE,
      },
    });

    return result.count;
  }

  private async recoverStaleProcessingCommissions(now: Date) {
    const staleBefore = new Date(now.getTime() - this.staleProcessingMs);
    const result = await this.prismaService.commission.updateMany({
      where: {
        status: CommissionStatus.PROCESSING,
        lastAttemptAt: {
          lt: staleBefore,
        },
      },
      data: {
        status: CommissionStatus.DUE,
        lastAttemptError: 'Recovered from stale processing state',
      },
    });

    return result.count;
  }

  private async processSingleCommission(
    commission: Prisma.CommissionGetPayload<{
      include: {
        unlock: {
          include: {
            dispute: {
              select: {
                status: true;
              };
            };
            listing: {
              select: {
                id: true;
                neighborhood: true;
                user: {
                  select: {
                    phoneNumberEncrypted: true;
                  };
                };
              };
            };
          };
        };
      };
    }>,
    now: Date,
  ): Promise<'paid' | 'retry' | 'dead-letter' | 'skipped'> {
    const claimed = await this.prismaService.commission.updateMany({
      where: {
        id: commission.id,
        status: CommissionStatus.DUE,
      },
      data: {
        status: CommissionStatus.PROCESSING,
        lastAttemptAt: now,
        lastAttemptError: null,
      },
    });

    if (claimed.count === 0) {
      return 'skipped';
    }

    const freshDispute = await this.prismaService.dispute.findUnique({
      where: {
        unlockId: commission.unlockId,
      },
      select: {
        status: true,
      },
    });

    if (freshDispute && this.blockingDisputeStatuses.has(freshDispute.status)) {
      await this.prismaService.commission.update({
        where: {
          id: commission.id,
        },
        data: {
          status: CommissionStatus.DUE,
          lastAttemptError: 'Blocked by dispute after payout claim',
        },
      });

      return 'skipped';
    }

    const encryptedPhone = commission.unlock.listing.user.phoneNumberEncrypted;
    if (!encryptedPhone) {
      this.logger.warn(`Commission ${commission.id}: tenant has no phone number, skipping payout`);
      return 'skipped';
    }
    const phoneNumber = this.userService.decryptPhoneNumber(encryptedPhone);
    const originatorConversationId = await this.ensureOriginatorConversationId(commission);
    const isRetry = commission.paymentAttempts > 0;

    // On retries we positively confirm with Safaricom before re-issuing. A
    // crash between a successful B2C and the local PAID write would otherwise
    // cause a re-issue — Safaricom dedupes via OriginatorConversationID, but
    // querying first gives us the receipt/conversation id to mark PAID
    // immediately rather than waiting for the next reconciliation tick.
    if (isRetry) {
      const queryOutcome = await this.queryExistingPayout(
        commission.id,
        originatorConversationId,
      );

      if (queryOutcome?.outcome === 'success') {
        await this.markCommissionPaid(commission, originatorConversationId, now, {
          conversationId: queryOutcome.conversationId,
          mpesaReceiptNumber: queryOutcome.mpesaReceiptNumber,
        });
        await this.sendSmsQuietly(
          phoneNumber,
          `You've received ${commission.amountKES} KES from PataSpace. Check your M-Pesa.`,
        );
        return 'paid';
      }

      if (queryOutcome?.outcome === 'failed') {
        const reason = queryOutcome.resultDesc ?? 'M-Pesa reported the previous payout as failed';
        await this.markCommissionDeadLettered(commission, reason, now);
        return 'dead-letter';
      }

      // pending | unsupported → fall through to re-issue with the same id
    }

    try {
      const payout = await this.mpesaClient.b2c({
        phoneNumber,
        amount: commission.amountKES,
        remarks: `PataSpace commission payout ${commission.id}`,
        originatorConversationId,
      });

      await this.markCommissionPaid(commission, originatorConversationId, now, {
        conversationId: payout.conversationId,
      });

      await this.sendSmsQuietly(
        phoneNumber,
        `You've received ${commission.amountKES} KES from PataSpace. Check your M-Pesa.`,
      );

      return 'paid';
    } catch (error) {
      const attempts = commission.paymentAttempts + 1;
      const terminalFailure = attempts >= this.maxAttempts;
      const errorMessage = error instanceof Error ? error.message : 'Commission payout failed';

      await this.recordPayoutFailure(commission, attempts, terminalFailure, errorMessage, now);

      this.logger.error(
        JSON.stringify({
          event: 'job.commission-payout.failure',
          commissionId: commission.id,
          attempts,
          terminalFailure,
          error: errorMessage,
        }),
      );

      return terminalFailure ? 'dead-letter' : 'retry';
    }
  }

  private async sendSmsQuietly(phoneNumber: string, message: string) {
    try {
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }

  /**
   * Returns the stable OriginatorConversationID for this commission.
   * On the first attempt the column is null — we generate a UUID and persist
   * it BEFORE the B2C call so any subsequent retry passes the same id and
   * Safaricom can dedupe instead of double-paying.
   */
  private async ensureOriginatorConversationId(commission: {
    id: string;
    originatorConversationId: string | null;
  }): Promise<string> {
    if (commission.originatorConversationId) {
      return commission.originatorConversationId;
    }

    const id = `pataspace-${randomUUID()}`;
    await this.prismaService.commission.update({
      where: { id: commission.id },
      data: { originatorConversationId: id },
    });
    return id;
  }

  /**
   * Best-effort B2C status lookup. Swallows provider errors so they cannot
   * crash the payout run — caller treats `null` the same as "pending"
   * (proceed with the re-issue path).
   */
  private async queryExistingPayout(
    commissionId: string,
    originatorConversationId: string,
  ): Promise<MpesaB2CQueryResponse | null> {
    try {
      return await this.mpesaClient.queryB2CTransaction({ originatorConversationId });
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'job.commission-payout.query-error',
          commissionId,
          originatorConversationId,
          error: error instanceof Error ? error.message : 'unknown',
        }),
      );
      return null;
    }
  }

  private async markCommissionPaid(
    commission: { id: string; amountKES: number; unlock: { listing: { neighborhood: string } } },
    originatorConversationId: string,
    now: Date,
    payout: { conversationId?: string; mpesaReceiptNumber?: string },
  ) {
    await this.prismaService.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commission.id },
        data: {
          status: CommissionStatus.PAID,
          paidAt: now,
          mpesaTransactionId: payout.conversationId ?? originatorConversationId,
          mpesaReceiptNumber: payout.mpesaReceiptNumber ?? undefined,
          lastAttemptAt: now,
          lastAttemptError: null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'commission.paid',
          entityType: 'Commission',
          entityId: commission.id,
          metadata: {
            amountKES: commission.amountKES,
            conversationId: payout.conversationId ?? null,
            mpesaReceiptNumber: payout.mpesaReceiptNumber ?? null,
            originatorConversationId,
            neighborhood: commission.unlock.listing.neighborhood,
          } satisfies Prisma.InputJsonObject,
        },
      });
    });
  }

  private async markCommissionDeadLettered(
    commission: { id: string; amountKES: number; paymentAttempts: number; unlock: { listing: { id: string } } },
    reason: string,
    now: Date,
  ) {
    const attempts = commission.paymentAttempts + 1;
    await this.prismaService.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commission.id },
        data: {
          status: CommissionStatus.FAILED,
          paymentAttempts: attempts,
          lastAttemptAt: now,
          lastAttemptError: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'commission.dead_lettered',
          entityType: 'Commission',
          entityId: commission.id,
          metadata: {
            amountKES: commission.amountKES,
            error: reason,
            listingId: commission.unlock.listing.id,
            paymentAttempts: attempts,
            reason: 'mpesa_query_returned_failed',
          } satisfies Prisma.InputJsonObject,
        },
      });
    });
  }

  private async recordPayoutFailure(
    commission: { id: string; amountKES: number; unlock: { listing: { id: string } } },
    attempts: number,
    terminalFailure: boolean,
    errorMessage: string,
    now: Date,
  ) {
    await this.prismaService.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commission.id },
        data: {
          status: terminalFailure ? CommissionStatus.FAILED : CommissionStatus.DUE,
          paymentAttempts: attempts,
          lastAttemptAt: now,
          lastAttemptError: errorMessage,
        },
      });

      if (terminalFailure) {
        await tx.auditLog.create({
          data: {
            action: 'commission.dead_lettered',
            entityType: 'Commission',
            entityId: commission.id,
            metadata: {
              amountKES: commission.amountKES,
              error: errorMessage,
              listingId: commission.unlock.listing.id,
              paymentAttempts: attempts,
            } satisfies Prisma.InputJsonObject,
          },
        });
      }
    });
  }
}
