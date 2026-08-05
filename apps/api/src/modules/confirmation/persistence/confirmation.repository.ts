/**
 * Purpose: Every Prisma read and write the confirmation loop needs — the canonical
 * unlock projection, the confirmation insert, the settlement projection, the
 * stale-unlock candidate scan, and the commission lookup.
 * Why important: three services (manual confirm, settlement, 14-day auto-confirm)
 * used to inline the same select. One projection means the notifier and the
 * policies can never be handed a differently shaped unlock, and it keeps Prisma
 * out of the application services. The two-party reads run privileged because
 * UNLOCK_SELECT spans both tenants' user rows and RLS only ever grants a caller
 * their own; see findUnlock.
 * Used by: ConfirmationService, SettlementService, StaleConfirmationService.
 */
import { Injectable } from '@nestjs/common';
import { ConfirmationSide as PrismaConfirmationSide, Prisma } from '@prisma/client';
import { ConfirmationSide as ContractConfirmationSide } from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';
import { RequestContextService } from '../../../common/request-context/request-context.service';
import { alreadyConfirmedError } from '../confirmation.errors';

const UNLOCK_SELECT = {
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

const SETTLEMENT_SELECT = {
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
} as const;

export type UnlockForConfirmation = Prisma.UnlockGetPayload<{ select: typeof UNLOCK_SELECT }>;
export type UnlockForSettlement = Prisma.UnlockGetPayload<{ select: typeof SETTLEMENT_SELECT }>;

@Injectable()
export class ConfirmationRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Runs privileged because UNLOCK_SELECT spans BOTH parties' user rows —
   * `buyer` (incoming tenant) and `listing.user` (outgoing tenant) — while the
   * caller can only ever be one of them. users_select_policy gates on
   * app.is_privileged() OR self, so under the caller's own context the other
   * party's row comes back empty and Prisma rejects the whole query with
   * "Field buyer is required to return data, got null" — a 500, not a 403.
   *
   * Bypassing RLS here makes ConfirmationService.assertConfirmationAllowed the
   * only authorization guard, so that check MUST stay ahead of any use of the
   * returned unlock. It does, and confirmation.authorization.spec.ts holds it
   * there. Nothing is returned to an unauthorized caller: the guard throws
   * before the unlock reaches a response body.
   */
  async findUnlock(unlockId: string): Promise<UnlockForConfirmation | null> {
    return this.requestContext.runInternal(async () =>
      this.prismaService.unlock.findUnique({
        where: { id: unlockId },
        select: UNLOCK_SELECT,
      }),
    );
  }

  async findUnlockForSettlement(unlockId: string): Promise<UnlockForSettlement | null> {
    return this.prismaService.unlock.findUnique({
      where: { id: unlockId },
      select: SETTLEMENT_SELECT,
    });
  }

  /**
   * Candidates are unlocks with at least one confirmation older than the cutoff.
   * The one-sided and dispute filters are applied in the policy rather than here:
   * Prisma cannot express "exactly one confirmation" in a where clause.
   */
  async findStaleUnlockCandidates(cutoff: Date): Promise<UnlockForConfirmation[]> {
    return this.prismaService.unlock.findMany({
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
      select: UNLOCK_SELECT,
    });
  }

  /**
   * The (unlockId, side) unique constraint is the real duplicate guard. The
   * caller's in-memory check races against a concurrent request, so P2002 is
   * translated into the same ALREADY_CONFIRMED the caller would have raised.
   */
  async createConfirmation(unlockId: string, userId: string, side: ContractConfirmationSide) {
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw alreadyConfirmedError();
      }

      throw error;
    }
  }

  async findCommission(unlockId: string) {
    return this.prismaService.commission.findUnique({
      where: { unlockId },
      select: {
        amountKES: true,
        status: true,
        eligibleAt: true,
      },
    });
  }
}
