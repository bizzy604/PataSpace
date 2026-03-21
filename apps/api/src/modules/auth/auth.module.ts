import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import { UserModule } from '../user/user.module';
import { AuthCleanupService } from './auth.cleanup.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UserModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
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
  providers: [JwtStrategy, AuthService, AuthCleanupService],
  exports: [JwtModule, PassportModule, AuthService],
})
export class AuthModule {}
