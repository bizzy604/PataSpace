import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../utils/create-test-app';

describe('Swagger smoke checks', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the raw OpenAPI document under the versioned docs path', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/docs/openapi.json')
      .expect(200);

    expect(response.body).toMatchObject({
      info: {
        title: 'PataSpace API',
        version: '0.1.0',
      },
    });
    expect(response.body.paths['/health']).toBeDefined();
    expect(response.body.paths['/ready']).toBeDefined();
  });
});
