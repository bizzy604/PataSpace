/**
 * Purpose: Unit tests for ReferralService — self-invite guard, duplicate
 *   handling, masking.
 * Why important: Locks in the invariants of the invite-friends loop so a
 *   future migration cannot accidentally bypass the dedupe constraint.
 * Used by: jest runner via apps/api jest config.
 */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma, ReferralStatus } from '@prisma/client';
import { ReferralService } from './referral.service';

describe('ReferralService', () => {
  const create = () => {
    const prismaService = {
      $transaction: jest.fn(),
      referral: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      user: { findUnique: jest.fn() },
    };
    return { prismaService, service: new ReferralService(prismaService as never) };
  };

  it('creates a referral and masks the invitee phone', async () => {
    const { prismaService, service } = create();
    prismaService.user.findUnique.mockResolvedValue({ phoneNumberHash: 'mine' });
    prismaService.referral.create.mockResolvedValue({
      id: 'ref_1',
      code: 'A1B2C3D4',
      inviteePhoneMasked: '+254***678',
      status: ReferralStatus.INVITED,
      joinedAt: null,
      rewardedAt: null,
      createdAt: new Date('2026-04-02T09:00:00.000Z'),
    });

    const result = await service.createReferral('user_1', {
      phoneNumber: '+254712345678',
    });

    expect(result.status).toBe(ReferralStatus.INVITED);
    expect(result.inviteePhoneMasked).toMatch(/\*/);
    expect(prismaService.referral.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referrerId: 'user_1',
          code: expect.any(String),
        }),
      }),
    );
  });

  it('refuses to refer yourself', async () => {
    const { prismaService, service } = create();
    const create1 = jest.fn();
    prismaService.referral.create = create1;
    // Make the prisma user.findUnique return the same hash as the input
    // We do this by pre-computing the hash via real util; alternatively mock
    // it by intercepting prismaService.user.findUnique to return whatever
    // hash the service computes. Simpler: spy on referral.create and ensure
    // it is never invoked when self-invite is detected.
    prismaService.user.findUnique.mockImplementation(async () => ({
      phoneNumberHash: (
        await import('../../common/security/encryption.util')
      ).hashLookupValue(
        (await import('../../common/security/encryption.util')).normalizePhoneNumber(
          '+254712345678',
        ),
      ),
    }));

    await expect(
      service.createReferral('user_1', { phoneNumber: '+254712345678' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create1).not.toHaveBeenCalled();
  });

  it('maps duplicate referrals to a 409 conflict', async () => {
    const { prismaService, service } = create();
    prismaService.user.findUnique.mockResolvedValue({ phoneNumberHash: 'mine' });
    prismaService.referral.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      }),
    );

    await expect(
      service.createReferral('user_1', { phoneNumber: '+254712345678' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists referrals with pagination meta', async () => {
    const { prismaService, service } = create();
    prismaService.$transaction.mockImplementation(
      async (ops: Array<Promise<unknown>>) => Promise.all(ops),
    );
    prismaService.referral.count.mockResolvedValue(1);
    prismaService.referral.findMany.mockResolvedValue([
      {
        id: 'ref_1',
        code: 'A1B2C3D4',
        inviteePhoneMasked: '+254***678',
        status: ReferralStatus.JOINED,
        joinedAt: new Date('2026-04-02T09:00:00.000Z'),
        rewardedAt: null,
        createdAt: new Date('2026-04-02T09:00:00.000Z'),
      },
    ]);

    const result = await service.listMyReferrals('user_1', 1, 20);
    expect(result.pagination.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.status).toBe(ReferralStatus.JOINED);
  });

  describe('linkPendingReferral', () => {
    it('promotes matching INVITED rows to JOINED and returns the linked count', async () => {
      const { prismaService, service } = create();
      prismaService.referral.updateMany.mockResolvedValue({ count: 1 });

      const linked = await service.linkPendingReferral('hash_xyz', 'user_invitee');

      expect(linked).toBe(1);
      expect(prismaService.referral.updateMany).toHaveBeenCalledWith({
        where: {
          inviteePhoneHash: 'hash_xyz',
          status: ReferralStatus.INVITED,
          refereeUserId: null,
          NOT: { referrerId: 'user_invitee' },
        },
        data: expect.objectContaining({
          status: ReferralStatus.JOINED,
          refereeUserId: 'user_invitee',
        }),
      });
    });

    it('does not link a referrer to a referral they sent themselves', async () => {
      const { prismaService, service } = create();
      prismaService.referral.updateMany.mockResolvedValue({ count: 0 });

      const linked = await service.linkPendingReferral('hash_same', 'user_self');

      expect(linked).toBe(0);
      expect(prismaService.referral.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: { referrerId: 'user_self' },
          }),
        }),
      );
    });
  });
});
