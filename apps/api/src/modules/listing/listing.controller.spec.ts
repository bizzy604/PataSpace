import { ListingController } from './listing.controller';

describe('ListingController', () => {
  const createResponse = () => ({
    setHeader: jest.fn(),
    status: jest.fn(),
  });

  it('returns the browse payload with an ETag when the request is fresh', async () => {
    const listingService = {
      browseListings: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'listing_1',
          },
        ],
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 20,
          page: 1,
          total: 1,
          totalPages: 1,
        },
      }),
    };
    const controller = new ListingController(listingService as never);
    const response = createResponse();

    const result = await controller.browseListings(
      {} as never,
      undefined,
      {
        headers: {},
      } as never,
      response,
    );

    expect(result).toMatchObject({
      data: [{ id: 'listing_1' }],
    });
    expect(response.setHeader).toHaveBeenCalledWith(
      'ETag',
      expect.stringMatching(/^".+"$/),
    );
    expect(response.status).not.toHaveBeenCalled();
  });

  it('returns 304 without a payload when the ETag matches If-None-Match', async () => {
    const payload = {
      data: [
        {
          id: 'listing_1',
        },
      ],
      pagination: {
        hasNext: false,
        hasPrev: false,
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
      },
    };
    const listingService = {
      browseListings: jest.fn().mockResolvedValue(payload),
    };
    const controller = new ListingController(listingService as never);
    const initialResponse = createResponse();

    await controller.browseListings(
      {} as never,
      undefined,
      {
        headers: {},
      } as never,
      initialResponse,
    );

    const etag = initialResponse.setHeader.mock.calls[0][1] as string;
    const replayResponse = createResponse();

    const result = await controller.browseListings(
      {} as never,
      undefined,
      {
        headers: {
          'if-none-match': etag,
        },
      } as never,
      replayResponse,
    );

    expect(result).toBeUndefined();
    expect(replayResponse.status).toHaveBeenCalledWith(304);
  });
});
