import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConfirmationSide,
  DisputeStatus as PrismaDisputeStatus,
  Prisma,
  Role,
} from '@prisma/client';
import {
  CreateDisputeRequest,
  CreateDisputeResponse,
  DisputeRecord,
  ResolveDisputeRequest,
  DisputeStatus as ContractDisputeStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { ConfirmationService } from '../confirmation/confirmation.service';
import { UnlockService } from '../unlock/unlock.service';

@Injectable()
export class DisputeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly unlockService: UnlockService,
    private readonly confirmationService: ConfirmationService,
  ) {}

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

  async investigateDispute(adminId: string, disputeId: string): Promise<DisputeRecord> {
    const dispute = await this.prismaService.dispute.findUnique({
      where: {
        id: disputeId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: 'DISPUTE_NOT_FOUND',
        message: 'Dispute was not found',
      });
    }

    if (
      dispute.status !== PrismaDisputeStatus.OPEN &&
      dispute.status !== PrismaDisputeStatus.INVESTIGATING
    ) {
      throw new ConflictException({
        code: 'DISPUTE_NOT_OPEN',
        message: 'Only open disputes can move into investigation',
      });
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.dispute.update({
        where: {
          id: disputeId,
        },
        data: {
          status: PrismaDisputeStatus.INVESTIGATING,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'dispute.investigate',
          entityType: 'Dispute',
          entityId: disputeId,
        },
      });
    });

    return this.getDispute(adminId, Role.ADMIN, disputeId);
  }

  async resolveDispute(
    adminId: string,
    disputeId: string,
    input: ResolveDisputeRequest,
  ): Promise<DisputeRecord> {
    const dispute = await this.prismaService.dispute.findUnique({
      where: {
        id: disputeId,
      },
      select: {
        id: true,
        unlockId: true,
        status: true,
        unlock: {
          select: {
            id: true,
            isRefunded: true,
            confirmations: {
              select: {
                side: true,
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

    if (
      dispute.status !== PrismaDisputeStatus.OPEN &&
      dispute.status !== PrismaDisputeStatus.INVESTIGATING
    ) {
      throw new ConflictException({
        code: 'DISPUTE_NOT_OPEN',
        message: 'Only open disputes can be resolved',
      });
    }

    if (input.action === 'FULL_REFUND') {
      await this.unlockService.refundUnlockById(dispute.unlock.id, input.resolution.trim());
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.dispute.update({
        where: {
          id: disputeId,
        },
        data: {
          status: PrismaDisputeStatus.RESOLVED,
          resolution: input.resolution.trim(),
          resolvedAt: new Date(),
          resolvedBy: adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'dispute.resolve',
          entityType: 'Dispute',
          entityId: disputeId,
          metadata: {
            action: input.action,
            unlockId: dispute.unlockId,
          },
        },
      });
    });

    const hasBothConfirmations =
      dispute.unlock.confirmations.some(
        (confirmation) => confirmation.side === ConfirmationSide.INCOMING_TENANT,
      ) &&
      dispute.unlock.confirmations.some(
        (confirmation) => confirmation.side === ConfirmationSide.OUTGOING_TENANT,
      );

    if (input.action === 'NO_REFUND' && hasBothConfirmations && !dispute.unlock.isRefunded) {
      await this.confirmationService.ensureCommissionForUnlock(dispute.unlock.id);
    }

    return this.getDispute(adminId, Role.ADMIN, disputeId);
  }

  async closeDispute(adminId: string, disputeId: string): Promise<DisputeRecord> {
    const dispute = await this.prismaService.dispute.findUnique({
      where: {
        id: disputeId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: 'DISPUTE_NOT_FOUND',
        message: 'Dispute was not found',
      });
    }

    if (
      dispute.status !== PrismaDisputeStatus.RESOLVED &&
      dispute.status !== PrismaDisputeStatus.CLOSED
    ) {
      throw new ConflictException({
        code: 'DISPUTE_NOT_RESOLVED',
        message: 'Only resolved disputes can be closed',
      });
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.dispute.update({
        where: {
          id: disputeId,
        },
        data: {
          status: PrismaDisputeStatus.CLOSED,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'dispute.close',
          entityType: 'Dispute',
          entityId: disputeId,
        },
      });
    });

    return this.getDispute(adminId, Role.ADMIN, disputeId);
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
