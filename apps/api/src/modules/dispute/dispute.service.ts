import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DisputeStatus as PrismaDisputeStatus, Prisma, Role } from '@prisma/client';
import {
  CreateDisputeRequest,
  CreateDisputeResponse,
  DisputeRecord,
  DisputeStatus as ContractDisputeStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class DisputeService {
  constructor(private readonly prismaService: PrismaService) {}

  async createDispute(
    userId: string,
    input: CreateDisputeRequest,
  ): Promise<CreateDisputeResponse> {
    const unlock = await this.prismaService.unlock.findUnique({
      where: {
        id: input.unlockId,
      },
      select: {
        id: true,
        buyerId: true,
        listingId: true,
        listing: {
          select: {
            userId: true,
          },
        },
        dispute: {
          select: {
            id: true,
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

    this.assertParticipantAccess(userId, unlock.buyerId, unlock.listing.userId);

    if (unlock.dispute) {
      throw this.alreadyDisputedError();
    }

    try {
      const dispute = await this.prismaService.$transaction(async (tx) => {
        const createdDispute = await tx.dispute.create({
          data: {
            unlockId: unlock.id,
            reportedBy: userId,
            reason: input.reason.trim(),
            evidence: input.evidence ?? [],
            status: PrismaDisputeStatus.OPEN,
          },
          select: {
            id: true,
            status: true,
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'dispute.create',
            entityType: 'Dispute',
            entityId: createdDispute.id,
            metadata: {
              unlockId: unlock.id,
              listingId: unlock.listingId,
              reportedBy: userId,
            },
          },
        });

        return createdDispute;
      });

      return {
        disputeId: dispute.id,
        status: dispute.status as unknown as ContractDisputeStatus,
        message: 'Dispute filed. Admin will review within 24 hours.',
        estimatedResolution: '2-3 business days',
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw this.alreadyDisputedError();
      }

      throw error;
    }
  }

  async getDispute(userId: string, role: Role, disputeId: string): Promise<DisputeRecord> {
    const dispute = await this.prismaService.dispute.findUnique({
      where: {
        id: disputeId,
      },
      select: {
        id: true,
        unlockId: true,
        reportedBy: true,
        reason: true,
        evidence: true,
        status: true,
        resolution: true,
        createdAt: true,
        resolvedAt: true,
        unlock: {
          select: {
            buyerId: true,
            creditsSpent: true,
            isRefunded: true,
            listing: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: 'DISPUTE_NOT_FOUND',
        message: 'Dispute was not found',
      });
    }

    const canAccess =
      role === Role.ADMIN ||
      [dispute.reportedBy, dispute.unlock.buyerId, dispute.unlock.listing.userId].includes(userId);

    if (!canAccess) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You are not allowed to access this dispute',
      });
    }

    return {
      id: dispute.id,
      unlockId: dispute.unlockId,
      status: dispute.status as unknown as ContractDisputeStatus,
      reason: dispute.reason,
      evidence: dispute.evidence,
      resolution: dispute.resolution ?? undefined,
      createdAt: dispute.createdAt.toISOString(),
      resolvedAt: dispute.resolvedAt?.toISOString() ?? undefined,
      refundAmount: dispute.unlock.isRefunded ? dispute.unlock.creditsSpent : undefined,
    };
  }

  private assertParticipantAccess(
    userId: string,
    buyerId: string,
    outgoingTenantId: string,
  ) {
    if (userId !== buyerId && userId !== outgoingTenantId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You are not allowed to create a dispute for this unlock',
      });
    }
  }

  private alreadyDisputedError() {
    return new BadRequestException({
      code: 'DISPUTE_ALREADY_EXISTS',
      message: 'A dispute has already been filed for this unlock',
    });
  }
}
