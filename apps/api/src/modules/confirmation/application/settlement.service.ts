/**
 * Purpose: The both-sides-confirmed settlement: captures the success fee,
 * extends the masked contact session, hands the listing over (lock + rival
 * refunds), and reports the resulting commission.
 * Why important: this is the single point where "both tenants confirmed"
 * becomes money moving and a house leaving the market. Manual confirmation and
 * the 14-day auto-confirm job both route through here, so neither can settle
 * without also locking the listing.
 * Used by: ConfirmationService, StaleConfirmationService.
 */
import { Injectable } from '@nestjs/common';
import { ConfirmationSuccessFee } from '@pataspace/contracts';
import { ProxySessionService } from '../../unlock/contact/proxy-session.service';
import { isSettleable } from '../domain/confirmation-eligibility.policy';
import { ListingHandoverService } from '../listing-handover.service';
import { ConfirmationRepository } from '../persistence/confirmation.repository';
import { SuccessFeeService } from '../success-fee.service';

export type SettlementOutcome = {
  commission: { amountKES: number; status: string; eligibleAt: Date } | null;
  successFee: ConfirmationSuccessFee;
};

@Injectable()
export class SettlementService {
  constructor(
    private readonly repository: ConfirmationRepository,
    private readonly successFeeService: SuccessFeeService,
    private readonly proxySessionService: ProxySessionService,
    private readonly listingHandoverService: ListingHandoverService,
  ) {}

  /**
   * Returns null when the unlock is not settleable yet, which is how callers
   * distinguish a one-sided confirmation from a completed handover.
   *
   * Idempotent end to end: ensureForConfirmedUnlock and handOverListing both
   * no-op on a second call, so re-running this after a retry settles nothing
   * twice and refunds nobody twice.
   */
  async ensureSettlementIfEligible(unlockId: string): Promise<SettlementOutcome | null> {
    const unlock = await this.repository.findUnlockForSettlement(unlockId);

    if (!isSettleable(unlock)) {
      return null;
    }

    const settleable = unlock as NonNullable<typeof unlock>;
    const successFee = await this.successFeeService.ensureForConfirmedUnlock(settleable);
    await this.proxySessionService.extendForConfirmedUnlock(settleable.id);

    // Both sides have signed off, so the house is taken. Locking it refunds
    // every rival unlocker and stops anyone else spending credits on it.
    await this.listingHandoverService.handOverListing(settleable.listing.id, settleable.id);

    const commission = await this.repository.findCommission(settleable.id);

    return { commission, successFee };
  }
}
