/**
 * Purpose: The manual move-in confirmation (spec sections 4.4/4.6): authorizes
 * the caller for the side they claim, records the confirmation, delegates
 * settlement, and hands the mover the vacated-listing prompt.
 * Why important: this is the tenant-facing half of the payout trigger. The
 * authorization rules here are what stop one party confirming on the other's
 * behalf. Settlement, the stale sweep, and Prisma access live in collaborators.
 * Used by: ConfirmationController, DisputeService, MoverPosterReminderJob.
 */
import { ConflictException, ForbiddenException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CommissionStatus as ContractCommissionStatus,
  ConfirmationSide as ContractConfirmationSide,
  CreateConfirmationRequest,
  CreateConfirmationResponse,
  VacatedListingPrompt,
} from '@pataspace/contracts';
import { computeSuccessFeeKes, posterShareKes, PricingConfig } from '../listing/domain/pricing.policy';
import { SystemConfigService } from '../system-config/system-config.service';
import { SettlementService } from './application/settlement.service';
import { ConfirmationNotifierService } from './confirmation-notifier.service';
import { alreadyConfirmedError } from './confirmation.errors';
import { hasBlockingDispute } from './domain/confirmation-eligibility.policy';
import { ConfirmationRepository, UnlockForConfirmation } from './persistence/confirmation.repository';

@Injectable()
export class ConfirmationService {
  constructor(
    private readonly repository: ConfirmationRepository,
    private readonly notifier: ConfirmationNotifierService,
    private readonly settlementService: SettlementService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  async createConfirmation(
    userId: string,
    input: CreateConfirmationRequest,
  ): Promise<CreateConfirmationResponse> {
    const unlock = await this.getUnlockOrThrow(input.unlockId);
    this.assertConfirmationAllowed(unlock, userId, input.side);

    const confirmation = await this.repository.createConfirmation(unlock.id, userId, input.side);
    const settlement = await this.settlementService.ensureSettlementIfEligible(unlock.id);

    const bothConfirmed = settlement !== null;
    const commission = settlement?.commission ?? null;

    await this.notifier.sendConfirmationNotifications(
      unlock,
      input.side,
      commission ? { amountKES: commission.amountKES, eligibleAt: commission.eligibleAt } : null,
    );

    const pricingConfig = await this.systemConfig.resolvePricingConfig();

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
          ? this.buildVacatedListingPrompt(
              confirmation.id,
              unlock.listing.monthlyRent,
              pricingConfig,
            )
          : undefined,
      message: this.buildResponseMessage(input.side, commission?.eligibleAt ?? null),
    };
  }

  async ensureCommissionForUnlock(unlockId: string) {
    const settlement = await this.settlementService.ensureSettlementIfEligible(unlockId);

    return settlement?.commission ?? null;
  }

  // Supply flywheel (spec section 4.6): the mover is vacating another house
  // right now. Rent-history profiles do not exist yet, so the new home's rent
  // is the estimate basis; the client collects the real figures pre-capture.
  private buildVacatedListingPrompt(
    confirmationId: string,
    estimateBasisRentKes: number,
    pricingConfig: PricingConfig,
  ): VacatedListingPrompt {
    const estimatedEarningsKes = posterShareKes(
      computeSuccessFeeKes(estimateBasisRentKes, pricingConfig),
      pricingConfig,
    );

    return {
      seededFromConfirmationId: confirmationId,
      estimatedEarningsKes,
      message: `Leaving a house behind? It's worth ~KES ${estimatedEarningsKes} on PataSpace. Post it in 2 minutes.`,
    };
  }

  private async getUnlockOrThrow(unlockId: string): Promise<UnlockForConfirmation> {
    const unlock = await this.repository.findUnlock(unlockId);

    if (!unlock) {
      throw new NotFoundException({
        code: 'UNLOCK_NOT_FOUND',
        message: 'Unlock was not found',
      });
    }

    return unlock;
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

    if (hasBlockingDispute(unlock.dispute)) {
      throw new ConflictException({
        code: 'DISPUTE_OPEN',
        message: 'This unlock has an open dispute and cannot be confirmed',
      });
    }

    if (unlock.confirmations.some((confirmation) => confirmation.side === side)) {
      throw alreadyConfirmedError();
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

  private buildResponseMessage(side: ContractConfirmationSide, payableOn: Date | null) {
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
