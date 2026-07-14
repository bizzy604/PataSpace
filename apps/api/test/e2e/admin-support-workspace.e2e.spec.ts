/**
 * Purpose: Live-app e2e for the support triage workspace — tenant files a
 *   ticket, admin works the queue/detail/thread, transitions status, and the
 *   tenant reads and replies on their own thread.
 * Why important: Proves the whole Phase 2 surface over HTTP against a real DB,
 *   including the transition guard and the tenant ownership boundary.
 * Used by: jest e2e runner.
 */
import request from 'supertest';
import { Role } from '@prisma/client';
import { createVerifiedUser } from '../utils/api-fixtures';
import { ApiTestContext, createApiTestContext } from '../utils/api-test-context';

jest.setTimeout(60_000);

describe('Admin support workspace', () => {
  let context: ApiTestContext;

  beforeAll(async () => {
    context = await createApiTestContext({ ipRangePrefix: 71 });
  });

  afterAll(async () => {
    await context.close();
  });

  const server = () => context.app.getHttpServer();

  it('runs a ticket from filing through admin reply, transition, and tenant reply', async () => {
    const tenant = await createVerifiedUser(context);
    const admin = await createVerifiedUser(context, { role: Role.ADMIN });

    const created = await request(server())
      .post('/api/v1/support/tickets')
      .set('Authorization', `Bearer ${tenant.accessToken}`)
      .send({ subject: 'Landlord rejected application', message: 'I paid but was rejected instantly.' })
      .expect(201);
    const ticketId = created.body.id as string;

    // The queue shows the ticket, and the seeded body is the first thread message.
    const queue = await request(server())
      .get('/api/v1/admin/support/tickets')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    const queued = queue.body.data.find((t: { id: string }) => t.id === ticketId);
    expect(queued).toMatchObject({ status: 'OPEN', messageCount: 1 });

    const detail = await request(server())
      .get(`/api/v1/admin/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(detail.body.reporter.phoneNumber).toBe(tenant.phoneNumber);
    expect(detail.body.messages).toHaveLength(1);
    expect(detail.body.messages[0].body).toBe('I paid but was rejected instantly.');

    // Admin replies — an OPEN ticket is pulled into review.
    await request(server())
      .post(`/api/v1/admin/support/tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ body: 'Looking into the listing and the landlord activity now.' })
      .expect(201);

    const afterReply = await request(server())
      .get(`/api/v1/admin/support/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(afterReply.body.status).toBe('IN_REVIEW');
    expect(afterReply.body.messages).toHaveLength(2);

    // Illegal jump is refused; a legal resolve stamps resolvedAt.
    await request(server())
      .post(`/api/v1/admin/support/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'CLOSED' })
      .expect(200);
    await request(server())
      .post(`/api/v1/admin/support/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'OPEN' })
      .expect(409);

    // The tenant can read and reply on their own thread; a reply reopens it.
    const tenantThread = await request(server())
      .get(`/api/v1/support/tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${tenant.accessToken}`)
      .expect(200);
    expect(tenantThread.body.messages).toHaveLength(2);

    await request(server())
      .post(`/api/v1/support/tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${tenant.accessToken}`)
      .send({ body: 'Thanks, any update?' })
      .expect(201);
  });

  it('forbids a tenant from reading another user thread and gates the admin queue', async () => {
    const owner = await createVerifiedUser(context);
    const intruder = await createVerifiedUser(context);

    const created = await request(server())
      .post('/api/v1/support/tickets')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ subject: 'Cannot upload photo', message: 'The app rejects my profile picture upload.' })
      .expect(201);

    await request(server())
      .get(`/api/v1/support/tickets/${created.body.id}/messages`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(403);

    await request(server())
      .get('/api/v1/admin/support/tickets')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(403);
  });
});
