/**
 * Purpose: Issues and validates the email-verification codes used to confirm
 *   ownership of a user's email address.
 * Why important: Email verification reuses the same expiry/attempts/mismatch
 *   rules as the phone OTP service so the two flows cannot drift. A code and
 *   a signed magic-link token are issued together; either one verifies the
 *   address.
 * Used by: EmailVerificationController.
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { hashSecretValue } from '../../../common/security/encryption.util';

@Injectable()
export class EmailVerificationService {
  private readonly otpMaxAttempts: number;
  private readonly otpTtlSeconds: number;
  private readonly sandboxOtpCode: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.otpMaxAttempts = this.configService.get<number>('security.otpMaxAttempts') ?? 3;
    this.otpTtlSeconds = this.configService.get<number>('security.otpTtlSeconds') ?? 300;
    this.sandboxOtpCode = this.configService.get<string>('security.sandboxOtpCode') ?? '123456';
  }

  get ttlSeconds() {
    return this.otpTtlSeconds;
  }

  /** Replaces any pending code for this email with a fresh one. Caller sends it via email. */
  async issue(
    tx: Prisma.TransactionClient,
    emailHash: string,
  ): Promise<{ code: string; expiresAt: Date }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.otpTtlSeconds * 1000);

    await tx.emailVerificationCode.deleteMany({ where: { emailHash } });
    await tx.emailVerificationCode.create({
      data: {
        attempts: 0,
        codeHash: hashSecretValue(code),
        emailHash,
        expiresAt,
        verified: false,
      },
    });

    return { code, expiresAt };
  }

  /**
   * Throws BadRequestException if the email has no valid pending code or the
   * code doesn't match; increments the attempt counter on a mismatch. Does
   * not consume the code on success — call `consume` after the caller's
   * state change succeeds.
   */
  async assertValid(emailHash: string, code: string): Promise<void> {
    const record = await this.prismaService.emailVerificationCode.findFirst({
      where: { emailHash, verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt.getTime() < Date.now() || record.attempts >= this.otpMaxAttempts) {
      await this.prismaService.emailVerificationCode.deleteMany({
        where: {
          emailHash,
          OR: [{ expiresAt: { lt: new Date() } }, { attempts: { gte: this.otpMaxAttempts } }],
        },
      });

      throw new BadRequestException({
        code: 'INVALID_EMAIL_VERIFICATION_CODE',
        message: 'Verification code is invalid or expired',
      });
    }

    if (record.codeHash !== hashSecretValue(code)) {
      await this.prismaService.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      throw new BadRequestException({
        code: 'INVALID_EMAIL_VERIFICATION_CODE',
        message: 'Verification code is invalid or expired',
      });
    }
  }

  /** Deletes every verification code for the email. Call inside the same tx that applies the state change. */
  async consume(tx: Prisma.TransactionClient, emailHash: string): Promise<void> {
    await tx.emailVerificationCode.deleteMany({ where: { emailHash } });
  }

  private generateCode(): string {
    if (this.configService.get<string>('app.environment') === 'test') {
      return this.sandboxOtpCode;
    }

    return randomInt(100000, 999999).toString();
  }
}
