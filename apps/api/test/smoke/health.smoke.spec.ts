import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../utils/create-test-app';

describe('API smoke checks', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the health endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'pataspace-api',
    });
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('serves the readiness endpoint without exposing dependency internals', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/ready').expect(200);

    expect(response.body).toMatchObject({
      status: 'ready',
      service: 'pataspace-api',
    });
    expect(response.body.components).toBeUndefined();
    expect(response.headers['x-request-id']).toBeDefined();
  });
});
