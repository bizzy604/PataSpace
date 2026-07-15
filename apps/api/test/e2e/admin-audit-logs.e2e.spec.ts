/**
 * Purpose: Live-app e2e for the audit-log console — an admin mutation writes a
 *   trail row that the filtered list surfaces and the CSV export returns.
 * Why important: Proves the read + export path over HTTP against a real DB,
 *   including the action filter and the text/csv response.
 * Used by: jest e2e runner.
 */
import request from 'supertest';
import { Role } from '@prisma/client';
import { createVerifiedUser } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Admin audit logs', () => {
  let context: ApiTestContext;

  beforeAll(async () => {
    context = await createApiTestContext({ ipRangePrefix: 73 });
  });

  afterAll(async () => {
    await context.close();
  });

  const server = () => context.app.getHttpServer();

  it('surfaces an admin action in the filtered list and CSV export', async () => {
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });
    const target = await createVerifiedUser(context);

    await request(server())
      .post(`/api/v1/admin/users/${target.userId}/ban`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ reason: 'Repeated fraudulent listings' })
      .expect(200);

    const list = await request(server())
      .get('/api/v1/admin/audit-logs')
      .query({ action: 'user.ban', entityId: target.userId })
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(list.body.data.length).toBeGreaterThanOrEqual(1);
    const entry = list.body.data.find(
      (row: { entityId: string }) => row.entityId === target.userId,
    );
    expect(entry).toMatchObject({ action: 'user.ban', entityType: 'User' });
    expect(entry.admin.id).toBe(admin.userId);

    const csv = await request(server())
      .get('/api/v1/admin/audit-logs/export')
      .query({ action: 'user.ban', entityId: target.userId })
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
      .expect('Content-Type', /text\/csv/);

    expect(csv.text.split('\r\n')[0]).toContain('id,createdAt,action');
    expect(csv.text).toContain('user.ban');
    expect(csv.text).toContain(target.userId);
  });

  it('gates the console to admins', async () => {
    const user = await createVerifiedUser(context);

    await request(server())
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);
  });
});
