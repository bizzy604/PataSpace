/**
 * Purpose: Application service for tenant saved listings — add, remove, list.
 * Why important: Backs the "Saved" tab on web and mobile so users can return
 *   to favourites across devices, instead of holding state in local storage.
 * Used by: SavedListingController.
 */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ListingHouseType as ContractListingHouseType,
  ListingCard,
  PaginatedSavedListingsResponse,
  SavedListingRecord,
} from '@pataspace/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

const PUBLIC_MAP_COORDINATE_DECIMALS = 2;

type SavedListingWithListing = Prisma.SavedListingGetPayload<{
  include: {
    listing: {
      include: {
        user: {
          select: {
            firstName: true;
            createdAt: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class SavedListingService {
  constructor(private readonly prismaService: PrismaService) {}

  async saveListing(userId: string, listingId: string): Promise<SavedListingRecord> {
    const listing = await this.prismaService.listing.findFirst({
      where: { id: listingId, isDeleted: false },
      select: { id: true },
    });
    if (!listing) {
      throw new NotFoundException({
        code: 'LISTING_NOT_FOUND',
        message: 'Listing was not found',
      });
    }

    try {
      const saved = await this.prismaService.savedListing.create({
        data: { userId, listingId },
        include: this.includeListing(),
      });
      return this.toRecord(saved, new Set<string>());
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'LISTING_ALREADY_SAVED',
          message: 'Listing is already in your saved list',
        });
      }
      throw error;
    }
  }

  async unsaveListing(userId: string, listingId: string): Promise<void> {
    const result = await this.prismaService.savedListing.deleteMany({
      where: { userId, listingId },
    });
    if (result.count === 0) {
      throw new NotFoundException({
        code: 'SAVED_LISTING_NOT_FOUND',
        message: 'You have not saved that listing',
      });
    }
  }

  async listSavedListings(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedSavedListingsResponse> {
    const skip = (page - 1) * limit;
    const where = { userId } satisfies Prisma.SavedListingWhereInput;

    const [total, saved] = await this.prismaService.$transaction([
      this.prismaService.savedListing.count({ where }),
      this.prismaService.savedListing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.includeListing(),
      }),
    ]);

    const unlockedIds = await this.getUnlockedListingIds(
      userId,
      saved.map((entry) => entry.listingId),
    );

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: saved.map((entry) => this.toRecord(entry, unlockedIds)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: totalPages > 0 && page < totalPages,
        hasPrev: totalPages > 0 && page > 1,
      },
    };
  }

  private includeListing() {
    return {
      listing: {
        include: {
          user: { select: { firstName: true, createdAt: true } },
        },
      },
    } as const;
  }

  private toRecord(
    saved: SavedListingWithListing,
    unlockedIds: Set<string>,
  ): SavedListingRecord {
    const card: ListingCard = {
      id: saved.listing.id,
      county: saved.listing.county,
      neighborhood: saved.listing.neighborhood,
      monthlyRent: saved.listing.monthlyRent,
      bedrooms: saved.listing.bedrooms,
      bathrooms: saved.listing.bathrooms,
      houseType: saved.listing.houseType as unknown as ContractListingHouseType,
      propertyType: saved.listing.propertyType,
      furnished: saved.listing.furnished,
      availableFrom: saved.listing.availableFrom.toISOString(),
      unlockCostCredits: saved.listing.unlockCostCredits,
      thumbnailUrl: saved.listing.thumbnailUrl ?? undefined,
      viewCount: saved.listing.viewCount,
      unlockCount: saved.listing.unlockCount,
      isUnlocked: unlockedIds.has(saved.listing.id),
      createdAt: saved.listing.createdAt.toISOString(),
      mapLocation: {
        approxLatitude: this.roundCoordinate(saved.listing.latitude),
        approxLongitude: this.roundCoordinate(saved.listing.longitude),
      },
      tenant: {
        firstName: saved.listing.user.firstName,
        joinedDate: saved.listing.user.createdAt.toISOString(),
      },
    };

    return {
      id: saved.id,
      listing: card,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  private roundCoordinate(value: number): number {
    const precision = 10 ** PUBLIC_MAP_COORDINATE_DECIMALS;
    return Math.round(value * precision) / precision;
  }

  private async getUnlockedListingIds(userId: string, listingIds: string[]) {
    if (listingIds.length === 0) {
      return new Set<string>();
    }
    const unlocks = await this.prismaService.unlock.findMany({
      where: {
        buyerId: userId,
        isRefunded: false,
        listingId: { in: listingIds },
      },
      select: { listingId: true },
    });
    return new Set(unlocks.map((unlock) => unlock.listingId));
  }
}
