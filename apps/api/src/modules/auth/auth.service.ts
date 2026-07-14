/**
 * Purpose: Session lifecycle — email+password login, refresh-token
 *   rotation, and logout. Registration and password recovery live in
 *   RegistrationService / PasswordRecoveryService.
 * Why important: The only identity provider now that Clerk is removed;
 *   every access/refresh token pair in the system is minted or rotated
 *   through this service.
 * Used by: AuthController.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  AuthSessionResponse,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
} from '@pataspace/contracts';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/database/prisma.service';
import { userSelect, UserService } from '../user/user.service';
import { assertUserCanAuthenticate } from './domain/auth-eligibility.policy';
import { AuthTokenService } from './application/auth-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async login(input: LoginRequest): Promise<AuthSessionResponse> {
    const user = await this.userService.findStoredByEmail(input.email);
    const invalidCredentials = () =>
      new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });

    if (!user) {
      throw invalidCredentials();
    }

    assertUserCanAuthenticate(user, true);

    if (!user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw invalidCredentials();
    }

    return this.prismaService.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        select: userSelect,
      });

      return this.authTokenService.issueAuthSession(tx, updatedUser);
    });
  }

  async refresh(input: RefreshRequest): Promise<RefreshResponse> {
    const tokenRecord = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash: this.authTokenService.hashRefreshToken(input.refreshToken) },
      include: { user: { select: userSelect } },
    });

    if (!tokenRecord || tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token is invalid or expired',
      });
    }

    assertUserCanAuthenticate(tokenRecord.user);

    return this.prismaService.$transaction(async (tx) => {
      await tx.refreshToken.delete({ where: { id: tokenRecord.id } });

      const [accessToken, nextRefreshToken] = await Promise.all([
        this.authTokenService.createAccessToken(tokenRecord.user),
        this.authTokenService.createRefreshToken(tx, tokenRecord.user.id),
      ]);

      return { accessToken, refreshToken: nextRefreshToken };
    });
  }

  async logout(userId: string, input: LogoutRequest) {
    await this.prismaService.refreshToken.deleteMany({
      where: {
        tokenHash: this.authTokenService.hashRefreshToken(input.refreshToken),
        userId,
      },
    });
  }
}
