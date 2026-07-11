/**
 * Purpose: Gate tests for post-refund side effects: cache invalidation,
 * phone decryption at the edge, and SMS failure isolation.
 * Why important: a notification failure must never surface as a refund
 * failure; the money movement has already committed.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { encryptField } from '../../common/security/encryption.util';
import { UnlockRefundNotifier } from './unlock-refund-notifier';

describe('UnlockRefundNotifier', () => {
  const encryptionKey = '12345678901234567890123456789012';

  const createNotifier = () => {
    const listingCacheService = {
      invalidateListing: jest.fn(),
    };
    const smsService = {
      sendMessage: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockImplementation((key: string) =>
        key === 'security.encryptionKey' ? encryptionKey : undefined,
      ),
    };

    return {
      listingCacheService,
      smsService,
      notifier: new UnlockRefundNotifier(
        listingCacheService as never,
        smsService as never,
        configService as never,
      ),
    };
  };

  it('invalidates the listing cache and texts the decrypted buyer phone', async () => {
    const { listingCacheService, notifier, smsService } = createNotifier();

    await notifier.afterRefund({
      listingId: 'listing_1',
      buyerPhoneEncrypted: encryptField('+254712345678', encryptionKey),
      reason: 'Listing invalidated',
    });

    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254712345678',
      'Your unlock has been refunded on PataSpace. Reason: Listing invalidated',
    );
  });

  it('skips SMS when the buyer has no phone number', async () => {
    const { notifier, smsService } = createNotifier();

    await notifier.afterRefund({
      listingId: 'listing_1',
      buyerPhoneEncrypted: null,
      reason: 'Listing invalidated',
    });

    expect(smsService.sendMessage).not.toHaveBeenCalled();
  });

  it('swallows SMS provider failures', async () => {
    const { notifier, smsService } = createNotifier();
    smsService.sendMessage.mockRejectedValue(new Error('provider down'));

    await expect(
      notifier.afterRefund({
        listingId: null,
        buyerPhoneEncrypted: encryptField('+254712345678', encryptionKey),
        reason: 'Listing invalidated',
      }),
    ).resolves.toBeUndefined();
  });
});
