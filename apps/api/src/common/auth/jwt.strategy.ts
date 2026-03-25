import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './authenticated-request.interface';
import {
  resolveDatabaseAccessModeForRole,
} from '../database/rls-context.util';
import { RequestContextService } from '../request-context/request-context.service';
import { UserService } from '../../modules/user/user.service';

type JwtPayload = {
  sub?: string;
  id?: string;
  role?: Role;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
    private readonly requestContext: RequestContextService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('security.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const userId = payload.sub ?? payload.id;

    if (!userId) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    this.requestContext.set({
      databaseAccessMode: resolveDatabaseAccessModeForRole(payload.role),
      role: payload.role,
      userId,
    });

    const user = await this.userService.findStoredById(userId);

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
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

    return this.userService.toAuthUser(user) as AuthenticatedUser;
  }
}
