import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { PrismaService } from '../../src/common/database/prisma.service';
import { hashLookupValue, normalizePhoneNumber } from '../../src/common/security/encryption.util';
import { setupSwagger } from '../../src/common/swagger/setup-swagger';

jest.setTimeout(60_000);

describe('Phase 6 confirmations, disputes, and admin review flows', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let previousDatabaseUrl: string | undefined;
  const createdPhoneNumbers: string[] = [];
  let forwardedForCounter = 0;
  const forwardedForSeed = Math.floor(Math.random() * 180) + 1;

  const createForwardedFor = () => {
    const counter = forwardedForCounter;
    forwardedForCounter += 1;

    return `198.53.${((forwardedForSeed + Math.floor(counter / 200)) % 200) + 1}.${(counter % 200) + 1}`;
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
        firstName: role === Role.ADMIN ? 'Admin' : 'User',
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
          fileSize: 512 * 1024,
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
        url: confirmUploadResponse.body.cdnUrl as string,
        s3Key: confirmUploadResponse.body.s3Key as string,
        order: index,
        latitude,
        longitude,
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
    neighborhood: string,
    monthlyRent: number,
  ) => {
    const latitude = -1.289563;
    const longitude = 36.790942;
    const media = await createConfirmedMediaSet(accessToken, label, latitude, longitude);

    return request(app.getHttpServer())
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Device-Type', 'mobile')
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        county: 'Nairobi',
        neighborhood,
        address: `${label} House, Nairobi`,
        latitude,
        longitude,
        monthlyRent,
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

  const unlockListing = async (
    buyerAccessToken: string,
    buyerUserId: string,
    listingId: string,
    balance = 6000,
  ) => {
    await prismaService.credit.update({
      where: {
        userId: buyerUserId,
      },
      data: {
        balance,
        lifetimeEarned: balance,
      },
    });

    return request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${buyerAccessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId,
      })
      .expect(201);
  };

  beforeAll(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pataspace';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('creates confirmations, blocks duplicate and unauthorized requests, and creates commission once both parties confirm', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);
    const buyer = await createVerifiedUser(Role.USER);
    const stranger = await createVerifiedUser(Role.USER);

    const listingResponse = await createListing(
      owner.accessToken,
      'phase6-confirmation',
      `Phase6-Confirm-${Date.now()}`,
      25000,
    );

    expect(listingResponse.status).toBe(201);
    await approveListing(admin.accessToken, listingResponse.body.id);

    const unlockResponse = await unlockListing(
      buyer.accessToken,
      buyer.userId,
      listingResponse.body.id,
    );

    const unauthorizedConfirmationResponse = await request(app.getHttpServer())
      .post('/api/v1/confirmations')
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .send({
        unlockId: unlockResponse.body.unlockId,
        side: 'INCOMING_TENANT',
      })
      .expect(403);

    expect(unauthorizedConfirmationResponse.body.error.code).toBe('FORBIDDEN');

    const incomingConfirmationResponse = await request(app.getHttpServer())
      .post('/api/v1/confirmations')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        unlockId: unlockResponse.body.unlockId,
        side: 'INCOMING_TENANT',
      })
      .expect(201);

    expect(incomingConfirmationResponse.body).toMatchObject({
      unlockId: unlockResponse.body.unlockId,
      side: 'INCOMING_TENANT',
      bothConfirmed: false,
      message: 'Waiting for outgoing tenant to confirm.',
    });

    const duplicateConfirmationResponse = await request(app.getHttpServer())
      .post('/api/v1/confirmations')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        unlockId: unlockResponse.body.unlockId,
        side: 'INCOMING_TENANT',
      })
      .expect(400);

    expect(duplicateConfirmationResponse.body.error.code).toBe('ALREADY_CONFIRMED');

    const outgoingConfirmationResponse = await request(app.getHttpServer())
      .post('/api/v1/confirmations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        unlockId: unlockResponse.body.unlockId,
        side: 'OUTGOING_TENANT',
      })
      .expect(201);

    expect(outgoingConfirmationResponse.body.bothConfirmed).toBe(true);
    expect(outgoingConfirmationResponse.body.commission).toMatchObject({
      amount: 750,
      status: 'PENDING',
    });

    const payableOn = new Date(outgoingConfirmationResponse.body.commission.payableOn).getTime();
    const minimumExpected = Date.now() + 6 * 24 * 60 * 60 * 1000;
    const maximumExpected = Date.now() + 8 * 24 * 60 * 60 * 1000;

    expect(payableOn).toBeGreaterThan(minimumExpected);
    expect(payableOn).toBeLessThan(maximumExpected);

    const commission = await prismaService.commission.findUnique({
      where: {
        unlockId: unlockResponse.body.unlockId,
      },
      select: {
        amountKES: true,
        outgoingTenantId: true,
        status: true,
      },
    });

    expect(commission).toMatchObject({
      amountKES: 750,
      outgoingTenantId: owner.userId,
      status: 'PENDING',
    });

    const unlockHistoryResponse = await request(app.getHttpServer())
      .get('/api/v1/unlocks/my-unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(unlockHistoryResponse.body.data[0].status).toBe('confirmed');

    const ownerListingsResponse = await request(app.getHttpServer())
      .get('/api/v1/listings/my-listings')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const ownerListing = ownerListingsResponse.body.data.find(
      (item: { id: string }) => item.id === listingResponse.body.id,
    );

    expect(ownerListing.pendingEarnings).toBe(750);
  });

  it('creates disputes once and restricts dispute lookup to participants or admins', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);
    const buyer = await createVerifiedUser(Role.USER);
    const stranger = await createVerifiedUser(Role.USER);

    const listingResponse = await createListing(
      owner.accessToken,
      'phase6-dispute',
      `Phase6-Dispute-${Date.now()}`,
      24000,
    );

    expect(listingResponse.status).toBe(201);
    await approveListing(admin.accessToken, listingResponse.body.id);

    const unlockResponse = await unlockListing(
      buyer.accessToken,
      buyer.userId,
      listingResponse.body.id,
    );

    const createDisputeResponse = await request(app.getHttpServer())
      .post('/api/v1/disputes')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        unlockId: unlockResponse.body.unlockId,
        reason: 'The property details did not match what we agreed during the unlock process.',
        evidence: ['https://example.com/evidence/photo-1.jpg'],
      })
      .expect(201);

    expect(createDisputeResponse.body).toMatchObject({
      status: 'OPEN',
      message: 'Dispute filed. Admin will review within 24 hours.',
    });

    const duplicateDisputeResponse = await request(app.getHttpServer())
      .post('/api/v1/disputes')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        unlockId: unlockResponse.body.unlockId,
        reason: 'Trying to file the same dispute again should fail.',
        evidence: [],
      })
      .expect(400);

    expect(duplicateDisputeResponse.body.error.code).toBe('DISPUTE_ALREADY_EXISTS');

    await request(app.getHttpServer())
      .get(`/api/v1/disputes/${createDisputeResponse.body.disputeId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/disputes/${createDisputeResponse.body.disputeId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const forbiddenDisputeLookup = await request(app.getHttpServer())
      .get(`/api/v1/disputes/${createDisputeResponse.body.disputeId}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .expect(403);

    expect(forbiddenDisputeLookup.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects moderation on non-pending listings and records review audit diagnostics', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);

    const approvedListingResponse = await createListing(
      owner.accessToken,
      'phase6-admin-approved',
      `Phase6-Admin-A-${Date.now()}`,
      22000,
    );

    expect(approvedListingResponse.status).toBe(201);
    await approveListing(admin.accessToken, approvedListingResponse.body.id);

    const approveConflictResponse = await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${approvedListingResponse.body.id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(409);

    expect(approveConflictResponse.body.error.code).toBe('LISTING_NOT_PENDING');

    const approveAuditLog = await prismaService.auditLog.findFirst({
      where: {
        action: 'listing.approve',
        entityId: approvedListingResponse.body.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        metadata: true,
        oldValue: true,
        newValue: true,
      },
    });

    expect(approveAuditLog?.metadata).toMatchObject({
      reviewOutcome: 'approved',
      previousStatus: 'PENDING',
      nextStatus: 'ACTIVE',
      listingOwnerId: owner.userId,
    });
    expect(approveAuditLog?.oldValue).toMatchObject({
      status: 'PENDING',
      isApproved: false,
    });
    expect(approveAuditLog?.newValue).toMatchObject({
      status: 'ACTIVE',
      isApproved: true,
    });

    const rejectedListingResponse = await createListing(
      owner.accessToken,
      'phase6-admin-rejected',
      `Phase6-Admin-B-${Date.now()}`,
      23000,
    );

    expect(rejectedListingResponse.status).toBe(201);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${rejectedListingResponse.body.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        reason: 'Photos still need correction before this listing can go live.',
      })
      .expect(200);

    const rejectConflictResponse = await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${rejectedListingResponse.body.id}/reject`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        reason: 'This second rejection should fail because the listing is no longer pending.',
      })
      .expect(409);

    expect(rejectConflictResponse.body.error.code).toBe('LISTING_NOT_PENDING');

    const rejectAuditLog = await prismaService.auditLog.findFirst({
      where: {
        action: 'listing.reject',
        entityId: rejectedListingResponse.body.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        metadata: true,
        oldValue: true,
        newValue: true,
      },
    });

    expect(rejectAuditLog?.metadata).toMatchObject({
      reviewOutcome: 'rejected',
      previousStatus: 'PENDING',
      nextStatus: 'REJECTED',
      listingOwnerId: owner.userId,
      reason: 'Photos still need correction before this listing can go live.',
    });
    expect(rejectAuditLog?.oldValue).toMatchObject({
      status: 'PENDING',
      isApproved: false,
    });
    expect(rejectAuditLog?.newValue).toMatchObject({
      status: 'REJECTED',
      isApproved: false,
    });
  });
});
