/**
 * Purpose: Listing lifecycle orchestration: create/update with two-part
 * pricing snapshots (spec v1.1 section 4.3) and landlord-awareness
 * attestation (spec v1.2 section 5), browse/details, moderation.
 * Why important: listings are the supply side; pricing snapshots taken here
 * must never be recomputed for existing holds or pending fees.
 * Used by: ListingController, AdminListingsController, ListingSeedService.
 */
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
  ConfirmationSide,
  DisputeStatus,
  ListingHouseType as PrismaListingHouseType,
  ListingStatus,
  PosterRole as PrismaPosterRole,
  Prisma,
  Role,
} from '@prisma/client';
import {
  AdminPendingListingsResponse,
  CreateListingRequest,
  CreateListingResponse,
  ListingHouseType as ContractListingHouseType,
  ListingDetails,
  ListingFilters,
  ListingStatus as ContractListingStatus,
  ModerateListingResponse,
  MyListing,
  MyListingsFilters,
  PaginatedListingsResponse,
  PaginatedMyListingsResponse,
  PosterRole as ContractPosterRole,
  RejectListingRequest,
  UpdateListingRequest,
  UpdateListingResponse,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { decryptField, encryptField } from '../../common/security/encryption.util';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { UserService } from '../user/user.service';
import {
  assertPhotoGpsMatchesListing,
  assertStoredPhotoGpsMatchesListing,
} from './domain/listing-geo.util';
import {
  computeSuccessFeeKes,
  posterShareKes,
  resolveUnlockCredits,
} from './domain/pricing.policy';
import { ListingCacheService } from './listing-cache.service';
import { ListingMediaResolver } from './persistence/listing-media.resolver';
import { SystemConfigService } from '../system-config/system-config.service';

const FIRST_LISTINGS_REVIEW_THRESHOLD = 3;
const PUBLIC_MAP_COORDINATE_DECIMALS = 2;
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
    private readonly listingMediaResolver: ListingMediaResolver,
    private readonly systemConfig: SystemConfigService,
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
    this.assertLandlordAware(input.landlordAware);
    await this.assertListingAccountIsEligible(userId);
    assertPhotoGpsMatchesListing(input.latitude, input.longitude, input.photos);

    if (input.seededFromConfirmationId) {
      await this.assertSeedConfirmationUsable(userId, input.seededFromConfirmationId);
    }

    const media = await this.listingMediaResolver.resolveMediaAssets(
      userId,
      input.photos,
      input.video,
    );
    const existingListingCount = await this.prismaService.listing.count({
      where: {
        userId,
      },
    });
    const requiresReview = existingListingCount < FIRST_LISTINGS_REVIEW_THRESHOLD;
    const pricingConfig = await this.systemConfig.resolvePricingConfig();
    const unlockCostCredits = resolveUnlockCredits(
      input.houseType as unknown as PrismaListingHouseType,
      pricingConfig,
    );
    const successFeeKes = computeSuccessFeeKes(input.monthlyRent, pricingConfig);
    const commission = posterShareKes(successFeeKes, pricingConfig);
    const now = new Date();

    let listing;
    try {
      listing = await this.prismaService.listing.create({
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
          houseType: input.houseType as unknown as PrismaListingHouseType,
          isApproved: !requiresReview,
          landlordAware: input.landlordAware,
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
          posterRole: (input.posterRole ??
            ContractPosterRole.OUTGOING_TENANT) as unknown as PrismaPosterRole,
          propertyNotes: input.propertyNotes?.trim(),
          propertyType: input.propertyType.trim(),
          seededFromConfirmationId: input.seededFromConfirmationId ?? null,
          status: requiresReview ? ListingStatus.PENDING : ListingStatus.ACTIVE,
          successFeeKes,
          thumbnailUrl: media.photoByKey.get(input.photos[0].s3Key)?.cdnUrl,
          unlockCostCredits,
          userId,
          videoUrl: media.video?.cdnUrl ?? null,
        },
        select: {
          id: true,
          status: true,
          unlockCostCredits: true,
          commission: true,
          successFeeKes: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'SEEDED_LISTING_EXISTS',
          message: 'A listing was already created from this move-in confirmation',
        });
      }

      throw error;
    }

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
      successFeeKes: listing.successFeeKes,
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
        houseType: listing.houseType as unknown as ContractListingHouseType,
        propertyType: listing.propertyType,
        furnished: listing.furnished,
        availableFrom: listing.availableFrom.toISOString(),
        unlockCostCredits: listing.unlockCostCredits,
        successFeeKes: listing.successFeeKes,
        landlordAware: listing.landlordAware,
        posterRole: listing.posterRole as unknown as ContractPosterRole,
        thumbnailUrl: listing.thumbnailUrl ?? undefined,
        viewCount: listing.viewCount,
        unlockCount: listing.unlockCount,
        isUnlocked: unlockedListingIds.has(listing.id),
        createdAt: listing.createdAt.toISOString(),
        mapLocation: this.buildMapLocation(listing.latitude, listing.longitude),
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
      houseType: listing.houseType as unknown as ContractListingHouseType,
      propertyType: listing.propertyType,
      furnished: listing.furnished,
      availableFrom: listing.availableFrom.toISOString(),
      unlockCostCredits: listing.unlockCostCredits,
      successFeeKes: listing.successFeeKes,
      landlordAware: listing.landlordAware,
      posterRole: listing.posterRole as unknown as ContractPosterRole,
      thumbnailUrl: listing.thumbnailUrl ?? undefined,
      viewCount: listing.viewCount,
      unlockCount: listing.unlockCount,
      isUnlocked: canViewContactInfo,
      createdAt: listing.createdAt.toISOString(),
      mapLocation: this.buildMapLocation(listing.latitude, listing.longitude),
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
            phoneNumber: listing.user.phoneNumberEncrypted
              ? this.userService.decryptPhoneNumber(listing.user.phoneNumberEncrypted)
              : null,
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
              id: true,
              commission: {
                select: {
                  amountKES: true,
                  status: true,
                  eligibleAt: true,
                  paidAt: true,
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
      const commissions: MyListing['commissions'] = [];

      for (const unlock of listing.unlocks) {
        if (!unlock.commission) {
          continue;
        }

        commissions.push({
          unlockId: unlock.id,
          amountKES: unlock.commission.amountKES,
          status: unlock.commission.status as unknown as MyListing['commissions'][number]['status'],
          eligibleAt: unlock.commission.eligibleAt?.toISOString() ?? null,
          paidAt: unlock.commission.paidAt?.toISOString() ?? null,
        });

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
        commissions,
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
      assertPhotoGpsMatchesListing(effectiveLatitude, effectiveLongitude, input.photos);
    }

    const photoMedia = input.photos
      ? await this.listingMediaResolver.resolvePhotoAssets(userId, input.photos)
      : null;
    const videoMedia = input.video
      ? await this.listingMediaResolver.resolveVideoAsset(userId, input.video)
      : null;
    const pricingConfig = await this.systemConfig.resolvePricingConfig();
    const unlockCostCredits =
      input.houseType !== undefined
        ? resolveUnlockCredits(
            input.houseType as unknown as PrismaListingHouseType,
            pricingConfig,
          )
        : listing.unlockCostCredits;
    const successFeeKes =
      input.monthlyRent !== undefined
        ? computeSuccessFeeKes(input.monthlyRent, pricingConfig)
        : listing.successFeeKes;
    const commission =
      input.monthlyRent !== undefined
        ? posterShareKes(successFeeKes, pricingConfig)
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
        houseType:
          input.houseType !== undefined
            ? (input.houseType as unknown as PrismaListingHouseType)
            : undefined,
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
        successFeeKes,
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
    await this.prismaService.$transaction(async (db) => {
      const lockedListing = await this.lockListingRow(db, listingId);

      if (!lockedListing) {
        throw new NotFoundException({
          code: 'LISTING_NOT_FOUND',
          message: 'Listing was not found',
        });
      }

      const listing = await db.listing.findFirst({
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

      const blockingUnlockCount = await db.unlock.count({
        where: {
          listingId: listing.id,
          isRefunded: false,
          OR: [
            {
              dispute: {
                is: {
                  status: {
                    in: [DisputeStatus.OPEN, DisputeStatus.INVESTIGATING],
                  },
                },
              },
            },
            {
              NOT: {
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
              },
            },
          ],
        },
      });

      if (blockingUnlockCount > 0) {
        throw new ConflictException({
          code: 'CANNOT_DELETE_LISTING_WITH_UNLOCKS',
          message: 'Cannot delete a listing with unresolved unlock activity',
        });
      }

      await db.listing.update({
        where: {
          id: listing.id,
        },
        data: {
          deletedAt: new Date(),
          isDeleted: true,
          status: ListingStatus.DELETED,
        },
      });
    });

    await this.listingCacheService.invalidateListing(listingId);
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
        houseType: listing.houseType as unknown as ContractListingHouseType,
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

    assertStoredPhotoGpsMatchesListing(listing.latitude, listing.longitude, listing.photos);

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

  private assertLandlordAware(landlordAware: boolean) {
    if (landlordAware === true) {
      return;
    }

    throw new BadRequestException({
      code: 'LANDLORD_AWARENESS_REQUIRED',
      message:
        'You must confirm the landlord or caretaker knows this unit is being listed',
    });
  }

  private async assertSeedConfirmationUsable(userId: string, confirmationId: string) {
    const confirmation = await this.prismaService.confirmation.findUnique({
      where: {
        id: confirmationId,
      },
      select: {
        userId: true,
        side: true,
      },
    });

    if (
      !confirmation ||
      confirmation.userId !== userId ||
      confirmation.side !== ConfirmationSide.INCOMING_TENANT
    ) {
      throw new BadRequestException({
        code: 'INVALID_SEED_CONFIRMATION',
        message: 'The referenced move-in confirmation does not belong to you',
      });
    }
  }

  private buildMapLocation(latitude: number, longitude: number) {
    return {
      approxLatitude: this.roundCoordinate(latitude, PUBLIC_MAP_COORDINATE_DECIMALS),
      approxLongitude: this.roundCoordinate(longitude, PUBLIC_MAP_COORDINATE_DECIMALS),
    };
  }

  private roundCoordinate(value: number, decimals: number) {
    const precision = 10 ** decimals;

    return Math.round(value * precision) / precision;
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
      houseType: PrismaListingHouseType;
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
      houseType: listing.houseType,
      neighborhood: listing.neighborhood,
      monthlyRent: listing.monthlyRent,
      unlockCostCredits: listing.unlockCostCredits,
      commission: listing.commission,
      previousStatus: listing.status,
      nextStatus,
      reason: reason ?? null,
    };
  }

  private async sendListingNotification(phoneNumberEncrypted: string | null, message: string) {
    if (!phoneNumberEncrypted) {
      return;
    }
    try {
      const phoneNumber = this.userService.decryptPhoneNumber(phoneNumberEncrypted);
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }

  private safeDecryptPhoneNumberForAdmin(phoneNumberEncrypted: string | null) {
    if (!phoneNumberEncrypted) {
      return 'Unavailable';
    }
    try {
      return this.userService.decryptPhoneNumber(phoneNumberEncrypted);
    } catch {
      return 'Unavailable';
    }
  }
}
