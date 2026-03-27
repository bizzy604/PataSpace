import request from 'supertest';
import { Role } from '@prisma/client';
import {
  approveListing,
  completeSandboxPurchase,
  createConfirmation,
  createCreditPurchase,
  createDispute,
  createListing,
  createUnlock,
  createVerifiedUser,
  rejectListing,
} from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Main public and admin API surface', () => {
  let context: ApiTestContext;

  beforeAll(async () => {
    context = await createApiTestContext({
      ipRangePrefix: 65,
    });
  });

  afterAll(async () => {
    await context.close();
  });

  it('covers the main public flow from browse to dispute creation', async () => {
    const owner = await createVerifiedUser(context);
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const buyer = await createVerifiedUser(context);
    const surfaceNeighborhood = `Surface-${Date.now()}`;
    const listingResponse = await createListing(context, owner.accessToken, 'phase8-surface', {
      neighborhood: surfaceNeighborhood,
      monthlyRent: 30000,
    });

    expect(listingResponse.status).toBe(201);
    await approveListing(context, admin.accessToken, listingResponse.body.id);

    const browseResponse = await request(context.app.getHttpServer())
      .get('/api/v1/listings')
      .query({
        neighborhoods: surfaceNeighborhood,
      })
      .expect(200);

    expect(browseResponse.headers.etag).toBeTruthy();
    expect(browseResponse.body.data.map((listing: { id: string }) => listing.id)).toContain(
      listingResponse.body.id,
    );
    expect(browseResponse.body.data[0].mapLocation).toBeTruthy();
    expect(browseResponse.body.data[0].mapLocation.approxLatitude).toBeCloseTo(-1.29, 2);
    expect(browseResponse.body.data[0].mapLocation.approxLongitude).toBeCloseTo(36.79, 2);

    const detailsResponse = await request(context.app.getHttpServer())
      .get(`/api/v1/listings/${listingResponse.body.id}`)
      .expect(200);

    expect(detailsResponse.body.contactInfo).toBeUndefined();
    expect(detailsResponse.body.mapLocation).toEqual({
      approxLatitude: -1.29,
      approxLongitude: 36.79,
    });

    const myListingsResponse = await request(context.app.getHttpServer())
      .get('/api/v1/listings/my-listings')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(myListingsResponse.body.data[0].id).toBe(listingResponse.body.id);

    const purchaseResponse = await createCreditPurchase(
      context,
      buyer.accessToken,
      buyer.phoneNumber,
      '10_credits',
    );

    await completeSandboxPurchase(context, {
      phoneNumber: buyer.phoneNumber,
      transactionId: purchaseResponse.body.transactionId,
    });

    const balanceResponse = await request(context.app.getHttpServer())
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(balanceResponse.body.balance).toBe(10500);

    const unlockResponse = await createUnlock(context, {
      accessToken: buyer.accessToken,
      listingId: listingResponse.body.id,
    });

    expect(unlockResponse.body.contactInfo.phoneNumber).toBe(owner.phoneNumber);

    const listingDetailsAfterUnlock = await request(context.app.getHttpServer())
      .get(`/api/v1/listings/${listingResponse.body.id}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(listingDetailsAfterUnlock.body.mapLocation).toEqual({
      approxLatitude: -1.29,
      approxLongitude: 36.79,
    });
    expect(listingDetailsAfterUnlock.body.contactInfo.phoneNumber).toBe(owner.phoneNumber);

    const unlockHistoryResponse = await request(context.app.getHttpServer())
      .get('/api/v1/unlocks/my-unlocks')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);

    expect(unlockHistoryResponse.body.data[0].unlockId).toBe(unlockResponse.body.unlockId);

    await createConfirmation(
      context,
      buyer.accessToken,
      unlockResponse.body.unlockId,
      'INCOMING_TENANT',
    );
    const ownerConfirmationResponse = await createConfirmation(
      context,
      owner.accessToken,
      unlockResponse.body.unlockId,
      'OUTGOING_TENANT',
    );

    expect(ownerConfirmationResponse.body.bothConfirmed).toBe(true);

    const disputeResponse = await createDispute(context, {
      accessToken: buyer.accessToken,
      unlockId: unlockResponse.body.unlockId,
      reason: 'Surface flow dispute coverage.',
      evidence: ['https://example.com/evidence/screenshot.png'],
    });

    const adminDisputeResponse = await request(context.app.getHttpServer())
      .get(`/api/v1/disputes/${disputeResponse.body.disputeId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(adminDisputeResponse.body.status).toBe('OPEN');
    expect(adminDisputeResponse.body.evidence).toEqual([
      'https://example.com/evidence/screenshot.png',
    ]);
  });

  it('covers the main admin moderation surface from pending queue to public visibility', async () => {
    const owner = await createVerifiedUser(context);
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const approvedNeighborhood = `Admin-Approved-${Date.now()}`;
    const rejectedNeighborhood = `Admin-Rejected-${Date.now() + 1}`;
    const approvedListing = await createListing(context, owner.accessToken, 'phase8-admin-a', {
      neighborhood: approvedNeighborhood,
      monthlyRent: 24000,
    });
    const rejectedListing = await createListing(context, owner.accessToken, 'phase8-admin-b', {
      neighborhood: rejectedNeighborhood,
      monthlyRent: 26000,
    });

    expect(approvedListing.status).toBe(201);
    expect(rejectedListing.status).toBe(201);

    const pendingResponse = await request(context.app.getHttpServer())
      .get('/api/v1/admin/listings/pending')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(pendingResponse.body.data.map((listing: { id: string }) => listing.id)).toEqual(
      expect.arrayContaining([approvedListing.body.id, rejectedListing.body.id]),
    );

    await approveListing(context, admin.accessToken, approvedListing.body.id);
    await rejectListing(
      context,
      admin.accessToken,
      rejectedListing.body.id,
      'Listing photos are incomplete for moderation.',
    );

    const publicBrowseResponse = await request(context.app.getHttpServer())
      .get('/api/v1/listings')
      .query({
        neighborhoods: `${approvedNeighborhood},${rejectedNeighborhood}`,
      })
      .expect(200);

    expect(publicBrowseResponse.body.data.map((listing: { id: string }) => listing.id)).toContain(
      approvedListing.body.id,
    );
    expect(publicBrowseResponse.body.data.map((listing: { id: string }) => listing.id)).not.toContain(
      rejectedListing.body.id,
    );

    const rejectedOwnerView = await request(context.app.getHttpServer())
      .get('/api/v1/listings/my-listings')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .query({
        status: 'REJECTED',
      })
      .expect(200);

    expect(rejectedOwnerView.body.data[0]).toMatchObject({
      id: rejectedListing.body.id,
      status: 'REJECTED',
    });

    const rejectedListingRecord = await context.prismaService.listing.findUniqueOrThrow({
      where: {
        id: rejectedListing.body.id,
      },
      select: {
        rejectionReason: true,
      },
    });

    expect(rejectedListingRecord.rejectionReason).toBe(
      'Listing photos are incomplete for moderation.',
    );
  });
});
