/**
 * Purpose: Hands a house over once both tenants have confirmed — locks the
 * listing to CONFIRMED so nobody else can pay for it, refunds every rival
 * unlocker, and drops the caches that still advertise it as open.
 * Why important: before this existed nothing ever wrote CONFIRMED, so a house
 * both parties had signed off on stayed on the market and a third tenant could
 * spend real credits on a handover that could never happen. The lock is the
 * money guard; the refunds are the trust promise.
 * Used by: ConfirmationService and StaleConfirmationService, both via the
 * settlement path that only fires when two confirmations exist.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { ListingCacheService } from '../listing/listing-cache.service';
import { UnlockRefundService } from '../unlock/unlock-refund.service';

export const HANDOVER_REFUND_REASON = 'Listing was taken by another tenant';

@Injectable()
export class ListingHandoverService {
  private readonly logger = new Logger(ListingHandoverService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly listingCacheService: ListingCacheService,
    private readonly unlockRefundService: UnlockRefundService,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Idempotent. Safe to call on every settlement attempt: the second call sees
   * the listing already CONFIRMED and returns without refunding anyone twice.
   *
   * Runs under runInternal because the caller may be either tenant while this
   * writes the *owner's* listing row and *other buyers'* unlock rows.
   * listings_update_policy and unlocks_update_policy both gate those on
   * app.is_privileged(), so without the internal context this silently matches
   * zero rows. Same reason UnlockService wraps its unlockCount bump.
   */
  async handOverListing(listingId: string, winningUnlockId: string): Promise<boolean> {
    return this.requestContext.runInternal(async () => {
      if (!(await this.claimListing(listingId))) {
        return false;
      }

      await this.refundRivalUnlocks(listingId, winningUnlockId);
      await this.listingCacheService.invalidateListing(listingId);
      await this.listingCacheService.invalidateBrowse();

      return true;
    });
  }

  /**
   * Lock first, refund second. A conditional updateMany is the claim: whichever
   * caller flips the status away from "not CONFIRMED" owns the handover, so two
   * concurrent settlements cannot both start refunding. Ordering it before the
   * refunds also closes the window where a rival unlock could still be created.
   */
  private async claimListing(listingId: string): Promise<boolean> {
    const claimed = await this.prismaService.listing.updateMany({
      where: {
        id: listingId,
        status: {
          not: ListingStatus.CONFIRMED,
        },
      },
      data: {
        status: ListingStatus.CONFIRMED,
      },
    });

    if (claimed.count === 0) {
      this.logger.debug(`Listing ${listingId} was already handed over; skipping.`);
      return false;
    }

    return true;
  }

  /**
   * Rivals are refunded independently by UnlockRefundService, which reports
   * per-unlock failures instead of throwing. The listing is already locked by
   * this point, so a throw here would strand the remaining rivals paid-up on a
   * dead listing with no retry. Log loudly instead: it is a real money
   * discrepancy someone has to reconcile by hand.
   */
  private async refundRivalUnlocks(listingId: string, winningUnlockId: string): Promise<void> {
    try {
      const { failed } = await this.unlockRefundService.refundUnlocksForListingInvalidation(
        listingId,
        HANDOVER_REFUND_REASON,
        winningUnlockId,
      );

      for (const failure of failed) {
        this.logger.error(
          `Listing ${listingId} was handed over but unlock ${failure.unlockId} could not be refunded: ${failure.message}`,
        );
      }
    } catch (error) {
      // The lock has already committed. Propagating would hand the confirming
      // tenant a 500 for work that succeeded, and because the listing is now
      // CONFIRMED the next attempt claims nothing and skips these refunds for
      // good. Swallow, log, and let reconciliation pick it up.
      this.logger.error(
        `Listing ${listingId} was handed over but the rival refund sweep failed outright: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
