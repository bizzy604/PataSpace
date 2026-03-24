import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import {
  AuthSessionResponse,
  Role as ContractRole,
  RefreshResponse,
  RefreshRequest,
  ResendOtpRequest,
  ResendOtpResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyOtpRequest,
  LoginRequest,
  LogoutRequest,
} from '@pataspace/contracts';
import bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';
import {
  encryptField,
  hashLookupValue,
  hashSecretValue,
  normalizePhoneNumber,
} from '../../common/security/encryption.util';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { UserService, StoredUser } from '../user/user.service';

@Injectable()
export class AuthService {
  private readonly accessTokenTtl: string;
  private readonly encryptionKey: string;
  private readonly otpMaxAttempts: number;
  private readonly otpTtlSeconds: number;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenTtlDays: number;
  private readonly sandboxOtpCode: string;
  private readonly smsProvider: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
  ) {
    this.accessTokenTtl = this.configService.get<string>('security.accessTokenTtl') ?? '15m';
    this.encryptionKey = this.configService.get<string>('security.encryptionKey') ?? '';
    this.otpMaxAttempts = this.configService.get<number>('security.otpMaxAttempts') ?? 3;
    this.otpTtlSeconds = this.configService.get<number>('security.otpTtlSeconds') ?? 300;
    this.refreshTokenSecret =
      this.configService.get<string>('security.jwtRefreshSecret') ?? 'refresh-secret';
    this.refreshTokenTtlDays =
      this.configService.get<number>('security.refreshTokenTtlDays') ?? 30;
    this.sandboxOtpCode = this.configService.get<string>('security.sandboxOtpCode') ?? '123456';
    this.smsProvider = this.configService.get<string>('infrastructure.sms.provider') ?? 'sandbox';
  }

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
    const normalizedEmail = input.email?.trim().toLowerCase();
    const existingUser = await this.userService.findStoredByPhoneNumber(normalizedPhoneNumber);

    if (existingUser?.phoneVerified) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_REGISTERED',
        message: 'Phone number is already registered',
      });
    }

    if (existingUser?.isBanned) {
      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: existingUser.banReason ?? 'Account is banned',
      });
    }

    if (normalizedEmail) {
      const existingEmailUser = await this.userService.findStoredByEmail(normalizedEmail);

      if (existingEmailUser && existingEmailUser.id !== existingUser?.id) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Email address is already registered',
        });
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const otpCode = this.generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + this.otpTtlSeconds * 1000);

    const user = await this.prismaService.$transaction(async (tx) => {
      await tx.oTPCode.deleteMany({
        where: { phoneNumberHash },
      });

      if (existingUser) {
        const updatedUser = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            email: normalizedEmail,
            firstName: input.firstName.trim(),
            isActive: true,
            lastName: input.lastName.trim(),
            passwordHash,
            phoneNumberEncrypted: encryptField(normalizedPhoneNumber, this.encryptionKey),
            phoneVerified: false,
          },
          select: {
            id: true,
          },
        });

        await tx.oTPCode.create({
          data: {
            attempts: 0,
            codeHash: hashSecretValue(otpCode),
            expiresAt: otpExpiresAt,
            phoneNumberHash,
            verified: false,
          },
        });

        return updatedUser;
      }

      const createdUser = await tx.user.create({
        data: {
          credit: {
            create: {
              balance: 0,
              lifetimeEarned: 0,
              lifetimeSpent: 0,
            },
          },
          email: normalizedEmail,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          passwordHash,
          phoneNumberEncrypted: encryptField(normalizedPhoneNumber, this.encryptionKey),
          phoneNumberHash,
          phoneVerified: false,
          role: Role.USER,
        },
        select: {
          id: true,
        },
      });

      await tx.oTPCode.create({
        data: {
          attempts: 0,
          codeHash: hashSecretValue(otpCode),
          expiresAt: otpExpiresAt,
          phoneNumberHash,
          verified: false,
        },
      });

      return createdUser;
    });

    await this.smsService.sendOtp(normalizedPhoneNumber, otpCode);

    return {
      userId: user.id,
      message: `OTP sent to ${normalizedPhoneNumber}`,
      expiresIn: this.otpTtlSeconds,
    };
  }

  async verifyOtp(input: VerifyOtpRequest): Promise<AuthSessionResponse> {
    const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
    const user = await this.userService.findStoredByPhoneNumber(normalizedPhoneNumber);
    const otp = await this.prismaService.oTPCode.findFirst({
      where: {
        phoneNumberHash,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!user || !otp || otp.expiresAt.getTime() < Date.now() || otp.attempts >= this.otpMaxAttempts) {
      await this.prismaService.oTPCode.deleteMany({
        where: {
          phoneNumberHash,
          OR: [
            { expiresAt: { lt: new Date() } },
            { attempts: { gte: this.otpMaxAttempts } },
          ],
        },
      });

      throw new BadRequestException({
        code: 'INVALID_OTP',
        message: 'OTP is invalid or expired',
      });
    }

    if (otp.codeHash !== hashSecretValue(input.code)) {
      await this.prismaService.oTPCode.update({
        where: { id: otp.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException({
        code: 'INVALID_OTP',
        message: 'OTP is invalid or expired',
      });
    }

    this.assertUserCanAuthenticate(user);

    return this.prismaService.$transaction(async (tx) => {
      await tx.oTPCode.deleteMany({
        where: {
          phoneNumberHash,
        },
      });

      const verifiedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastLoginAt: new Date(),
          phoneVerified: true,
        },
        select: this.getStoredUserSelect(),
      });

      return this.issueAuthSession(tx, verifiedUser);
    });
  }

  async resendOtp(input: ResendOtpRequest): Promise<ResendOtpResponse> {
    const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
    const user = await this.userService.findStoredByPhoneNumber(normalizedPhoneNumber);

    if (!user) {
      throw new NotFoundException({
        code: 'PENDING_ACCOUNT_NOT_FOUND',
        message: 'Pending account was not found for this phone number',
      });
    }

    if (user.phoneVerified) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_VERIFIED',
        message: 'Phone number is already verified',
      });
    }

    this.assertUserCanAuthenticate(user);

    const otpCode = this.generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + this.otpTtlSeconds * 1000);

    await this.prismaService.$transaction(async (tx) => {
      await tx.oTPCode.deleteMany({
        where: {
          phoneNumberHash,
        },
      });

      await tx.oTPCode.create({
        data: {
          attempts: 0,
          codeHash: hashSecretValue(otpCode),
          expiresAt: otpExpiresAt,
          phoneNumberHash,
          verified: false,
        },
      });
    });

    await this.smsService.sendOtp(normalizedPhoneNumber, otpCode);

    return {
      userId: user.id,
      message: `OTP resent to ${normalizedPhoneNumber}`,
      expiresIn: this.otpTtlSeconds,
    };
  }

  async login(input: LoginRequest): Promise<AuthSessionResponse> {
    const user = await this.userService.findStoredByPhoneNumber(input.phoneNumber);

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Phone number or password is incorrect',
      });
    }

    this.assertUserCanAuthenticate(user, true);

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Phone number or password is incorrect',
      });
    }

    return this.prismaService.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
        select: this.getStoredUserSelect(),
      });

      return this.issueAuthSession(tx, updatedUser);
    });
  }

  async refresh(input: RefreshRequest): Promise<RefreshResponse> {
    const tokenRecord = await this.prismaService.refreshToken.findUnique({
      where: {
        tokenHash: this.hashRefreshToken(input.refreshToken),
      },
      include: {
        user: {
          select: this.getStoredUserSelect(),
        },
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token is invalid or expired',
      });
    }

    this.assertUserCanAuthenticate(tokenRecord.user);

    return this.prismaService.$transaction(async (tx) => {
      await tx.refreshToken.delete({
        where: {
          id: tokenRecord.id,
        },
      });

      const nextRefreshToken = await this.createRefreshToken(tx, tokenRecord.user.id);
      const accessToken = await this.createAccessToken(tokenRecord.user);

      return {
        accessToken,
        refreshToken: nextRefreshToken,
      };
    });
  }

  async logout(userId: string, input: LogoutRequest) {
    await this.prismaService.refreshToken.deleteMany({
      where: {
        tokenHash: this.hashRefreshToken(input.refreshToken),
        userId,
      },
    });
  }

  private async issueAuthSession(
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

  private async createAccessToken(user: StoredUser) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        phoneNumber: this.userService.decryptPhoneNumber(user.phoneNumberEncrypted),
        phoneVerified: user.phoneVerified,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      {
        expiresIn: this.accessTokenTtl,
      } as never,
    );
  }

  private async createRefreshToken(tx: Prisma.TransactionClient, userId: string) {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    );

    await tx.refreshToken.create({
      data: {
        expiresAt,
        tokenHash: this.hashRefreshToken(refreshToken),
        userId,
      },
    });

    return refreshToken;
  }

  private hashRefreshToken(token: string) {
    return hashSecretValue(`${token}:${this.refreshTokenSecret}`);
  }

  private generateOtpCode() {
    if (this.smsProvider === 'sandbox' || this.configService.get<string>('app.environment') === 'test') {
      return this.sandboxOtpCode;
    }

    return randomInt(100000, 999999).toString();
  }

  private assertUserCanAuthenticate(user: StoredUser, requireVerified = false) {
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

    if (requireVerified && !user.phoneVerified) {
      throw new ForbiddenException({
        code: 'PHONE_NOT_VERIFIED',
        message: 'Phone number has not been verified',
      });
    }
  }

  private getStoredUserSelect() {
    return {
      id: true,
      phoneNumberEncrypted: true,
      phoneVerified: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isBanned: true,
      banReason: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    } as const;
  }
}
