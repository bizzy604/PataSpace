import { Role } from '@prisma/client';
import request, { Response } from 'supertest';
import { ApiTestContext } from './api-test-context';

type CreateVerifiedUserOptions = {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: Role;
};

type CreateListingFixtureOptions = {
  county?: string;
  neighborhood: string;
  monthlyRent: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  furnished?: boolean;
  deviceType?: string;
  latitude?: number;
  longitude?: number;
  photoLatitude?: number;
  photoLongitude?: number;
  availableFrom?: string;
  availableTo?: string;
};

type CompleteSandboxPurchaseOptions = {
  amount?: number;
  phoneNumber: string;
  receiptNumber?: string;
  resultCode?: number;
  resultDesc?: string;
  transactionId: string;
};

type CreateUnlockFixtureOptions = {
  accessToken: string;
  expectedStatus?: number;
  listingId: string;
};

type CreateDisputeFixtureOptions = {
  accessToken: string;
  evidence?: string[];
  expectedStatus?: number;
  reason: string;
  unlockId: string;
};

export type VerifiedUserFixture = {
  accessToken: string;
  password: string;
  phoneNumber: string;
  userId: string;
};

export async function createVerifiedUser(
  context: ApiTestContext,
  options: CreateVerifiedUserOptions = {},
): Promise<VerifiedUserFixture> {
  const role = options.role ?? Role.USER;
  const phoneNumber = context.createPhoneNumber();
  const password = options.password ?? 'SecurePassword123!';

  await request(context.app.getHttpServer())
    .post('/api/v1/auth/register')
    .set('X-Forwarded-For', context.createForwardedFor())
    .send({
      phoneNumber,
      password,
      firstName: options.firstName ?? (role === Role.ADMIN ? 'Admin' : 'User'),
      lastName: options.lastName ?? 'Tester',
      email: options.email,
    })
    .expect(201);

  const verifyResponse = await request(context.app.getHttpServer())
    .post('/api/v1/auth/verify-otp')
    .set('X-Forwarded-For', context.createForwardedFor())
    .send({
      phoneNumber,
      code: '123456',
    })
    .expect(200);

  if (role === Role.USER) {
    return {
      accessToken: verifyResponse.body.accessToken as string,
      password,
      phoneNumber,
      userId: verifyResponse.body.user.id as string,
    };
  }

  await context.prismaService.user.update({
    where: {
      id: verifyResponse.body.user.id,
    },
    data: {
      role,
    },
  });

  const loginResponse = await request(context.app.getHttpServer())
    .post('/api/v1/auth/login')
    .set('X-Forwarded-For', context.createForwardedFor())
    .send({
      phoneNumber,
      password,
    })
    .expect(200);

  return {
    accessToken: loginResponse.body.accessToken as string,
    password,
    phoneNumber,
    userId: verifyResponse.body.user.id as string,
  };
}

export async function createConfirmedMediaSet(
  context: ApiTestContext,
  accessToken: string,
  label: string,
  latitude: number,
  longitude: number,
  photoLatitude = latitude,
  photoLongitude = longitude,
) {
  const photos: Array<{
    latitude: number;
    longitude: number;
    order: number;
    s3Key: string;
    takenAt: string;
    url: string;
  }> = [];

  for (let index = 1; index <= 5; index += 1) {
    const createUploadResponse = await request(context.app.getHttpServer())
      .post('/api/v1/uploads/presigned-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Forwarded-For', context.createForwardedFor())
      .send({
        filename: `${label}-photo-${index}.jpg`,
        contentType: 'image/jpeg',
        fileSize: 512 * 1024,
      })
      .expect(200);

    const confirmUploadResponse = await request(context.app.getHttpServer())
      .post('/api/v1/uploads/confirm')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Forwarded-For', context.createForwardedFor())
      .send({
        s3Key: createUploadResponse.body.s3Key,
      })
      .expect(200);

    photos.push({
      url: confirmUploadResponse.body.cdnUrl as string,
      s3Key: confirmUploadResponse.body.s3Key as string,
      order: index,
      latitude: photoLatitude,
      longitude: photoLongitude,
      takenAt: `2026-03-2${index}T10:30:00.000Z`,
    });
  }

  const createVideoResponse = await request(context.app.getHttpServer())
    .post('/api/v1/uploads/presigned-url')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('X-Forwarded-For', context.createForwardedFor())
    .send({
      filename: `${label}-walkthrough.mp4`,
      contentType: 'video/mp4',
      fileSize: 5_000_000,
    })
    .expect(200);

  const confirmVideoResponse = await request(context.app.getHttpServer())
    .post('/api/v1/uploads/confirm')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('X-Forwarded-For', context.createForwardedFor())
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
}

export async function createListing(
  context: ApiTestContext,
  accessToken: string,
  label: string,
  options: CreateListingFixtureOptions,
): Promise<Response> {
  const latitude = options.latitude ?? -1.289563;
  const longitude = options.longitude ?? 36.790942;
  const media = await createConfirmedMediaSet(
    context,
    accessToken,
    label,
    latitude,
    longitude,
    options.photoLatitude ?? latitude,
    options.photoLongitude ?? longitude,
  );

  return request(context.app.getHttpServer())
    .post('/api/v1/listings')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('X-Device-Type', options.deviceType ?? 'mobile')
    .set('X-Forwarded-For', context.createForwardedFor())
    .send({
      county: options.county ?? 'Nairobi',
      neighborhood: options.neighborhood,
      address: `${label} House, Nairobi`,
      latitude,
      longitude,
      monthlyRent: options.monthlyRent,
      bedrooms: options.bedrooms ?? 2,
      bathrooms: options.bathrooms ?? 1,
      propertyType: options.propertyType ?? 'Apartment',
      furnished: options.furnished ?? false,
      description: `Listing ${label} has enough detail to satisfy validation rules.`,
      amenities: ['Water 24/7', 'Parking'],
      propertyNotes: `Notes for ${label}`,
      availableFrom: options.availableFrom ?? '2026-05-01T00:00:00.000Z',
      availableTo: options.availableTo ?? '2026-05-31T00:00:00.000Z',
      photos: media.photos,
      video: media.video,
    });
}

export async function approveListing(
  context: ApiTestContext,
  accessToken: string,
  listingId: string,
): Promise<Response> {
  return request(context.app.getHttpServer())
    .post(`/api/v1/admin/listings/${listingId}/approve`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);
}

export async function rejectListing(
  context: ApiTestContext,
  accessToken: string,
  listingId: string,
  reason = 'Listing does not meet moderation requirements.',
): Promise<Response> {
  return request(context.app.getHttpServer())
    .post(`/api/v1/admin/listings/${listingId}/reject`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      reason,
    })
    .expect(200);
}

export async function seedCredits(
  context: ApiTestContext,
  userId: string,
  balance: number,
) {
  return context.prismaService.credit.upsert({
    where: {
      userId,
    },
    update: {
      balance,
      lifetimeEarned: balance,
    },
    create: {
      userId,
      balance,
      lifetimeEarned: balance,
    },
  });
}

export async function createCreditPurchase(
  context: ApiTestContext,
  accessToken: string,
  phoneNumber: string,
  packageKey: '5_credits' | '10_credits' | '20_credits' = '10_credits',
): Promise<Response> {
  return request(context.app.getHttpServer())
    .post('/api/v1/credits/purchase')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('X-Forwarded-For', context.createForwardedFor())
    .send({
      package: packageKey,
      phoneNumber,
    })
    .expect(202);
}

export async function completeSandboxPurchase(
  context: ApiTestContext,
  options: CompleteSandboxPurchaseOptions,
): Promise<Response> {
  const transaction = await context.prismaService.creditTransaction.findUniqueOrThrow({
    where: {
      id: options.transactionId,
    },
    select: {
      mpesaTransactionId: true,
      metadata: true,
    },
  });

  const metadata = transaction.metadata as
    | {
        merchantRequestId?: string;
        paymentAmountKES?: number;
      }
    | null;
  const callbackAmount = options.amount ?? metadata?.paymentAmountKES ?? 0;
  const callbackPayload = {
    Body: {
      stkCallback: {
        MerchantRequestID: metadata?.merchantRequestId ?? `mr_${options.transactionId}`,
        CheckoutRequestID:
          transaction.mpesaTransactionId ?? `ws_CO_${options.transactionId}`,
        ResultCode: options.resultCode ?? 0,
        ResultDesc:
          options.resultDesc ?? 'The service request is processed successfully.',
        CallbackMetadata:
          (options.resultCode ?? 0) === 0
            ? {
                Item: [
                  { Name: 'Amount', Value: callbackAmount },
                  {
                    Name: 'MpesaReceiptNumber',
                    Value: options.receiptNumber ?? `PSPACE${Date.now()}`,
                  },
                  { Name: 'TransactionDate', Value: 20260324120000 },
                  {
                    Name: 'PhoneNumber',
                    Value: Number(options.phoneNumber.replace('+', '')),
                  },
                ],
              }
            : undefined,
      },
    },
  };

  return request(context.app.getHttpServer())
    .post('/api/v1/payments/mpesa-callback')
    .send(callbackPayload)
    .expect(200);
}

export async function createUnlock(
  context: ApiTestContext,
  options: CreateUnlockFixtureOptions,
): Promise<Response> {
  return request(context.app.getHttpServer())
    .post('/api/v1/unlocks')
    .set('Authorization', `Bearer ${options.accessToken}`)
    .set('X-Forwarded-For', context.createForwardedFor())
    .send({
      listingId: options.listingId,
    })
    .expect(options.expectedStatus ?? 201);
}

export async function createConfirmation(
  context: ApiTestContext,
  accessToken: string,
  unlockId: string,
  side: 'INCOMING_TENANT' | 'OUTGOING_TENANT',
): Promise<Response> {
  return request(context.app.getHttpServer())
    .post('/api/v1/confirmations')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      unlockId,
      side,
    })
    .expect(201);
}

export async function createDispute(
  context: ApiTestContext,
  options: CreateDisputeFixtureOptions,
): Promise<Response> {
  return request(context.app.getHttpServer())
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${options.accessToken}`)
    .send({
      unlockId: options.unlockId,
      reason: options.reason,
      evidence: options.evidence ?? [],
    })
    .expect(options.expectedStatus ?? 201);
}
