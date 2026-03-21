import {
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
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
  loginSchema,
  LoginRequest,
  LogoutRequest,
  logoutSchema,
  refreshSchema,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  registerSchema,
  RefreshResponse,
  verifyOtpSchema,
  VerifyOtpRequest,
} from '@pataspace/contracts';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiRateLimit } from '../../common/throttling/rate-limit.decorator';
import {
  AuthSessionResponseDto,
  LoginRequestDto,
  LogoutRequestDto,
  RefreshRequestDto,
  RefreshResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  VerifyOtpRequestDto,
} from './auth.docs';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Register a user and send an OTP to verify the phone number' })
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
    return this.authService.register(input);
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
    return this.authService.verifyOtp(input);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate with phone number and password' })
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
