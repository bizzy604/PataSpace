import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

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
