/**
 * Purpose: Issues and validates the phone-OTP codes used for registration
 *   verification, resend, and password recovery.
 * Why important: The delete-then-create issuance and the expiry/attempts/
 *   mismatch validation were duplicated across register/verify-otp/resend
 *   before this split; centralizing them means forgot/reset-password reuse
 *   the exact same rules instead of a parallel implementation drifting.
 * Used by: AuthService.
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { hashSecretValue } from '../../../common/security/encryption.util';

@Injectable()
export class AuthOtpService {
  private readonly otpMaxAttempts: number;
  private readonly otpTtlSeconds: number;
  private readonly sandboxOtpCode: string;
  private readonly smsProvider: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.otpMaxAttempts = this.configService.get<number>('security.otpMaxAttempts') ?? 3;
    this.otpTtlSeconds = this.configService.get<number>('security.otpTtlSeconds') ?? 300;
    this.sandboxOtpCode = this.configService.get<string>('security.sandboxOtpCode') ?? '123456';
    this.smsProvider = this.configService.get<string>('infrastructure.sms.provider') ?? 'sandbox';
  }

  get ttlSeconds() {
    return this.otpTtlSeconds;
  }

  /** Replaces any pending OTP for this phone with a fresh one. Caller sends it via SMS. */
  async issue(
    tx: Prisma.TransactionClient,
    phoneNumberHash: string,
  ): Promise<{ code: string; expiresAt: Date }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.otpTtlSeconds * 1000);

    await tx.oTPCode.deleteMany({ where: { phoneNumberHash } });
    await tx.oTPCode.create({
      data: {
        attempts: 0,
        codeHash: hashSecretValue(code),
        expiresAt,
        phoneNumberHash,
        verified: false,
      },
    });

    return { code, expiresAt };
  }

  /**
   * Throws BadRequestException if the phone has no valid pending OTP or the
   * code doesn't match; increments the attempt counter on a mismatch. Does
   * not consume the OTP on success — call `consume` after the caller's
   * state change succeeds.
   */
  async assertValid(phoneNumberHash: string, code: string): Promise<void> {
    const otp = await this.prismaService.oTPCode.findFirst({
      where: { phoneNumberHash, verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now() || otp.attempts >= this.otpMaxAttempts) {
      await this.prismaService.oTPCode.deleteMany({
        where: {
          phoneNumberHash,
          OR: [{ expiresAt: { lt: new Date() } }, { attempts: { gte: this.otpMaxAttempts } }],
        },
      });

      throw new BadRequestException({ code: 'INVALID_OTP', message: 'OTP is invalid or expired' });
    }

    if (otp.codeHash !== hashSecretValue(code)) {
      await this.prismaService.oTPCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });

      throw new BadRequestException({ code: 'INVALID_OTP', message: 'OTP is invalid or expired' });
    }
  }

  /** Deletes every OTP record for the phone. Call inside the same tx that applies the state change. */
  async consume(tx: Prisma.TransactionClient, phoneNumberHash: string): Promise<void> {
    await tx.oTPCode.deleteMany({ where: { phoneNumberHash } });
  }

  private generateCode(): string {
    if (this.smsProvider === 'sandbox' || this.configService.get<string>('app.environment') === 'test') {
      return this.sandboxOtpCode;
    }

    return randomInt(100000, 999999).toString();
  }
}
