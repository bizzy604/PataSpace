/**
 * Purpose: Gate tests for the single mover-to-poster reminder: one SMS per
 * confirmation, no reminders for movers who already posted, no re-sends.
 * Why important: "one reminder, then stop" is a product promise; double
 * texting movers erodes the trust the flywheel depends on.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { MoverPosterReminderJob } from './mover-poster-reminder.job';

describe('MoverPosterReminderJob', () => {
  const now = new Date('2026-07-03T12:00:00.000Z');

  const createJob = () => {
    const prismaService = {
      confirmation: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      listing: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const listingSeedService = {
      estimateEarnings: jest.fn().mockReturnValue({
        basisRentKes: 25000,
        earningsKes: 1750,
      }),
    };
    const smsService = {
      sendMessage: jest.fn().mockResolvedValue({ accepted: true }),
    };
    const userService = {
      decryptPhoneNumber: jest.fn().mockReturnValue('+254700000001'),
    };
    const requestContext = {
      runInternal: jest.fn((callback: () => unknown) => callback()),
    };

    return {
      listingSeedService,
      prismaService,
      smsService,
      job: new MoverPosterReminderJob(
        prismaService as never,
        listingSeedService as never,
        smsService as never,
        userService as never,
        requestContext as never,
      ),
    };
  };

  const createCandidate = (overrides = {}) => ({
    id: 'confirmation_1',
    userId: 'buyer_1',
    confirmedAt: new Date('2026-07-02T10:00:00.000Z'),
    user: {
      phoneNumberEncrypted: 'buyer-phone',
    },
    unlock: {
      listing: {
        monthlyRent: 25000,
      },
    },
    ...overrides,
  });

  it('sends one reminder with the earnings estimate and marks the confirmation', async () => {
    const { job, prismaService, smsService } = createJob();

    prismaService.confirmation.findMany.mockResolvedValue([createCandidate()]);

    await expect(job.sendPendingReminders(now)).resolves.toBe(1);
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000001',
      expect.stringContaining('1750'),
    );
    expect(prismaService.confirmation.update).toHaveBeenCalledWith({
      where: {
        id: 'confirmation_1',
      },
      data: {
        posterPromptSmsAt: now,
      },
    });
  });

  it('skips movers who already posted a listing after confirming, but still marks them', async () => {
    const { job, prismaService, smsService } = createJob();

    prismaService.confirmation.findMany.mockResolvedValue([createCandidate()]);
    prismaService.listing.findFirst.mockResolvedValue({
      id: 'listing_2',
    });

    await expect(job.sendPendingReminders(now)).resolves.toBe(0);
    expect(smsService.sendMessage).not.toHaveBeenCalled();
    expect(prismaService.confirmation.update).toHaveBeenCalled();
  });

  it('only considers unmarked incoming confirmations inside the 24h-72h window', async () => {
    const { job, prismaService } = createJob();

    await job.sendPendingReminders(now);

    expect(prismaService.confirmation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          side: 'INCOMING_TENANT',
          posterPromptSmsAt: null,
          confirmedAt: {
            lt: new Date('2026-07-02T12:00:00.000Z'),
            gt: new Date('2026-06-30T12:00:00.000Z'),
          },
        }),
      }),
    );
  });
});
