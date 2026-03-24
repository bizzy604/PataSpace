import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommissionStatus as PrismaCommissionStatus,
  ConfirmationSide as PrismaConfirmationSide,
  DisputeStatus as PrismaDisputeStatus,
  Prisma,
} from '@prisma/client';
import {
  CommissionStatus as ContractCommissionStatus,
  ConfirmationSide as ContractConfirmationSide,
  CreateConfirmationRequest,
  CreateConfirmationResponse,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { UserService } from '../user/user.service';

const COMMISSION_WAIT_DAYS = 7;
const BLOCKING_DISPUTE_STATUSES = new Set<PrismaDisputeStatus>([
  PrismaDisputeStatus.OPEN,
  PrismaDisputeStatus.INVESTIGATING,
]);

type UnlockForConfirmation = Prisma.UnlockGetPayload<{
  select: {
    id: true;
    buyerId: true;
    isRefunded: true;
    refundReason: true;
    refundedAt: true;
    listing: {
      select: {
        userId: true;
        neighborhood: true;
        commission: true;
        user: {
          select: {
            phoneNumberEncrypted: true;
          };
        };
      };
    };
    buyer: {
      select: {
        phoneNumberEncrypted: true;
      };
    };
    confirmations: {
      select: {
        side: true;
      };
    };
    dispute: {
      select: {
        status: true;
      };
    };
  };
}>;

@Injectable()
export class ConfirmationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
  ) {}

  async createConfirmation(
    userId: string,
    input: CreateConfirmationRequest,
  ): Promise<CreateConfirmationResponse> {
    const unlock = await this.getUnlockOrThrow(input.unlockId);
    this.assertConfirmationAllowed(unlock, userId, input.side);

    const confirmation = await this.createConfirmationRecord(unlock.id, userId, input.side);
    await this.ensureCommissionIfEligible(unlock.id);

    const currentState = await this.prismaService.unlock.findUniqueOrThrow({
      where: {
        id: unlock.id,
      },
      select: {
        confirmations: {
          select: {
            side: true,
          },
        },
        commission: {
          select: {
            amountKES: true,
            status: true,
            eligibleAt: true,
          },
        },
      },
    });

    const bothConfirmed = currentState.confirmations.length >= 2;

    await this.sendConfirmationNotifications(unlock, input.side, currentState.commission);

    return {
      confirmationId: confirmation.id,
      unlockId: confirmation.unlockId,
      side: confirmation.side as unknown as ContractConfirmationSide,
      confirmedAt: confirmation.confirmedAt.toISOString(),
      bothConfirmed,
      commission: currentState.commission
        ? {
            amount: currentState.commission.amountKES,
            status: currentState.commission.status as unknown as ContractCommissionStatus,
            payableOn: currentState.commission.eligibleAt.toISOString(),
          }
        : undefined,
      message: this.buildResponseMessage(input.side, currentState.commission?.eligibleAt ?? null),
    };
  }

  private async createConfirmationRecord(
    unlockId: string,
    userId: string,
    side: ContractConfirmationSide,
  ) {
    try {
      return await this.prismaService.confirmation.create({
        data: {
          unlockId,
          userId,
          side: side as unknown as PrismaConfirmationSide,
        },
        select: {
          id: true,
          unlockId: true,
          side: true,
          confirmedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw this.alreadyConfirmedError();
      }

      throw error;
    }
  }

  private async ensureCommissionIfEligible(unlockId: string) {
    const unlock = await this.prismaService.unlock.findUnique({
      where: {
        id: unlockId,
      },
      select: {
        id: true,
        isRefunded: true,
        listing: {
          select: {
            userId: true,
            commission: true,
          },
        },
        confirmations: {
          select: {
            side: true,
          },
        },
        dispute: {
          select: {
            status: true,
          },
        },
      },
    });

    if (
      !unlock ||
      unlock.isRefunded ||
      unlock.confirmations.length < 2 ||
      (unlock.dispute && BLOCKING_DISPUTE_STATUSES.has(unlock.dispute.status))
    ) {
      return null;
    }

    return this.prismaService.commission.upsert({
      where: {
        unlockId,
      },
      update: {},
      create: {
        unlockId,
        outgoingTenantId: unlock.listing.userId,
        amountKES: unlock.listing.commission,
        status: PrismaCommissionStatus.PENDING,
        eligibleAt: new Date(
          Date.now() + COMMISSION_WAIT_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
      select: {
        amountKES: true,
        status: true,
        eligibleAt: true,
      },
    });
  }

  private async getUnlockOrThrow(unlockId: string): Promise<UnlockForConfirmation> {
    const unlock = await this.prismaService.unlock.findUnique({
      where: {
        id: unlockId,
      },
      select: {
        id: true,
        buyerId: true,
        isRefunded: true,
        refundReason: true,
        refundedAt: true,
        listing: {
          select: {
            userId: true,
            neighborhood: true,
            commission: true,
            user: {
              select: {
                phoneNumberEncrypted: true,
              },
            },
          },
        },
        buyer: {
          select: {
            phoneNumberEncrypted: true,
          },
        },
        confirmations: {
          select: {
            side: true,
          },
        },
        dispute: {
          select: {
            status: true,
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

    return unlock;
  }

  private assertConfirmationAllowed(
    unlock: UnlockForConfirmation,
    userId: string,
    side: ContractConfirmationSide,
  ) {
    if (unlock.isRefunded) {
      throw new GoneException({
        code: 'UNLOCK_REFUNDED',
        message:
          unlock.refundReason ??
          'This unlock was refunded because the listing is no longer available',
        details: {
          refundedAt: unlock.refundedAt?.toISOString() ?? null,
        },
      });
    }

    if (unlock.dispute && BLOCKING_DISPUTE_STATUSES.has(unlock.dispute.status)) {
      throw new ConflictException({
        code: 'DISPUTE_OPEN',
        message: 'This unlock has an open dispute and cannot be confirmed',
      });
    }

    if (unlock.confirmations.some((confirmation) => confirmation.side === side)) {
      throw this.alreadyConfirmedError();
    }

    const isAuthorized =
      side === ContractConfirmationSide.INCOMING_TENANT
        ? unlock.buyerId === userId
        : unlock.listing.userId === userId;

    if (!isAuthorized) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Not authorized to confirm this unlock',
      });
    }
  }

  private alreadyConfirmedError() {
    return new BadRequestException({
      code: 'ALREADY_CONFIRMED',
      message: 'This side has already confirmed the unlock',
    });
  }

  private buildResponseMessage(
    side: ContractConfirmationSide,
    payableOn: Date | null,
  ) {
    if (payableOn) {
      return `Both parties confirmed! Commission will be paid on ${payableOn
        .toISOString()
        .slice(0, 10)}.`;
    }

    return side === ContractConfirmationSide.INCOMING_TENANT
      ? 'Waiting for outgoing tenant to confirm.'
      : 'Waiting for incoming tenant to confirm.';
  }

  private async sendConfirmationNotifications(
    unlock: UnlockForConfirmation,
    side: ContractConfirmationSide,
    commission: { amountKES: number; eligibleAt: Date } | null,
  ) {
    const buyerPhoneNumber = this.userService.decryptPhoneNumber(
      unlock.buyer.phoneNumberEncrypted,
    );
    const outgoingTenantPhoneNumber = this.userService.decryptPhoneNumber(
      unlock.listing.user.phoneNumberEncrypted,
    );

    if (commission) {
      await Promise.all([
        this.sendSmsQuietly(
          buyerPhoneNumber,
          `Connection confirmed on PataSpace for ${unlock.listing.neighborhood}.`,
        ),
        this.sendSmsQuietly(
          outgoingTenantPhoneNumber,
          `Connection confirmed on PataSpace. Your ${commission.amountKES} KES commission is scheduled for ${commission.eligibleAt
            .toISOString()
            .slice(0, 10)}.`,
        ),
      ]);

      return;
    }

    if (side === ContractConfirmationSide.INCOMING_TENANT) {
      await this.sendSmsQuietly(
        outgoingTenantPhoneNumber,
        `Incoming tenant confirmed the unlock for your ${unlock.listing.neighborhood} listing. Please confirm on PataSpace.`,
      );
      return;
    }

    await this.sendSmsQuietly(
      buyerPhoneNumber,
      `Outgoing tenant confirmed the unlock for ${unlock.listing.neighborhood}. Please confirm on PataSpace.`,
    );
  }

  private async sendSmsQuietly(phoneNumber: string, message: string) {
    try {
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }
}
