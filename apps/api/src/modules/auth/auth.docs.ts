import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterRequestDto {
  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  password!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;
}

export class RegisterResponseDto {
  @ApiProperty({ example: 'cm8abc123' })
  userId!: string;

  @ApiProperty({ example: 'OTP sent to +254712345678' })
  message!: string;

  @ApiProperty({ example: 300 })
  expiresIn!: number;
}

export class VerifyOtpRequestDto {
  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;

  @ApiProperty({ example: '123456' })
  code!: string;
}

export class ResendOtpRequestDto {
  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;
}

export class ResendOtpResponseDto {
  @ApiProperty({ example: 'cm8abc123' })
  userId!: string;

  @ApiProperty({ example: 'OTP resent to +254712345678' })
  message!: string;

  @ApiProperty({ example: 300 })
  expiresIn!: number;
}

export class LoginRequestDto {
  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  password!: string;
}

export class RefreshRequestDto {
  @ApiProperty({ example: 'refresh_token_here' })
  refreshToken!: string;
}

export class LogoutRequestDto {
  @ApiProperty({ example: 'refresh_token_here' })
  refreshToken!: string;
}

export class AuthUserResponseDto {
  @ApiProperty({ example: 'cm8abc123' })
  id!: string;

  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  role!: Role;

  @ApiProperty({ example: true })
  phoneVerified!: boolean;
}

export class AuthSessionResponseDto {
  @ApiProperty({ example: 'eyJhbGciOi...' })
  accessToken!: string;

  @ApiProperty({ example: 'refresh_token_here' })
  refreshToken!: string;

  @ApiProperty({ type: () => AuthUserResponseDto })
  user!: AuthUserResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOi...' })
  accessToken!: string;

  @ApiProperty({ example: 'refresh_token_here' })
  refreshToken!: string;
}
