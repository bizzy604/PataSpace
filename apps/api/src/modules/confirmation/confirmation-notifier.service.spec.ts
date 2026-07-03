/**
 * Purpose: Gate tests for confirmation SMS routing: nudge the missing side,
 * announce the commission to both when the loop closes.
 * Why important: the confirmation loop only closes if the right party gets
 * nudged; swapped recipients stall payouts.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { ConfirmationSide } from '@pataspace/contracts';
import { ConfirmationNotifierService } from './confirmation-notifier.service';

describe('ConfirmationNotifierService', () => {
  const createNotifier = () => {
    const smsService = {
      sendMessage: jest.fn().mockResolvedValue({ accepted: true }),
    };
    const userService = {
      decryptPhoneNumber: jest.fn((value: string) =>
        value === 'buyer-phone' ? '+254700000001' : '+254700000002',
      ),
    };

    return {
      smsService,
      userService,
      notifier: new ConfirmationNotifierService(smsService as never, userService as never),
    };
  };

  const unlock = {
    listing: {
      neighborhood: 'Kilimani',
      user: {
        phoneNumberEncrypted: 'owner-phone',
      },
    },
    buyer: {
      phoneNumberEncrypted: 'buyer-phone',
    },
  };

  it('notifies both parties with the commission schedule when the loop closes', async () => {
    const { notifier, smsService } = createNotifier();

    await notifier.sendConfirmationNotifications(unlock, ConfirmationSide.OUTGOING_TENANT, {
      amountKES: 1750,
      eligibleAt: new Date('2026-03-31T09:00:00.000Z'),
    });

    expect(smsService.sendMessage).toHaveBeenCalledTimes(2);
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000002',
      expect.stringContaining('1750'),
    );
  });

  it('nudges the outgoing tenant when the incoming tenant confirms first', async () => {
    const { notifier, smsService } = createNotifier();

    await notifier.sendConfirmationNotifications(
      unlock,
      ConfirmationSide.INCOMING_TENANT,
      null,
    );

    expect(smsService.sendMessage).toHaveBeenCalledTimes(1);
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000002',
      expect.stringContaining('Please confirm'),
    );
  });

  it('nudges the incoming tenant when the outgoing tenant confirms first', async () => {
    const { notifier, smsService } = createNotifier();

    await notifier.sendConfirmationNotifications(
      unlock,
      ConfirmationSide.OUTGOING_TENANT,
      null,
    );

    expect(smsService.sendMessage).toHaveBeenCalledTimes(1);
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000001',
      expect.stringContaining('Please confirm'),
    );
  });

  it('swallows SMS provider failures', async () => {
    const { notifier, smsService } = createNotifier();

    smsService.sendMessage.mockRejectedValue(new Error('provider down'));

    await expect(
      notifier.sendConfirmationNotifications(unlock, ConfirmationSide.INCOMING_TENANT, null),
    ).resolves.toBeUndefined();
  });
});
