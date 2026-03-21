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
      servers: [
        {
          url: '/api/v1',
          description: 'Current environment',
        },
      ],
    });
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        '/auth/register',
        '/auth/verify-otp',
        '/auth/login',
        '/auth/refresh',
        '/auth/logout',
        '/users/me',
        '/listings',
        '/listings/my-listings',
        '/listings/{id}',
        '/uploads/presigned-url',
        '/uploads/confirm',
        '/admin/listings/pending',
        '/admin/listings/{id}/approve',
        '/admin/listings/{id}/reject',
        '/health',
        '/ready',
      ]),
    );
    expect(response.body.paths['/auth/login'].post.tags).toEqual(
      expect.arrayContaining(['Auth']),
    );
    expect(response.body.paths['/users/me'].get.tags).toEqual(
      expect.arrayContaining(['Users']),
    );
    expect(response.body.paths['/listings'].get.tags).toEqual(
      expect.arrayContaining(['Listings']),
    );
    expect(response.body.paths['/uploads/presigned-url'].post.tags).toEqual(
      expect.arrayContaining(['Uploads']),
    );
    expect(response.body.paths['/admin/listings/pending'].get.tags).toEqual(
      expect.arrayContaining(['Admin']),
    );
    expect(response.body.paths['/health'].get.tags).toEqual(
      expect.arrayContaining(['System']),
    );
  });
});
