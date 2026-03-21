import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './authenticated-request.interface';

type JwtPayload = {
  sub?: string;
  id?: string;
  role?: Role;
  phoneNumber?: string;
  phoneVerified?: boolean;
  firstName?: string;
  lastName?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('security.jwtSecret'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub ?? payload.id ?? '',
      role: payload.role ?? Role.USER,
      phoneNumber: payload.phoneNumber ?? null,
      phoneVerified: payload.phoneVerified ?? false,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
    };
  }
}
