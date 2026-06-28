/**
 * Purpose: Passport strategy that validates Clerk-issued JWTs and syncs the user to the local DB.
 * Why important: Allows Clerk to act as the identity provider for mobile and web clients
 *   without requiring the backend to issue its own auth tokens for those clients.
 * Used by: JwtAuthGuard and OptionalJwtAuthGuard via AuthGuard(['jwt', 'clerk-jwt']).
 */
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { Strategy } from 'passport-custom';
import { UserService } from '../../modules/user/user.service';
import { RequestContextService } from '../request-context/request-context.service';
import { resolveDatabaseAccessModeForRole } from '../database/rls-context.util';

type BearerRequest = {
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class ClerkJwtStrategy extends PassportStrategy(Strategy, 'clerk-jwt') {
  private readonly clerk: ReturnType<typeof createClerkClient>;
  private readonly clerkSecretKey: string;
  private readonly authorizedParties: string[];

  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
    private readonly requestContext: RequestContextService,
  ) {
    super();
    this.clerkSecretKey = configService.get<string>('security.clerkSecretKey') ?? '';
    this.authorizedParties = configService.get<string[]>('http.allowedOrigins') ?? [];
    this.clerk = createClerkClient({ secretKey: this.clerkSecretKey });
  }

  async validate(req: BearerRequest) {
    const authHeader = req.headers['authorization'];
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    let clerkId: string;
    try {
      // Pass authorizedParties (the configured frontend origins) so a token
      // minted for a different origin (azp mismatch) is rejected. Only applied
      // when origins are configured — production env validation requires them.
      const payload = await verifyToken(token, {
        secretKey: this.clerkSecretKey,
        ...(this.authorizedParties.length > 0
          ? { authorizedParties: this.authorizedParties }
          : {}),
      });
      clerkId = payload.sub;
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }

    // Elevate to 'internal' before any DB access. The middleware only marks
    // auth paths (e.g. /auth/login) as internal; Clerk validation runs on
    // every protected route, so without this the SELECT is hidden by RLS and
    // the INSERT is blocked by the users_insert_policy.
    this.requestContext.set({ databaseAccessMode: 'internal' });

    let user = await this.userService.findStoredByClerkId(clerkId);

    if (!user) {
      const clerkUser = await this.clerk.users.getUser(clerkId);
      const email = clerkUser.primaryEmailAddress?.emailAddress;

      // Account linking: if a phone-OTP account already owns this email, attach
      // the Clerk ID to it rather than failing with a unique constraint on email.
      if (email) {
        const existing = await this.userService.findStoredByEmail(email);
        if (existing) {
          user = await this.userService.linkClerkId(existing.id, clerkId);
        }
      }

      if (!user) {
        user = await this.userService.createFromClerk({
          clerkId,
          email,
          firstName: clerkUser.firstName ?? 'User',
          lastName: clerkUser.lastName ?? '',
        });
      }
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: user.banReason ?? 'Account is banned',
      });
    }

    this.requestContext.set({
      databaseAccessMode: resolveDatabaseAccessModeForRole(user.role),
      role: user.role,
      userId: user.id,
    });

    return this.userService.toAuthUser(user);
  }
}
