import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/bootstrap/configure-app';
import { PrismaService } from '../../src/common/database/prisma.service';
import { hashLookupValue, normalizePhoneNumber } from '../../src/common/security/encryption.util';
import { setupSwagger } from '../../src/common/swagger/setup-swagger';
import { UnlockService } from '../../src/modules/unlock/unlock.service';
import { RedisService } from '../../src/infrastructure/cache/redis.service';
import { QueueService } from '../../src/infrastructure/queue/queue.service';
import { createInMemoryRedisService } from '../utils/create-in-memory-redis-service';

jest.setTimeout(60_000);

describe('Phase 5 credits, payments, and unlock flows', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let unlockService: UnlockService;
  let previousDatabaseUrl: string | undefined;
  const createdPhoneNumbers: string[] = [];
  let forwardedForCounter = 0;
  const forwardedForSeed = Math.floor(Math.random() * 180) + 1;

  const createForwardedFor = () => {
    const counter = forwardedForCounter;
    forwardedForCounter += 1;

    return `198.52.${((forwardedForSeed + Math.floor(counter / 200)) % 200) + 1}.${(counter % 200) + 1}`;
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
        houseType: 'TWO_BEDROOM',
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
    unlockService = app.get(UnlockService);
  });

  afterAll(async () => {
    for (const phoneNumber of createdPhoneNumbers) {
      await cleanupPhone(phoneNumber);
    }

    await app.close();
    process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it('processes sandbox purchases and ignores duplicate callbacks', async () => {
    const buyer = await createVerifiedUser(Role.USER);

    const purchaseResponse = await request(app.getHttpServer())
      .post('/api/v1/credits/purchase')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        package: '10_credits',
        phoneNumber: buyer.phoneNumber,
      })
      .expect(202);

    expect(purchaseResponse.body.status).toBe('PENDING');
    expect(purchaseResponse.body.amount).toBe(10000);
    expect(purchaseResponse.body.credits).toBe(10500);

    const pendingTransaction = await prismaService.creditTransaction.findUnique({
      where: {
        id: purchaseResponse.body.transactionId,
      },
      select: {
        mpesaTransactionId: true,
        metadata: true,
      },
    });

    const checkoutRequestId = pendingTransaction?.mpesaTransactionId;
    const merchantRequestId = (pendingTransaction?.metadata as { merchantRequestId?: string } | null)
      ?.merchantRequestId;

    expect(checkoutRequestId).toBeTruthy();
    expect(merchantRequestId).toBeTruthy();

    const callbackPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: merchantRequestId,
          CheckoutRequestID: checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 10000 },
              { Name: 'MpesaReceiptNumber', Value: 'PSPACE1234' },
              { Name: 'TransactionDate', Value: 20260322120000 },
              { Name: 'PhoneNumber', Value: Number(buyer.phoneNumber.replace('+', '')) },
            ],
          },
        },
      },
    };

    await request(app.getHttpServer())
      .post('/api/v1/payments/mpesa-callback')
      .send(callbackPayload)
      .expect(200);

    const balanceResponse = await request(app.getHttpServer())
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(balanceResponse.body.balance).toBe(10500);
    expect(balanceResponse.body.lifetimeEarned).toBe(10500);

    const transactionHistoryResponse = await request(app.getHttpServer())
      .get('/api/v1/credits/transactions')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(transactionHistoryResponse.body.data[0]).toMatchObject({
      status: 'COMPLETED',
      amount: 10500,
      mpesaReceiptNumber: 'PSPACE1234',
    });

    await request(app.getHttpServer())
      .post('/api/v1/payments/mpesa-callback')
      .send(callbackPayload)
      .expect(200);

    const balanceAfterDuplicateCallback = await request(app.getHttpServer())
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(balanceAfterDuplicateCallback.body.balance).toBe(10500);
  });

  it('rejects duplicate pending purchases and avoids crediting failed or mismatched callbacks', async () => {
    const buyer = await createVerifiedUser(Role.USER);

    const firstPurchaseResponse = await request(app.getHttpServer())
      .post('/api/v1/credits/purchase')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        package: '5_credits',
        phoneNumber: buyer.phoneNumber,
      })
      .expect(202);

    const duplicatePendingResponse = await request(app.getHttpServer())
      .post('/api/v1/credits/purchase')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        package: '5_credits',
        phoneNumber: buyer.phoneNumber,
      })
      .expect(402);

    expect(duplicatePendingResponse.body.error.code).toBe('PURCHASE_ALREADY_PENDING');

    const firstPendingTransaction = await prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: firstPurchaseResponse.body.transactionId,
      },
      select: {
        mpesaTransactionId: true,
        status: true,
        metadata: true,
      },
    });

    const firstMerchantRequestId = (firstPendingTransaction.metadata as { merchantRequestId?: string } | null)
      ?.merchantRequestId;

    await request(app.getHttpServer())
      .post('/api/v1/payments/mpesa-callback')
      .send({
        Body: {
          stkCallback: {
            MerchantRequestID: firstMerchantRequestId,
            CheckoutRequestID: firstPendingTransaction.mpesaTransactionId,
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user.',
          },
        },
      })
      .expect(200);

    const cancelledTransaction = await prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: firstPurchaseResponse.body.transactionId,
      },
      select: {
        status: true,
      },
    });

    expect(cancelledTransaction.status).toBe('CANCELLED');

    const secondPurchaseResponse = await request(app.getHttpServer())
      .post('/api/v1/credits/purchase')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        package: '5_credits',
        phoneNumber: buyer.phoneNumber,
      })
      .expect(202);

    const secondPendingTransaction = await prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: secondPurchaseResponse.body.transactionId,
      },
      select: {
        mpesaTransactionId: true,
        status: true,
        metadata: true,
      },
    });

    const secondMerchantRequestId = (secondPendingTransaction.metadata as { merchantRequestId?: string } | null)
      ?.merchantRequestId;

    await request(app.getHttpServer())
      .post('/api/v1/payments/mpesa-callback')
      .send({
        Body: {
          stkCallback: {
            MerchantRequestID: secondMerchantRequestId,
            CheckoutRequestID: secondPendingTransaction.mpesaTransactionId,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 9999 },
                { Name: 'MpesaReceiptNumber', Value: 'PSPACEMISMATCH1' },
                { Name: 'TransactionDate', Value: 20260322123000 },
                { Name: 'PhoneNumber', Value: Number(buyer.phoneNumber.replace('+', '')) },
              ],
            },
          },
        },
      })
      .expect(200);

    const failedTransaction = await prismaService.creditTransaction.findUniqueOrThrow({
      where: {
        id: secondPurchaseResponse.body.transactionId,
      },
      select: {
        status: true,
        balanceAfter: true,
      },
    });

    expect(failedTransaction.status).toBe('FAILED');
    expect(failedTransaction.balanceAfter).toBe(0);

    const balanceResponse = await request(app.getHttpServer())
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(balanceResponse.body.balance).toBe(0);
    expect(balanceResponse.body.lifetimeEarned).toBe(0);
  });

  it('unlocks listings once and returns the same payload on repeat requests', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);
    const buyer = await createVerifiedUser(Role.USER);

    await prismaService.credit.update({
      where: {
        userId: buyer.userId,
      },
      data: {
        balance: 6000,
        lifetimeEarned: 6000,
      },
    });

    const listingResponse = await createListing(
      owner.accessToken,
      'phase5-unlock-repeat',
      `Phase5-Repeat-${Date.now()}`,
      25000,
    );

    expect(listingResponse.status).toBe(201);
    await approveListing(admin.accessToken, listingResponse.body.id);

    const firstUnlockResponse = await request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId: listingResponse.body.id,
      })
      .expect(201);

    expect(firstUnlockResponse.body.creditsSpent).toBe(2500);
    expect(firstUnlockResponse.body.newBalance).toBe(3500);
    expect(firstUnlockResponse.body.contactInfo.phoneNumber).toBe(owner.phoneNumber);

    const repeatUnlockResponse = await request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId: listingResponse.body.id,
      })
      .expect(200);

    expect(repeatUnlockResponse.body.unlockId).toBe(firstUnlockResponse.body.unlockId);
    expect(repeatUnlockResponse.body.newBalance).toBe(3500);

    const balanceResponse = await request(app.getHttpServer())
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(balanceResponse.body.balance).toBe(3500);

    const transactionsResponse = await request(app.getHttpServer())
      .get('/api/v1/credits/transactions')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    const spendTransactions = transactionsResponse.body.data.filter(
      (transaction: { type: string }) => transaction.type === 'SPEND',
    );

    expect(spendTransactions).toHaveLength(1);

    const unlockHistoryResponse = await request(app.getHttpServer())
      .get('/api/v1/unlocks/my-unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(unlockHistoryResponse.body.data).toHaveLength(1);
    expect(unlockHistoryResponse.body.data[0].status).toBe('pending_confirmation');

    const listingDetailsResponse = await request(app.getHttpServer())
      .get(`/api/v1/listings/${listingResponse.body.id}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(listingDetailsResponse.body.contactInfo.phoneNumber).toBe(owner.phoneNumber);
  });

  it('rejects invalid unlock attempts and supports refund-aware transaction queries', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);
    const buyer = await createVerifiedUser(Role.USER);

    await prismaService.credit.update({
      where: {
        userId: buyer.userId,
      },
      data: {
        balance: 1000,
        lifetimeEarned: 1000,
      },
    });

    const approvedListingResponse = await createListing(
      owner.accessToken,
      'phase5-invalid-unlock-approved',
      `Phase5-Approved-${Date.now()}`,
      25000,
    );

    expect(approvedListingResponse.status).toBe(201);
    await approveListing(admin.accessToken, approvedListingResponse.body.id);

    const insufficientCreditsResponse = await request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId: approvedListingResponse.body.id,
      })
      .expect(402);

    expect(insufficientCreditsResponse.body.error.code).toBe('INSUFFICIENT_CREDITS');

    const ownListingUnlockResponse = await request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId: approvedListingResponse.body.id,
      })
      .expect(403);

    expect(ownListingUnlockResponse.body.error.code).toBe('CANNOT_UNLOCK_OWN_LISTING');

    const unavailableListingResponse = await createListing(
      owner.accessToken,
      'phase5-invalid-unlock-pending',
      `Phase5-Pending-${Date.now()}`,
      23000,
    );

    expect(unavailableListingResponse.status).toBe(201);
    expect(unavailableListingResponse.body.status).toBe('PENDING');

    const unavailableUnlockResponse = await request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId: unavailableListingResponse.body.id,
      })
      .expect(410);

    expect(unavailableUnlockResponse.body.error.code).toBe('LISTING_UNAVAILABLE');

    await prismaService.credit.update({
      where: {
        userId: buyer.userId,
      },
      data: {
        balance: 6000,
        lifetimeEarned: 6000,
      },
    });

    const successfulUnlockResponse = await request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId: approvedListingResponse.body.id,
      })
      .expect(201);

    expect(successfulUnlockResponse.body.creditsSpent).toBe(2500);

    await unlockService.refundUnlocksForListingInvalidation(
      approvedListingResponse.body.id,
      'Listing invalidated after moderation review',
    );

    const refundedUnlockRetryResponse = await request(app.getHttpServer())
      .post('/api/v1/unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .set('X-Forwarded-For', createForwardedFor())
      .send({
        listingId: approvedListingResponse.body.id,
      })
      .expect(410);

    expect(refundedUnlockRetryResponse.body.error.code).toBe('UNLOCK_REFUNDED');

    const refundTransactionsResponse = await request(app.getHttpServer())
      .get('/api/v1/credits/transactions')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .query({
        type: 'REFUND',
        status: 'COMPLETED',
        page: 1,
        limit: 1,
      })
      .expect(200);

    expect(refundTransactionsResponse.body.pagination.total).toBe(1);
    expect(refundTransactionsResponse.body.pagination.limit).toBe(1);
    expect(refundTransactionsResponse.body.data[0]).toMatchObject({
      type: 'REFUND',
      status: 'COMPLETED',
      amount: 2500,
    });
  });

  it('handles concurrent unlock attempts safely and supports refund-driven cleanup', async () => {
    const owner = await createVerifiedUser(Role.USER);
    const admin = await createVerifiedUser(Role.ADMIN);
    const buyer = await createVerifiedUser(Role.USER);

    await prismaService.credit.update({
      where: {
        userId: buyer.userId,
      },
      data: {
        balance: 7000,
        lifetimeEarned: 7000,
      },
    });

    const listingResponse = await createListing(
      owner.accessToken,
      'phase5-concurrent',
      `Phase5-Concurrent-${Date.now()}`,
      25000,
    );

    expect(listingResponse.status).toBe(201);
    await approveListing(admin.accessToken, listingResponse.body.id);

    const [unlockA, unlockB] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/unlocks')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .set('X-Forwarded-For', createForwardedFor())
        .send({
          listingId: listingResponse.body.id,
        }),
      request(app.getHttpServer())
        .post('/api/v1/unlocks')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .set('X-Forwarded-For', createForwardedFor())
        .send({
          listingId: listingResponse.body.id,
        }),
    ]);

    expect([unlockA.status, unlockB.status].sort()).toEqual([200, 201]);

    const spendTransactions = await prismaService.creditTransaction.findMany({
      where: {
        userId: buyer.userId,
        type: 'SPEND',
      },
      select: {
        id: true,
      },
    });

    const unlockRecords = await prismaService.unlock.findMany({
      where: {
        buyerId: buyer.userId,
        listingId: listingResponse.body.id,
      },
      select: {
        id: true,
      },
    });

    expect(spendTransactions).toHaveLength(1);
    expect(unlockRecords).toHaveLength(1);

    const balanceAfterUnlock = await request(app.getHttpServer())
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(balanceAfterUnlock.body.balance).toBe(4500);

    await unlockService.refundUnlocksForListingInvalidation(
      listingResponse.body.id,
      'Listing removed by moderation',
    );

    const refundedBalanceResponse = await request(app.getHttpServer())
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(refundedBalanceResponse.body.balance).toBe(7000);

    const refundedUnlocksResponse = await request(app.getHttpServer())
      .get('/api/v1/unlocks/my-unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .query({ status: 'refunded' })
      .expect(200);

    expect(refundedUnlocksResponse.body.data).toHaveLength(1);
    expect(refundedUnlocksResponse.body.data[0].status).toBe('refunded');

    const listingDetailsAfterRefund = await request(app.getHttpServer())
      .get(`/api/v1/listings/${listingResponse.body.id}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(listingDetailsAfterRefund.body.contactInfo).toBeUndefined();

    await request(app.getHttpServer())
      .delete(`/api/v1/listings/${listingResponse.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(204);
  });
});
