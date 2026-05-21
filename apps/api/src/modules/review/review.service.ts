/**
 * Purpose: Application service for unlock reviews — creates ratings for a
 *   participant in a confirmed unlock.
 * Why important: Enforces the integrity invariant that only the buyer or the
 *   outgoing tenant on a confirmed (both-side) unlock can leave a review, and
 *   that each side can review at most once.
 * Used by: ReviewController.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConfirmationSide,
  Prisma,
  ReviewerSide as PrismaReviewerSide,
} from '@prisma/client';
import {
  CreateReviewRequest,
  CreateReviewResponse,
  ReviewRecord,
  ReviewerSide as ContractReviewerSide,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async createReview(
    userId: string,
    input: CreateReviewRequest,
  ): Promise<CreateReviewResponse> {
    const unlock = await this.prismaService.unlock.findUnique({
      where: { id: input.unlockId },
      select: {
        id: true,
        buyerId: true,
        isRefunded: true,
        listing: { select: { userId: true } },
        confirmations: { select: { side: true } },
      },
    });

    if (!unlock) {
      throw new NotFoundException({
        code: 'UNLOCK_NOT_FOUND',
        message: 'Unlock was not found',
      });
    }

    if (unlock.isRefunded) {
      throw new BadRequestException({
        code: 'UNLOCK_REFUNDED',
        message: 'Cannot review a refunded unlock',
      });
    }

    const side =
      unlock.buyerId === userId
        ? PrismaReviewerSide.INCOMING_TENANT
        : unlock.listing.userId === userId
          ? PrismaReviewerSide.OUTGOING_TENANT
          : null;

    if (!side) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You did not participate in this unlock',
      });
    }

    const bothConfirmed =
      unlock.confirmations.some((c) => c.side === ConfirmationSide.INCOMING_TENANT) &&
      unlock.confirmations.some((c) => c.side === ConfirmationSide.OUTGOING_TENANT);

    if (!bothConfirmed) {
      throw new BadRequestException({
        code: 'UNLOCK_NOT_CONFIRMED',
        message: 'Reviews are only available after both parties confirm the unlock',
      });
    }

    try {
      const review = await this.prismaService.unlockReview.create({
        data: {
          unlockId: unlock.id,
          reviewerId: userId,
          side,
          rating: input.rating,
          comment: input.comment?.trim() || null,
        },
      });

      return this.toRecord(review);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'REVIEW_ALREADY_EXISTS',
          message: 'You have already left a review for this unlock',
        });
      }
      throw error;
    }
  }

  private toRecord(review: {
    id: string;
    unlockId: string;
    side: PrismaReviewerSide;
    rating: number;
    comment: string | null;
    createdAt: Date;
  }): ReviewRecord {
    return {
      id: review.id,
      unlockId: review.unlockId,
      side: review.side as unknown as ContractReviewerSide,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
