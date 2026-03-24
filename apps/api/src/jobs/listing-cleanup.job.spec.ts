import { ListingCleanupJob } from './listing-cleanup.job';

describe('ListingCleanupJob', () => {
  const createJob = () => {
    let prismaService: any;
    prismaService = {
      listing: {
        findMany: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: any) => unknown) => callback(prismaService)),
    };
    const storageService = {
      deleteObject: jest.fn(),
    };

    return {
      prismaService,
      storageService,
      job: new ListingCleanupJob(prismaService as never, storageService as never),
    };
  };

  it('hard deletes aged soft-deleted listings after deleting storage objects', async () => {
    const { job, prismaService, storageService } = createJob();

    prismaService.listing.findMany.mockResolvedValue([
      {
        id: 'listing_1',
        deletedAt: new Date('2025-12-01T00:00:00.000Z'),
        videoUrl: 'https://cdn.example.com/videos/listing_1.mp4',
        photos: [{ s3Key: 'photos/one.jpg' }, { s3Key: 'photos/two.jpg' }],
      },
    ]);
    storageService.deleteObject.mockResolvedValue({ deleted: true });

    const summary = await job.hardDeleteOldListings(new Date('2026-04-02T06:00:00.000Z'));

    expect(summary).toEqual({
      candidates: 1,
      deleted: 1,
      failed: 0,
    });
    expect(storageService.deleteObject).toHaveBeenCalledWith('photos/one.jpg');
    expect(storageService.deleteObject).toHaveBeenCalledWith('photos/two.jpg');
    expect(storageService.deleteObject).toHaveBeenCalledWith('videos/listing_1.mp4');
    expect(prismaService.listing.delete).toHaveBeenCalledWith({
      where: {
        id: 'listing_1',
      },
    });
    expect(prismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'listing.hard_delete',
        entityId: 'listing_1',
      }),
    });
  });

  it('records cleanup failures without deleting the listing record', async () => {
    const { job, prismaService, storageService } = createJob();

    prismaService.listing.findMany.mockResolvedValue([
      {
        id: 'listing_fail',
        deletedAt: new Date('2025-12-01T00:00:00.000Z'),
        videoUrl: null,
        photos: [{ s3Key: 'photos/fail.jpg' }],
      },
    ]);
    storageService.deleteObject.mockRejectedValue(new Error('storage unavailable'));

    const summary = await job.hardDeleteOldListings(new Date('2026-04-02T06:00:00.000Z'));

    expect(summary.failed).toBe(1);
    expect(prismaService.listing.delete).not.toHaveBeenCalled();
    expect(prismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'listing.cleanup_failed',
        entityId: 'listing_fail',
      }),
    });
  });
});
