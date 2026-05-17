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

  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
    private readonly requestContext: RequestContextService,
  ) {
    super();
    this.clerkSecretKey = configService.get<string>('security.clerkSecretKey') ?? '';
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
      const payload = await verifyToken(token, { secretKey: this.clerkSecretKey });
      clerkId = payload.sub;
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }

    let user = await this.userService.findStoredByClerkId(clerkId);

    if (!user) {
      const clerkUser = await this.clerk.users.getUser(clerkId);
      user = await this.userService.createFromClerk({
        clerkId,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        firstName: clerkUser.firstName ?? 'User',
        lastName: clerkUser.lastName ?? '',
      });
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
