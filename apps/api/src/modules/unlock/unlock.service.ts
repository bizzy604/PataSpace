import {
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  ConfirmationSide,
  DisputeStatus,
  ListingStatus,
  Prisma,
  TransactionStatus,
} from '@prisma/client';
import {
  CreateUnlockRequest,
  CreateUnlockResponse,
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

      return {
        created: false,
        payload: this.toCreateUnlockResponse(
          existingUnlock,
          currentBalance,
          'Listing already unlocked. Existing contact information returned without charging credits again.',
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

          return {
            created: false,
            payload: this.toCreateUnlockResponse(
              concurrentUnlock,
              currentBalance,
              'Listing already unlocked. Existing contact information returned without charging credits again.',
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
            revealedPhoneEncrypted: lockedListing.user.phoneNumberEncrypted,
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

        notificationPhoneNumber = this.decrypt(lockedListing.user.phoneNumberEncrypted);
        notificationNeighborhood = lockedListing.neighborhood;

        return {
          created: true,
          payload: this.toCreateUnlockResponse(
            unlock,
            spendResult.balanceAfter,
            'Contact unlocked. SMS sent to tenant to notify them.',
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

          result = {
            created: false,
            payload: this.toCreateUnlockResponse(
              concurrentUnlock,
              currentBalance,
              'Listing already unlocked. Existing contact information returned without charging credits again.',
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
        },
      }),
    ]);

    const data: MyUnlockRecord[] = unlocks.map((unlock) => {
      const gps = this.parseGps(unlock.revealedGPS);
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
          phoneNumber: this.decrypt(unlock.revealedPhoneEncrypted),
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
      };
    });

    return {
      data,
      pagination: this.buildPagination(total, page, limit),
    };
  }

  async refundUnlocksForListingInvalidation(listingId: string, reason: string) {
    const unlocks = await this.prismaService.unlock.findMany({
      where: {
        listingId,
        isRefunded: false,
      },
      select: {
        id: true,
      },
    });

    for (const unlock of unlocks) {
      await this.refundUnlock(unlock.id, reason);
    }

    if (unlocks.length > 0) {
      await this.listingCacheService.invalidateListing(listingId);
    }
  }

  async refundUnlockById(unlockId: string, reason: string) {
    await this.refundUnlock(unlockId, reason);
  }

  private async refundUnlock(unlockId: string, reason: string) {
    let buyerId: string | null = null;
    let buyerPhoneNumber: string | null = null;
    let listingId: string | null = null;

    await this.prismaService.$transaction(async (db) => {
      const unlock = await db.unlock.findUnique({
        where: {
          id: unlockId,
        },
        include: {
          creditTransaction: {
            select: {
              id: true,
              metadata: true,
              status: true,
            },
          },
          commission: {
            select: {
              id: true,
              status: true,
            },
          },
          buyer: {
            select: {
              phoneNumberEncrypted: true,
            },
          },
        },
      });

      if (!unlock || unlock.isRefunded) {
        return;
      }

      if (unlock.commission?.status === CommissionStatus.PAID) {
        throw new ConflictException({
          code: 'COMMISSION_ALREADY_PAID',
          message: 'Cannot refund an unlock after the commission has already been paid',
        });
      }

      const refundResult = await this.creditService.refundCredits(db, {
        userId: unlock.buyerId,
        amount: unlock.creditsSpent,
        description: `Refund for invalid listing ${unlock.listingId}`,
        metadata: {
          listingId: unlock.listingId,
          reason,
          unlockId: unlock.id,
        },
      });

      await db.unlock.update({
        where: {
          id: unlock.id,
        },
        data: {
          isRefunded: true,
          refundReason: reason,
          refundedAt: new Date(),
        },
      });

      if (unlock.creditTransaction) {
        await db.creditTransaction.update({
          where: {
            id: unlock.creditTransaction.id,
          },
          data: {
            status: TransactionStatus.REFUNDED,
            metadata: this.mergeMetadata(unlock.creditTransaction.metadata, {
              refundedAt: new Date().toISOString(),
              refundReason: reason,
              refundTransactionId: refundResult.transaction.id,
            }),
          },
        });
      }

      if (
        unlock.commission &&
        unlock.commission.status !== CommissionStatus.CANCELLED
      ) {
        await db.commission.update({
          where: {
            id: unlock.commission.id,
          },
          data: {
            status: CommissionStatus.CANCELLED,
            lastAttemptError: `Cancelled because unlock ${unlock.id} was refunded: ${reason}`,
          },
        });
      }

      buyerId = unlock.buyerId;
      buyerPhoneNumber = this.decrypt(unlock.buyer.phoneNumberEncrypted);
      listingId = unlock.listingId;
    });

    if (!buyerId) {
      return;
    }

    await this.creditService.invalidateBalanceCache(buyerId);

    if (listingId) {
      await this.listingCacheService.invalidateListing(listingId);
    }

    if (buyerPhoneNumber) {
      await this.sendSmsQuietly(
        buyerPhoneNumber,
        `Your unlock has been refunded on PataSpace. Reason: ${reason}`,
      );
    }
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
  ): CreateUnlockResponse {
    const gps = this.parseGps(unlock.revealedGPS);

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
      tenant: {
        firstName: unlock.listing.user.firstName,
        lastName: unlock.listing.user.lastName,
        phoneNumber: this.decrypt(unlock.listing.user.phoneNumberEncrypted),
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

  private mergeMetadata(
    existing: Prisma.JsonValue | null | undefined,
    patch: Record<string, unknown>,
  ): Prisma.InputJsonObject {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Prisma.InputJsonObject)
        : {};

    return {
      ...base,
      ...(patch as Prisma.InputJsonObject),
    };
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
