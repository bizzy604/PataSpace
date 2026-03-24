import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommissionStatus, DisputeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { MpesaClient } from '../infrastructure/payment/mpesa.client';
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
  ) {}

  @Cron('0 9 * * *')
  async handleCommissionPayouts() {
    return this.processCommissionPayouts();
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

    const phoneNumber = this.userService.decryptPhoneNumber(
      commission.unlock.listing.user.phoneNumberEncrypted,
    );

    try {
      const payout = await this.mpesaClient.b2c({
        phoneNumber,
        amount: commission.amountKES,
        remarks: `PataSpace commission payout ${commission.id}`,
      });

      await this.prismaService.$transaction(async (tx) => {
        await tx.commission.update({
          where: {
            id: commission.id,
          },
          data: {
            status: CommissionStatus.PAID,
            paidAt: now,
            mpesaTransactionId: payout.conversationId,
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
              conversationId: payout.conversationId,
              neighborhood: commission.unlock.listing.neighborhood,
            } satisfies Prisma.InputJsonObject,
          },
        });
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

      await this.prismaService.$transaction(async (tx) => {
        await tx.commission.update({
          where: {
            id: commission.id,
          },
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
}
