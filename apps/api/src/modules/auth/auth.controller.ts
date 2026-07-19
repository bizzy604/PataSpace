import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthSessionResponse,
  ForgotPasswordRequest,
  forgotPasswordSchema,
  ForgotPasswordResponse,
  loginSchema,
  magicLinkRequestSchema,
  magicLinkSignInSchema,
  LoginRequest,
  LogoutRequest,
  logoutSchema,
  resendOtpSchema,
  ResendOtpRequest,
  ResendOtpResponse,
  refreshSchema,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  registerSchema,
  RefreshResponse,
  resetPasswordSchema,
  ResetPasswordRequest,
  verifyOtpSchema,
  VerifyOtpRequest,
} from '@pataspace/contracts';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import {
  AuthSessionResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  LoginRequestDto,
  LogoutRequestDto,
  RefreshRequestDto,
  RefreshResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  ResendOtpRequestDto,
  ResendOtpResponseDto,
  ResetPasswordRequestDto,
  VerifyOtpRequestDto,
} from './auth.docs';
import { AuthService } from './auth.service';
import { PasswordRecoveryService } from './application/password-recovery.service';
import { RegistrationService } from './application/registration.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService,
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Register with email + password and send an OTP to verify the phone number' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiCreatedResponse({
    type: RegisterResponseDto,
    description: 'Pending account created or updated and OTP dispatched.',
  })
  @ApiRateLimit('authRegister')
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterRequest,
  ): Promise<RegisterResponse> {
    return this.registrationService.register(input);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify the phone OTP and return an authenticated session' })
  @ApiBody({ type: VerifyOtpRequestDto })
  @ApiOkResponse({
    type: AuthSessionResponseDto,
    description: 'OTP verified successfully.',
  })
  @ApiRateLimit('authVerifyOtp')
  @Post('verify-otp')
  verifyOtp(
    @Body(new ZodValidationPipe(verifyOtpSchema)) input: VerifyOtpRequest,
  ): Promise<AuthSessionResponse> {
    return this.registrationService.verifyOtp(input);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend a fresh OTP for an existing pending phone verification' })
  @ApiBody({ type: ResendOtpRequestDto })
  @ApiOkResponse({
    type: ResendOtpResponseDto,
    description: 'A fresh OTP was issued for the pending account.',
  })
  @ApiRateLimit('authResendOtp')
  @Post('resend-otp')
  resendOtp(
    @Body(new ZodValidationPipe(resendOtpSchema)) input: ResendOtpRequest,
  ): Promise<ResendOtpResponse> {
    return this.registrationService.resendOtp(input);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({
    type: AuthSessionResponseDto,
    description: 'Authenticated session response.',
  })
  @ApiRateLimit('authLogin')
  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) input: LoginRequest): Promise<AuthSessionResponse> {
    return this.authService.login(input);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Request a password-reset OTP for the account with this email' })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiOkResponse({
    type: ForgotPasswordResponseDto,
    description: 'Same response whether or not the email is registered (anti-enumeration).',
  })
  @ApiRateLimit('authForgotPassword')
  @Post('forgot-password')
  forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) input: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    return this.passwordRecoveryService.forgotPassword(input);
  }

  @Public()
  @HttpCode(204)
  @ApiOperation({ summary: 'Set a new password using the OTP sent by forgot-password' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiNoContentResponse({
    description: 'Password reset; every existing session for the account was revoked.',
  })
  @ApiRateLimit('authResetPassword')
  @Post('reset-password')
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) input: ResetPasswordRequest,
  ) {
    await this.passwordRecoveryService.resetPassword(input);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Request a sign-in magic link for an existing account' })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiOkResponse({ description: 'Magic-link email sent if the account exists.' })
  @ApiRateLimit('authForgotPassword')
  @Post('magic-link/request')
  async requestMagicLink(@Body(new ZodValidationPipe(magicLinkRequestSchema)) input: ForgotPasswordRequest) {
    await this.passwordRecoveryService.requestMagicLink(input);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with a magic-link token' })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiOkResponse({ type: AuthSessionResponseDto, description: 'Authenticated session response.' })
  @ApiRateLimit('authLogin')
  @Post('magic-link/sign-in')
  async signInWithMagicLink(
    @Body(new ZodValidationPipe(magicLinkSignInSchema)) input: { email: string; token: string },
  ): Promise<AuthSessionResponse> {
    return this.passwordRecoveryService.signInWithMagicLink(input);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate a refresh token and mint a new access token' })
  @ApiBody({ type: RefreshRequestDto })
  @ApiOkResponse({
    type: RefreshResponseDto,
    description: 'Rotated access and refresh tokens.',
  })
  @Post('refresh')
  refresh(
    @Body(new ZodValidationPipe(refreshSchema)) input: RefreshRequest,
  ): Promise<RefreshResponse> {
    return this.authService.refresh(input);
  }

  @ApiBearerAuth('bearer')
  @HttpCode(204)
  @ApiOperation({ summary: 'Invalidate the provided refresh token for the current user' })
  @ApiBody({ type: LogoutRequestDto })
  @ApiNoContentResponse({
    description: 'Refresh token invalidated.',
  })
  @Post('logout')
  async logout(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(logoutSchema)) input: LogoutRequest,
  ) {
    await this.authService.logout(userId, input);
  }
}
