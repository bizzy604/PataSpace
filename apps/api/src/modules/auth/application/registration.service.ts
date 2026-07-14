/**
 * Purpose: Handles account registration and the phone-OTP verification
 *   lifecycle (register, verify-otp, resend-otp).
 * Why important: Registration is email-identified but phone-OTP verified —
 *   this use case owns both the email/phone conflict rules and the OTP
 *   issuance that AuthOtpService performs on its behalf.
 * Used by: AuthController.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthSessionResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  VerifyOtpRequest,
} from '@pataspace/contracts';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  encryptField,
  hashLookupValue,
  normalizePhoneNumber,
} from '../../../common/security/encryption.util';
import { SmsService } from '../../../infrastructure/sms/sms.service';
import { userSelect, UserService } from '../../user/user.service';
import { ReferralService } from '../../referral/referral.service';
import { assertUserCanAuthenticate } from '../domain/auth-eligibility.policy';
import { AuthOtpService } from './auth-otp.service';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class RegistrationService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
    private readonly referralService: ReferralService,
    private readonly authTokenService: AuthTokenService,
    private readonly authOtpService: AuthOtpService,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.get<string>('security.encryptionKey') ?? '';
  }

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
    const existingByEmail = await this.userService.findStoredByEmail(input.email);

    if (existingByEmail?.phoneVerified) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Email address is already registered',
      });
    }

    if (existingByEmail?.isBanned) {
      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: existingByEmail.banReason ?? 'Account is banned',
      });
    }

    const existingByPhone = await this.userService.findStoredByPhoneNumber(normalizedPhoneNumber);

    if (existingByPhone && existingByPhone.id !== existingByEmail?.id) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_REGISTERED',
        message: 'Phone number is already registered',
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const phoneNumberEncrypted = encryptField(normalizedPhoneNumber, this.encryptionKey);

    const { userId, otpCode } = await this.prismaService.$transaction(async (tx) => {
      const userData = {
        email: input.email,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash,
        phoneNumberEncrypted,
        phoneNumberHash,
        phoneVerified: false,
      };

      const user = existingByEmail
        ? await tx.user.update({
            where: { id: existingByEmail.id },
            data: { ...userData, isActive: true },
            select: { id: true },
          })
        : await tx.user.create({
            data: {
              ...userData,
              role: 'USER',
              credit: { create: { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 } },
            },
            select: { id: true },
          });

      const otp = await this.authOtpService.issue(tx, phoneNumberHash);

      return { userId: user.id, otpCode: otp.code };
    });

    await this.smsService.sendOtp(normalizedPhoneNumber, otpCode);

    return {
      userId,
      message: `OTP sent to ${normalizedPhoneNumber}`,
      expiresIn: this.authOtpService.ttlSeconds,
    };
  }

  async verifyOtp(input: VerifyOtpRequest): Promise<AuthSessionResponse> {
    const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
    const user = await this.userService.findStoredByPhoneNumber(normalizedPhoneNumber);

    if (!user) {
      throw new BadRequestException({ code: 'INVALID_OTP', message: 'OTP is invalid or expired' });
    }

    await this.authOtpService.assertValid(phoneNumberHash, input.code);
    assertUserCanAuthenticate(user);

    const session = await this.prismaService.$transaction(async (tx) => {
      await this.authOtpService.consume(tx, phoneNumberHash);

      const verifiedUser = await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), phoneVerified: true },
        select: userSelect,
      });

      return this.authTokenService.issueAuthSession(tx, verifiedUser);
    });

    // Best-effort — never blocks the auth response if it fails.
    await this.referralService
      .linkPendingReferral(phoneNumberHash, session.user.id)
      .catch(() => undefined);

    return session;
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

    assertUserCanAuthenticate(user);

    const otp = await this.prismaService.$transaction((tx) =>
      this.authOtpService.issue(tx, phoneNumberHash),
    );

    await this.smsService.sendOtp(normalizedPhoneNumber, otp.code);

    return {
      userId: user.id,
      message: `OTP resent to ${normalizedPhoneNumber}`,
      expiresIn: this.authOtpService.ttlSeconds,
    };
  }
}
