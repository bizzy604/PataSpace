/**
 * Purpose: Move-in confirmation loop (spec sections 4.4/4.6): records
 * per-side confirmations, triggers success-fee capture + fee-backed
 * commission when both sides confirm, extends the masked contact session,
 * and hands the mover the vacated-listing prompt (supply flywheel).
 * Why important: confirmations are the payout trigger; nothing pays out
 * without this loop closing.
 * Used by: ConfirmationController, DisputeService, ConfirmationFollowupJob,
 * MoverPosterReminderJob.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConfirmationSide as PrismaConfirmationSide,
  DisputeStatus as PrismaDisputeStatus,
  Prisma,
} from '@prisma/client';
import {
  CommissionStatus as ContractCommissionStatus,
  ConfirmationSide as ContractConfirmationSide,
  ConfirmationSuccessFee,
  CreateConfirmationRequest,
  CreateConfirmationResponse,
  VacatedListingPrompt,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import {
  computeSuccessFeeKes,
  posterShareKes,
} from '../listing/domain/pricing.policy';
import { ProxySessionService } from '../unlock/contact/proxy-session.service';
import { ConfirmationNotifierService } from './confirmation-notifier.service';
import { SuccessFeeService } from './success-fee.service';

const AUTO_CONFIRM_AFTER_DAYS = 14;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const BLOCKING_DISPUTE_STATUSES = new Set<PrismaDisputeStatus>([
  PrismaDisputeStatus.OPEN,
  PrismaDisputeStatus.INVESTIGATING,
]);

type UnlockForConfirmation = Prisma.UnlockGetPayload<{
  select: {
    id: true;
    buyerId: true;
    isRefunded: true;
    refundReason: true;
    refundedAt: true;
    listing: {
      select: {
        userId: true;
        neighborhood: true;
        monthlyRent: true;
        user: {
          select: {
            phoneNumberEncrypted: true;
          };
        };
      };
    };
    buyer: {
      select: {
        phoneNumberEncrypted: true;
      };
    };
    confirmations: {
      select: {
        confirmedAt: true;
        side: true;
      };
    };
    dispute: {
      select: {
        status: true;
      };
    };
  };
}>;

type SettlementOutcome = {
  commission: { amountKES: number; status: string; eligibleAt: Date } | null;
  successFee: ConfirmationSuccessFee;
};

@Injectable()
export class ConfirmationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notifier: ConfirmationNotifierService,
    private readonly successFeeService: SuccessFeeService,
    private readonly proxySessionService: ProxySessionService,
  ) {}

  async createConfirmation(
    userId: string,
    input: CreateConfirmationRequest,
  ): Promise<CreateConfirmationResponse> {
    const unlock = await this.getUnlockOrThrow(input.unlockId);
    this.assertConfirmationAllowed(unlock, userId, input.side);

    const confirmation = await this.createConfirmationRecord(unlock.id, userId, input.side);
    const settlement = await this.ensureSettlementIfEligible(unlock.id);

    const bothConfirmed = settlement !== null;
    const commission = settlement?.commission ?? null;

    await this.notifier.sendConfirmationNotifications(
      unlock,
      input.side,
      commission ? { amountKES: commission.amountKES, eligibleAt: commission.eligibleAt } : null,
    );

    return {
      confirmationId: confirmation.id,
      unlockId: confirmation.unlockId,
      side: confirmation.side as unknown as ContractConfirmationSide,
      confirmedAt: confirmation.confirmedAt.toISOString(),
      bothConfirmed,
      commission: commission
        ? {
            amount: commission.amountKES,
            status: commission.status as unknown as ContractCommissionStatus,
            payableOn: commission.eligibleAt.toISOString(),
          }
        : undefined,
      successFee: settlement?.successFee,
      vacatedListingPrompt:
        input.side === ContractConfirmationSide.INCOMING_TENANT
          ? this.buildVacatedListingPrompt(confirmation.id, unlock.listing.monthlyRent)
          : undefined,
      message: this.buildResponseMessage(input.side, commission?.eligibleAt ?? null),
    };
  }

  async ensureCommissionForUnlock(unlockId: string) {
    const settlement = await this.ensureSettlementIfEligible(unlockId);

    return settlement?.commission ?? null;
  }

  async autoConfirmStaleUnlocks(now = new Date()) {
    const cutoff = new Date(now.getTime() - AUTO_CONFIRM_AFTER_DAYS * DAY_IN_MS);
    const candidateUnlocks = await this.prismaService.unlock.findMany({
      where: {
        isRefunded: false,
        confirmations: {
          some: {
            confirmedAt: {
              lt: cutoff,
            },
          },
        },
      },
      select: this.unlockSelect(),
    });

    let autoConfirmed = 0;

    for (const unlock of candidateUnlocks) {
      if (
        unlock.confirmations.length !== 1 ||
        (unlock.dispute && BLOCKING_DISPUTE_STATUSES.has(unlock.dispute.status))
      ) {
        continue;
      }

      const existingSide = unlock.confirmations[0]?.side;
      const missingSide =
        existingSide === PrismaConfirmationSide.INCOMING_TENANT
          ? ContractConfirmationSide.OUTGOING_TENANT
          : ContractConfirmationSide.INCOMING_TENANT;
      const attributedUserId =
        missingSide === ContractConfirmationSide.INCOMING_TENANT
          ? unlock.buyerId
          : unlock.listing.userId;

      try {
        await this.createConfirmationRecord(unlock.id, attributedUserId, missingSide);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }

        if (error instanceof BadRequestException) {
          continue;
        }

        throw error;
      }

      const settlement = await this.ensureSettlementIfEligible(unlock.id);
      await this.notifier.sendConfirmationNotifications(
        unlock,
        missingSide,
        settlement?.commission
          ? {
              amountKES: settlement.commission.amountKES,
              eligibleAt: settlement.commission.eligibleAt,
            }
          : null,
      );
      autoConfirmed += 1;
    }

    return autoConfirmed;
  }

  private async ensureSettlementIfEligible(unlockId: string): Promise<SettlementOutcome | null> {
    const unlock = await this.prismaService.unlock.findUnique({
      where: {
        id: unlockId,
      },
      select: {
        id: true,
        buyerId: true,
        creditsSpent: true,
        isRefunded: true,
        listing: {
          select: {
            id: true,
            userId: true,
            monthlyRent: true,
            successFeeKes: true,
          },
        },
        confirmations: {
          select: {
            confirmedAt: true,
          },
        },
        dispute: {
          select: {
            status: true,
          },
        },
      },
    });

    if (
      !unlock ||
      unlock.isRefunded ||
      unlock.confirmations.length < 2 ||
      (unlock.dispute && BLOCKING_DISPUTE_STATUSES.has(unlock.dispute.status))
    ) {
      return null;
    }

    const successFee = await this.successFeeService.ensureForConfirmedUnlock(unlock);
    await this.proxySessionService.extendForConfirmedUnlock(unlock.id);

    const commission = await this.prismaService.commission.findUnique({
      where: {
        unlockId: unlock.id,
      },
      select: {
        amountKES: true,
        status: true,
        eligibleAt: true,
      },
    });

    return {
      commission,
      successFee,
    };
  }

  private async createConfirmationRecord(
    unlockId: string,
    userId: string,
    side: ContractConfirmationSide,
  ) {
    try {
      return await this.prismaService.confirmation.create({
        data: {
          unlockId,
          userId,
          side: side as unknown as PrismaConfirmationSide,
        },
        select: {
          id: true,
          unlockId: true,
          side: true,
          confirmedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw this.alreadyConfirmedError();
      }

      throw error;
    }
  }

  // Supply flywheel (spec section 4.6): the mover is vacating another house
  // right now. Rent-history profiles do not exist yet, so the new home's rent
  // is the estimate basis; the client collects the real figures pre-capture.
  private buildVacatedListingPrompt(
    confirmationId: string,
    estimateBasisRentKes: number,
  ): VacatedListingPrompt {
    const estimatedEarningsKes = posterShareKes(computeSuccessFeeKes(estimateBasisRentKes));

    return {
      seededFromConfirmationId: confirmationId,
      estimatedEarningsKes,
      message: `Leaving a house behind? It's worth ~KES ${estimatedEarningsKes} on PataSpace. Post it in 2 minutes.`,
    };
  }

  private async getUnlockOrThrow(unlockId: string): Promise<UnlockForConfirmation> {
    const unlock = await this.prismaService.unlock.findUnique({
      where: {
        id: unlockId,
      },
      select: this.unlockSelect(),
    });

    if (!unlock) {
      throw new NotFoundException({
        code: 'UNLOCK_NOT_FOUND',
        message: 'Unlock was not found',
      });
    }

    return unlock;
  }

  private unlockSelect() {
    return {
      id: true,
      buyerId: true,
      isRefunded: true,
      refundReason: true,
      refundedAt: true,
      listing: {
        select: {
          userId: true,
          neighborhood: true,
          monthlyRent: true,
          user: {
            select: {
              phoneNumberEncrypted: true,
            },
          },
        },
      },
      buyer: {
        select: {
          phoneNumberEncrypted: true,
        },
      },
      confirmations: {
        select: {
          confirmedAt: true,
          side: true,
        },
      },
      dispute: {
        select: {
          status: true,
        },
      },
    } as const;
  }

  private assertConfirmationAllowed(
    unlock: UnlockForConfirmation,
    userId: string,
    side: ContractConfirmationSide,
  ) {
    if (unlock.isRefunded) {
      throw new GoneException({
        code: 'UNLOCK_REFUNDED',
        message:
          unlock.refundReason ??
          'This unlock was refunded because the listing is no longer available',
        details: {
          refundedAt: unlock.refundedAt?.toISOString() ?? null,
        },
      });
    }

    if (unlock.dispute && BLOCKING_DISPUTE_STATUSES.has(unlock.dispute.status)) {
      throw new ConflictException({
        code: 'DISPUTE_OPEN',
        message: 'This unlock has an open dispute and cannot be confirmed',
      });
    }

    if (unlock.confirmations.some((confirmation) => confirmation.side === side)) {
      throw this.alreadyConfirmedError();
    }

    const isAuthorized =
      side === ContractConfirmationSide.INCOMING_TENANT
        ? unlock.buyerId === userId
        : unlock.listing.userId === userId;

    if (!isAuthorized) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Not authorized to confirm this unlock',
      });
    }
  }

  private alreadyConfirmedError() {
    return new BadRequestException({
      code: 'ALREADY_CONFIRMED',
      message: 'This side has already confirmed the unlock',
    });
  }

  private buildResponseMessage(
    side: ContractConfirmationSide,
    payableOn: Date | null,
  ) {
    if (payableOn) {
      return `Both parties confirmed! Commission will be paid on ${payableOn
        .toISOString()
        .slice(0, 10)}.`;
    }

    return side === ContractConfirmationSide.INCOMING_TENANT
      ? 'Waiting for outgoing tenant to confirm.'
      : 'Waiting for incoming tenant to confirm.';
  }
}
