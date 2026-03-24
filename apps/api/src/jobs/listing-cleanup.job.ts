import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { StorageService } from '../infrastructure/storage/storage.service';

@Injectable()
export class ListingCleanupJob {
  private readonly logger = new Logger(ListingCleanupJob.name);
  private readonly retentionDays = 90;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @Cron('0 3 * * 0')
  async handleListingCleanup() {
    return this.hardDeleteOldListings();
  }

  async hardDeleteOldListings(now = new Date()) {
    const cutoffDate = new Date(now.getTime() - this.retentionDays * 24 * 60 * 60 * 1000);
    const listings = await this.prismaService.listing.findMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lt: cutoffDate,
        },
      },
      include: {
        photos: {
          select: {
            s3Key: true,
          },
        },
      },
      take: 100,
      orderBy: {
        deletedAt: 'asc',
      },
    });

    const summary = {
      candidates: listings.length,
      deleted: 0,
      failed: 0,
    };

    for (const listing of listings) {
      try {
        for (const photo of listing.photos) {
          await this.storageService.deleteObject(photo.s3Key);
        }

        const videoKey = this.extractStorageKeyFromUrl(listing.videoUrl);
        if (videoKey) {
          await this.storageService.deleteObject(videoKey);
        }

        await this.prismaService.$transaction(async (tx) => {
          await tx.listing.delete({
            where: {
              id: listing.id,
            },
          });

          await tx.auditLog.create({
            data: {
              action: 'listing.hard_delete',
              entityType: 'Listing',
              entityId: listing.id,
              metadata: {
                deletedAt: listing.deletedAt?.toISOString() ?? null,
                photoCount: listing.photos.length,
                hadVideo: Boolean(listing.videoUrl),
              } satisfies Prisma.InputJsonObject,
            },
          });
        });

        summary.deleted += 1;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Listing cleanup failed';

        summary.failed += 1;
        this.logger.error(
          JSON.stringify({
            event: 'job.listing-cleanup.failure',
            listingId: listing.id,
            error: errorMessage,
          }),
        );

        await this.prismaService.auditLog.create({
          data: {
            action: 'listing.cleanup_failed',
            entityType: 'Listing',
            entityId: listing.id,
            metadata: {
              deletedAt: listing.deletedAt?.toISOString() ?? null,
              error: errorMessage,
            } satisfies Prisma.InputJsonObject,
          },
        });
      }
    }

    this.logger.log(
      JSON.stringify({
        event: 'job.listing-cleanup.summary',
        ...summary,
        cutoffDate: cutoffDate.toISOString(),
      }),
    );

    return summary;
  }

  private extractStorageKeyFromUrl(videoUrl: string | null) {
    if (!videoUrl) {
      return null;
    }

    try {
      const url = new URL(videoUrl);
      return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    } catch {
      return null;
    }
  }
}
