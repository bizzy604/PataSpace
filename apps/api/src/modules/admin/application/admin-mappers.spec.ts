/**
 * Purpose: Gate tests for the pure admin mappers — filter construction for
 *   user/listing queries and PATCH payload conversion.
 * Why important: Filter bugs here would hide banned users or deleted listings
 *   from the console, or write raw ISO strings where Prisma expects Dates.
 * Used by: jest runner via apps/api jest config.
 */
import { Role } from '@pataspace/contracts';
import { buildListingsWhere, buildListingUpdateData } from './admin-listing.mapper';
import { buildUsersWhere } from './admin-user.mapper';

describe('admin mappers', () => {
  it('builds user filters for role, banned state, and search', () => {
    expect(buildUsersWhere({ page: 1, limit: 20 })).toEqual({});
    expect(
      buildUsersWhere({ page: 1, limit: 20, role: Role.ADMIN, banned: 'true', search: 'jo' }),
    ).toEqual({
      role: Role.ADMIN,
      isBanned: true,
      OR: [
        { firstName: { contains: 'jo', mode: 'insensitive' } },
        { lastName: { contains: 'jo', mode: 'insensitive' } },
        { email: { contains: 'jo', mode: 'insensitive' } },
      ],
    });
    expect(buildUsersWhere({ page: 1, limit: 20, banned: 'false' })).toEqual({
      isBanned: false,
    });
  });

  it('hides deleted listings unless explicitly included', () => {
    expect(buildListingsWhere({ page: 1, limit: 20 })).toEqual({ isDeleted: false });
    expect(buildListingsWhere({ page: 1, limit: 20, includeDeleted: 'true' })).toEqual({});
  });

  it('converts availability strings to Dates and preserves null clearing', () => {
    const data = buildListingUpdateData({
      monthlyRent: 30000,
      availableFrom: '2026-05-01T00:00:00.000Z',
      availableTo: null,
    });

    expect(data).toEqual({
      monthlyRent: 30000,
      availableFrom: new Date('2026-05-01T00:00:00.000Z'),
      availableTo: null,
    });
  });

  it('leaves availability untouched when absent from the patch', () => {
    expect(buildListingUpdateData({ description: 'Updated description text' })).toEqual({
      description: 'Updated description text',
    });
  });
});
