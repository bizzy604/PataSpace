/**
 * Purpose: The 14-day auto-confirmation sweep. Finds unlocks where exactly one
 * side ever confirmed, attributes the missing side, and settles them.
 * Why important: without it a silent counterparty freezes the payout forever.
 * It shares SettlementService with the manual path, so an auto-confirmed
 * handover also locks the listing and refunds rivals.
 * Used by: ConfirmationFollowupJob (daily cron, already wrapped in runInternal).
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfirmationSide as ContractConfirmationSide } from '@pataspace/contracts';
import { ConfirmationNotifierService } from '../confirmation-notifier.service';
import {
  isAutoConfirmable,
  missingConfirmationSide,
  staleConfirmationCutoff,
} from '../domain/confirmation-eligibility.policy';
import {
  ConfirmationRepository,
  UnlockForConfirmation,
} from '../persistence/confirmation.repository';
import { SettlementService } from './settlement.service';

@Injectable()
export class StaleConfirmationService {
  constructor(
    private readonly repository: ConfirmationRepository,
    private readonly notifier: ConfirmationNotifierService,
    private readonly settlementService: SettlementService,
  ) {}

  async autoConfirmStaleUnlocks(now = new Date()): Promise<number> {
    const candidates = await this.repository.findStaleUnlockCandidates(
      staleConfirmationCutoff(now),
    );
    let autoConfirmed = 0;

    for (const unlock of candidates) {
      if (!isAutoConfirmable(unlock)) {
        continue;
      }

      if (await this.autoConfirm(unlock)) {
        autoConfirmed += 1;
      }
    }

    return autoConfirmed;
  }

  private async autoConfirm(unlock: UnlockForConfirmation): Promise<boolean> {
    const missingSide = missingConfirmationSide(unlock.confirmations[0]?.side);
    const attributedUserId =
      missingSide === ContractConfirmationSide.INCOMING_TENANT
        ? unlock.buyerId
        : unlock.listing.userId;

    if (!(await this.recordMissingSide(unlock.id, attributedUserId, missingSide))) {
      return false;
    }

    const settlement = await this.settlementService.ensureSettlementIfEligible(unlock.id);
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

    return true;
  }

  /**
   * A duplicate here means the real counterparty confirmed between the scan and
   * this write. That unlock is no longer stale and the winning request already
   * settled it, so skip it rather than failing the whole sweep.
   */
  private async recordMissingSide(
    unlockId: string,
    userId: string,
    side: ContractConfirmationSide,
  ): Promise<boolean> {
    try {
      await this.repository.createConfirmation(unlockId, userId, side);
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }

      if (error instanceof BadRequestException) {
        return false;
      }

      throw error;
    }
  }
}
