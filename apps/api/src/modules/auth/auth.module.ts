/**
 * Purpose: Wires together all authentication providers — backend OTP/JWT and Clerk SSO.
 * Why important: Registers both JwtStrategy (backend-issued tokens) and ClerkJwtStrategy
 *   (Clerk-issued tokens) so the global JwtAuthGuard can accept either.
 * Used by: AppModule; exports JwtModule so other modules can issue/verify backend tokens.
 */
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import { ClerkJwtStrategy } from '../../common/auth/clerk-jwt.strategy';
import { UserModule } from '../user/user.module';
import { AuthCleanupService } from './auth.cleanup.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('security.jwtSecret'),
        signOptions: {
          expiresIn: (configService.get<string>('security.accessTokenTtl') ?? '15m') as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, ClerkJwtStrategy, AuthService, AuthCleanupService],
  exports: [JwtModule, PassportModule, AuthService],
})
export class AuthModule {}
