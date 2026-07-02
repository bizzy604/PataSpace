import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadMediaType } from '@prisma/client';
import {
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  CreateUploadUrlRequest,
  CreateUploadUrlResponse,
} from '@pataspace/contracts';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';

const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png']);
const VIDEO_CONTENT_TYPES = new Set(['video/mp4']);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

@Injectable()
export class UploadService {
  private readonly cdnBaseUrl: string;
  private readonly publicBaseUrl: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    configService: ConfigService,
  ) {
    this.cdnBaseUrl =
      configService.get<string>('infrastructure.storage.cdnBaseUrl') ??
      'http://localhost:3000/sandbox-storage';
    this.publicBaseUrl =
      configService.get<string>('infrastructure.storage.publicBaseUrl') ??
      'http://localhost:3000/sandbox-storage';
  }

  async createPresignedUrl(
    userId: string,
    input: CreateUploadUrlRequest,
  ): Promise<CreateUploadUrlResponse> {
    const mediaType = this.resolveMediaType(input.contentType, input.fileSize);
    const sanitizedFilename = this.sanitizeFilename(input.filename);
    const folder = mediaType === UploadMediaType.IMAGE ? 'images' : 'videos';
    const storageKey = `listings/${userId}/${folder}/${Date.now()}-${randomUUID()}-${sanitizedFilename}`;
    const upload = await this.storageService.createUploadUrl({
      key: storageKey,
      contentType: input.contentType,
    });

    await this.prismaService.uploadedAsset.create({
      data: {
        cdnUrl: this.buildUrl(this.cdnBaseUrl, storageKey),
        contentType: input.contentType,
        filename: sanitizedFilename,
        mediaType,
        size: input.fileSize,
        storageKey,
        url: this.buildUrl(this.publicBaseUrl, storageKey),
        userId,
      },
    });

    return {
      uploadUrl: upload.uploadUrl,
      s3Key: upload.key,
      expiresIn: upload.expiresInSeconds,
    };
  }

  async confirmUpload(
    userId: string,
    input: ConfirmUploadRequest,
  ): Promise<ConfirmUploadResponse> {
    const upload = await this.prismaService.uploadedAsset.findUnique({
      where: {
        storageKey: input.s3Key,
      },
    });

    if (!upload || upload.userId !== userId || !this.belongsToUser(userId, upload.storageKey)) {
      throw new NotFoundException({
        code: 'UPLOAD_NOT_FOUND',
        message: 'Upload asset was not found',
      });
    }

    if (upload.confirmedAt) {
      return {
        s3Key: upload.storageKey,
        url: upload.url,
        cdnUrl: upload.cdnUrl,
      };
    }

    const result = await this.storageService.confirmUpload({
      key: upload.storageKey,
      size: upload.size,
      contentType: upload.contentType,
    });

    if (!result.confirmed) {
      throw new BadRequestException({
        code: 'UPLOAD_CONFIRMATION_FAILED',
        message: 'Upload could not be confirmed with the storage provider',
      });
    }

    const updatedUpload = await this.prismaService.uploadedAsset.update({
      where: {
        id: upload.id,
      },
      data: {
        cdnUrl: result.cdnUrl,
        confirmedAt: new Date(),
        url: result.url,
      },
    });

    return {
      s3Key: updatedUpload.storageKey,
      url: updatedUpload.url,
      cdnUrl: updatedUpload.cdnUrl,
    };
  }

  private resolveMediaType(contentType: string, fileSize: number) {
    if (IMAGE_CONTENT_TYPES.has(contentType)) {
      if (fileSize > MAX_IMAGE_SIZE_BYTES) {
        throw new BadRequestException({
          code: 'INVALID_UPLOAD_FILE',
          message: 'Image uploads must be 10MB or smaller',
          details: {
            contentType,
            maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
          },
        });
      }

      return UploadMediaType.IMAGE;
    }

    if (VIDEO_CONTENT_TYPES.has(contentType)) {
      if (fileSize > MAX_VIDEO_SIZE_BYTES) {
        throw new BadRequestException({
          code: 'INVALID_UPLOAD_FILE',
          message: 'Video uploads must be 50MB or smaller',
          details: {
            contentType,
            maxSizeBytes: MAX_VIDEO_SIZE_BYTES,
          },
        });
      }

      return UploadMediaType.VIDEO;
    }

    throw new BadRequestException({
      code: 'INVALID_UPLOAD_FILE',
      message: 'Only JPEG, PNG, and MP4 uploads are supported',
      details: {
        contentType,
      },
    });
  }

  private sanitizeFilename(filename: string) {
    const trimmed = filename.trim().replace(/\\/g, '/');
    const lastSegment = trimmed.split('/').at(-1) ?? 'upload.bin';
    const sanitized = lastSegment
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+/, '')
      .replace(/\.\.+/g, '.');

    return sanitized.length > 0 ? sanitized : 'upload.bin';
  }

  private belongsToUser(userId: string, storageKey: string) {
    return storageKey.startsWith(`listings/${userId}/`);
  }

  private buildUrl(baseUrl: string, storageKey: string) {
    return `${baseUrl.replace(/\/$/, '')}/${storageKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')}`;
  }
}
