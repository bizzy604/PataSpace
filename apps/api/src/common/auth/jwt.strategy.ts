import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './authenticated-request.interface';
import { UserService } from '../../modules/user/user.service';

type JwtPayload = {
  sub?: string;
  id?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
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

    return this.userService.toAuthUser(user) as AuthenticatedUser;
  }
}
