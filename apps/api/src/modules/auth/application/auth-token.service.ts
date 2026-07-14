/**
 * Purpose: Mints and rotates the access/refresh token pair and builds the
 *   AuthSessionResponse shape returned to clients.
 * Why important: Token issuance (JWT signing, refresh-token hashing and
 *   persistence) is identical across register/verify-otp/login/refresh;
 *   centralizing it means a change to token TTL or claims happens once.
 * Used by: AuthService.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { AuthSessionResponse, Role as ContractRole } from '@pataspace/contracts';
import { randomBytes } from 'crypto';
import { hashSecretValue } from '../../../common/security/encryption.util';
import { StoredUser, UserService } from '../../user/user.service';

@Injectable()
export class AuthTokenService {
  private readonly accessTokenTtl: string;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenTtlDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.accessTokenTtl = this.configService.get<string>('security.accessTokenTtl') ?? '15m';
    this.refreshTokenSecret =
      this.configService.get<string>('security.jwtRefreshSecret') ?? 'refresh-secret';
    this.refreshTokenTtlDays =
      this.configService.get<number>('security.refreshTokenTtlDays') ?? 30;
  }

  async issueAuthSession(
    tx: Prisma.TransactionClient,
    user: StoredUser,
  ): Promise<AuthSessionResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.createAccessToken(user),
      this.createRefreshToken(tx, user.id),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        ...this.userService.toAuthUser(user),
        role: user.role as unknown as ContractRole,
      },
    };
  }

  async createAccessToken(user: StoredUser) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        phoneNumber: user.phoneNumberEncrypted
          ? this.userService.decryptPhoneNumber(user.phoneNumberEncrypted)
          : null,
        phoneVerified: user.phoneVerified,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      {
        expiresIn: this.accessTokenTtl,
      } as never,
    );
  }

  async createRefreshToken(tx: Prisma.TransactionClient, userId: string) {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    await tx.refreshToken.create({
      data: {
        expiresAt,
        tokenHash: this.hashRefreshToken(refreshToken),
        userId,
      },
    });

    return refreshToken;
  }

  /** Deletes every outstanding refresh token for a user (password reset). */
  async revokeAllRefreshTokens(tx: Prisma.TransactionClient, userId: string) {
    await tx.refreshToken.deleteMany({ where: { userId } });
  }

  hashRefreshToken(token: string) {
    return hashSecretValue(`${token}:${this.refreshTokenSecret}`);
  }
}
