import { ApiProperty } from '@nestjs/swagger';
import { DisputeStatus } from '@prisma/client';

export class CreateDisputeRequestDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({
    example: 'Landlord rejected me without valid reason after we had already agreed.',
  })
  reason!: string;

  @ApiProperty({
    type: [String],
    example: ['https://example.com/evidence/screenshot-1.jpg'],
    required: false,
  })
  evidence?: string[];
}

export class CreateDisputeResponseDto {
  @ApiProperty({ example: 'cm8dispute123' })
  disputeId!: string;

  @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.OPEN })
  status!: DisputeStatus;

  @ApiProperty({ example: 'Dispute filed. Admin will review within 24 hours.' })
  message!: string;

  @ApiProperty({ example: '2-3 business days' })
  estimatedResolution!: string;
}

export class DisputeRecordDto {
  @ApiProperty({ example: 'cm8dispute123' })
  id!: string;

  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.OPEN })
  status!: DisputeStatus;

  @ApiProperty({
    example: 'Landlord rejected me without valid reason after we had already agreed.',
  })
  reason!: string;

  @ApiProperty({
    type: [String],
    example: ['https://example.com/evidence/screenshot-1.jpg'],
  })
  evidence!: string[];

  @ApiProperty({
    example: 'Full refund issued. Listing violated policy.',
    required: false,
  })
  resolution?: string;

  @ApiProperty({ example: '2026-03-25T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({
    example: '2026-03-26T10:00:00.000Z',
    required: false,
  })
  resolvedAt?: string;

  @ApiProperty({ example: 2500, required: false })
  refundAmount?: number;
}
