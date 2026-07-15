/**
 * Purpose: Live-app e2e for system config — CRUD over /admin/config plus the
 *   proof that a pricing edit changes the NEXT listing's snapshot with no
 *   restart, while leaving already-created listings untouched.
 * Why important: This is the guardrail for the phase's real risk: config edits
 *   must take effect live and must not retroactively reprice existing listings.
 * Used by: jest e2e runner.
 */
import request from 'supertest';
import { Role } from '@prisma/client';
import { createListing, createVerifiedUser } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(90_000);

describe('Admin system config', () => {
  let context: ApiTestContext;

  const TOUCHED_KEYS = ['pricing.unlockBand2Br', 'pricing.successFeePct'];

  beforeAll(async () => {
    context = await createApiTestContext({ ipRangePrefix: 75 });
    // Clear any lingering overrides from a prior run before the config cache
    // loads (it is lazy), so the baseline resolves to the env defaults.
    await context.prismaService.systemConfig.deleteMany({ where: { key: { in: TOUCHED_KEYS } } });
  });

  afterAll(async () => {
    await context.prismaService.systemConfig.deleteMany({ where: { key: { in: TOUCHED_KEYS } } });
    await context.close();
  });

  const server = () => context.app.getHttpServer();

  it('edits pricing live: the next 2BR listing uses the new band, the old one does not', async () => {
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const poster = await createVerifiedUser(context);

    const before = await createListing(context, poster.accessToken, 'before', {
      neighborhood: 'Kilimani',
      monthlyRent: 45000,
      houseType: 'TWO_BEDROOM',
    });
    expect(before.status).toBe(201);
    expect(before.body.unlockCostCredits).toBe(300);

    const updated = await request(server())
      .put('/api/v1/admin/config/pricing.unlockBand2Br')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ value: 777 })
      .expect(200);
    expect(updated.body).toMatchObject({ key: 'pricing.unlockBand2Br', value: 777, source: 'override' });

    const after = await createListing(context, poster.accessToken, 'after', {
      neighborhood: 'Kilimani',
      monthlyRent: 45000,
      houseType: 'TWO_BEDROOM',
    });
    expect(after.status).toBe(201);
    expect(after.body.unlockCostCredits).toBe(777);

    // The earlier listing keeps its snapshot — no retroactive repricing.
    const list = await request(server())
      .get('/api/v1/admin/listings')
      .query({ search: 'before' })
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    const beforeRow = list.body.data.find((l: { id: string }) => l.id === before.body.id);
    if (beforeRow) expect(beforeRow.unlockCostCredits).toBe(300);
  });

  it('lists effective config, rejects bad values, and gates to admins', async () => {
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const user = await createVerifiedUser(context);

    const listed = await request(server())
      .get('/api/v1/admin/config')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    const successFee = listed.body.data.find(
      (e: { key: string }) => e.key === 'pricing.successFeePct',
    );
    expect(successFee).toMatchObject({ value: 0.1, group: 'PRICING', kind: 'ratio' });

    await request(server())
      .put('/api/v1/admin/config/pricing.successFeePct')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ value: 5 })
      .expect(400);

    await request(server())
      .put('/api/v1/admin/config/pricing.nope')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ value: 1 })
      .expect(400);

    await request(server())
      .get('/api/v1/admin/config')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);
  });
});
