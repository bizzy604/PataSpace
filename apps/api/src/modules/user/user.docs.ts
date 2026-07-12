/**
 * Purpose: Swagger DTOs for the user module's profile and phone-verification endpoints.
 * Why important: keeps the OpenAPI document accurate for mobile client generation.
 * Used by: user.controller.ts.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RequestPhoneVerificationRequestDto {
  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;
}

export class VerifyPhoneVerificationRequestDto {
  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;

  @ApiProperty({ example: '123456' })
  code!: string;
}

export class PhoneVerificationRequestResponseDto {
  @ApiProperty({ example: 'OTP sent to +254712345678' })
  message!: string;

  @ApiProperty({ example: 300 })
  expiresIn!: number;
}

export class UserProfileResponseDto {
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

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;

  @ApiProperty({ example: '2026-03-21T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-21T10:15:00.000Z' })
  updatedAt!: string;
}
