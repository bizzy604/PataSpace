/**
 * Purpose: Seeker-initiated report-dead flow with reason codes (spec v1.2
 * section 4.2): validates the reporter, refunds instantly, and records the
 * dead reason for the refund-share metrics.
 * Why important: landlord_declined is a market-structure signal, not poster
 * fraud; distinguishing reasons at the source is what makes the pilot metric
 * (landlord_declined share of refunds) trustworthy.
 * Used by: UnlockController (POST /unlocks/:id/report-dead).
 */
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UnlockDeadReason as PrismaUnlockDeadReason } from '@prisma/client';
import {
  ReportUnlockDeadRequest,
  ReportUnlockDeadResponse,
  UnlockDeadReason as ContractUnlockDeadReason,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { CreditService } from '../credit/credit.service';
import { UnlockRefundService } from './unlock-refund.service';

const DEAD_REASON_LABELS: Record<ContractUnlockDeadReason, string> = {
  [ContractUnlockDeadReason.OCCUPIED]: 'House already occupied',
  [ContractUnlockDeadReason.FAKE]: 'Listing reported as fake',
  [ContractUnlockDeadReason.UNRESPONSIVE]: 'Poster unresponsive',
  [ContractUnlockDeadReason.LANDLORD_DECLINED]: 'Landlord declined the move-in',
};

@Injectable()
export class ReportDeadService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    private readonly unlockRefundService: UnlockRefundService,
  ) {}

  async reportDead(
    userId: string,
    unlockId: string,
    input: ReportUnlockDeadRequest,
  ): Promise<ReportUnlockDeadResponse> {
    const unlock = await this.prismaService.unlock.findUnique({
      where: {
        id: unlockId,
      },
      select: {
        id: true,
        buyerId: true,
        creditsSpent: true,
        isRefunded: true,
        confirmations: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!unlock) {
      throw new NotFoundException({
        code: 'UNLOCK_NOT_FOUND',
        message: 'Unlock was not found',
      });
    }

    if (unlock.buyerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only the seeker who unlocked this listing can report it dead',
      });
    }

    if (unlock.isRefunded) {
      throw new GoneException({
        code: 'UNLOCK_REFUNDED',
        message: 'This unlock was already refunded',
      });
    }

    if (unlock.confirmations.some((confirmation) => confirmation.userId === userId)) {
      throw new ConflictException({
        code: 'ALREADY_CONFIRMED',
        message: 'You already confirmed this move-in; open a dispute instead',
      });
    }

    await this.unlockRefundService.refundUnlock(unlock.id, DEAD_REASON_LABELS[input.reason], {
      deadReason: input.reason as unknown as PrismaUnlockDeadReason,
      comment: input.comment,
    });

    const newBalance = await this.creditService.getCurrentBalanceValue(userId);

    return {
      unlockId: unlock.id,
      reason: input.reason,
      creditsRefunded: unlock.creditsSpent,
      newBalance,
      message: 'Credits refunded instantly. Thanks for keeping listings honest.',
    };
  }
}
