import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  ListingStatus,
  Prisma,
  Role,
  UploadMediaType,
} from '@prisma/client';
import {
  AdminPendingListingsResponse,
  CreateListingRequest,
  CreateListingResponse,
  ListingDetails,
  ListingFilters,
  ListingStatus as ContractListingStatus,
  ModerateListingResponse,
  MyListing,
  MyListingsFilters,
  PaginatedListingsResponse,
  PaginatedMyListingsResponse,
  RejectListingRequest,
  UpdateListingRequest,
  UpdateListingResponse,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { decryptField, encryptField } from '../../common/security/encryption.util';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { UserService } from '../user/user.service';
import { ListingCacheService } from './listing-cache.service';

const GPS_MATCH_THRESHOLD_METERS = 100;
const FIRST_LISTINGS_REVIEW_THRESHOLD = 3;
const VISIBLE_LISTING_STATUSES = [
  ListingStatus.ACTIVE,
  ListingStatus.UNLOCKED,
  ListingStatus.CONFIRMED,
] as const;

type Viewer = {
  id: string;
  role: Role;
} | undefined;

@Injectable()
export class ListingService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly listingCacheService: ListingCacheService,
    private readonly smsService: SmsService,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.get<string>('security.encryptionKey') ?? '';
  }

  async createListing(
    userId: string,
    deviceType: string | undefined,
    input: CreateListingRequest,
  ): Promise<CreateListingResponse> {
    this.assertMobileDevice(deviceType);
    await this.assertListingAccountIsEligible(userId);
    this.assertPhotoGpsMatchesListing(input.latitude, input.longitude, input.photos);

    const media = await this.resolveMediaAssets(userId, input.photos, input.video);
    const existingListingCount = await this.prismaService.listing.count({
      where: {
        userId,
      },
    });
    const requiresReview = existingListingCount < FIRST_LISTINGS_REVIEW_THRESHOLD;
    const unlockCostCredits = this.calculateUnlockCost(input.monthlyRent);
    const commission = this.calculateCommission(unlockCostCredits);
    const now = new Date();

    const listing = await this.prismaService.listing.create({
      data: {
        addressEncrypted: encryptField(input.address.trim(), this.encryptionKey),
        amenities: input.amenities.map((amenity) => amenity.trim()),
        approvedAt: requiresReview ? null : now,
        availableFrom: new Date(input.availableFrom),
        availableTo: input.availableTo ? new Date(input.availableTo) : null,
        bathrooms: input.bathrooms,
        bedrooms: input.bedrooms,
        commission,
        county: input.county.trim(),
        description: input.description.trim(),
        furnished: input.furnished ?? false,
        isApproved: !requiresReview,
        latitude: input.latitude,
        longitude: input.longitude,
        monthlyRent: input.monthlyRent,
        neighborhood: input.neighborhood.trim(),
        photos: {
          create: input.photos
            .sort((left, right) => left.order - right.order)
            .map((photo) => {
              const uploadedPhoto = media.photoByKey.get(photo.s3Key)!;

              return {
                height: photo.height,
                latitude: photo.latitude,
                longitude: photo.longitude,
                order: photo.order,
                s3Key: photo.s3Key,
                takenAt: photo.takenAt ? new Date(photo.takenAt) : null,
                url: uploadedPhoto.cdnUrl,
                width: photo.width,
              };
            }),
        },
        propertyNotes: input.propertyNotes?.trim(),
        propertyType: input.propertyType.trim(),
        status: requiresReview ? ListingStatus.PENDING : ListingStatus.ACTIVE,
        thumbnailUrl: media.photoByKey.get(input.photos[0].s3Key)?.cdnUrl,
        unlockCostCredits,
        userId,
        videoUrl: media.video.cdnUrl,
      },
      select: {
        id: true,
        status: true,
        unlockCostCredits: true,
        commission: true,
      },
    });

    if (!requiresReview) {
      await this.listingCacheService.invalidateListing(listing.id);
    }

    return {
      id: listing.id,
      status: listing.status as unknown as ContractListingStatus,
      message: requiresReview
        ? 'Listing created. Awaiting admin review (first 3 listings).'
        : 'Listing created and is now live.',
      unlockCostCredits: listing.unlockCostCredits,
      commission: listing.commission,
      estimatedApprovalTime: requiresReview ? '24 hours' : undefined,
    };
  }

  async browseListings(
    filters: ListingFilters,
    viewer?: Viewer,
  ): Promise<PaginatedListingsResponse> {
    const viewerKey = this.getViewerCacheKey(viewer);
    const cached = await this.listingCacheService.getBrowse<PaginatedListingsResponse>(
      viewerKey,
      filters,
    );

    if (cached) {
      return cached;
    }

    const where = this.buildBrowseWhere(filters);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'desc';

    const [total, listings] = await this.prismaService.$transaction([
      this.prismaService.listing.count({ where }),
      this.prismaService.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              firstName: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const unlockedListingIds = await this.getUnlockedListingIds(
      viewer?.id,
      listings.map((listing) => listing.id),
    );

    const response: PaginatedListingsResponse = {
      data: listings.map((listing) => ({
        id: listing.id,
        county: listing.county,
        neighborhood: listing.neighborhood,
        monthlyRent: listing.monthlyRent,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        propertyType: listing.propertyType,
        furnished: listing.furnished,
        availableFrom: listing.availableFrom.toISOString(),
        unlockCostCredits: listing.unlockCostCredits,
        thumbnailUrl: listing.thumbnailUrl ?? undefined,
        viewCount: listing.viewCount,
        unlockCount: listing.unlockCount,
        isUnlocked: unlockedListingIds.has(listing.id),
        createdAt: listing.createdAt.toISOString(),
        tenant: {
          firstName: listing.user.firstName,
          joinedDate: listing.user.createdAt.toISOString(),
        },
      })),
      pagination: this.buildPagination(total, page, limit),
    };

    await this.listingCacheService.setBrowse(viewerKey, filters, response);

    return response;
  }

  async getListingDetails(
    listingId: string,
    viewer?: Viewer,
  ): Promise<ListingDetails> {
    const viewerKey = this.getViewerCacheKey(viewer);
    const cached = await this.listingCacheService.getDetails<ListingDetails>(listingId, viewerKey);

    if (cached) {
      return cached;
    }

    const listing = await this.prismaService.listing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
      },
      include: {
        photos: {
          orderBy: {
            order: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            createdAt: true,
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

    const viewerCanSeeHiddenListing =
      viewer?.role === Role.ADMIN || listing.userId === viewer?.id;
    const listingIsVisible =
      listing.isApproved &&
      VISIBLE_LISTING_STATUSES.includes(listing.status as (typeof VISIBLE_LISTING_STATUSES)[number]);

    if (!viewerCanSeeHiddenListing && !listingIsVisible) {
      throw new NotFoundException({
        code: 'LISTING_NOT_FOUND',
        message: 'Listing was not found',
      });
    }

    const hasUnlock =
      viewer && !viewerCanSeeHiddenListing
        ? await this.prismaService.unlock.findUnique({
            where: {
              listingId_buyerId: {
                listingId,
                buyerId: viewer.id,
              },
            },
            select: {
              id: true,
              isRefunded: true,
            },
          })
        : null;
    const listingsPosted = await this.prismaService.listing.count({
      where: {
        userId: listing.userId,
      },
    });

    const canViewContactInfo = viewerCanSeeHiddenListing || Boolean(hasUnlock && !hasUnlock.isRefunded);
    const response: ListingDetails = {
      id: listing.id,
      county: listing.county,
      neighborhood: listing.neighborhood,
      monthlyRent: listing.monthlyRent,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      propertyType: listing.propertyType,
      furnished: listing.furnished,
      availableFrom: listing.availableFrom.toISOString(),
      unlockCostCredits: listing.unlockCostCredits,
      thumbnailUrl: listing.thumbnailUrl ?? undefined,
      viewCount: listing.viewCount,
      unlockCount: listing.unlockCount,
      isUnlocked: canViewContactInfo,
      createdAt: listing.createdAt.toISOString(),
      description: listing.description,
      amenities: listing.amenities,
      propertyNotes: listing.propertyNotes ?? undefined,
      availableTo: listing.availableTo?.toISOString() ?? undefined,
      photos: listing.photos.map((photo) => ({
        url: photo.url,
        order: photo.order,
        width: photo.width ?? undefined,
        height: photo.height ?? undefined,
      })),
      video: listing.videoUrl
        ? {
            url: listing.videoUrl,
          }
        : undefined,
      tenant: {
        firstName: listing.user.firstName,
        joinedDate: listing.user.createdAt.toISOString(),
        listingsPosted,
      },
      contactInfo: canViewContactInfo
        ? {
            address: decryptField(listing.addressEncrypted, this.encryptionKey),
            phoneNumber: this.userService.decryptPhoneNumber(listing.user.phoneNumberEncrypted),
            latitude: listing.latitude,
            longitude: listing.longitude,
          }
        : undefined,
    };

    await this.listingCacheService.setDetails(listingId, viewerKey, response);

    return response;
  }

  async getMyListings(
    userId: string,
    filters: MyListingsFilters,
  ): Promise<PaginatedMyListingsResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.ListingWhereInput = {
      userId,
    };

    if (filters.status) {
      where.status = filters.status as unknown as ListingStatus;
    }

    const [total, listings] = await this.prismaService.$transaction([
      this.prismaService.listing.count({ where }),
      this.prismaService.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          status: true,
          monthlyRent: true,
          neighborhood: true,
          viewCount: true,
          unlockCount: true,
          createdAt: true,
          unlocks: {
            select: {
              commission: {
                select: {
                  amountKES: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const data: MyListing[] = listings.map((listing) => {
      let totalEarnings = 0;
      let pendingEarnings = 0;

      for (const unlock of listing.unlocks) {
        if (!unlock.commission) {
          continue;
        }

        if (unlock.commission.status === CommissionStatus.PAID) {
          totalEarnings += unlock.commission.amountKES;
          continue;
        }

        if (
          unlock.commission.status !== CommissionStatus.CANCELLED &&
          unlock.commission.status !== CommissionStatus.FAILED
        ) {
          pendingEarnings += unlock.commission.amountKES;
        }
      }

      return {
        id: listing.id,
        status: listing.status as unknown as ContractListingStatus,
        monthlyRent: listing.monthlyRent,
        neighborhood: listing.neighborhood,
        viewCount: listing.viewCount,
        unlockCount: listing.unlockCount,
        totalEarnings,
        pendingEarnings,
        createdAt: listing.createdAt.toISOString(),
      };
    });

    return {
      data,
      pagination: this.buildPagination(total, page, limit),
    };
  }

  async updateListing(
    userId: string,
    listingId: string,
    input: UpdateListingRequest,
  ): Promise<UpdateListingResponse> {
    const listing = await this.prismaService.listing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
      },
      include: {
        photos: {
          orderBy: {
            order: 'asc',
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

    if (listing.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not own this listing',
      });
    }

    const requestedFields = Object.keys(input).filter(
      (field) => input[field as keyof UpdateListingRequest] !== undefined,
    );

    if (requestedFields.length === 0) {
      return {
        id: listing.id,
        message: 'Listing updated successfully',
        updatedAt: listing.updatedAt.toISOString(),
      };
    }

    if (listing.unlockCount > 0) {
      const allowedFields = new Set<keyof UpdateListingRequest>([
        'description',
        'propertyNotes',
        'availableTo',
      ]);
      const forbiddenFields = requestedFields.filter(
        (field) => !allowedFields.has(field as keyof UpdateListingRequest),
      );

      if (forbiddenFields.length > 0) {
        throw new ForbiddenException({
          code: 'LISTING_LOCKED_AFTER_UNLOCK',
          message: `Cannot update ${forbiddenFields.join(', ')} after the listing has been unlocked`,
        });
      }
    }

    if (
      (input.latitude !== undefined || input.longitude !== undefined) &&
      input.photos === undefined
    ) {
      throw new BadRequestException({
        code: 'PHOTOS_REQUIRED_FOR_GPS_CHANGE',
        message: 'Updated listing coordinates require a fresh photo set for GPS validation',
      });
    }

    const effectiveLatitude = input.latitude ?? listing.latitude;
    const effectiveLongitude = input.longitude ?? listing.longitude;

    if (input.photos) {
      this.assertPhotoGpsMatchesListing(effectiveLatitude, effectiveLongitude, input.photos);
    }

    const photoMedia = input.photos
      ? await this.resolvePhotoAssets(userId, input.photos)
      : null;
    const videoMedia = input.video ? await this.resolveVideoAsset(userId, input.video) : null;
    const unlockCostCredits =
      input.monthlyRent !== undefined
        ? this.calculateUnlockCost(input.monthlyRent)
        : listing.unlockCostCredits;
    const commission =
      input.monthlyRent !== undefined
        ? this.calculateCommission(unlockCostCredits)
        : listing.commission;

    const updatedListing = await this.prismaService.listing.update({
      where: {
        id: listing.id,
      },
      data: {
        addressEncrypted:
          input.address !== undefined
            ? encryptField(input.address.trim(), this.encryptionKey)
            : undefined,
        amenities: input.amenities?.map((amenity) => amenity.trim()),
        availableFrom:
          input.availableFrom !== undefined ? new Date(input.availableFrom) : undefined,
        availableTo:
          input.availableTo !== undefined
            ? input.availableTo
              ? new Date(input.availableTo)
              : null
            : undefined,
        bathrooms: input.bathrooms,
        bedrooms: input.bedrooms,
        commission,
        county: input.county?.trim(),
        description: input.description?.trim(),
        furnished: input.furnished,
        isApproved:
          listing.status === ListingStatus.REJECTED && requestedFields.length > 0
            ? false
            : undefined,
        latitude: input.latitude,
        longitude: input.longitude,
        monthlyRent: input.monthlyRent,
        neighborhood: input.neighborhood?.trim(),
        photos: input.photos
          ? {
              deleteMany: {},
              create: input.photos
                .sort((left, right) => left.order - right.order)
                .map((photo) => {
                  const uploadedPhoto = photoMedia!.get(photo.s3Key)!;

                  return {
                    height: photo.height,
                    latitude: photo.latitude,
                    longitude: photo.longitude,
                    order: photo.order,
                    s3Key: photo.s3Key,
                    takenAt: photo.takenAt ? new Date(photo.takenAt) : null,
                    url: uploadedPhoto.cdnUrl,
                    width: photo.width,
                  };
                }),
            }
          : undefined,
        propertyNotes:
          input.propertyNotes !== undefined ? input.propertyNotes?.trim() : undefined,
        propertyType: input.propertyType?.trim(),
        rejectionReason:
          listing.status === ListingStatus.REJECTED && requestedFields.length > 0
            ? null
            : undefined,
        status:
          listing.status === ListingStatus.REJECTED && requestedFields.length > 0
            ? ListingStatus.PENDING
            : undefined,
        thumbnailUrl: input.photos
          ? photoMedia?.get(input.photos[0].s3Key)?.cdnUrl
          : undefined,
        unlockCostCredits,
        videoUrl: input.video ? videoMedia?.cdnUrl : undefined,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    await this.listingCacheService.invalidateListing(listing.id);

    return {
      id: updatedListing.id,
      message: 'Listing updated successfully',
      updatedAt: updatedListing.updatedAt.toISOString(),
    };
  }

  async softDeleteListing(userId: string, listingId: string) {
    const listing = await this.prismaService.listing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!listing) {
      throw new NotFoundException({
        code: 'LISTING_NOT_FOUND',
        message: 'Listing was not found',
      });
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not own this listing',
      });
    }

    const activeUnlockCount = await this.prismaService.unlock.count({
      where: {
        listingId: listing.id,
        isRefunded: false,
      },
    });

    if (activeUnlockCount > 0) {
      throw new ConflictException({
        code: 'CANNOT_DELETE_LISTING_WITH_UNLOCKS',
        message: 'Cannot delete a listing that has already been unlocked',
      });
    }

    await this.prismaService.listing.update({
      where: {
        id: listing.id,
      },
      data: {
        deletedAt: new Date(),
        isDeleted: true,
        status: ListingStatus.DELETED,
      },
    });

    await this.listingCacheService.invalidateListing(listing.id);
  }

  async getPendingListings(): Promise<AdminPendingListingsResponse> {
    const listings = await this.prismaService.listing.findMany({
      where: {
        isDeleted: false,
        isApproved: false,
        status: ListingStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        photos: {
          orderBy: {
            order: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            phoneNumberEncrypted: true,
          },
        },
      },
    });
    const listingCounts = await this.prismaService.listing.groupBy({
      by: ['userId'],
      where: {
        userId: {
          in: [...new Set(listings.map((listing) => listing.userId))],
        },
      },
      _count: {
        _all: true,
      },
    });
    const listingCountByUserId = new Map(
      listingCounts.map((entry) => [entry.userId, entry._count._all]),
    );

    return {
      data: listings.map((listing) => ({
        id: listing.id,
        tenant: {
          id: listing.user.id,
          firstName: listing.user.firstName,
          phoneNumber: this.safeDecryptPhoneNumberForAdmin(listing.user.phoneNumberEncrypted),
          listingsPosted: listingCountByUserId.get(listing.userId) ?? 0,
        },
        county: listing.county,
        neighborhood: listing.neighborhood,
        monthlyRent: listing.monthlyRent,
        photos: listing.photos.map((photo) => ({
          url: photo.url,
          order: photo.order,
          width: photo.width ?? undefined,
          height: photo.height ?? undefined,
        })),
        createdAt: listing.createdAt.toISOString(),
        daysWaiting: Math.max(
          0,
          Math.floor((Date.now() - listing.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
        ),
      })),
    };
  }

  async approveListing(adminId: string, listingId: string): Promise<ModerateListingResponse> {
    const listing = await this.prismaService.listing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
      },
      include: {
        photos: true,
        user: {
          select: {
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

    if (listing.status !== ListingStatus.PENDING) {
      throw new ConflictException({
        code: 'LISTING_NOT_PENDING',
        message: 'Only pending listings can be approved',
      });
    }

    this.assertStoredPhotoGpsMatchesListing(listing.latitude, listing.longitude, listing.photos);

    const updatedListing = await this.prismaService.$transaction(async (tx) => {
      const approvedListing = await tx.listing.update({
        where: {
          id: listing.id,
        },
        data: {
          approvedAt: new Date(),
          approvedBy: adminId,
          isApproved: true,
          rejectionReason: null,
          status: ListingStatus.ACTIVE,
        },
        select: {
          id: true,
          status: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'listing.approve',
          entityType: 'Listing',
          entityId: listing.id,
          oldValue: this.buildModerationStateSnapshot(listing),
          newValue: this.buildModerationStateSnapshot({
            ...listing,
            approvedAt: new Date(),
            isApproved: true,
            rejectionReason: null,
            status: ListingStatus.ACTIVE,
          }),
          metadata: this.buildModerationAuditMetadata(
            listing,
            ListingStatus.ACTIVE,
            'approved',
          ),
        },
      });

      return approvedListing;
    });

    await this.listingCacheService.invalidateListing(listing.id);
    await this.sendListingNotification(
      listing.user.phoneNumberEncrypted,
      'Your listing has been approved and is now live on PataSpace.',
    );

    return {
      id: updatedListing.id,
      status: updatedListing.status as unknown as ContractListingStatus,
      message: 'Listing approved and now visible to all users',
    };
  }

  async rejectListing(
    adminId: string,
    listingId: string,
    input: RejectListingRequest,
  ): Promise<ModerateListingResponse> {
    const listing = await this.prismaService.listing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
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

    if (listing.status !== ListingStatus.PENDING) {
      throw new ConflictException({
        code: 'LISTING_NOT_PENDING',
        message: 'Only pending listings can be rejected',
      });
    }

    const updatedListing = await this.prismaService.$transaction(async (tx) => {
      const rejectedListing = await tx.listing.update({
        where: {
          id: listing.id,
        },
        data: {
          approvedAt: null,
          approvedBy: adminId,
          isApproved: false,
          rejectionReason: input.reason.trim(),
          status: ListingStatus.REJECTED,
        },
        select: {
          id: true,
          status: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'listing.reject',
          entityType: 'Listing',
          entityId: listing.id,
          oldValue: this.buildModerationStateSnapshot(listing),
          newValue: this.buildModerationStateSnapshot({
            ...listing,
            approvedAt: null,
            isApproved: false,
            rejectionReason: input.reason.trim(),
            status: ListingStatus.REJECTED,
          }),
          metadata: this.buildModerationAuditMetadata(
            listing,
            ListingStatus.REJECTED,
            'rejected',
            input.reason.trim(),
          ),
        },
      });

      return rejectedListing;
    });

    await this.listingCacheService.invalidateListing(listing.id);
    await this.sendListingNotification(
      listing.user.phoneNumberEncrypted,
      `Your listing was rejected: ${input.reason.trim()}`,
    );

    return {
      id: updatedListing.id,
      status: updatedListing.status as unknown as ContractListingStatus,
      message: 'Listing rejected. User notified via SMS.',
    };
  }

  private buildBrowseWhere(filters: ListingFilters): Prisma.ListingWhereInput {
    const neighborhoods = [
      ...(filters.neighborhood ? [filters.neighborhood] : []),
      ...(filters.neighborhoods ?? []),
    ];
    const where: Prisma.ListingWhereInput = {
      isDeleted: false,
      isApproved: true,
      status: {
        in: [...VISIBLE_LISTING_STATUSES],
      },
    };

    if (filters.county) {
      where.county = filters.county;
    }

    if (neighborhoods.length > 0) {
      where.neighborhood = {
        in: neighborhoods,
      };
    }

    if (filters.minRent !== undefined || filters.maxRent !== undefined) {
      where.monthlyRent = {
        gte: filters.minRent,
        lte: filters.maxRent,
      };
    }

    if (filters.bedrooms !== undefined) {
      where.bedrooms = filters.bedrooms;
    }

    if (filters.bathrooms !== undefined) {
      where.bathrooms = filters.bathrooms;
    }

    if (filters.furnished !== undefined) {
      where.furnished = filters.furnished;
    }

    if (filters.availableFrom || filters.availableTo) {
      where.AND = [
        filters.availableTo
          ? {
              availableFrom: {
                lte: new Date(filters.availableTo),
              },
            }
          : {},
        filters.availableFrom
          ? {
              OR: [
                {
                  availableTo: null,
                },
                {
                  availableTo: {
                    gte: new Date(filters.availableFrom),
                  },
                },
              ],
            }
          : {},
      ];
    }

    return where;
  }

  private async assertListingAccountIsEligible(userId: string) {
    const user = await this.userService.findStoredById(userId);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User profile was not found',
      });
    }

    if (!user.phoneVerified) {
      throw new ForbiddenException({
        code: 'PHONE_NOT_VERIFIED',
        message: 'Verify your phone number before creating a listing',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: user.banReason ?? 'Account is banned',
      });
    }
  }

  private assertMobileDevice(deviceType: string | undefined) {
    if (deviceType?.toLowerCase() === 'mobile') {
      return;
    }

    throw new BadRequestException({
      code: 'MOBILE_DEVICE_REQUIRED',
      message: 'Listing creation is only available from a mobile device',
    });
  }

  private async resolveMediaAssets(
    userId: string,
    photos: CreateListingRequest['photos'],
    video: CreateListingRequest['video'],
  ) {
    const photoByKey = await this.resolvePhotoAssets(userId, photos);
    const resolvedVideo = await this.resolveVideoAsset(userId, video);

    return {
      photoByKey,
      video: resolvedVideo,
    };
  }

  private async resolvePhotoAssets(userId: string, photos: Array<{ s3Key: string; url: string }>) {
    const keys = photos.map((photo) => photo.s3Key);
    const uniqueKeys = new Set(keys);

    if (uniqueKeys.size !== keys.length) {
      throw new BadRequestException({
        code: 'INVALID_MEDIA_SELECTION',
        message: 'Each listing photo must reference a unique uploaded asset',
      });
    }

    const uploads = await this.prismaService.uploadedAsset.findMany({
      where: {
        storageKey: {
          in: keys,
        },
      },
    });
    const uploadMap = new Map(uploads.map((upload) => [upload.storageKey, upload]));

    for (const photo of photos) {
      const upload = uploadMap.get(photo.s3Key);

      this.assertUploadUsable(userId, photo.s3Key, photo.url, upload, UploadMediaType.IMAGE);
    }

    return uploadMap;
  }

  private async resolveVideoAsset(userId: string, video: { s3Key: string; url: string }) {
    const upload = await this.prismaService.uploadedAsset.findUnique({
      where: {
        storageKey: video.s3Key,
      },
    });

    this.assertUploadUsable(userId, video.s3Key, video.url, upload, UploadMediaType.VIDEO);

    return upload!;
  }

  private assertUploadUsable(
    userId: string,
    storageKey: string,
    inputUrl: string,
    upload:
      | {
          userId: string;
          storageKey: string;
          mediaType: UploadMediaType;
          confirmedAt: Date | null;
          url: string;
          cdnUrl: string;
        }
      | null
      | undefined,
    expectedMediaType: UploadMediaType,
  ) {
    if (!upload || upload.userId !== userId || !storageKey.startsWith(`listings/${userId}/`)) {
      throw new BadRequestException({
        code: 'INVALID_MEDIA_SELECTION',
        message: 'One or more uploaded assets do not belong to the current user',
      });
    }

    if (!upload.confirmedAt) {
      throw new BadRequestException({
        code: 'UPLOAD_NOT_CONFIRMED',
        message: 'All media must be confirmed before attaching them to a listing',
      });
    }

    if (upload.mediaType !== expectedMediaType) {
      throw new BadRequestException({
        code: 'INVALID_MEDIA_SELECTION',
        message: 'Uploaded media type does not match the requested listing field',
      });
    }

    if (inputUrl !== upload.url && inputUrl !== upload.cdnUrl) {
      throw new BadRequestException({
        code: 'INVALID_MEDIA_SELECTION',
        message: 'Uploaded media URL does not match the confirmed asset',
      });
    }
  }

  private assertPhotoGpsMatchesListing(
    listingLatitude: number,
    listingLongitude: number,
    photos: Array<{ latitude: number; longitude: number; s3Key: string }>,
  ) {
    photos.forEach((photo) => {
      const distanceMeters = this.calculateDistanceMeters(
        listingLatitude,
        listingLongitude,
        photo.latitude,
        photo.longitude,
      );

      if (distanceMeters <= GPS_MATCH_THRESHOLD_METERS) {
        return;
      }

      throw new BadRequestException({
        code: 'GPS_MISMATCH',
        message: 'Photo GPS coordinates must match the listing coordinates within 100 meters',
        details: {
          distanceMeters: Math.round(distanceMeters),
          s3Key: photo.s3Key,
        },
      });
    });
  }

  private assertStoredPhotoGpsMatchesListing(
    listingLatitude: number,
    listingLongitude: number,
    photos: Array<{ latitude: number | null; longitude: number | null; s3Key: string }>,
  ) {
    photos.forEach((photo) => {
      if (photo.latitude === null || photo.longitude === null) {
        throw new BadRequestException({
          code: 'GPS_MISMATCH',
          message: 'All listing photos must include GPS metadata before approval',
          details: {
            s3Key: photo.s3Key,
          },
        });
      }

      const distanceMeters = this.calculateDistanceMeters(
        listingLatitude,
        listingLongitude,
        photo.latitude,
        photo.longitude,
      );

      if (distanceMeters <= GPS_MATCH_THRESHOLD_METERS) {
        return;
      }

      throw new BadRequestException({
        code: 'GPS_MISMATCH',
        message: 'Photo GPS coordinates must match the listing coordinates within 100 meters',
        details: {
          distanceMeters: Math.round(distanceMeters),
          s3Key: photo.s3Key,
        },
      });
    });
  }

  private calculateDistanceMeters(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number,
  ) {
    const earthRadiusMeters = 6_371_000;
    const latitudeDelta = this.toRadians(latitude2 - latitude1);
    const longitudeDelta = this.toRadians(longitude2 - longitude1);
    const latitude1Radians = this.toRadians(latitude1);
    const latitude2Radians = this.toRadians(latitude2);

    const a =
      Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
      Math.cos(latitude1Radians) *
        Math.cos(latitude2Radians) *
        Math.sin(longitudeDelta / 2) *
        Math.sin(longitudeDelta / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMeters * c;
  }

  private toRadians(value: number) {
    return (value * Math.PI) / 180;
  }

  private calculateUnlockCost(monthlyRent: number) {
    return Math.round(monthlyRent * 0.1);
  }

  private calculateCommission(unlockCostCredits: number) {
    return Math.round(unlockCostCredits * 0.3);
  }

  private buildPagination(total: number, page: number, limit: number) {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: totalPages > 0 && page < totalPages,
      hasPrev: page > 1 && totalPages > 0,
    };
  }

  private async getUnlockedListingIds(userId: string | undefined, listingIds: string[]) {
    if (!userId || listingIds.length === 0) {
      return new Set<string>();
    }

    const unlocks = await this.prismaService.unlock.findMany({
      where: {
        buyerId: userId,
        isRefunded: false,
        listingId: {
          in: listingIds,
        },
      },
      select: {
        listingId: true,
      },
    });

    return new Set(unlocks.map((unlock) => unlock.listingId));
  }

  private getViewerCacheKey(viewer?: Viewer) {
    if (!viewer) {
      return 'anon';
    }

    if (viewer.role === Role.ADMIN) {
      return `admin:${viewer.id}`;
    }

    return viewer.id;
  }

  private buildModerationStateSnapshot(listing: {
    status: ListingStatus;
    isApproved: boolean;
    approvedAt: Date | null;
    rejectionReason: string | null;
  }): Prisma.InputJsonObject {
    return {
      status: listing.status,
      isApproved: listing.isApproved,
      approvedAt: listing.approvedAt?.toISOString() ?? null,
      rejectionReason: listing.rejectionReason ?? null,
    };
  }

  private buildModerationAuditMetadata(
    listing: {
      userId: string;
      county: string;
      neighborhood: string;
      monthlyRent: number;
      unlockCostCredits: number;
      commission: number;
      status: ListingStatus;
    },
    nextStatus: ListingStatus,
    reviewOutcome: 'approved' | 'rejected',
    reason?: string,
  ): Prisma.InputJsonObject {
    return {
      reviewOutcome,
      listingOwnerId: listing.userId,
      county: listing.county,
      neighborhood: listing.neighborhood,
      monthlyRent: listing.monthlyRent,
      unlockCostCredits: listing.unlockCostCredits,
      commission: listing.commission,
      previousStatus: listing.status,
      nextStatus,
      reason: reason ?? null,
    };
  }

  private async sendListingNotification(phoneNumberEncrypted: string, message: string) {
    try {
      const phoneNumber = this.userService.decryptPhoneNumber(phoneNumberEncrypted);
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }

  private safeDecryptPhoneNumberForAdmin(phoneNumberEncrypted: string) {
    try {
      return this.userService.decryptPhoneNumber(phoneNumberEncrypted);
    } catch {
      return 'Unavailable';
    }
  }
}
