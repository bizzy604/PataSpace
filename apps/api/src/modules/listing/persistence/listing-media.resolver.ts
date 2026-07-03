/**
 * Purpose: Resolves and validates uploaded media assets referenced by a
 * listing payload: ownership, confirmation, media type, and URL integrity.
 * Why important: enforces the "camera is the only source of listing media"
 * principle at the persistence boundary; unowned or unconfirmed assets are
 * rejected before a listing row exists.
 * Used by: ListingService createListing/updateListing.
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { UploadMediaType } from '@prisma/client';
import { CreateListingRequest } from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';

type UsableUpload = {
  userId: string;
  storageKey: string;
  mediaType: UploadMediaType;
  confirmedAt: Date | null;
  url: string;
  cdnUrl: string;
};

@Injectable()
export class ListingMediaResolver {
  constructor(private readonly prismaService: PrismaService) {}

  async resolveMediaAssets(
    userId: string,
    photos: CreateListingRequest['photos'],
    video: CreateListingRequest['video'],
  ) {
    const photoByKey = await this.resolvePhotoAssets(userId, photos);
    const resolvedVideo = video ? await this.resolveVideoAsset(userId, video) : null;

    return {
      photoByKey,
      video: resolvedVideo,
    };
  }

  async resolvePhotoAssets(userId: string, photos: Array<{ s3Key: string; url: string }>) {
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

  async resolveVideoAsset(userId: string, video: { s3Key: string; url: string }) {
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
    upload: UsableUpload | null | undefined,
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
}
