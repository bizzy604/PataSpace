/**
 * Purpose: Wires the auth feature module — the JWT strategy, guard-facing
 *   JwtModule, and the use-case services (session, registration, password
 *   recovery, token issuance, OTP lifecycle).
 * Why important: The single identity provider now that Clerk is removed.
 * Used by: AppModule; exports JwtModule so other modules can issue/verify
 *   backend tokens.
 */
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import { UserModule } from '../user/user.module';
import { ReferralModule } from '../referral/referral.module';
import { AuthCleanupService } from './auth.cleanup.service';
import { AuthController } from './auth.controller';
import { EmailVerificationController } from './email-verification.controller';
import { AuthService } from './auth.service';
import { AuthOtpService } from './application/auth-otp.service';
import { AuthTokenService } from './application/auth-token.service';
import { PasswordRecoveryService } from './application/password-recovery.service';
import { RegistrationService } from './application/registration.service';
import { EmailVerificationService } from './application/email-verification.service';

@Module({
  imports: [
    UserModule,
    ReferralModule,
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
  controllers: [AuthController, EmailVerificationController],
  providers: [
    JwtStrategy,
    AuthService,
    RegistrationService,
    PasswordRecoveryService,
    AuthTokenService,
    AuthOtpService,
    EmailVerificationService,
    AuthCleanupService,
  ],
  exports: [JwtModule, PassportModule, AuthService],
})
export class AuthModule {}
