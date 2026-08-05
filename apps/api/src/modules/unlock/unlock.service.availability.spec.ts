/**
 * Purpose: Gate tests proving UnlockService actually enforces the unlock
 * eligibility policy at both checkpoints — the pre-flight read and the
 * in-transaction re-read that runs after the row lock.
 * Why important: unlock-eligibility.policy.spec.ts proves the rule is correct;
 * this file proves the paywall is wired to it. A CONFIRMED listing must cost a
 * tenant nothing: no credits spent, no unlock row, HTTP 410.
 * Why separate from unlock.service.spec.ts: that file is already well over the
 * 200-line ceiling, and availability is its own reason to change.
 * Used by: `pnpm --filter @pataspace/api test`.
 */
import { HttpStatus } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { UnlockService } from './unlock.service';

const encryptionKey = '12345678901234567890123456789012';

function createHarness() {
  const prismaService = {
    unlock: { findUnique: jest.fn().mockResolvedValue(null) },
    listing: { findFirst: jest.fn() },
    successFee: { findFirst: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn(),
  };
  const creditService = {
    spendCredits: jest.fn(),
    getCurrentBalanceValue: jest.fn(),
    invalidateBalanceCache: jest.fn(),
  };

  return {
    creditService,
    prismaService,
    service: new UnlockService(
      prismaService as never,
      creditService as never,
      { invalidateListing: jest.fn() } as never,
      { sendMessage: jest.fn() } as never,
      { getActiveForUnlock: jest.fn().mockResolvedValue(null) } as never,
      { runInternal: (fn: () => unknown) => fn() } as never,
      {
        get: (key: string) => (key === 'security.encryptionKey' ? encryptionKey : undefined),
      } as never,
    ),
  };
}

function listingRow(status: ListingStatus) {
  return {
    id: 'listing_1',
    userId: 'owner_1',
    addressEncrypted: 'address',
    latitude: -1.2,
    longitude: 36.8,
    neighborhood: 'Kilimani',
    unlockCostCredits: 2500,
    isApproved: true,
    isDeleted: false,
    status,
    user: { firstName: 'Owner', lastName: 'Tester', phoneNumberEncrypted: 'phone' },
  };
}

describe('UnlockService listing availability', () => {
  // The regression this whole slice exists for. Before the handover feature,
  // CONFIRMED sat on the unlockable allow-list, so a third tenant could pay
  // full credits for a house both parties had already signed off on.
  it('refuses a CONFIRMED listing with 410 and charges nothing', async () => {
    const { creditService, prismaService, service } = createHarness();

    prismaService.listing.findFirst.mockResolvedValue(listingRow(ListingStatus.CONFIRMED));

    await expect(service.createUnlock('buyer_1', { listingId: 'listing_1' })).rejects.toMatchObject({
      status: HttpStatus.GONE,
      response: { code: 'LISTING_UNAVAILABLE' },
    });
    expect(creditService.spendCredits).not.toHaveBeenCalled();
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });

  it.each([ListingStatus.ACTIVE, ListingStatus.UNLOCKED])(
    'lets a %s listing through the pre-flight check and into the transaction',
    async (status) => {
      const { prismaService, service } = createHarness();

      prismaService.listing.findFirst.mockResolvedValue(listingRow(status));
      // Fail inside the transaction so the test asserts only that the
      // pre-flight gate opened, without standing up the whole spend path.
      prismaService.$transaction.mockRejectedValue(new Error('reached the transaction'));

      await expect(
        service.createUnlock('buyer_1', { listingId: 'listing_1' }),
      ).rejects.toThrow('reached the transaction');
    },
  );

  it.each([ListingStatus.PENDING, ListingStatus.COMPLETED, ListingStatus.REJECTED])(
    'refuses a %s listing',
    async (status) => {
      const { prismaService, service } = createHarness();

      prismaService.listing.findFirst.mockResolvedValue(listingRow(status));

      await expect(
        service.createUnlock('buyer_1', { listingId: 'listing_1' }),
      ).rejects.toMatchObject({ status: HttpStatus.GONE });
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    },
  );

  // The pre-flight read is not authoritative: another tenant's handover can
  // land between it and the row lock. The in-transaction re-read filters on the
  // same allow-list, so a listing that turned CONFIRMED mid-flight finds no row.
  it('refuses inside the transaction when the listing is taken after the pre-check', async () => {
    const { creditService, prismaService, service } = createHarness();
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'listing_1' }]),
      listing: { findFirst: jest.fn().mockResolvedValue(null) },
      unlock: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
    };

    prismaService.listing.findFirst.mockResolvedValue(listingRow(ListingStatus.ACTIVE));
    prismaService.$transaction.mockImplementation(async (cb: (db: unknown) => unknown) => cb(tx));

    await expect(service.createUnlock('buyer_1', { listingId: 'listing_1' })).rejects.toMatchObject({
      status: HttpStatus.GONE,
      response: { code: 'LISTING_UNAVAILABLE' },
    });
    expect(tx.unlock.create).not.toHaveBeenCalled();
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });

  it('queries the transaction re-read with the allow-list, not a bare id lookup', async () => {
    const { prismaService, service } = createHarness();
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'listing_1' }]),
      listing: { findFirst: jest.fn().mockResolvedValue(null) },
      unlock: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
    };

    prismaService.listing.findFirst.mockResolvedValue(listingRow(ListingStatus.ACTIVE));
    prismaService.$transaction.mockImplementation(async (cb: (db: unknown) => unknown) => cb(tx));

    await expect(service.createUnlock('buyer_1', { listingId: 'listing_1' })).rejects.toBeDefined();
    expect(tx.listing.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isApproved: true,
          isDeleted: false,
          status: { in: [ListingStatus.ACTIVE, ListingStatus.UNLOCKED] },
        }),
      }),
    );
  });
});
