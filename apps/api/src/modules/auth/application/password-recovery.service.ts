/**
 * Purpose: Forgot/reset-password flow — dispatches a phone OTP for a known
 *   email and, given a valid OTP, sets a new password and revokes sessions.
 * Why important: Password recovery rides the same SMS-OTP rails as phone
 *   verification instead of requiring an email provider (none exists in
 *   this project). Responses must never reveal whether an email is
 *   registered (anti-enumeration).
 * Used by: AuthController.
 */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  AuthSessionResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
} from '@pataspace/contracts';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../../common/database/prisma.service';
import { hashLookupValue } from '../../../common/security/encryption.util';
import { SmsService } from '../../../infrastructure/sms/sms.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { buildMagicLinkEmail, buildPasswordResetEmail } from '../../../infrastructure/email/email-templates';
import { UserService } from '../../user/user.service';
import { assertUserCanAuthenticate } from '../domain/auth-eligibility.policy';
import { AuthOtpService } from './auth-otp.service';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
    private readonly authTokenService: AuthTokenService,
    private readonly authOtpService: AuthOtpService,
    private readonly emailService: EmailService,
  ) {}

  async forgotPassword(input: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const user = await this.userService.findStoredByEmail(input.email);

    if (user && !user.isBanned && user.phoneNumberEncrypted) {
      const normalizedPhoneNumber = this.userService.decryptPhoneNumber(user.phoneNumberEncrypted);
      const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);
      const otp = await this.prismaService.$transaction((tx) =>
        this.authOtpService.issue(tx, phoneNumberHash),
      );

      await this.smsService.sendOtp(normalizedPhoneNumber, otp.code).catch(() => undefined);
      const passwordResetEmail = buildPasswordResetEmail(otp.code);
      await this.emailService.sendMail({
        to: input.email,
        subject: passwordResetEmail.subject,
        text: passwordResetEmail.text,
        html: passwordResetEmail.html,
      }).catch(() => undefined);
    }

    // Anti-enumeration: identical response whether or not the account exists.
    return {
      message: 'If an account exists for this email, an OTP has been sent to the phone on file.',
      expiresIn: this.authOtpService.ttlSeconds,
    };
  }

  async requestMagicLink(input: { email: string }): Promise<void> {
    const user = await this.userService.findStoredByEmail(input.email);

    if (!user || user.isBanned) {
      return;
    }

    const token = await this.authTokenService.createMagicLinkToken(user);
    const signInLink = `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/auth/magic-link?email=${encodeURIComponent(input.email)}&token=${encodeURIComponent(token)}`;
    const magicLinkEmail = buildMagicLinkEmail(signInLink);

    await this.emailService.sendMail({
      to: input.email,
      subject: magicLinkEmail.subject,
      text: magicLinkEmail.text,
      html: magicLinkEmail.html,
    }).catch(() => undefined);
  }

  async signInWithMagicLink(input: { email: string; token: string }): Promise<AuthSessionResponse> {
    const user = await this.userService.findStoredByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException({ code: 'INVALID_MAGIC_LINK', message: 'Magic link is invalid or expired' });
    }

    const payload = await this.authTokenService.verifyMagicLinkToken(input.token);

    if (payload.email !== input.email || payload.sub !== user.id || payload.purpose !== 'magic-link') {
      throw new UnauthorizedException({ code: 'INVALID_MAGIC_LINK', message: 'Magic link is invalid or expired' });
    }

    assertUserCanAuthenticate(user);

    return this.prismaService.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        select: {
          id: true,
          phoneNumberEncrypted: true,
          phoneVerified: true,
          emailVerified: true,
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
        },
      });

      return this.authTokenService.issueAuthSession(tx, updatedUser);
    });
  }

  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    const user = await this.userService.findStoredByEmail(input.email);

    if (!user || !user.phoneNumberEncrypted) {
      throw new BadRequestException({ code: 'INVALID_OTP', message: 'OTP is invalid or expired' });
    }

    const normalizedPhoneNumber = this.userService.decryptPhoneNumber(user.phoneNumberEncrypted);
    const phoneNumberHash = hashLookupValue(normalizedPhoneNumber);

    await this.authOtpService.assertValid(phoneNumberHash, input.code);
    assertUserCanAuthenticate(user);

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await this.prismaService.$transaction(async (tx) => {
      await this.authOtpService.consume(tx, phoneNumberHash);
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await this.authTokenService.revokeAllRefreshTokens(tx, user.id);
    });
  }
}
