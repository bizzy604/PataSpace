/**
 * Purpose: Global authentication guard that accepts both backend-issued JWTs and Clerk JWTs.
 * Why important: Protects all non-public routes while supporting two auth paths —
 *   the phone/OTP backend flow and Clerk SSO used by mobile and web clients.
 * Used by: AppModule as APP_GUARD (applied to every route by default).
 */
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt', 'clerk-jwt']) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    error: unknown,
    user: TUser,
    info: { message?: string } | undefined,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (error) {
      throw error;
    }

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: info?.message ?? 'Authentication required',
      });
    }

    return user;
  }
}
