import request from 'supertest';
import { Role } from '@prisma/client';
import { approveListing, createListing, createVerifiedUser } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Listing controller integration', () => {
  let context: ApiTestContext;

  beforeAll(async () => {
    context = await createApiTestContext({
      ipRangePrefix: 68,
    });
  });

  afterAll(async () => {
    await context.close();
  });

  it('returns 304 for listing details when If-None-Match matches the current ETag', async () => {
    const owner = await createVerifiedUser(context);
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const listingResponse = await createListing(context, owner.accessToken, 'integration-etag', {
      neighborhood: `Integration-ETag-${Date.now()}`,
      monthlyRent: 22000,
    });

    expect(listingResponse.status).toBe(201);
    await approveListing(context, admin.accessToken, listingResponse.body.id);

    const firstResponse = await request(context.app.getHttpServer())
      .get(`/api/v1/listings/${listingResponse.body.id}`)
      .expect(200);

    expect(firstResponse.headers.etag).toBeTruthy();

    const cachedResponse = await request(context.app.getHttpServer())
      .get(`/api/v1/listings/${listingResponse.body.id}`)
      .set('If-None-Match', firstResponse.headers.etag)
      .expect(304);

    expect(cachedResponse.text).toBe('');
  });

  it('blocks non-admin users from admin listing review routes', async () => {
    const owner = await createVerifiedUser(context);
    const nonAdmin = await createVerifiedUser(context);
    const listingResponse = await createListing(context, owner.accessToken, 'integration-admin', {
      neighborhood: `Integration-Admin-${Date.now()}`,
      monthlyRent: 21000,
    });

    expect(listingResponse.status).toBe(201);
    expect(listingResponse.body.status).toBe('PENDING');

    const pendingQueueResponse = await request(context.app.getHttpServer())
      .get('/api/v1/admin/listings/pending')
      .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
      .expect(403);

    expect(pendingQueueResponse.body.error.code).toBe('FORBIDDEN');

    const approveResponse = await request(context.app.getHttpServer())
      .post(`/api/v1/admin/listings/${listingResponse.body.id}/approve`)
      .set('Authorization', `Bearer ${nonAdmin.accessToken}`)
      .expect(403);

    expect(approveResponse.body.error.code).toBe('FORBIDDEN');
  });
});
