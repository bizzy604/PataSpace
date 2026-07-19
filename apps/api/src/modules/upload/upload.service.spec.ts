/**
 * Purpose: Regression tests for upload confirmation behavior.
 * Why important: Evidence uploads must be accepted through the same confirmation flow as listing media.
 * Used by: UploadService.
 */
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  it('accepts evidence uploads for the current user during confirmation', async () => {
    const prismaService = {
      uploadedAsset: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'asset_1',
          userId: 'user_1',
          storageKey: 'evidence/images/asset-1.jpg',
          size: 1024,
          contentType: 'image/jpeg',
          confirmedAt: null,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'asset_1',
          storageKey: 'evidence/images/asset-1.jpg',
          url: 'https://cdn.example.com/evidence/images/asset-1.jpg',
          cdnUrl: 'https://cdn.example.com/evidence/images/asset-1.jpg',
        }),
      },
    };
    const storageService = {
      confirmUpload: jest.fn().mockResolvedValue({
        confirmed: true,
        url: 'https://cdn.example.com/evidence/images/asset-1.jpg',
        cdnUrl: 'https://cdn.example.com/evidence/images/asset-1.jpg',
      }),
    };

    const service = new UploadService(
      prismaService as never,
      storageService as never,
      { get: jest.fn() } as unknown as ConfigService,
    );

    await expect(
      service.confirmUpload('user_1', { s3Key: 'evidence/images/asset-1.jpg' }),
    ).resolves.toMatchObject({
      s3Key: 'evidence/images/asset-1.jpg',
      url: 'https://cdn.example.com/evidence/images/asset-1.jpg',
    });
    expect(storageService.confirmUpload).toHaveBeenCalled();
  });

  it('rejects uploads that do not belong to the current user', async () => {
    const prismaService = {
      uploadedAsset: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'asset_2',
          userId: 'someone_else',
          storageKey: 'listings/other-user/image.jpg',
          size: 1024,
          contentType: 'image/jpeg',
          confirmedAt: null,
        }),
      },
    };

    const service = new UploadService(
      prismaService as never,
      { confirmUpload: jest.fn() } as never,
      { get: jest.fn() } as unknown as ConfigService,
    );

    await expect(service.confirmUpload('user_1', { s3Key: 'listings/other-user/image.jpg' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
