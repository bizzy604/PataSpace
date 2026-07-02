/**
 * Purpose: Admin listing CRUD — full-catalogue browsing, content edits, and
 *   soft deletion, each with audit logging and listing-cache invalidation.
 * Why important: Admin edits write straight to live marketplace data that
 *   tenants browse from cache; skipping invalidation or the audit trail here
 *   would serve stale listings and erase accountability.
 * Used by: AdminListingsController (modules/admin). Moderation (approve/
 *   reject) stays in ListingService; this service owns everything else.
 */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import {
  AdminDeleteListingRequest,
  AdminListingsResponse,
  AdminUpdateListingRequest,
  ModerateListingResponse,
  ListingStatus as ContractListingStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';
import { ListingCacheService } from '../../listing/listing-cache.service';
import {
  AdminListingsQuery,
  buildListingsWhere,
  buildListingUpdateData,
  toListingSummary,
} from './admin-listing.mapper';

@Injectable()
export class AdminListingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly listingCacheService: ListingCacheService,
  ) {}

  async listListings(query: AdminListingsQuery): Promise<AdminListingsResponse> {
    const where = buildListingsWhere(query);
    const [total, listings] = await Promise.all([
      this.prismaService.listing.count({ where }),
      this.prismaService.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      data: listings.map(toListingSummary),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async updateListing(
    adminId: string,
    listingId: string,
    input: AdminUpdateListingRequest,
  ): Promise<ModerateListingResponse> {
    const listing = await this.getListingOrThrow(listingId);

    if (listing.isDeleted) {
      throw new ConflictException({
        code: 'LISTING_DELETED',
        message: 'Deleted listings cannot be edited',
      });
    }

    const data = buildListingUpdateData(input);
    const updated = await this.prismaService.$transaction(async (tx) => {
      const row = await tx.listing.update({
        where: { id: listingId },
        data,
        select: { id: true, status: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'listing.admin_update',
          entityType: 'Listing',
          entityId: listingId,
          oldValue: this.pickFields(listing, Object.keys(data)),
          newValue: data,
        },
      });

      return row;
    });

    await this.listingCacheService.invalidateListing(listingId);

    return {
      id: updated.id,
      status: updated.status as unknown as ContractListingStatus,
      message: 'Listing updated',
    };
  }

  async deleteListing(
    adminId: string,
    listingId: string,
    input: AdminDeleteListingRequest,
  ): Promise<ModerateListingResponse> {
    const listing = await this.getListingOrThrow(listingId);

    if (listing.isDeleted) {
      throw new ConflictException({
        code: 'LISTING_DELETED',
        message: 'This listing is already deleted',
      });
    }

    const deleted = await this.prismaService.$transaction(async (tx) => {
      const row = await tx.listing.update({
        where: { id: listingId },
        data: { isDeleted: true, status: ListingStatus.DELETED },
        select: { id: true, status: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'listing.admin_delete',
          entityType: 'Listing',
          entityId: listingId,
          oldValue: { isDeleted: false, status: listing.status },
          newValue: { isDeleted: true, status: ListingStatus.DELETED },
          metadata: input.reason ? { reason: input.reason } : undefined,
        },
      });

      return row;
    });

    await this.listingCacheService.invalidateListing(listingId);

    return {
      id: deleted.id,
      status: deleted.status as unknown as ContractListingStatus,
      message: 'Listing removed from the marketplace',
    };
  }

  private async getListingOrThrow(listingId: string) {
    const listing = await this.prismaService.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException({
        code: 'LISTING_NOT_FOUND',
        message: 'Listing was not found',
      });
    }

    return listing;
  }

  private pickFields(source: Record<string, unknown>, keys: string[]) {
    return Object.fromEntries(
      keys.map((key) => [key, source[key] instanceof Date ? (source[key] as Date).toISOString() : source[key]]),
    );
  }
}
