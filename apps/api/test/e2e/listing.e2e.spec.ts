import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { PrismaService } from '../../src/common/database/prisma.service';
import { hashLookupValue, normalizePhoneNumber } from '../../src/common/security/encryption.util';
import { setupSwagger } from '../../src/common/swagger/setup-swagger';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../src/infrastructure/cache/redis.service';
import { QueueService } from '../../src/infrastructure/queue/queue.service';
import { createInMemoryRedisService } from '../utils/create-in-memory-redis-service';

jest.setTimeout(60_000);

describe('Upload, listing, and admin review flows', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let previousDatabaseUrl: string | undefined;
  const createdPhoneNumbers: string[] = [];
  let forwardedForCounter = 0;
  const forwardedForSeed = Math.floor(Math.random() * 180) + 1;

  const createForwardedFor = () => {
    const counter = forwardedForCounter;
    forwardedForCounter += 1;

    return `198.51.${((forwardedForSeed + Math.floor(counter / 200)) % 200) + 1}.${(counter % 200) + 1}`;
  };

  const createPhoneNumber = () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 100000)}`.slice(-8);
    const phoneNumber = `+2547${suffix}`;
    createdPhoneNumbers.push(phoneNumber);
    return phoneNumber;
  };

  const cleanupPhone = async (phoneNumber: string) => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
    const user = await prismaService.user.findUnique({
      where: {
        phoneNumberHash,
      },
      select: {
        id: true,
      },
    });

    await prismaService.oTPCode.deleteMany({
      where: {
        phoneNumberHash,
      },
    });

    if (user) {
      await prismaService.user.delete({
        where: {
          id: user.id,
        },
      });
    }
  };

  const createVerifiedUser = async (role: Role = Role.USER) => {
    const phoneNumber = createPhoneNumber();
    const password = 'SecurePassword123!';

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        phoneNumber,
        password,
        firstName: role === Role.ADMIN ? 'Admin' : 'Owner',
        lastName: 'Tester',
      })
      .expect(201);

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        phoneNumber,
        code: '123456',
      })
      .expect(200);

    if (role === Role.USER) {
      return {
        phoneNumber,
        password,
        userId: verifyResponse.body.user.id as string,
        accessToken: verifyResponse.body.accessToken as string,
      };
    }

    await prismaService.user.update({
      where: {
        id: verifyResponse.body.user.id,
      },
      data: {
        role,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        phoneNumber,
        password,
      })
      .expect(200);

    return {
      phoneNumber,
      password,
      userId: verifyResponse.body.user.id as string,
      accessToken: loginResponse.body.accessToken as string,
    };
  };

  const createConfirmedMediaSet = async (
    accessToken: string,
    label: string,
    latitude: number,
    longitude: number,
    photoLatitude = latitude,
    photoLongitude = longitude,
  ) => {
    const photos: Array<{
      url: string;
      s3Key: string;
      order: number;
      latitude: number;
      longitude: number;
      takenAt: string;
    }> = [];

    for (let index = 1; index <= 5; index += 1) {
      const createUploadResponse = await request(app.getHttpServer())
        .post('/api/v1/uploads/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Forwarded-For', createForwardedFor())
        .send({
          filename: `${label}-photo-${index}.jpg`,
          contentType: 'image/jpeg',
        fileSize: 1_024 * 512,
      })
        .expect(200);

      const confirmUploadResponse = await request(app.getHttpServer())
        .post('/api/v1/uploads/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Forwarded-For', createForwardedFor())
        .send({
          s3Key: createUploadResponse.body.s3Key,
        })
        .expect(200);

      photos.push({
        url: confirmUploadResponse.body.cdnUrl,
        s3Key: confirmUploadResponse.body.s3Key,
        order: index,
        latitude: photoLatitude,
        longitude: photoLongitude,
        takenAt: `2026-03-2${index}T10:30:00.000Z`,
      });
    }

    const createVideoResponse = await request(app.getHttpServer())
      .post('/api/v1/uploads/presigned-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        filename: `${label}-walkthrough.mp4`,
        contentType: 'video/mp4',
        fileSize: 5_000_000,
      })
      .expect(200);

    const confirmVideoResponse = await request(app.getHttpServer())
      .post('/api/v1/uploads/confirm')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        s3Key: createVideoResponse.body.s3Key,
      })
      .expect(200);

    return {
      photos,
      video: {
        url: confirmVideoResponse.body.cdnUrl as string,
        s3Key: confirmVideoResponse.body.s3Key as string,
      },
    };
  };

  const createListing = async (
    accessToken: string,
    label: string,
    options: {
      neighborhood: string;
      monthlyRent: number;
      deviceType?: string;
      latitude?: number;
      longitude?: number;
      photoLatitude?: number;
      photoLongitude?: number;
    },
  ) => {
    const latitude = options.latitude ?? -1.289563;
    const longitude = options.longitude ?? 36.790942;
    const media = await createConfirmedMediaSet(
      accessToken,
      label,
      latitude,
      longitude,
      options.photoLatitude ?? latitude,
      options.photoLongitude ?? longitude,
    );

    return request(app.getHttpServer())
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Device-Type', options.deviceType ?? 'mobile')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        county: 'Nairobi',
        neighborhood: options.neighborhood,
        address: `${label} House, Nairobi`,
        latitude,
        longitude,
        monthlyRent: options.monthlyRent,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'Apartment',
        furnished: false,
        description: `Listing ${label} has enough detail to satisfy validation rules.`,
        amenities: ['Water 24/7', 'Parking'],
        propertyNotes: `Notes for ${label}`,
        availableFrom: '2026-05-01T00:00:00.000Z',
        availableTo: '2026-05-31T00:00:00.000Z',
        photos: media.photos,
        video: media.video,
      });
  };

  const approveListing = async (accessToken: string, listingId: string) =>
    request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${listingId}/approve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

  beforeAll(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pataspace';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(createInMemoryRedisService())
      .overrideProvider(QueueService)
      .useValue({
        healthCheck: jest.fn().mockResolvedValue({ status: 'up', provider: 'bullmq' }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    const configService = app.get(ConfigService);
    const { globalPrefix } = configureApp(app);
    setupSwagger(app, configService, globalPrefix);
    await app.init();

    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    for (const phoneNumber of createdPhoneNumbers) {
      await cleanupPhone(phoneNumber);
    }

    await app.close();
    process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it('handles first-three review, approval, browse filters, pagination, and etags', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);
    const neighborhoods = {
      first: `Phase4-A-Kilimani-${Date.now()}`,
      second: `Phase4-A-Westlands-${Date.now() + 1}`,
      third: `Phase4-A-Lavington-${Date.now() + 2}`,
      fourth: `Phase4-A-SouthB-${Date.now() + 3}`,
    };

    const listing1 = await createListing(owner.accessToken, 'phase4-a1', {
      neighborhood: neighborhoods.first,
      monthlyRent: 25000,
    });

    expect(listing1.status).toBe(201);

    expect(listing1.body.status).toBe('PENDING');

    await approveListing(admin.accessToken, listing1.body.id);

    const listing2 = await createListing(owner.accessToken, 'phase4-a2', {
      neighborhood: neighborhoods.second,
      monthlyRent: 26000,
    });
    const listing3 = await createListing(owner.accessToken, 'phase4-a3', {
      neighborhood: neighborhoods.third,
      monthlyRent: 27000,
    });
    const listing4 = await createListing(owner.accessToken, 'phase4-a4', {
      neighborhood: neighborhoods.fourth,
      monthlyRent: 28000,
    });

    expect(listing2.status).toBe(201);
    expect(listing3.status).toBe(201);
    expect(listing4.status).toBe(201);
    expect(listing2.body.status).toBe('PENDING');
    expect(listing3.body.status).toBe('PENDING');
    expect(listing4.body.status).toBe('ACTIVE');

    const pendingResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/listings/pending')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      ;

    expect(pendingResponse.status).toBe(200);

    expect(pendingResponse.body.data.map((listing: { id: string }) => listing.id)).toEqual(
      expect.arrayContaining([listing2.body.id, listing3.body.id]),
    );
    expect(pendingResponse.body.data.map((listing: { id: string }) => listing.id)).not.toContain(
      listing4.body.id,
    );

    const browseResponse = await request(app.getHttpServer())
      .get('/api/v1/listings')
      .query({
        county: 'Nairobi',
        neighborhoods: `${neighborhoods.first},${neighborhoods.fourth}`,
        page: 1,
        limit: 1,
      })
      .expect(200);

    expect(browseResponse.body.pagination.total).toBe(2);
    expect(browseResponse.body.pagination.totalPages).toBe(2);
    expect(browseResponse.headers.etag).toBeTruthy();

    await request(app.getHttpServer())
      .get('/api/v1/listings')
      .query({
        county: 'Nairobi',
        neighborhoods: `${neighborhoods.first},${neighborhoods.fourth}`,
        page: 1,
        limit: 1,
      })
      .set('If-None-Match', browseResponse.headers.etag as string)
      .expect(304);

    const filteredResponse = await request(app.getHttpServer())
      .get('/api/v1/listings')
      .query({ neighborhoods: neighborhoods.fourth })
      .expect(200);

    expect(filteredResponse.body.pagination.total).toBe(1);
    expect(filteredResponse.body.data[0].id).toBe(listing4.body.id);

    const detailsResponse = await request(app.getHttpServer())
      .get(`/api/v1/listings/${listing4.body.id}`)
      .expect(200);

    expect(detailsResponse.body.id).toBe(listing4.body.id);
    expect(detailsResponse.body.contactInfo).toBeUndefined();
    expect(detailsResponse.headers.etag).toBeTruthy();

    await request(app.getHttpServer())
      .get(`/api/v1/listings/${listing4.body.id}`)
      .set('If-None-Match', detailsResponse.headers.etag as string)
      .expect(304);

    const myListingsResponse = await request(app.getHttpServer())
      .get('/api/v1/listings/my-listings')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(myListingsResponse.body.pagination.total).toBe(4);
  });

  it('rejects invalid uploads and enforces mobile create, GPS checks, and ownership', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const otherUser = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);

    const oversizeUpload = await request(app.getHttpServer())
      .post('/api/v1/uploads/presigned-url')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        filename: 'oversized.mp4',
        contentType: 'video/mp4',
        fileSize: 60 * 1024 * 1024,
      })
      .expect(400);

    expect(oversizeUpload.body.error.code).toBe('INVALID_UPLOAD_FILE');

    const nonMobileCreate = await createListing(owner.accessToken, 'phase4-b1', {
      neighborhood: 'Kasarani',
      monthlyRent: 24000,
      deviceType: 'web',
    });

    expect(nonMobileCreate.status).toBe(400);
    expect(nonMobileCreate.body.error.code).toBe('MOBILE_DEVICE_REQUIRED');

    const gpsMismatchCreate = await createListing(owner.accessToken, 'phase4-b2', {
      neighborhood: 'Kasarani',
      monthlyRent: 24000,
      photoLatitude: -1.200001,
      photoLongitude: 36.900001,
    });

    expect(gpsMismatchCreate.status).toBe(400);
    expect(gpsMismatchCreate.body.error.code).toBe('GPS_MISMATCH');

    const validListing = await createListing(owner.accessToken, 'phase4-b3', {
      neighborhood: 'Roysambu',
      monthlyRent: 23000,
    });

    expect(validListing.status).toBe(201);

    await approveListing(admin.accessToken, validListing.body.id);

    const forbiddenUpdate = await request(app.getHttpServer())
      .patch(`/api/v1/listings/${validListing.body.id}`)
      .set('Authorization', `Bearer ${otherUser.accessToken}`)
      .send({
        description: 'This should not be allowed because the user is not the owner.',
      })
      .expect(403);

    expect(forbiddenUpdate.body.error.code).toBe('FORBIDDEN');

    const missingPhotosForGpsChange = await request(app.getHttpServer())
      .patch(`/api/v1/listings/${validListing.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        latitude: -1.280001,
      })
      .expect(400);

    expect(missingPhotosForGpsChange.body.error.code).toBe('PHOTOS_REQUIRED_FOR_GPS_CHANGE');
  });

  it('hides pending listings, blocks non-admin moderation, and locks listings after unlock', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const buyer = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);

    const pendingListing = await createListing(owner.accessToken, 'phase4-d1', {
      neighborhood: `Phase4-Hidden-${Date.now()}`,
      monthlyRent: 25000,
    });

    expect(pendingListing.status).toBe(201);
    expect(pendingListing.body.status).toBe('PENDING');

    const hiddenDetailsResponse = await request(app.getHttpServer())
      .get(`/api/v1/listings/${pendingListing.body.id}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(404);

    expect(hiddenDetailsResponse.body.error.code).toBe('LISTING_NOT_FOUND');

    const nonAdminPendingResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/listings/pending')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(403);

    expect(nonAdminPendingResponse.body.error.code).toBe('FORBIDDEN');

    const nonAdminApproveResponse = await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${pendingListing.body.id}/approve`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(403);

    expect(nonAdminApproveResponse.body.error.code).toBe('FORBIDDEN');

    await approveListing(admin.accessToken, pendingListing.body.id);

    await prismaService.credit.update({
      where: {
        userId: buyer.userId,
      },
      data: {
        balance: 6000,
        lifetimeEarned: 6000,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId: pendingListing.body.id,
      })
      .expect(201);

    const lockedUpdateResponse = await request(app.getHttpServer())
      .patch(`/api/v1/listings/${pendingListing.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        monthlyRent: 26000,
      })
      .expect(403);

    expect(lockedUpdateResponse.body.error.code).toBe('LISTING_LOCKED_AFTER_UNLOCK');

    const lockedDeleteResponse = await request(app.getHttpServer())
      .delete(`/api/v1/listings/${pendingListing.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(409);

    expect(lockedDeleteResponse.body.error.code).toBe('CANNOT_DELETE_LISTING_WITH_UNLOCKS');
  });

  it('supports admin rejection, resubmission, and soft delete', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);

    const listing = await createListing(owner.accessToken, 'phase4-c1', {
      neighborhood: 'Embakasi',
      monthlyRent: 21000,
    });

    expect(listing.status).toBe(201);

    const rejectionResponse = await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${listing.body.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        reason: 'Photos do not match the expected GPS evidence',
      })
      .expect(200);

    expect(rejectionResponse.body.status).toBe('REJECTED');

    const hiddenFromBrowse = await request(app.getHttpServer())
      .get('/api/v1/listings')
      .query({ neighborhoods: 'Embakasi' })
      .expect(200);

    expect(hiddenFromBrowse.body.pagination.total).toBe(0);

    await request(app.getHttpServer())
      .patch(`/api/v1/listings/${listing.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        description: 'Updated listing description after rejection with enough detail to pass validation.',
      })
      .expect(200);

    const pendingAfterResubmission = await request(app.getHttpServer())
      .get('/api/v1/admin/listings/pending')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      ;

    expect(pendingAfterResubmission.status).toBe(200);

    expect(
      pendingAfterResubmission.body.data.map((item: { id: string }) => item.id),
    ).toContain(listing.body.id);

    await request(app.getHttpServer())
      .delete(`/api/v1/listings/${listing.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(204);

    const deletedListings = await request(app.getHttpServer())
      .get('/api/v1/listings/my-listings')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .query({ status: 'DELETED' })
      .expect(200);

    expect(deletedListings.body.data.map((item: { id: string }) => item.id)).toContain(
      listing.body.id,
    );
  });
});
