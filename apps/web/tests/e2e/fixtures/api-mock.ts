/**
 * Purpose: Playwright fixture that intercepts /api/v1 requests and tracks them.
 * Why important: Lets tests assert that a page actually calls the backend (the
 *   "is everything wired to the API?" check) without needing the real API
 *   running. We provide deterministic mock responses for the routes the
 *   workspace fetches.
 * Used by: tests under apps/web/tests/e2e.
 */
import { test as base, type Page, type Route } from '@playwright/test';

type ApiCall = {
  method: string;
  pathname: string;
  url: string;
};

type ApiFixture = {
  /** All recorded API calls in chronological order. */
  apiCalls: ApiCall[];
  /** Truthy assertion helper — fails the test if no call matched. */
  expectApiCall: (predicate: (call: ApiCall) => boolean, label: string) => void;
};

const EMPTY_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

const ROUTE_FIXTURES: Array<{
  match: (url: URL) => boolean;
  body: unknown;
  status?: number;
}> = [
  {
    match: (url) => url.pathname.endsWith('/listings'),
    body: { data: [], pagination: EMPTY_PAGINATION },
  },
  {
    match: (url) => /\/listings\/[^/]+$/.test(url.pathname),
    body: {
      id: 'cm8mocklisting',
      county: 'Nairobi',
      neighborhood: 'Kilimani',
      monthlyRent: 25000,
      bedrooms: 2,
      bathrooms: 1,
      houseType: 'TWO_BEDROOM',
      propertyType: 'Apartment',
      furnished: false,
      availableFrom: '2026-06-01T00:00:00.000Z',
      unlockCostCredits: 2500,
      viewCount: 12,
      unlockCount: 0,
      isUnlocked: false,
      createdAt: '2026-04-01T00:00:00.000Z',
      mapLocation: { approxLatitude: -1.29, approxLongitude: 36.79 },
      tenant: { firstName: 'Amina', joinedDate: '2025-12-09T00:00:00.000Z', listingsPosted: 1 },
      description: 'Bright two-bedroom near Yaya Centre.',
      amenities: ['Parking'],
      photos: [],
    },
  },
  {
    match: (url) => url.pathname.endsWith('/credits/balance'),
    body: { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0, pendingCommissions: 0 },
  },
  {
    match: (url) => url.pathname.endsWith('/credits/transactions'),
    body: { data: [], pagination: EMPTY_PAGINATION },
  },
  {
    match: (url) => url.pathname.endsWith('/unlocks/my-unlocks'),
    body: { data: [], pagination: EMPTY_PAGINATION },
  },
  {
    match: (url) => url.pathname.endsWith('/me/saved-listings'),
    body: { data: [], pagination: EMPTY_PAGINATION },
  },
  {
    match: (url) => url.pathname.endsWith('/referrals/me'),
    body: { data: [], pagination: EMPTY_PAGINATION },
  },
  {
    match: (url) => url.pathname.endsWith('/support/tickets/me'),
    body: { data: [], pagination: EMPTY_PAGINATION },
  },
  {
    match: (url) => url.pathname.endsWith('/users/me'),
    body: {
      id: 'cm8mockuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phoneNumber: '+254700000001',
      phoneVerified: true,
      role: 'USER',
    },
  },
];

export const test = base.extend<ApiFixture>({
  apiCalls: async ({ page }, use) => {
    const calls: ApiCall[] = [];
    await mockApi(page, calls);
    await use(calls);
  },
  expectApiCall: async ({ apiCalls }, use) => {
    const helper: ApiFixture['expectApiCall'] = (predicate, label) => {
      const matched = apiCalls.some(predicate);
      if (!matched) {
        const seen = apiCalls
          .map((call) => `${call.method} ${call.pathname}`)
          .join('\n  ');
        throw new Error(
          `Expected API call "${label}" but it was never made.\nSeen:\n  ${seen || '(none)'}`,
        );
      }
    };
    await use(helper);
  },
});

export const expect = test.expect;

async function mockApi(page: Page, calls: ApiCall[]): Promise<void> {
  await page.route(/\/api\/v1\//, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    calls.push({ method: request.method(), pathname: url.pathname, url: request.url() });

    const fixture = ROUTE_FIXTURES.find((entry) => entry.match(url));
    if (!fixture) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'NOT_FOUND_IN_MOCK', message: `No mock for ${url.pathname}` }),
      });
      return;
    }

    await route.fulfill({
      status: fixture.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture.body),
    });
  });
}
