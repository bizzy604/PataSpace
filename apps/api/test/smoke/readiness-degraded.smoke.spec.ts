import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../utils/create-test-app';

describe('API readiness edge cases', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      databaseHealth: {
        shouldFail: true,
      },
      smsHealth: {
        status: 'degraded',
        provider: 'africastalking',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns degraded readiness when a critical dependency fails', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/ready').expect(200);

    expect(response.body).toMatchObject({
      status: 'degraded',
      components: {
        database: {
          status: 'down',
        },
        cache: {
          status: 'up',
        },
        queue: {
          status: 'up',
        },
        sms: {
          status: 'degraded',
          provider: 'africastalking',
        },
      },
    });
  });
});
