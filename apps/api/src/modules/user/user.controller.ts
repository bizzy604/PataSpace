/**
 * Purpose: HTTP transport for the authenticated user's own profile and account:
 * `GET /users/me`, phone verification (`POST /users/me/phone/*`), and the
 * `DELETE /users/me` account-deletion endpoint App Store / Play Store policy requires.
 * Why important: phone verification here is what unlocks listing submission and
 * M-Pesa purchases for Clerk sign-ins; stays thin, delegating to services.
 * Used by: mobile and web clients via the global Clerk/JWT auth guard.
 */
import { Body, Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  PhoneVerificationRequestResponse,
  RequestPhoneVerificationRequest,
  requestPhoneVerificationSchema,
  UserProfile,
  VerifyPhoneVerificationRequest,
  verifyPhoneVerificationSchema,
} from '@pataspace/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import {
  PhoneVerificationRequestResponseDto,
  RequestPhoneVerificationRequestDto,
  UserProfileResponseDto,
  VerifyPhoneVerificationRequestDto,
} from './user.docs';
import { AccountDeletionService } from './account-deletion.service';
import { PhoneVerificationService } from './phone-verification.service';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly accountDeletion: AccountDeletionService,
    private readonly phoneVerification: PhoneVerificationService,
  ) {}

  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiOkResponse({
    type: UserProfileResponseDto,
    description: 'Minimal authenticated user profile for client bootstrap.',
  })
  @Get('me')
  getMe(@CurrentUser('id') userId: string): Promise<UserProfile> {
    return this.userService.getProfileOrThrow(userId);
  }

  @ApiOperation({
    summary: 'Send a phone-verification OTP to the given number for the current user',
    description:
      'Required before submitting a listing or purchasing credits via M-Pesa when the ' +
      'account (e.g. a Clerk sign-in) has no verified phone yet.',
  })
  @ApiBody({ type: RequestPhoneVerificationRequestDto })
  @ApiOkResponse({
    type: PhoneVerificationRequestResponseDto,
    description: 'OTP issued for the phone number.',
  })
  @ApiRateLimit('phoneVerifyRequest')
  @HttpCode(200)
  @Post('me/phone/request-otp')
  requestPhoneOtp(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(requestPhoneVerificationSchema))
    input: RequestPhoneVerificationRequest,
  ): Promise<PhoneVerificationRequestResponse> {
    return this.phoneVerification.requestOtp(userId, input.phoneNumber);
  }

  @ApiOperation({
    summary: 'Verify the phone OTP and bind the number to the current user',
  })
  @ApiBody({ type: VerifyPhoneVerificationRequestDto })
  @ApiOkResponse({
    type: UserProfileResponseDto,
    description: 'Phone verified; updated profile returned.',
  })
  @ApiRateLimit('phoneVerifyConfirm')
  @HttpCode(200)
  @Post('me/phone/verify-otp')
  verifyPhoneOtp(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(verifyPhoneVerificationSchema))
    input: VerifyPhoneVerificationRequest,
  ): Promise<UserProfile> {
    return this.phoneVerification.verifyOtp(userId, input.phoneNumber, input.code);
  }

  @ApiOperation({
    summary: 'Permanently delete the authenticated account and all its data',
  })
  @ApiNoContentResponse({ description: 'Account and all associated data deleted.' })
  @Delete('me')
  @HttpCode(204)
  deleteMe(@CurrentUser('id') userId: string): Promise<void> {
    return this.accountDeletion.deleteAccount(userId);
  }
}
