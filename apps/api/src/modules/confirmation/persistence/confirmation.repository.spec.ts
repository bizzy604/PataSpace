/**
 * Purpose: Gate test that the unlock reads run privileged so RLS grants both
 * parties' user rows. UNLOCK_SELECT spans buyer (incoming tenant) and
 * listing.user (outgoing tenant); users_select_policy only allows
 * privileged-or-self, so under the caller's own context the other party's row
 * comes back empty and Prisma rejects the entire query with "Field buyer is
 * required to return data, got null" — a 500, not a 403.
 * Why important: without runInternal, outgoing-tenant confirmation crashed
 * when it tried to read the unlock because the buyer row was blocked by RLS.
 * Used by: jest runner via apps/api jest config.
 */
import { ConfirmationRepository } from './confirmation.repository';

describe('ConfirmationRepository RLS privilege escalation', () => {
  it('wraps findUnlock in runInternal so both parties can be read', async () => {
    const prismaService = {
      unlock: {
        findUnique: jest.fn(),
      },
    };
    const requestContext = {
      runInternal: jest.fn(<T,>(fn: () => T): T => fn()),
    };

    const repository = new ConfirmationRepository(
      prismaService as never,
      requestContext as never,
    );

    await repository.findUnlock('unlock_1');

    // The wrapper is the guard: without it, users_select_policy drops one of
    // the two user rows and Prisma fails the query before app-level auth can
    // run. ConfirmationService.assertConfirmationAllowed is still the only
    // authorization: it checks the returned unlock against the caller's userId
    // and rejects unauthorized access before the unlock reaches a response body.
    // The authorization spec holds that gate in place.
    expect(requestContext.runInternal).toHaveBeenCalled();
  });
});
