/**
 * Purpose: Unit tests for ReviewService — participant check, both-confirmed
 *   gate, duplicate prevention.
 * Why important: Guards the integrity rule that only buyer or outgoing tenant
 *   on a both-confirmed unlock can leave a review, and only once per side.
 * Used by: jest runner via apps/api jest config.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ConfirmationSide,
  Prisma,
  ReviewerSide,
} from '@prisma/client';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  const create = () => {
    const prismaService = {
      unlock: { findUnique: jest.fn() },
      unlockReview: { create: jest.fn() },
    };
    return { prismaService, service: new ReviewService(prismaService as never) };
  };

  const baseUnlock = {
    id: 'unlock_1',
    buyerId: 'buyer_1',
    isRefunded: false,
    listing: { userId: 'owner_1' },
    confirmations: [
      { side: ConfirmationSide.INCOMING_TENANT },
      { side: ConfirmationSide.OUTGOING_TENANT },
    ],
  };

  it('records a review for the buyer on a confirmed unlock', async () => {
    const { prismaService, service } = create();
    prismaService.unlock.findUnique.mockResolvedValue(baseUnlock);
    prismaService.unlockReview.create.mockResolvedValue({
      id: 'rev_1',
      unlockId: 'unlock_1',
      side: ReviewerSide.INCOMING_TENANT,
      rating: 5,
      comment: 'Smooth move-in',
      createdAt: new Date('2026-04-02T09:00:00.000Z'),
    });

    const result = await service.createReview('buyer_1', {
      unlockId: 'unlock_1',
      rating: 5,
      comment: 'Smooth move-in',
    });

    expect(result.side).toBe(ReviewerSide.INCOMING_TENANT);
    expect(result.rating).toBe(5);
  });

  it('rejects users who did not participate in the unlock', async () => {
    const { prismaService, service } = create();
    prismaService.unlock.findUnique.mockResolvedValue(baseUnlock);

    await expect(
      service.createReview('stranger', { unlockId: 'unlock_1', rating: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks reviews until both sides confirm', async () => {
    const { prismaService, service } = create();
    prismaService.unlock.findUnique.mockResolvedValue({
      ...baseUnlock,
      confirmations: [{ side: ConfirmationSide.INCOMING_TENANT }],
    });

    await expect(
      service.createReview('buyer_1', { unlockId: 'unlock_1', rating: 4 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses reviews on refunded unlocks', async () => {
    const { prismaService, service } = create();
    prismaService.unlock.findUnique.mockResolvedValue({
      ...baseUnlock,
      isRefunded: true,
    });

    await expect(
      service.createReview('buyer_1', { unlockId: 'unlock_1', rating: 4 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns NOT_FOUND when the unlock does not exist', async () => {
    const { prismaService, service } = create();
    prismaService.unlock.findUnique.mockResolvedValue(null);

    await expect(
      service.createReview('buyer_1', { unlockId: 'missing', rating: 4 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps unique-constraint failures to a 409 conflict', async () => {
    const { prismaService, service } = create();
    prismaService.unlock.findUnique.mockResolvedValue(baseUnlock);
    prismaService.unlockReview.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'x',
      }),
    );

    await expect(
      service.createReview('buyer_1', { unlockId: 'unlock_1', rating: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
