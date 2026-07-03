/**
 * Purpose: Unlock purchase flow: charges banded unlock credits, reveals the
 * gated contact payload (masked virtual number when the contact layer is
 * enabled, spec v1.2 section 4.5), and lists unlock history.
 * Why important: this is the paywall moment; money moves before contact is
 * revealed, and raw numbers must not leak once masking is provisioned.
 * Used by: UnlockController; refunds live in UnlockRefundService.
 */
import {
  ForbiddenException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConfirmationSide,
  DisputeStatus,
  ListingStatus,
  Prisma,
  SuccessFeeStatus,
} from '@prisma/client';
import {
  CreateUnlockRequest,
  CreateUnlockResponse,
  DisputeStatus as ContractDisputeStatus,
  MyUnlockRecord,
  MyUnlocksFilters,
  PaginatedMyUnlocksResponse,
  UnlockHistoryStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { decryptField } from '../../common/security/encryption.util';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { CreditService } from '../credit/credit.service';
import { ListingCacheService } from '../listing/listing-cache.service';
import { ProxySessionService, ProxySessionSummary } from './contact/proxy-session.service';

type CreateUnlockResult = {
  created: boolean;
  payload: CreateUnlockResponse;
};

type UnlockWithRelations = Prisma.UnlockGetPayload<{
  include: {
    confirmations: {
      select: {
        confirmedAt: true;
        side: true;
      };
    };
    creditTransaction: {
      select: {
        id: true;
        metadata: true;
        status: true;
      };
    };
    listing: {
      select: {
        id: true;
        addressEncrypted: true;
        latitude: true;
        longitude: true;
        monthlyRent: true;
        bedrooms: true;
        neighborhood: true;
        userId: true;
        user: {
          select: {
            firstName: true;
            lastName: true;
            phoneNumberEncrypted: true;
          };
        };
      };
    };
  };
}>;

type UnlockConfirmation = UnlockWithRelations['confirmations'][number];

const UNLOCKABLE_LISTING_STATUSES = [
  ListingStatus.ACTIVE,
  ListingStatus.UNLOCKED,
  ListingStatus.CONFIRMED,
] as const;
const ACTIVE_DISPUTE_STATUSES: DisputeStatus[] = [
  DisputeStatus.OPEN,
  DisputeStatus.INVESTIGATING,
];

@Injectable()
export class UnlockService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    private readonly listingCacheService: ListingCacheService,
    private readonly smsService: SmsService,
    private readonly proxySessionService: ProxySessionService,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.get<string>('security.encryptionKey') ?? '';
  }

  async createUnlock(userId: string, input: CreateUnlockRequest): Promise<CreateUnlockResult> {
    const existingUnlock = await this.findUnlock(input.listingId, userId);

    if (existingUnlock) {
      if (existingUnlock.isRefunded) {
        throw new GoneException({
          code: 'UNLOCK_REFUNDED',
          message:
            existingUnlock.refundReason ??
            'This unlock was refunded because the listing is no longer available',
          details: {
            refundedAt: existingUnlock.refundedAt?.toISOString() ?? null,
          },
        });
      }

      const currentBalance = await this.creditService.getCurrentBalanceValue(userId);
      const proxySession = await this.proxySessionService.getActiveForUnlock(existingUnlock.id);

      return {
        created: false,
        payload: this.toCreateUnlockResponse(
          existingUnlock,
          currentBalance,
          'Listing already unlocked. Existing contact information returned without charging credits again.',
          proxySession,
        ),
      };
    }

    const listing = await this.prismaService.listing.findFirst({
      where: {
        id: input.listingId,
      },
      select: {
        id: true,
        userId: true,
        addressEncrypted: true,
        latitude: true,
        longitude: true,
        neighborhood: true,
        unlockCostCredits: true,
        isApproved: true,
        isDeleted: true,
        status: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumberEncrypted: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException({
        code: 'LISTING_NOT_FOUND',
        message: 'Listing was not found',
      });
    }

    if (listing.userId === userId) {
      throw new ForbiddenException({
        code: 'CANNOT_UNLOCK_OWN_LISTING',
        message: 'You cannot unlock your own listing',
      });
    }

    await this.assertNoUnsettledSuccessFee(userId);

    if (
      listing.isDeleted ||
      !listing.isApproved ||
      !UNLOCKABLE_LISTING_STATUSES.includes(
        listing.status as (typeof UNLOCKABLE_LISTING_STATUSES)[number],
      )
    ) {
      throw new HttpException(
        {
          code: 'LISTING_UNAVAILABLE',
          message: 'Listing is no longer available for unlock',
        },
        HttpStatus.GONE,
      );
    }

    let result: CreateUnlockResult;
    let notificationPhoneNumber: string | null = null;
    let notificationNeighborhood: string | null = null;

    try {
      result = await this.prismaService.$transaction(async (db) => {
        await this.lockListingRow(db, input.listingId);
        const lockedListing = await db.listing.findFirst({
          where: {
            id: input.listingId,
            isDeleted: false,
            isApproved: true,
            status: {
              in: [...UNLOCKABLE_LISTING_STATUSES],
            },
          },
          select: {
            id: true,
            userId: true,
            addressEncrypted: true,
            latitude: true,
            longitude: true,
            neighborhood: true,
            unlockCostCredits: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumberEncrypted: true,
              },
            },
          },
        });

        if (!lockedListing) {
          throw new HttpException(
            {
              code: 'LISTING_UNAVAILABLE',
              message: 'Listing is no longer available for unlock',
            },
            HttpStatus.GONE,
          );
        }

        if (lockedListing.userId === userId) {
          throw new ForbiddenException({
            code: 'CANNOT_UNLOCK_OWN_LISTING',
            message: 'You cannot unlock your own listing',
          });
        }

        const concurrentUnlock = await this.findUnlock(input.listingId, userId, db);

        if (concurrentUnlock) {
          if (concurrentUnlock.isRefunded) {
            throw new GoneException({
              code: 'UNLOCK_REFUNDED',
              message:
                concurrentUnlock.refundReason ??
                'This unlock was refunded because the listing is no longer available',
              details: {
                refundedAt: concurrentUnlock.refundedAt?.toISOString() ?? null,
              },
            });
          }

          const currentBalance = await this.creditService.getCurrentBalanceValue(userId, db);
          const concurrentSession = await this.proxySessionService.getActiveForUnlock(
            concurrentUnlock.id,
          );

          return {
            created: false,
            payload: this.toCreateUnlockResponse(
              concurrentUnlock,
              currentBalance,
              'Listing already unlocked. Existing contact information returned without charging credits again.',
              concurrentSession,
            ),
          };
        }

        const unlock = await db.unlock.create({
          data: {
            buyerId: userId,
            creditsSpent: lockedListing.unlockCostCredits,
            listingId: lockedListing.id,
            revealedAddressEncrypted: lockedListing.addressEncrypted,
            revealedGPS: `${lockedListing.latitude},${lockedListing.longitude}`,
            revealedPhoneEncrypted: lockedListing.user.phoneNumberEncrypted ?? '',
          },
          include: {
            confirmations: {
              select: {
                confirmedAt: true,
                side: true,
              },
            },
            creditTransaction: {
              select: {
                id: true,
                metadata: true,
                status: true,
              },
            },
            listing: {
              select: {
                id: true,
                addressEncrypted: true,
                latitude: true,
                longitude: true,
                monthlyRent: true,
                bedrooms: true,
                neighborhood: true,
                userId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phoneNumberEncrypted: true,
                  },
                },
              },
            },
          },
        });

        const spendResult = await this.creditService.spendCredits(db, {
          userId,
          amount: lockedListing.unlockCostCredits,
          description: `Unlocked listing in ${lockedListing.neighborhood}`,
          unlockId: unlock.id,
          metadata: {
            listingId: lockedListing.id,
          },
        });

        const proxySession = await this.proxySessionService.createForUnlock(db, unlock.id);

        await db.listing.update({
          where: {
            id: lockedListing.id,
          },
          data: {
            unlockCount: {
              increment: 1,
            },
          },
        });

        notificationPhoneNumber = lockedListing.user.phoneNumberEncrypted
          ? this.decrypt(lockedListing.user.phoneNumberEncrypted)
          : null;
        notificationNeighborhood = lockedListing.neighborhood;

        return {
          created: true,
          payload: this.toCreateUnlockResponse(
            unlock,
            spendResult.balanceAfter,
            'Contact unlocked. SMS sent to tenant to notify them.',
            proxySession,
          ),
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const concurrentUnlock = await this.findUnlock(input.listingId, userId);

        if (concurrentUnlock && !concurrentUnlock.isRefunded) {
          const currentBalance = await this.creditService.getCurrentBalanceValue(userId);
          const concurrentSession = await this.proxySessionService.getActiveForUnlock(
            concurrentUnlock.id,
          );

          result = {
            created: false,
            payload: this.toCreateUnlockResponse(
              concurrentUnlock,
              currentBalance,
              'Listing already unlocked. Existing contact information returned without charging credits again.',
              concurrentSession,
            ),
          };
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (result.created) {
      await this.creditService.invalidateBalanceCache(userId);
      await this.listingCacheService.invalidateListing(input.listingId);
      if (notificationPhoneNumber && notificationNeighborhood) {
        await this.sendSmsQuietly(
          notificationPhoneNumber,
          `Someone unlocked your listing in ${notificationNeighborhood} on PataSpace.`,
        );
      }
    }

    return result;
  }

  async getMyUnlocks(
    userId: string,
    filters: MyUnlocksFilters,
  ): Promise<PaginatedMyUnlocksResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.UnlockWhereInput = {
      buyerId: userId,
      ...this.buildStatusWhere(filters.status),
    };

    const [total, unlocks] = await this.prismaService.$transaction([
      this.prismaService.unlock.count({ where }),
      this.prismaService.unlock.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          confirmations: {
            select: {
              confirmedAt: true,
              side: true,
            },
          },
          dispute: {
            select: {
              id: true,
              status: true,
            },
          },
          listing: {
            select: {
              id: true,
              neighborhood: true,
              monthlyRent: true,
              bedrooms: true,
            },
          },
          proxySession: {
            select: {
              virtualMsisdn: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const data: MyUnlockRecord[] = unlocks.map((unlock) => {
      const gps = this.parseGps(unlock.revealedGPS);
      // Once an unlock was created under masking, the raw number never
      // surfaces; expired sessions route callers to the closed prompt.
      const maskedNumber = unlock.proxySession?.virtualMsisdn ?? null;
      const incomingConfirmation = unlock.confirmations.find(
        (confirmation) => confirmation.side === ConfirmationSide.INCOMING_TENANT,
      );
        const outgoingConfirmation = unlock.confirmations.find(
          (confirmation) => confirmation.side === ConfirmationSide.OUTGOING_TENANT,
        );

        return {
        unlockId: unlock.id,
        listing: {
          id: unlock.listing.id,
          neighborhood: unlock.listing.neighborhood,
          monthlyRent: unlock.listing.monthlyRent,
          bedrooms: unlock.listing.bedrooms,
        },
        creditsSpent: unlock.creditsSpent,
        contactInfo: {
          address: this.decrypt(unlock.revealedAddressEncrypted),
          phoneNumber: maskedNumber ?? this.decrypt(unlock.revealedPhoneEncrypted),
          latitude: gps.latitude,
          longitude: gps.longitude,
        },
          status: this.resolveHistoryStatus(
            unlock.isRefunded,
            unlock.dispute?.status,
            incomingConfirmation,
            outgoingConfirmation,
          ),
        myConfirmation: incomingConfirmation?.confirmedAt.toISOString() ?? null,
        tenantConfirmation: outgoingConfirmation?.confirmedAt.toISOString() ?? null,
        createdAt: unlock.createdAt.toISOString(),
        dispute: unlock.dispute
          ? {
              id: unlock.dispute.id,
              status: unlock.dispute.status as unknown as ContractDisputeStatus,
            }
          : null,
      };
    });

    return {
      data,
      pagination: this.buildPagination(total, page, limit),
    };
  }

  private findUnlock(
    listingId: string,
    buyerId: string,
    client: PrismaService | Prisma.TransactionClient = this.prismaService,
  ) {
    return client.unlock.findUnique({
      where: {
        listingId_buyerId: {
          listingId,
          buyerId,
        },
      },
      include: {
        confirmations: {
          select: {
            confirmedAt: true,
            side: true,
          },
        },
        creditTransaction: {
          select: {
            id: true,
            metadata: true,
            status: true,
          },
        },
        listing: {
          select: {
            id: true,
            addressEncrypted: true,
            latitude: true,
            longitude: true,
            monthlyRent: true,
            bedrooms: true,
            neighborhood: true,
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumberEncrypted: true,
              },
            },
          },
        },
      },
    });
  }

  private toCreateUnlockResponse(
    unlock: UnlockWithRelations,
    newBalance: number,
    message: string,
    proxySession: ProxySessionSummary | null,
  ): CreateUnlockResponse {
    const gps = this.parseGps(unlock.revealedGPS);

    if (proxySession) {
      // Masked contact layer: the raw number never leaves the server.
      return {
        unlockId: unlock.id,
        creditsSpent: unlock.creditsSpent,
        newBalance,
        contactInfo: {
          address: this.decrypt(unlock.revealedAddressEncrypted),
          phoneNumber: proxySession.virtualMsisdn,
          latitude: gps.latitude,
          longitude: gps.longitude,
        },
        contactMode: 'masked',
        contactExpiresAt: proxySession.expiresAt.toISOString(),
        tenant: {
          firstName: unlock.listing.user.firstName,
          lastName: unlock.listing.user.lastName,
          phoneNumber: proxySession.virtualMsisdn,
        },
        message,
      };
    }

    return {
      unlockId: unlock.id,
      creditsSpent: unlock.creditsSpent,
      newBalance,
      contactInfo: {
        address: this.decrypt(unlock.revealedAddressEncrypted),
        phoneNumber: this.decrypt(unlock.revealedPhoneEncrypted),
        latitude: gps.latitude,
        longitude: gps.longitude,
      },
      contactMode: 'direct',
      contactExpiresAt: null,
      tenant: {
        firstName: unlock.listing.user.firstName,
        lastName: unlock.listing.user.lastName,
        phoneNumber: unlock.listing.user.phoneNumberEncrypted
          ? this.decrypt(unlock.listing.user.phoneNumberEncrypted)
          : null,
      },
      message,
    };
  }

  private buildStatusWhere(status?: UnlockHistoryStatus): Prisma.UnlockWhereInput {
    if (!status) {
      return {};
    }

    const activeDisputeFilter: Prisma.UnlockWhereInput = {
      dispute: {
        is: {
          status: {
            in: [...ACTIVE_DISPUTE_STATUSES],
          },
        },
      },
    };

    if (status === 'refunded') {
      return {
        isRefunded: true,
      };
    }

    if (status === 'disputed') {
      return {
        isRefunded: false,
        ...activeDisputeFilter,
      };
    }

    const bothConfirmedFilter: Prisma.UnlockWhereInput = {
      AND: [
        {
          confirmations: {
            some: {
              side: ConfirmationSide.INCOMING_TENANT,
            },
          },
        },
        {
          confirmations: {
            some: {
              side: ConfirmationSide.OUTGOING_TENANT,
            },
          },
        },
      ],
    };

    if (status === 'confirmed') {
      return {
        isRefunded: false,
        NOT: activeDisputeFilter,
        ...bothConfirmedFilter,
      };
    }

    return {
      isRefunded: false,
      AND: [
        {
          NOT: bothConfirmedFilter,
        },
        {
          NOT: activeDisputeFilter,
        },
      ],
    };
  }

  private resolveHistoryStatus(
    isRefunded: boolean,
    disputeStatus: DisputeStatus | undefined,
    incomingConfirmation: UnlockConfirmation | undefined,
    outgoingConfirmation: UnlockConfirmation | undefined,
  ): UnlockHistoryStatus {
    if (isRefunded) {
      return 'refunded';
    }

    if (disputeStatus && ACTIVE_DISPUTE_STATUSES.includes(disputeStatus)) {
      return 'disputed';
    }

    if (incomingConfirmation && outgoingConfirmation) {
      return 'confirmed';
    }

    return 'pending_confirmation';
  }

  private buildPagination(total: number, page: number, limit: number) {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: totalPages > 0 && page < totalPages,
      hasPrev: totalPages > 0 && page > 1,
    };
  }

  private parseGps(value: string) {
    const [latitude, longitude] = value.split(',');

    return {
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
    };
  }

  // Account gating (spec section 4.4): a mover with an unpaid success-fee
  // balance cannot open new unlocks until they settle. Queried directly to
  // avoid a module cycle with the confirmation module.
  private async assertNoUnsettledSuccessFee(userId: string) {
    const unsettled = await this.prismaService.successFee.findFirst({
      where: {
        moverId: userId,
        status: {
          in: [SuccessFeeStatus.PENDING, SuccessFeeStatus.PARTIAL],
        },
      },
      select: {
        feeDueKes: true,
        creditsApplied: true,
        cashCollectedKes: true,
        unlockId: true,
      },
    });

    if (!unsettled) {
      return;
    }

    throw new HttpException(
      {
        code: 'SUCCESS_FEE_UNSETTLED',
        message: 'Settle your move-in fee before unlocking new listings',
        details: {
          unlockId: unsettled.unlockId,
          remainingKes: Math.max(
            0,
            unsettled.feeDueKes - unsettled.creditsApplied - unsettled.cashCollectedKes,
          ),
        },
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  private decrypt(value: string) {
    return decryptField(value, this.encryptionKey);
  }

  private async lockListingRow(
    client: PrismaService | Prisma.TransactionClient,
    listingId: string,
  ) {
    const rows = await client.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT "id" FROM "listings" WHERE "id" = ${listingId} FOR UPDATE`,
    );

    return rows[0] ?? null;
  }

  private async sendSmsQuietly(phoneNumber: string, message: string) {
    try {
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }
}
