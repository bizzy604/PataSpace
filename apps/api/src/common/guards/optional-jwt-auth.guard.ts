/**
 * Purpose: Optional auth guard — validates the token when present but lets anonymous
 *   requests through, allowing responses to be auth-aware without requiring auth.
 * Why important: Used on public browse routes so unlocked listings show their unlock
 *   state for authenticated callers while still being readable without a token.
 * Used by: ListingController browse and detail endpoints.
 */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard(['jwt', 'clerk-jwt']) {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    if (!request.headers.authorization) {
      return true;
    }

    return super.canActivate(context);
  }

  // Never throw — silently drop invalid tokens on optional routes.
  handleRequest<TUser = unknown>(_error: unknown, user: TUser): TUser {
    return user;
  }
}
