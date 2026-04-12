import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ListingService } from '../../src/modules/listing/listing.service';
import { createTestApp } from '../utils/create-test-app';

describe('Public listings smoke checks', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      providerOverrides: [
        {
          token: ListingService,
          value: {
            browseListings: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'listing_smoke_1',
                  county: 'Nairobi',
                  houseType: 'TWO_BEDROOM',
                  neighborhood: 'Kilimani',
                  monthlyRent: 30000,
                },
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
              },
            }),
            getListingDetails: jest.fn().mockResolvedValue({
              id: 'listing_smoke_1',
              county: 'Nairobi',
              houseType: 'TWO_BEDROOM',
              neighborhood: 'Kilimani',
              monthlyRent: 30000,
              contactInfo: undefined,
            }),
          },
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves browse and details routes with etags during local startup checks', async () => {
    const browseResponse = await request(app.getHttpServer()).get('/api/v1/listings').expect(200);

    expect(browseResponse.body.pagination.total).toBe(1);
    expect(browseResponse.body.data[0].id).toBe('listing_smoke_1');
    expect(browseResponse.headers.etag).toBeDefined();

    const detailsResponse = await request(app.getHttpServer())
      .get('/api/v1/listings/listing_smoke_1')
      .expect(200);

    expect(detailsResponse.body.id).toBe('listing_smoke_1');
    expect(detailsResponse.body.contactInfo).toBeUndefined();
    expect(detailsResponse.headers.etag).toBeDefined();
  });
});
