/**
 * Purpose: Email verification endpoints — request a code+magic-link email,
 *   verify with the 6-digit code, or verify with the signed magic link.
 * Why important: Confirms email ownership using the same OTP rules as phone
 *   verification and gives the user both a code (mobile screen) and a link
 *   (email tap) path.
 * Used by: mobile VerifyEmailScreen and the web verify-email fallback page.
 */
import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  RequestEmailVerificationResponse,
  UserProfile,
  VerifyEmailCodeRequest,
  VerifyEmailLinkRequest,
  verifyEmailCodeSchema,
  verifyEmailLinkSchema,
} from '@pataspace/contracts';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { hashSecretValue } from '../../common/security/encryption.util';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import { EmailService } from '../../infrastructure/email/email.service';
import { buildEmailVerificationEmail } from '../../infrastructure/email/email-verification.template';
import { PrismaService } from '../../common/database/prisma.service';
import { UserService } from '../user/user.service';
import { assertUserCanAuthenticate } from './domain/auth-eligibility.policy';
import { AuthTokenService } from './application/auth-token.service';
import { EmailVerificationService } from './application/email-verification.service';
import { UserProfileResponseDto } from '../user/user.docs';

function hashEmail(email: string): string {
  return hashSecretValue(email.trim().toLowerCase());
}

function buildVerificationLink(email: string, token: string): string {
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  return `${baseUrl}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

export class RequestEmailVerificationResponseDto {
  @ApiProperty({ example: 600, description: 
'Seconds until the code and link expire.'
 })
  expiresIn!: number;
}

export class VerifyEmailCodeRequestDto {
  @ApiProperty({ example: '123456', description: '6-digit code from the verification email.' })
  code!: string;
}

export class VerifyEmailLinkRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'signed.jwt.token' })
  token!: string;
}
@ApiTags('Auth')
@Controller('auth/email-verification')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    private readonly authTokenService: AuthTokenService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly prismaService: PrismaService,
  ) {}

  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Request a 6-digit email verification code and magic link' })
  @ApiOkResponse({
    description: 'Verification email dispatched if the user has an email address.',
    type: RequestEmailVerificationResponseDto,
  })
  @ApiRateLimit('authRequestEmailVerification')
  @Post('request')
  async requestVerification(
    @CurrentUser('id') userId: string,
  ): Promise<RequestEmailVerificationResponse> {
    const user = await this.userService.findStoredById(userId);

    if (!user || !user.email) {
      throw new Error('Cannot request email verification for a user without an email address.');
    }

    assertUserCanAuthenticate(user);

    const emailHash = hashEmail(user.email);
    const { code, expiresAt } = await this.prismaService.$transaction((tx) =>
      this.emailVerificationService.issue(tx, emailHash),
    );
    const token = await this.authTokenService.createEmailVerificationToken(user);
    const verificationLink = buildVerificationLink(user.email, token);
    const verificationEmail = buildEmailVerificationEmail(verificationLink, code);

    await this.emailService.sendMail({
      to: user.email,
      subject: verificationEmail.subject,
      text: verificationEmail.text,
      html: verificationEmail.html,
    }).catch(() => undefined);

    return {
      expiresIn: Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
    };
  }

  @ApiBearerAuth('bearer')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify the email with the 6-digit code from the mail' })
  @ApiBody({ type: VerifyEmailCodeRequestDto })
  @ApiOkResponse({ type: UserProfileResponseDto, description: 'Email verified.' })
  @ApiRateLimit('authVerifyEmailCode')
  @Post('verify-code')
  async verifyCode(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(verifyEmailCodeSchema)) input: VerifyEmailCodeRequest,
  ): Promise<UserProfile> {
    const user = await this.userService.findStoredById(userId);

    if (!user || !user.email) {
      throw new Error('Cannot verify email for a user without an email address.');
    }

    assertUserCanAuthenticate(user);

    const emailHash = hashEmail(user.email);
    await this.emailVerificationService.assertValid(emailHash, input.code);

    const updatedUser = await this.prismaService.$transaction(async (tx) => {
      await this.emailVerificationService.consume(tx, emailHash);
      return tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
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
    });

    return this.userService.toUserProfile(updatedUser);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify the email with the signed magic link from the mail' })
  @ApiBody({ type: VerifyEmailLinkRequestDto })
  @ApiOkResponse({ type: UserProfileResponseDto, description: 'Email verified.' })
  @ApiRateLimit('authVerifyEmailLink')
  @Post('verify-link')
  async verifyLink(
    @Body(new ZodValidationPipe(verifyEmailLinkSchema)) input: VerifyEmailLinkRequest,
  ): Promise<UserProfile> {
    const payload = await this.authTokenService.verifyEmailVerificationToken(input.token);
    const user = await this.userService.findStoredById(payload.sub);

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException({
        code: 'INVALID_MAGIC_LINK',
        message: 'Magic link is invalid or expired',
      });
    }

    assertUserCanAuthenticate(user);

    const updatedUser = await this.prismaService.$transaction(async (tx) => {
      await tx.emailVerificationCode.deleteMany({ where: { emailHash: hashEmail(user.email!) } });
      return tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
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
    });

    return this.userService.toUserProfile(updatedUser);
  }
}





