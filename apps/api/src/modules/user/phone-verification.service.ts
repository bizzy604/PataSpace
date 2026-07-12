/**
 * Purpose: Authenticated phone verification for the current user: issues an
 * OTP to a phone number and, on verification, binds that number to the
 * account. Clerk sign-ins arrive with no phone, and listing submission and
 * M-Pesa purchases are gated on a verified one.
 * Why important: this is the only path for an already-signed-in user to earn
 * phoneVerified. It works without a real SMS provider: in sandbox mode the
 * OTP is the configured sandbox code, so the flow ships now and Africa's
 * Talking slots in later via SMS_PROVIDER.
 * Used by: UserController (/users/me/phone/request-otp and /verify-otp).
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PhoneVerificationRequestResponse, UserProfile } from '@pataspace/contracts';
import { randomInt } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';
import {
  encryptField,
  hashLookupValue,
  hashSecretValue,
  normalizePhoneNumber,
} from '../../common/security/encryption.util';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { UserService } from './user.service';

@Injectable()
export class PhoneVerificationService {
  private readonly encryptionKey: string;
  private readonly environment: string;
  private readonly otpMaxAttempts: number;
  private readonly otpTtlSeconds: number;
  private readonly sandboxOtpCode: string;
  private readonly smsProvider: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.get<string>('security.encryptionKey') ?? '';
    this.environment = configService.get<string>('app.environment') ?? 'development';
    this.otpMaxAttempts = configService.get<number>('security.otpMaxAttempts') ?? 3;
    this.otpTtlSeconds = configService.get<number>('security.otpTtlSeconds') ?? 300;
    this.sandboxOtpCode = configService.get<string>('security.sandboxOtpCode') ?? '123456';
    this.smsProvider = configService.get<string>('infrastructure.sms.provider') ?? 'sandbox';
  }

  async requestOtp(
    userId: string,
    phoneNumber: string,
  ): Promise<PhoneVerificationRequestResponse> {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);

    await this.assertPhoneAvailable(phoneNumberHash, userId);

    const otpCode = this.generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + this.otpTtlSeconds * 1000);

    await this.prismaService.$transaction(async (tx) => {
      await tx.oTPCode.deleteMany({
        where: { phoneNumberHash },
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
      message: `OTP sent to ${normalizedPhoneNumber}`,
      expiresIn: this.otpTtlSeconds,
    };
  }

  async verifyOtp(userId: string, phoneNumber: string, code: string): Promise<UserProfile> {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);

    const otp = await this.prismaService.oTPCode.findFirst({
      where: {
        phoneNumberHash,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now() || otp.attempts >= this.otpMaxAttempts) {
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

    if (otp.codeHash !== hashSecretValue(code)) {
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

    try {
      await this.prismaService.$transaction(async (tx) => {
        await tx.oTPCode.deleteMany({
          where: { phoneNumberHash },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            phoneNumberEncrypted: encryptField(normalizedPhoneNumber, this.encryptionKey),
            phoneNumberHash,
            phoneVerified: true,
          },
        });
      });
    } catch (error) {
      // The unique phoneNumberHash landed on another row between our
      // availability check and this write — same answer as the check.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw this.phoneAlreadyRegistered();
      }

      throw error;
    }

    return this.userService.getProfileOrThrow(userId);
  }

  private async assertPhoneAvailable(phoneNumberHash: string, userId: string) {
    const owner = await this.prismaService.user.findUnique({
      where: { phoneNumberHash },
      select: { id: true },
    });

    if (owner && owner.id !== userId) {
      throw this.phoneAlreadyRegistered();
    }
  }

  private phoneAlreadyRegistered() {
    return new ConflictException({
      code: 'PHONE_ALREADY_REGISTERED',
      message: 'Phone number is already registered to another account',
    });
  }

  private generateOtpCode() {
    if (this.smsProvider === 'sandbox' || this.environment === 'test') {
      return this.sandboxOtpCode;
    }

    return randomInt(100000, 999999).toString();
  }
}
