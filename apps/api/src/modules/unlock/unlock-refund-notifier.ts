/**
 * Purpose: Post-refund side effects: listing cache invalidation and the
 * buyer SMS, decrypting the buyer's phone at the edge.
 * Why important: keeps UnlockRefundService focused on the money movement;
 * notification failures must never roll back or block a committed refund.
 * Used by: unlock-refund.service.ts (after its transaction commits).
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decryptField } from '../../common/security/encryption.util';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { ListingCacheService } from '../listing/listing-cache.service';

export type RefundNotification = {
  listingId: string | null;
  buyerPhoneEncrypted: string | null;
  reason: string;
};

@Injectable()
export class UnlockRefundNotifier {
  private readonly encryptionKey: string;

  constructor(
    private readonly listingCacheService: ListingCacheService,
    private readonly smsService: SmsService,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.get<string>('security.encryptionKey') ?? '';
  }

  async afterRefund(notification: RefundNotification) {
    if (notification.listingId) {
      await this.listingCacheService.invalidateListing(notification.listingId);
    }

    if (!notification.buyerPhoneEncrypted) {
      return;
    }

    try {
      await this.smsService.sendMessage(
        decryptField(notification.buyerPhoneEncrypted, this.encryptionKey),
        `Your unlock has been refunded on PataSpace. Reason: ${notification.reason}`,
      );
    } catch {
      return;
    }
  }
}
